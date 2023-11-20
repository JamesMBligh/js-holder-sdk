import { ResponseErrorListV2 } from "consumer-data-standards/common";
import { getEndpoint } from "./cdr-utils";
import { Request, Response, NextFunction } from 'express';
import { CdrConfig } from "./models/cdr-config";

export function cdrEndpointValidator(config: CdrConfig) {

    return function endpoint(req: Request, res: Response, next: NextFunction) : any  {
        let errorList : ResponseErrorListV2 = {
            errors:  []
        }
        let ep = getEndpoint(req, config.endpoints, errorList);
        if (ep == null) {
            // if the endpoint is null, there will be some errors (genereated in getEndpoint)
            res.status(404).json(errorList);
            return;   
        }
        next();
    }

}