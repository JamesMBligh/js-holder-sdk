import { ResponseErrorListV2 } from "consumer-data-standards/common";
import { getEndpoint } from "./cdr-utils";
import { Request, Response, NextFunction } from 'express';
import { CdrConfig } from "./models/cdr-config";
import { DsbEndpoint } from "./models/dsb-endpoint-entity";

export function cdrEndpointValidator(config: CdrConfig) {

    return function endpoint(req: Request, res: Response, next: NextFunction): any {
        console.log("cdrEndpointValidator.....");
        let errorList: ResponseErrorListV2 = {
            errors: []
        }
        let returnEP = getEndpoint(req, config.endpoints, errorList);
        if (returnEP == null) {
            errorList.errors.push({code: 'urn:au-cds:error:cds-all:Resource/NotFound', title: 'NotFound', detail: 'This endpoint is not a CDR endpoint'})
        } else {
            let idx1 = config.endpoints.findIndex(x => x.requestPath == returnEP?.requestPath);
            if (idx1 < 0) {
                // this is a CDR endpoint but it has not been implemenetd by this server
                errorList.errors.push({code: 'urn:au-cds:error:cds-all:Resource/NotImplemented', title: 'NotImplemented', detail: 'This endpoint has not been implemented'})
            }       
        }
        if (errorList.errors.length == 0)
            next();
        else {
            res.status(404).json(errorList);
            return;
        }
    }

}