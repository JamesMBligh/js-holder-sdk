
import { Request } from 'express';
import { DsbEndpoint } from './models/dsb-endpoint-entity';
import energyEndpoints from './data/cdr-energy-endpoints.json';
import bankingEndpoints from './data/cdr-banking-endpoints.json';
import { EndpointConfig } from './models/endpoint-config';
import { ResponseErrorListV2 } from 'consumer-data-standards/common';

const endpoints = [...energyEndpoints, ...bankingEndpoints];

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
    let searchArray: string[] = requestUrlArray.slice();

    let returnEP = null;
    let found: boolean = false;
    do {
        let searchPath = buildPath(searchArray);
        returnEP = endpoints.find(x => x.requestPath == searchPath); 

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
    } while(!found && (searchArray.length > 0));

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


