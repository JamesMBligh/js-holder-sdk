
import { ErrorsEntity, MetaError, ResponseErrorListV2 } from 'consumer-data-standards';
import { Request, Response, NextFunction } from 'express';
import { validate as uuidValidate } from 'uuid';
import { v4 as uuidv4 } from 'uuid';


export function dsbHeaders(req: Request, res: Response, next: NextFunction) {
    var err: ErrorsEntity[] = [];
    let errorList : ResponseErrorListV2 = {
        errors: err
    }
    //let statusCode = 200;
    var versionValidationErrors = evaluateVersionHeader(req);

    if (versionValidationErrors.length > 0) {
        versionValidationErrors.forEach(e => {
            errorList.errors?.push(e);
        })
        //statusCode = 400;
    };
    var versionXFapiValidationErrors = evaluateXFapiHeader(req, res);
    if (versionXFapiValidationErrors.length > 0) {
        versionXFapiValidationErrors.forEach(e => {
            errorList.errors?.push(e);
        })
    }          
    res.setHeader('Content-Type', 'application/json');
    if (errorList.errors != null && errorList.errors.length > 0) {
        res.status(400).send(errorList);
    } else {
        next();
    }   
}


function evaluateVersionHeader(req: Request): ErrorsEntity[] {
    // return 400;
    // test for missing required header required header is x-v
    let returnedErrors: ErrorsEntity[] = [];
    if (req.headers == null || req.headers['x-v'] == null) {
        let errorResponse : ErrorsEntity = {
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
        let errorResponse : ErrorsEntity = {
            code: 'urn:au-cds:error:cds-all:Header/InvalidVersion',
            title: 'Invalid Version',
            detail: 'x-v'
        }
        returnedErrors.push(errorResponse);
        return returnedErrors;        
    }
       

    var isValid = /^([1-9]\d*)$/.test(val);
    if (!isValid == true) {
        let errorResponse : ErrorsEntity = {
            code: 'urn:au-cds:error:cds-all:Header/InvalidVersion',
            title: 'Invalid Version',
            detail: 'x-v'
        }
        returnedErrors.push(errorResponse);
    }
    return returnedErrors;
}

function evaluateXFapiHeader(req: Request, res: Response): ErrorsEntity[] {
    let returnedErrors: ErrorsEntity[] = [];
    // test is header is in request
    if (req.headers == null || req.headers['x-fapi-interaction-id'] == null) {
        const newUuid = uuidv4();
        res.setHeader('x-fapi-interaction-id', newUuid);
    } else {
        const v4Uuid = req.headers['x-fapi-interaction-id'].toString();
        if (uuidValidate(v4Uuid) === true) {
            res.setHeader('x-fapi-interaction-id', v4Uuid);
        } else {
            let errorResponse : ErrorsEntity = {
                code: 'urn:au-cds:error:cds-all:Header/Invalid',
                title: 'Invalid Header',
                detail: 'x-fapi-interaction-id'
            }
            returnedErrors.push(errorResponse);      
        }      
    }
    return returnedErrors;
}