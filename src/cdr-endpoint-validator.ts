import { ResponseErrorListV2 } from "consumer-data-standards/common";
import { getEndpoint } from "./cdr-utils";
import { Request, Response, NextFunction } from 'express';
import { CdrConfig } from "./models/cdr-config";

export function cdrEndpointValidator(config: CdrConfig) {

    return function endpoint(req: Request, res: Response, next: NextFunction): any {
        console.log("cdrEndpointValidator.....");
        let errorList: ResponseErrorListV2 = {
            errors: []
        }
        let returnEP = getEndpoint(req, errorList);
        if (returnEP == null) {
            console.log(`No endpoint found for url ${req.url}`);
            //errorList.errors.push({code: 'urn:au-cds:error:cds-all:Resource/NotFound', title: 'NotFound', detail: 'This endpoint is not a CDR endpoint'})
        } else {
            let idx1 = config.endpoints.findIndex(x => x.requestPath.toLowerCase() == returnEP?.requestPath.toLowerCase());
            if (idx1 < 0) {
                
                // this is a CDR endpoint but it has not been implemenetd by this server
                console.log(`Valid endpoint but has not been implemented: ${req.url}`);
               errorList.errors.push({code: 'urn:au-cds:error:cds-all:Resource/NotImplemented', title: 'NotImplemented', detail: 'This endpoint has not been implemented'})
            }       
        }
        if (errorList.errors.length == 0){
            console.log(`No errors. Calling next(): ${req.url}`);
            next();
        }
        else {
            console.log(`Errors found: ${req.url}`);
            res.status(404).json(errorList);
            return;
        }
    }

}