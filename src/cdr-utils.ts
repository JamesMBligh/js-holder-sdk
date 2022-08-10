
import { Request } from 'express';
import { DsbEndpoint } from './models/dsb-endpoint-entity';
import energyEndpoints from './data/cdr-energy-endpoints.json';
import bankingEndpoints from './data/cdr-banking-endpoints.json';
import { EndpointConfig } from './models/endpoint-config';
import { ResponseErrorListV2 } from 'consumer-data-standards/common';

const endpoints = [...energyEndpoints, ...bankingEndpoints];


// export function getEndpoint(req: Request, options: EndpointConfig[], errorList : ResponseErrorListV2 ): DsbEndpoint | null {
//     // remove the host and assign to urlId
//     // incrementally remove part of the urlId until a match is found
//     // once a match is found and the last part is a url parameter as per endpoint defintions
//     //  => look forward to identify if there is a url component after the paramenter
//     //  => there is nothing after the url (ie it matched the enpoint definition exactly)
//     //  => the last part of the url is a parameter AND it is the last part
//     //  => the next part of the url is a parameter, but it is NOT the last part

//     let idx = endpoints.findIndex(x => req.url.includes(x.requestPath));
//     let idx1 = -1;
//     if (idx < 0) {
//         /// this url is not an endpoint supported
//         errorList.errors.push({code: 'urn:au-cds:error:cds-all:Resource/NotFound', title: 'NotFound', detail: 'This endpoint is not a CDR endpoint'})
//     }
//     else {
//         idx1 = options.findIndex(x => x.requestPath == endpoints[idx].requestPath);
//         if (idx1 < 0) {
//             // this is a CDR endpoint but it has not been implemenetd by this server
//             errorList.errors.push({code: 'urn:au-cds:error:cds-all:Resource/NotImplemented', title: 'NotImplemented', detail: 'This endpoint has not been implemented'})
//         }
//     }
//     if (errorList.errors.length == 0)
//         return endpoints[idx] as DsbEndpoint;
//     else
//         return null;
// }

export function getEndpoint(req: Request, options: EndpointConfig[], errorList : ResponseErrorListV2 ): DsbEndpoint | null {

    // remove the host and assign to urlId  
    
    let tmp = req.url.substring(req.url.indexOf('//')+2);  
    let originalPath = tmp.substring(tmp.indexOf('/'));

    // create an array with all the path elements
    let requestUrlArray = req.url.split('/').splice(1);
    requestUrlArray = removeEmptyEntries(requestUrlArray);
    // the search array which will change as the search progresses
    let searchArray: string[] = requestUrlArray.slice();

    let returnerEP = null;
    let found: boolean = false;
    do {
        let searchPath = buildPath(searchArray);
        returnerEP = endpoints.find(x => x.requestPath == searchPath); 

        if (returnerEP == null) {   
            searchArray.splice(searchArray.length-1, 1) ;  
        }
        else {
            if (searchArray.length == requestUrlArray.length) {
                found = true;
                searchArray = [];
            }
            else {
                let tmpArray  = checkForEndpoint(returnerEP as DsbEndpoint);
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
    return returnerEP as DsbEndpoint;
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
    if ( ep1.requestPath.length < ep2.requestPath.length ){
        return -1;
      }
      if ( ep1.requestPath.length > ep2.requestPath.length ){
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


export function findXFapiRequired(req: Request): boolean {
    try {
        let idx = endpoints.findIndex(x => req.url.includes(x.requestPath));
        let ep = endpoints[idx];
        return ep.requiresXFAPI ??= true;
    } catch(e) {
        return true;
    }
}