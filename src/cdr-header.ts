
import { ResponseErrorListV2 } from 'consumer-data-standards/common';
import { Request, Response, NextFunction, request } from 'express';
import { validate as uuidValidate } from 'uuid';
import { v4 as uuidv4 } from 'uuid';
import zlib from 'zlib';
import { ErrorEntity } from './models/error-entity';
import { EndpointConfig } from './models/endpoint-config';
import { getEndpoint, findXFapiRequired } from './cdr-utils';
import { DsbEndpoint } from './models/dsb-endpoint-entity';
import { DsbResponse } from './models/dsb-response';
import { CdrConfig } from './models/cdr-config';
import defaultEnergyEndpoints from './data/default-energy.json';
import defaultBankingEndpoints from './data/default-banking.json';



export function cdrHeaders(options: CdrConfig) {
    
    return function headers(req: Request, res: DsbResponse, next: NextFunction) {

        let errorList : ResponseErrorListV2 = {
            errors:  []
        }
        let minSupportedVersion = findMinSupported(req, options.endpoints);
        let maxSupportedVersion = findMaxSupported(req, options.endpoints);
        let xfapiIsRequired: boolean = findXFapiRequired(req);

        let ep = getEndpoint(req, options.endpoints, errorList);

        if (ep != null) {

            let requestVersionObject = {
                requestedVersion : 1,
                minrequestedVersion : 1        
            };
    
            var versionValidationErrors = evaluateVersionHeader(req, requestVersionObject);
            if (versionValidationErrors.length > 0) {
                versionValidationErrors.forEach((e: ErrorEntity) => {
                    errorList.errors.push({code: e.code, title: e.title, detail: e.detail});
                })
            } ;
    
            var versionValidationErrors = evaluateMinVersionHeader(req, requestVersionObject);
            if (versionValidationErrors.length > 0) {
                versionValidationErrors.forEach((e: ErrorEntity) => {
                    errorList.errors.push({code: e.code, title: e.title, detail: e.detail});
                })
            } ;
            res.setHeader('x-v', maxSupportedVersion);
    
            var versionXFapiValidationErrors = evaluateXFapiHeader(req, res, ep);
            if (versionXFapiValidationErrors.length > 0) {
                versionXFapiValidationErrors.forEach(e => {
                    errorList.errors.push({code: e.code, title: e.title, detail: e.detail});
                })
            } 
            // If the minimum requested version is larger than the requested version, effectively ignore x-min-v
            if (requestVersionObject.minrequestedVersion > requestVersionObject.requestedVersion) {
                requestVersionObject.minrequestedVersion = requestVersionObject.requestedVersion;
            }

            if (errorList != null && errorList.errors.length > 0) {
                res.status(400).json(errorList);
                return;
            } else {
                // all provided headers are valid. Need to check versioning
                if ( requestVersionObject.requestedVersion < minSupportedVersion
                    ||  requestVersionObject.minrequestedVersion > maxSupportedVersion) {
                    let errorResponse  = {
                        code: 'urn:au-cds:error:cds-all:Header/UnsupportedVersion',
                        title: 'Unsupported Version',
                        detail: `${requestVersionObject.minrequestedVersion}`
                    }
                    errorList.errors.push(errorResponse);
                    res.status(406).json(errorList);
                    return;
                }    
            } 
        } else {
            // this endpoint was not found
            res.status(404).json(errorList);
            return;
        }

        next(); 
    } 
}

// Evaluate x-v header for presence and valid format. Create an error object for any issues founf
// Set the value versionObj.requestedVersion
function evaluateVersionHeader(req: Request, versionObj: any): ErrorEntity[] {
    // return 400;
    // test for missing required header required header is x-v
    let returnedErrors: ErrorEntity[] = [];
    if (req.headers == undefined || req.headers['x-v'] == null) {
        let errorResponse : ErrorEntity = {
            code: 'urn:au-cds:error:cds-all:Header/Missing',
            title: 'Missing Required Header',
            detail: 'x-v'
        }
        returnedErrors.push(errorResponse);
        return returnedErrors;
    }
    // test for invalid header   
    // invalid version, eg negative number, no number: urn:au-cds:error:cds-all:Header/InvalidVersion
    var val = req.headers['x-v'].toString();
    var version = parseInt(val);
    if (isNaN(version) == true) {
        let errorResponse : ErrorEntity = {
            code: 'urn:au-cds:error:cds-all:Header/InvalidVersion',
            title: 'Invalid Version',
            detail: 'x-v'
        }
        returnedErrors.push(errorResponse);
        return returnedErrors;        
    }
       
    var isValid = /^([1-9]\d*)$/.test(val);
    if (isValid == false) {
        let errorResponse : ErrorEntity = {
            code: 'urn:au-cds:error:cds-all:Header/InvalidVersion',
            title: 'Invalid Version',
            detail: 'x-v'
        }
        returnedErrors.push(errorResponse);
        
    } else {
        versionObj.requestedVersion = version;
    }
    return returnedErrors;
    
}

