
import { ResponseErrorListV2 } from 'consumer-data-standards/common';
import { Request, Response, NextFunction } from 'express';
import { validate as uuidValidate } from 'uuid';
import { v4 as uuidv4 } from 'uuid';
import { Endpoint } from './models/endpoint-entity';
import { ErrorEntity } from './models/error-entity';
import endpoints from './data/energy-endpoints.json'
import { EndpointConfig } from './models/endpoint-config';


export function dsbHeaders(req: Request, res: Response, next: NextFunction, options: EndpointConfig[]) {
    
        let errorList : ResponseErrorListV2 = {
            errors:  []
        }
        
        let minSupportedVersion = findMinSupported(req, options);
        let maxSupportedVersion = findMaxSupported(req, options);
        let xfapiIsRequired: boolean = findXFapiRequired(req);

        let versionObj = {
            requestedVersion : 1,
            minrequestedVersion : 1        
        };

        var versionValidationErrors = evaluateVersionHeader(req, versionObj);
        if (versionValidationErrors.length > 0) {
            versionValidationErrors.forEach((e: ErrorEntity) => {
                errorList.errors.push({code: e.code, title: e.title, detail: e.detail});
            })
        } ;

        var versionValidationErrors = evaluateMinVersionHeader(req, versionObj);
        if (versionValidationErrors.length > 0) {
            versionValidationErrors.forEach((e: ErrorEntity) => {
                errorList.errors.push({code: e.code, title: e.title, detail: e.detail});
            })
        } ;
        


        var versionXFapiValidationErrors = evaluateXFapiHeader(req, res);
        if (versionXFapiValidationErrors.length > 0) {
            versionXFapiValidationErrors.forEach(e => {
                errorList.errors.push({code: e.code, title: e.title, detail: e.detail});
            })
        } 

        if (errorList != null && errorList.errors.length > 0) {
            res.status(400).json(errorList);
            return;
        } else {
            if (versionObj.minrequestedVersion <= versionObj.requestedVersion &&  versionObj.minrequestedVersion > maxSupportedVersion) {
                let errorResponse  = {
                    code: 'urn:au-cds:error:cds-all:Header/UnsupportedVersion',
                    title: 'Unsupported Version',
                    detail: `${versionObj.minrequestedVersion}`
                }
                errorList.errors.push(errorResponse);
                res.status(406).json(errorList);
            }else {
                res.status(200);   
            }              
        } 
        next();  
}


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

function evaluateMinVersionHeader(req: Request,  versionObj: any): ErrorEntity[] {
    // return 400;
    // test for missing required header required header is x-v
    let returnedErrors: ErrorEntity[] = [];
    if (req.headers == undefined || req.headers['x-min-v'] == null) {
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

function evaluateXFapiHeader(req: Request, res: Response): ErrorEntity[] {
    
    let returnedErrors: ErrorEntity[] = [];
    let ep = getEndpoint(req);
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

function getEndpoint(req: Request): Endpoint {
    let idx = endpoints.findIndex(x => req.url.includes(x.requestPath));
    let ep = endpoints[idx];
    return ep;
}


function findMinSupported(req: Request, options: EndpointConfig[]): number {
    try {
        let idx = options.findIndex(x => req.url.includes(x.requestPath));
        let ep = options[idx];
        return ep.minSupprtedVersion;
    } catch(e) {
        return 1;
    }
}

function findXFapiRequired(req: Request): boolean {
    try {
        let idx = endpoints.findIndex(x => req.url.includes(x.requestPath));
        let ep = endpoints[idx];
        return ep.requiresXFAPI ??= true;
    } catch(e) {
        return true;
    }
}


function findMaxSupported(req: Request, options: EndpointConfig[]): number {
    try {
        let idx = options.findIndex(x => req.url.includes(x.requestPath));
        let ep = options[idx];
        return ep.maxSupportedVersion;
    } catch(e) {
        return 1;
    }
}