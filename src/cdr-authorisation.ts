
import { Request, Response, NextFunction } from 'express';
import { getEndpoint } from './cdr-utils';
import { ResponseErrorListV2 } from 'consumer-data-standards/common';
import { DsbRequest } from './models/dsb-request';
import { DsbResponse } from './models/dsb-response';
import { CdrConfig } from './models/cdr-config';




export function cdrAuthorisation(authOptions: CdrConfig): any {

    return function auth(req: DsbRequest, res: DsbResponse, next: NextFunction) : any {

        let errorList : ResponseErrorListV2 = {
            errors:  []
        }
        let ep = getEndpoint(req, authOptions.endpoints, errorList);
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

            // check if the right scope exist        
            let availableScopes  = req.scopes;
            // read the scope and compare to the scope required
            if (availableScopes == undefined || availableScopes?.indexOf(ep.authScopesRequired) == -1) {
                errorList.errors.push({code: 'urn:au-cds:error:cds-all:Authorisation/InvalidConsent', title: 'InvalidConsent', detail: 'Invalid scope'})
                res.status(403).json(errorList);
                return;         
            } 
        } else {
            // if the endpoint is null, there will be some errors (genereated in getEndpoint)
            res.status(404).json(errorList);
            return;   
        }
        next();
    } 
}



