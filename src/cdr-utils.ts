
import { Request } from 'express';
import { DsbEndpoint } from './models/dsb-endpoint-entity';
import energyEndpoints from './data/cdr-energy-endpoints.json';
import bankingEndpoints from './data/cdr-banking-endpoints.json';
import commonEndpoints from './data/cdr-common-endpoints.json';
import { EndpointConfig } from './models/endpoint-config';
import { ResponseErrorListV2 } from 'consumer-data-standards/common';
import { CdrUser } from './models/user';

const endpoints = [...energyEndpoints, ...bankingEndpoints, ...commonEndpoints];

export function getEndpoint(req: Request, options: EndpointConfig[], errorList : ResponseErrorListV2 ): DsbEndpoint | null {

    // remove the host and assign to urlId  
    let tmp = req.url.substring(req.url.indexOf('//')+2);  
    let originalPath = tmp.substring(tmp.indexOf('/'));


    // create an array with all the path elements
    let requestUrlArray = req.url.split('/').splice(1);
    // ensure that the cds-au/v1 exists
    if (requestUrlArray.length < 3) {
        // this cannot be a CDR endpoint
        errorList.errors.push({code: 'urn:au-cds:error:cds-all:Resource/NotFound', title: 'NotFound', detail: 'This endpoint is not a CDR endpoint'});
        return null;
    }
    if (requestUrlArray[0] != 'cds-au' || requestUrlArray[1] != 'v1') {
         // this cannot be a CDR endpoint
         errorList.errors.push({code: 'urn:au-cds:error:cds-all:Resource/NotFound', title: 'NotFound', detail: 'This endpoint is not a CDR endpoint'});
         return null;       
    }
    requestUrlArray = requestUrlArray.slice(2);
    requestUrlArray = removeEmptyEntries(requestUrlArray);
    // the search array which will change as the search progresses
    // remove query parameters from end
    let tmp1: string = requestUrlArray[requestUrlArray.length-1];
    let newValArray: string[] = tmp1.split('?');
    requestUrlArray[requestUrlArray.length-1] = newValArray[0];

    let searchArray: string[] = requestUrlArray.slice();

    let returnEP = null;
    let found: boolean = false;
    let idx = 0;
    do {
        idx++;
        let searchPath = buildPath(searchArray);
        returnEP = endpoints.find(x => x.requestPath == searchPath && x.requestType == req.method); 

        if (returnEP == null) {   
            searchArray.splice(searchArray.length-1, 1) ;  
        }
        else {
            if (searchArray.length == requestUrlArray.length) {
                found = true;
                searchArray = [];
            }
            else {
                let tmpArray  = checkForEndpoint(returnEP as DsbEndpoint);
                if (requestUrlArray.length > searchArray.length) {
                    if (tmpArray.length > searchArray.length) {
                        searchArray.push(tmpArray[searchArray.length]);
                    }
                    else {
                        searchArray.push(requestUrlArray[searchArray.length]);
                    }
                    
                } else {
                    searchArray = tmpArray;
                }  
                found = searchArray.length == 0;               
            }
        }
    } while((!found) && idx < (endpoints.length));

    // set the error message if no endpoint was found or not implemented
    if (returnEP == null) {
        errorList.errors.push({code: 'urn:au-cds:error:cds-all:Resource/NotFound', title: 'NotFound', detail: 'This endpoint is not a CDR endpoint'})
    } else {
        let ep: DsbEndpoint = returnEP as DsbEndpoint;
        let idx1 = options.findIndex(x => x.requestPath == ep.requestPath);
        if (idx1 < 0) {
            // this is a CDR endpoint but it has not been implemenetd by this server
            errorList.errors.push({code: 'urn:au-cds:error:cds-all:Resource/NotImplemented', title: 'NotImplemented', detail: 'This endpoint has not been implemented'})
        }       
    }

    return returnEP as DsbEndpoint;
}

export function findXFapiRequired(req: Request): boolean {
    try {
        let idx = endpoints.findIndex(x => req.url.includes(x.requestPath));
        let ep = endpoints[idx];
        return ep.requiresXFAPI ??= true;
    } catch(e) {
        return true;
    }
}

