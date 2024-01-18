import { ResponseErrorListV2 } from "consumer-data-standards/common";
import { getEndpoint } from "./cdr-utils";
import { Request, Response, NextFunction } from 'express';
import { CdrConfig } from "./models/cdr-config";
import energyEndpoints from './data/cdr-energy-endpoints.json';
import bankingEndpoints from './data/cdr-banking-endpoints.json';
import commonEndpoints from './data/cdr-common-endpoints.json';
import { EndpointConfig } from "./models/endpoint-config";
import { DsbEndpoint } from "./models/dsb-endpoint-entity";

const defaultEndpoints = [...energyEndpoints, ...bankingEndpoints, ...commonEndpoints] as DsbEndpoint[];

export function cdrEndpointValidator(config: CdrConfig | undefined) {

    return function endpoint(req: Request, res: Response, next: NextFunction): any {
        console.log("cdrEndpointValidator.....");

        let errorList: ResponseErrorListV2 = {
            errors: []
        }
        // Don't need to validate endpoints if the specifiedEndpointsOnly=true has been set
        // This will effectively bypass this function
        if (config?.specifiedEndpointsOnly == null || config.specifiedEndpointsOnly == false) {
            let returnEP = getEndpoint(req, config);
            // determine if this could be an endpoint, ie it is one defined by the DSB
            let defaultConfig :CdrConfig = {
                endpoints: defaultEndpoints,
                basePath: config?.basePath
            } 
            let isDsbEndpoint = getEndpoint(req, defaultConfig) != null;
            console.log(`isDsbEndpoint=${isDsbEndpoint}`);
            if (!isDsbEndpoint) {
                console.log(`cdrEndpointValidator: No CDR endpoint found for url ${req.url}`);
                errorList.errors.push({code: 'urn:au-cds:error:cds-all:Resource/NotFound', title: 'NotFound', detail: 'This endpoint is not a CDR endpoint'}) ;
                res.status(404).json(errorList); 
                return;  
            }
            if (returnEP == null) {
                console.log(`cdrEndpointValidator: Valid endpoint but has not been implemented: ${req.url}`);
                errorList.errors.push({code: 'urn:au-cds:error:cds-all:Resource/NotImplemented', title: 'NotImplemented', detail: 'This endpoint has not been implemented'});
                res.status(404).json(errorList);
                return;
            }
        }
        console.log("cdrEndpointValidator: OK.");
        next();
    }

}