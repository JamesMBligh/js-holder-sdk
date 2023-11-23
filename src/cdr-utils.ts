
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
        returnEP = endpoints.find(x => x.requestPath.toLowerCase() == searchPath?.toLowerCase() && x.requestType == req.method); 

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
export function authorisedForAccount(req: Request, user:  CdrUser | undefined): boolean | undefined {

    if (endpointRequiresAuthentication(req) == false)
        return true;
    if (urlHasResourceIdentifier(req) == false && req.method == 'GET')
        return true;

    if (user == null) 
        return false;

    let url = createSearchUrl(req)?.toLowerCase();
    if (url == undefined) return false;

    if (url.indexOf('/banking/products') > -1 ) return true;
    if (url.indexOf('/energy/plans') > -1 ) return true;

    if (url.indexOf('/banking/accounts') > -1) {
        return checkBankAccountRoute(url, user);
    }

    if (url.indexOf('/banking/payments/scheduled') > -1) {
       return  checkBankingPaymentRoute(req, url, user);
    }
    if (url.indexOf('/banking/payees') > -1) {
        return checkBankingPayeeRoute(url, user);
    }

    if (url.indexOf('/energy/accounts') > -1) {
        return  checkEnergyAccountRoute(url, user);
    }

    if (url.indexOf('/energy/electricity/servicepoints') > -1) {
        return checkEnergyElectricityRoute(url, user);
    }
}

export function endpointRequiresAuthentication(req: Request): boolean | undefined {
    let ep = findEndpointConfig(req);
    if (ep != null) {
        return (ep.authScopesRequired != null)
    }
    return true;
}

export function urlHasResourceIdentifier(req: Request): boolean | undefined {
    let ep = findEndpointConfig(req);
    if (ep != null) {
        return (ep.requestPath.indexOf('{') > -1)
    }
    return false;
}

function checkBankAccountRoute(url: string, user:  CdrUser): boolean {
    let startPos = url.indexOf('/banking/accounts/');
    let l1 = '/banking/accounts/'.length;
    let subStr = url.substring(startPos + l1, url.length).replace(/\/+$/, '').toLowerCase();

    if (subStr.length == 0) {
        return true;
    }
    if (user.accountsBanking == null) {
        return false;
    }
    // if the subStr does not have any slashes it must be interpreted as accountid
    if (subStr.indexOf('/') == -1) {
        return (user.accountsBanking?.indexOf(subStr) > -1);
    }

    let dd = subStr.indexOf('/direct-debits');
    // check for direct debit accounts
    if (dd > -1) {
        let accountId = subStr.substring(0, dd);
        return (user.accountsBanking?.indexOf(accountId) > -1);
    }
    let bal = subStr.indexOf('/balance');
    // check for balance account
    if (bal > -1) {
        let accountId = subStr.substring(0, bal);
        return (user.accountsBanking?.indexOf(accountId) > -1);
    }
    let trans = subStr.indexOf('/transactions');
    // check for balance account
    if (trans > -1) {
        let accountId = subStr.substring(0, trans);
        return (user.accountsBanking?.indexOf(accountId) > -1);
    }

    let payments = subStr.indexOf('/payments');
    // check for balance account
    if (payments > -1) {
        let accountId = subStr.substring(0, payments);
        return (user.accountsBanking?.indexOf(accountId) > -1);
    }
    return false;
}

function checkEnergyAccountRoute(url: string, user:  CdrUser): boolean {
    let startPos = url.indexOf('/energy/accounts/');
    let l1 = '/energy/accounts/'.length;
    let subStr = url.substring(startPos + l1, url.length).replace(/\/+$/, '').toLowerCase();

    if (subStr.length == 0) {
        return true;
    }

    if (user.accountsEnergy == null) {
        return false;
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
    return false;
}

function checkEnergyElectricityRoute(url: string, user:  CdrUser): boolean {
    let startPos = url.indexOf('/energy/electricity/servicepoints');
    let l1 = '/energy/electricity/servicepoints'.length;
    let subStr = url.substring(startPos + l1 + 1, url.length).replace(/\/+$/, '').toLowerCase();
    if (subStr.length == 0) {
        return true;
    }
    if (user.energyServicePoints == null) {
        return false;
    }
    // if the subStr does not have any slashes (ie end of uri) it has to be servicepoints
    if (subStr.indexOf('/') == -1) {
        return (user.energyServicePoints?.indexOf(subStr) > -1);
    }

    let usageSP = subStr.indexOf('/usage');
    if (usageSP > -1) {
        let sp = subStr.substring(0, usageSP);
        return (user.energyServicePoints?.indexOf(sp) > -1);
    }
    let derSP = subStr.indexOf('/der');
    if (derSP > -1) {
        let sp = subStr.substring(0, derSP );
        return (user.energyServicePoints?.indexOf(sp) > -1);
    }
    return false;    
}

function checkBankingPaymentRoute(req: Request, url: string, user:  CdrUser): boolean {
    let startPos = url.indexOf('/banking/payments/scheduled');
    let l1 = '/banking/payments/scheduled'.length;
    let subStr = url.substring(startPos + l1, url.length).replace(/\/+$/, '').toLowerCase();

    if (subStr.length == 0) {
        if (req.method == 'POST') {
            if (user.accountsBanking == null) {
                return false;
            }
            // read the account ids from body
            try {
                let body = req?.body;
                //let data = body?.data;
                let obj = JSON.parse(body);
                let accountIds = obj?.data?.accountIds;
                // read to data as array
                let invalidCount = 0;
                accountIds?.forEach((x: string) => {
                    let idx = user.accountsBanking?.indexOf(x);
                    if (idx == null || idx < 0) {
                        return invalidCount++;
                    }
                })
                return (invalidCount == 0);
            } catch (e: any) {
                console.log(e?.message)
                return false;
            }

        } else  {
            return true
        }
    } else {
        return false;
    }
}

function checkBankingPayeeRoute(url: string, user:  CdrUser): boolean {
    let startPos = url.indexOf('/banking/payees');
    let l1 = '/banking/payees'.length;
    let subStr = url.substring(startPos + l1, url.length).replace(/\/+$/, '');

    if (subStr.length == 0) {
        return true;
    }
    if (user.bankingPayees == null) {
        return true;
    }
    // if the subStr does not have any slashes it must be interpreted as accountid
    if (subStr.indexOf('/') == -1) {
        return (user.bankingPayees?.indexOf(subStr) > -1);
    }
    return false;
}

function createSearchUrl(req: Request): string | undefined {
    let url = req.url.substring(req.url.indexOf('//')+2).toLowerCase();  
    let baseIdx = url.indexOf('cds-au/v1') 
    if (baseIdx == -1)
        return undefined;

    // get rid of the query parameters
    let idx = url.indexOf('?');
    if (idx > -1)
        url = url.substring(0, url.indexOf('?'));
    // read the url after the cds-au/au part
    return url.substring(baseIdx + 'cds-au/v1'.length, url.length);
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


