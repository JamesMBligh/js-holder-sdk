
import { Request, Response, NextFunction } from 'express';
import { getEndpoint } from './cdr-utils';
import { ResponseErrorListV2 } from 'consumer-data-standards/common';
import { DsbRequest } from './models/dsb-request';
import { DsbResponse } from './models/dsb-response';
import { CdrConfig } from './models/cdr-config';
import { DsbEndpoint } from './models/dsb-endpoint-entity';
import energyEndpoints from './data/cdr-energy-endpoints.json';
import bankingEndpoints from './data/cdr-banking-endpoints.json';
import commonEndpoints from './data/cdr-common-endpoints.json';

const defaultEndpoints = [...energyEndpoints, ...bankingEndpoints, ...commonEndpoints] as any[];

export function cdrTokenValidator(config: CdrConfig | undefined): any {

    return function auth(req: DsbRequest, res: DsbResponse, next: NextFunction) : any {

        let endpoints : DsbEndpoint[] = [];
        if (config?.endpoints == null) {
            endpoints = defaultEndpoints;
        } else {
            endpoints = config?.endpoints as DsbEndpoint[];
        }

        let errorList : ResponseErrorListV2 = {
            errors:  []
        }
        
        let ep = getEndpoint(req, config);
        if (ep != null) {
            // if there no authorisation required
            if (ep.authScopesRequired == null) {
                next();
                return;
            } 
            // check if a token exists at all    
            if (!req.headers || !req.headers.authorization) {
                res.status(401).json();
                return;
            }

            // If there is no scopes property on the request object, go the next()
            if (req?.scopes == undefined) {
                errorList.errors.push({code: 'urn:au-cds:error:cds-all:Authorisation/InvalidConsent', title: 'InvalidConsent', detail: 'Invalid scope'})
                res.status(403).json(errorList);
                return;   
                // next();
                // return;
            }

            // check if the right scope exist        
            let availableScopes  = req?.scopes;

            // read the scope and compare to the scope required
            if (availableScopes == undefined || availableScopes?.indexOf(ep.authScopesRequired) == -1) {
                errorList.errors.push({code: 'urn:au-cds:error:cds-all:Authorisation/InvalidConsent', title: 'InvalidConsent', detail: 'Invalid scope'})
                res.status(403).json(errorList);
                return;         
            } 
        }
        if (config?.specifiedEndpointsOnly) {
            // this endpoint was not found
            res.status(404).json(errorList);
            return;
        }
        next();
    } 
}



