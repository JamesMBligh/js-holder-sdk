
import { Request, Response, NextFunction } from 'express';
import energyEndpoints from './data/energy-endpoints.json';
import bankingEndpoints from './data/banking-endpoints.json';
import { EndpointConfig } from './models/endpoint-config';
import { getEndpoint } from './cdr-utils';
import { ResponseErrorListV2 } from 'consumer-data-standards/common';

const endpoints = [...energyEndpoints, ...bankingEndpoints];

export function cdrAuthorisation(options: EndpointConfig[]): any {

    return function auth(req: Request, res: Response, next: NextFunction) : any {

        let errorList : ResponseErrorListV2 = {
            errors:  []
        }
        let ep = getEndpoint(req, options, errorList);
        if (ep != null) {
            if (ep.authScopesRequired == null) {
                next();
                return;
            }     
            if (!req.headers || !req.headers.authorization) {
                res.status(401).json();
                return;
            }
        } else {
            res.status(404).json(errorList);
            return;   
        }
        next();
    } 
}



