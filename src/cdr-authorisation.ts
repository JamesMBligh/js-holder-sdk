
import { Request, Response, NextFunction } from 'express';
import defaultEnergyEndpoints from './data/default-energy.json';
import defaultBankingEndpoints from './data/default-banking.json';
import { EndpointConfig } from './models/endpoint-config';
import { getEndpoint } from './cdr-utils';
import { ResponseErrorListV2 } from 'consumer-data-standards/common';
import  jwt_decode from  "jwt-decode";


const defaultOptions = [...defaultEnergyEndpoints, ...defaultBankingEndpoints] as EndpointConfig[];

export function cdrAuthorisation(authOptions: EndpointConfig[] = defaultOptions): any {

    return function auth(req: Request, res: Response, next: NextFunction) : any {

        let errorList : ResponseErrorListV2 = {
            errors:  []
        }
        let ep = getEndpoint(req, authOptions, errorList);
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
            let token = req.headers.authorization;
            let decoded = null;
            try {
                decoded = jwt_decode(token) as any;
            } catch (error) {
                // capture corrupt or invalid token
                res.status(401).json();
                return;                 
            }
            
            let availableScopes  = decoded.scope;
            // read the scope and compare to the scope required
            if (availableScopes.indexOf(ep.authScopesRequired) == -1) {
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



