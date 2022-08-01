
import { Request, Response, NextFunction } from 'express';
import energyEndpoints from './data/energy-endpoints.json';
import bankingEndpoints from './data/banking-endpoints.json';
import { EndpointConfig } from './models/endpoint-config';
import { isAuthorisationRequired } from './cdr-utils';

const endpoints = [...energyEndpoints, ...bankingEndpoints];

export function cdrAuthorisation(req: Request, res: Response, next: NextFunction, options: EndpointConfig[]): any{
      
    if (isAuthorisationRequired(req) == false) {
        next();
        return;
    }     
    if (!req.headers || !req.headers.authorization) {
        res.status(401).json();
        return;
    }
    next();
}