export function scopeForRequestIsValid(req: Request, scopes: string[] | undefined): boolean {
    try {
        let ep = findEndpointConfig(req);
        // endpoint exists and no scopes are required
        if (ep?.authScopesRequired == null)
            return true;
        else {
            // there is scopes required and none have been provided
            if (scopes == null) return false;
            let idx = scopes?.indexOf(ep.authScopesRequired) 
            return (idx > -1);
        }
    } catch(e) {
        return false;
    }    
}

// This will examine the request url, find any account identifiers and validate against the authorised user object
export function authorisedForAccount(req: Request, user:  CdrUser): boolean {

    if (user == null || user.accountsEnergy == null) 
        return false;
    let url = req.url.substring(req.url.indexOf('//')+2);  
    let baseIdx = url.indexOf('cds-au/v1') 
    if (baseIdx == -1)
        return false;

    // get rid of the query parameters
    let idx = url.indexOf('?');
    if (idx > -1)
        url = url.substring(0, url.indexOf('?'));
    // read the url after the cds-au/au part
    url = url.substring(baseIdx + 'cds-au/v1'.length, url.length);
    if (url.indexOf('/banking/accounts') > -1) {
        let startPos = url.indexOf('/banking/accounts/');
        let l1 = '/banking/accounts/'.length;
        let subStr = url.substring(startPos + l1, url.length).replace(/\/+$/, '');

        if (subStr.length == 0) {
            return true;
        }

        // if the subStr does not have any slashes it must be interpreted as accountid
        if (subStr.indexOf('/') == -1) {
            return (user.accountsEnergy?.indexOf(subStr) > -1);
        }

        let dd = subStr.indexOf('/direct-debits');
        // check for direct debit accounts
        if (dd > -1) {
            let accountId = subStr.substring(0, dd);
            return (user.accountsEnergy?.indexOf(accountId) > -1);
        }
        let bal = subStr.indexOf('/balance');
        // check for balance account
        if (bal > -1) {
            let accountId = subStr.substring(0, bal);
            return (user.accountsEnergy?.indexOf(accountId) > -1);
        }
        let trans = subStr.indexOf('/transactions');
        // check for balance account
        if (trans > -1) {
            let accountId = subStr.substring(0, trans);
            return (user.accountsEnergy?.indexOf(accountId) > -1);
        }

        let payments = subStr.indexOf('/payments');
        // check for balance account
        if (payments > -1) {
            let accountId = subStr.substring(0, payments);
            return (user.accountsEnergy?.indexOf(accountId) > -1);
        }
    }

    if (url.indexOf('/energy/accounts') > -1) {
        let startPos = url.indexOf('/energy/accounts/');
        let l1 = '/energy/accounts/'.length;
        let subStr = url.substring(startPos + l1, url.length).replace(/\/+$/, '');

        if (subStr.length == 0) {
            return true;
        }

        // if the subStr does not have any slashes it must be interpreted as accountid
        if (subStr.indexOf('/') == -1) {
            return (user.accountsEnergy?.indexOf(subStr) > -1);
        }

        let inv = subStr.indexOf('/invoices');
        // check for direct debit accounts
        if (inv > -1) {
            let accountId = subStr.substring(0, inv);
            return (user.accountsEnergy?.indexOf(accountId) > -1);
        }
        let bal = subStr.indexOf('/balance');
        // check for balance account
        if (bal > -1) {
            let accountId = subStr.substring(0, bal);
            return (user.accountsEnergy?.indexOf(accountId) > -1);
        }
        let conc = subStr.indexOf('/concessions');
        // check for balance account
        if (conc > -1) {
            let accountId = subStr.substring(0, conc);
            return (user.accountsEnergy?.indexOf(accountId) > -1);
        }
        let billing = subStr.indexOf('/billing');
        // check for balance account
        if (billing > -1) {
            let accountId = subStr.substring(0, billing);
            return (user.accountsEnergy?.indexOf(accountId) > -1);
        }
        let payments = subStr.indexOf('/payment-schedule');
        // check for balance account
        if (payments > -1) {
            let accountId = subStr.substring(0, payments);
            return (user.accountsEnergy?.indexOf(accountId) > -1);
        }
    }
    return false;
}