// Evaluate x-min-v header for presence and valid format. Create an error object for any issues founf
// Set the value versionObj.minrequestedVersion
function evaluateMinVersionHeader(req: Request,  versionObj: any): ErrorEntity[] {
    // return 400;
    // test for missing required header required header is x-v
    let returnedErrors: ErrorEntity[] = [];
    if (req.headers == undefined || req.headers['x-min-v'] == null) {
        try {
            var val = req.headers['x-v']?.toString();
            if (val != undefined) {
                var version = parseInt(val);
                versionObj.minSupportedVersion = version;
                versionObj.minrequestedVersion = version;
            }
            else {
                versionObj.minSupportedVersion = 1;
            }          
        } catch (error) {
            versionObj.minSupportedVersion = 1
        }

        return returnedErrors;
    }

    // test for invalid header   
    // invalid version, eg negative number, no number: urn:au-cds:error:cds-all:Header/InvalidVersion
    var xvmin = req.headers['x-min-v'].toString();
    var minimumVersion = parseInt(xvmin);

    if (isNaN(minimumVersion) == true) {
        let errorResponse : ErrorEntity = {
            code: 'urn:au-cds:error:cds-all:Header/InvalidVersion',
            title: 'Invalid Version',
            detail: 'x-min-v'
        }
        returnedErrors.push(errorResponse);
        return returnedErrors;        
    }
       
    var isValid = /^([1-9]\d*)$/.test(xvmin);
    if (isValid == false) {
        let errorResponse : ErrorEntity = {
            code: 'urn:au-cds:error:cds-all:Header/InvalidVersion',
            title: 'Invalid Version',
            detail: 'x-min-v'
        }
        returnedErrors.push(errorResponse);
        
    } else {
        versionObj.minrequestedVersion = minimumVersion;
    }
    return returnedErrors;
    
}

// Set the value for x-fapi-interaction-id
// If an invalid value is passed with the request, return error object
function evaluateXFapiHeader(req: Request, res: Response, ep: DsbEndpoint): ErrorEntity[] {
    
    let returnedErrors: ErrorEntity[] = [];
   // let ep = getEndpoint(req);
    // test is header is in request
    if (ep != null) {
        if (req.headers == null || req.headers['x-fapi-interaction-id'] == null) {
            const newUuid = uuidv4();
            res.setHeader('x-fapi-interaction-id', newUuid);
        } else {
            const v4Uuid = req.headers['x-fapi-interaction-id'].toString();
            if (uuidValidate(v4Uuid) === true) {
                res.setHeader('x-fapi-interaction-id', v4Uuid);
            } else {
                let errorResponse : ErrorEntity = {
                    code: 'urn:au-cds:error:cds-all:Header/Invalid',
                    title: 'Invalid Header',
                    detail: 'x-fapi-interaction-id'
                }
                returnedErrors.push(errorResponse);      
            }      
        }
    }
    return returnedErrors;
}

function findMinSupported(req: Request, options: EndpointConfig[]): number {
    try {
        let errorList : ResponseErrorListV2 = {
            errors:  []
        }
        let dsbEndpoint = getEndpoint(req, options, errorList) as DsbEndpoint;
        var idx = options.findIndex(x => x.requestPath == dsbEndpoint.requestPath);
        var ep = options[idx];
        return ep.minSupportedVersion;
    }
    catch (e) {
        return 1;
    }
}

function findMaxSupported(req: Request, options: EndpointConfig[]): number {
    try {
        let errorList : ResponseErrorListV2 = {
            errors:  []
        }
        let dsbEndpoint = getEndpoint(req, options, errorList) as DsbEndpoint;
        var idx = options.findIndex(x => x.requestPath == dsbEndpoint.requestPath);
        let ep = options[idx];
        return ep.maxSupportedVersion;
    } catch(e) {
        return 1;
    }
}

function isJsonString(str: string): boolean {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}