function findEndpointConfig(req: Request): DsbEndpoint | undefined{
    // remove the host and assign to urlId  
    let tmp = req.url.substring(req.url.indexOf('//')+2);  
    let originalPath = tmp.substring(tmp.indexOf('/'));


    // create an array with all the path elements
    let requestUrlArray = req.url.split('/').splice(1);
    // ensure that the cds-au/v1 exists
    if (requestUrlArray.length < 3) {
        // this cannot be a CDR endpoint
       // errorList.errors.push({code: 'urn:au-cds:error:cds-all:Resource/NotFound', title: 'NotFound', detail: 'This endpoint is not a CDR endpoint'});
        return undefined;
    }
    if (requestUrlArray[0] != 'cds-au' || requestUrlArray[1] != 'v1') {
         // this cannot be a CDR endpoint
         //errorList.errors.push({code: 'urn:au-cds:error:cds-all:Resource/NotFound', title: 'NotFound', detail: 'This endpoint is not a CDR endpoint'});
         return undefined;       
    }
    requestUrlArray = requestUrlArray.slice(2);
    requestUrlArray = removeEmptyEntries(requestUrlArray);
    // the search array which will change as the search progresses
    // remove query parameters from end
    let tmp1: string = requestUrlArray[requestUrlArray.length-1];
    let newValArray: string[] = tmp1.split('?');
    requestUrlArray[requestUrlArray.length-1] = newValArray[0];

    let searchArray: string[] = requestUrlArray.slice();

    let returnEP = null;
    let found: boolean = false;
    let idx = 0;
    do {
        idx++;
        let searchPath = buildPath(searchArray);
        returnEP = endpoints.find(x => x.requestPath == searchPath && x.requestType == req.method); 

        if (returnEP == null) {   
            searchArray.splice(searchArray.length-1, 1) ;  
        }
        else {
            if (searchArray.length == requestUrlArray.length) {
                found = true;
                searchArray = [];
            }
            else {
                let tmpArray  = checkForEndpoint(returnEP as DsbEndpoint);
                if (requestUrlArray.length > searchArray.length) {
                    if (tmpArray.length > searchArray.length) {
                        searchArray.push(tmpArray[searchArray.length]);
                    }
                    else {
                        searchArray.push(requestUrlArray[searchArray.length]);
                    }
                    
                } else {
                    searchArray = tmpArray;
                }  
                found = searchArray.length == 0;               
            }
        }
    } while((!found) && idx < (endpoints.length));
    return returnEP;
}

function arraysAreEqual(a: string[], b: string[]): boolean {
    const equals = (a.length === b.length &&
        a.every((v, i) => v === b[i]));
    return equals;
}

function removeEmptyEntries(arr: string[]): string[] {
    let returnArray : string[] = [];
    arr.forEach(elem => {
        if (elem != null && elem.trim() != '') {
            returnArray.push(elem);
        }     
    });
    return returnArray;
}

function checkForEndpoint(ep: DsbEndpoint): string[] {
    let returnPathArray : string[] = [];
    let searchPath = ep.requestPath + '/{';
    // get all endpoints which have searchPath in them
    let returnEpArray  = endpoints.filter(x => x.requestPath.includes(searchPath)) as DsbEndpoint[];
    if (returnEpArray != null && returnEpArray.length > 0) {
        // create an array with all the path elements
        // sort the elements with accorfing the requestPath length
        returnEpArray.sort(compare);
        returnPathArray = returnEpArray[0].requestPath.split('/').splice(1);
        return returnPathArray;
    } else {
        return [];
    }
}

function compare(ep1: DsbEndpoint, ep2: DsbEndpoint) : number {
    let arr1 = ep1.requestPath.split('/').splice(1);
    let arr2 = ep2.requestPath.split('/').splice(1);
    if ( arr1.length < arr2.length ){
        return -1;
      }
      if (arr1.length > arr2.length ){
        return 1;
      }
      return 0;
}

function buildPath(pathArray: string[], count : number = -1): string | null {
    if (pathArray == null || pathArray.length == 0)
        return null;
    if (pathArray.length < count || count == -1) {
        return '/' + pathArray.join('/');
    }
    let retVal = '/';
    let tmpArray = pathArray.slice(0, count);
    return '/' + tmpArray.join('/');
}


