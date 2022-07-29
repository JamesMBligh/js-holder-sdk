
import { ResponseErrorListV2 } from 'consumer-data-standards/common';
import { Request, Response, NextFunction } from 'express';
import { validate as uuidValidate } from 'uuid';
import { v4 as uuidv4 } from 'uuid';
import { Endpoint } from './models/endpoint-entity';
import { ErrorEntity } from './models/error-entity';
import endpoints from './data/energy-endpoints.json'
import { EndpointConfig } from './models/endpoint-config';

export function cdrAuthorisation(req: Request, res: Response, next: NextFunction, options: EndpointConfig[]): any{
    
    if (isAuthorisationRequired(req) == false) {
        next();
        return;
    }     
    if (!req.headers || !req.headers['Authorization']) {
        res.status(401).json();
        return;
    }
    next();
}

function isAuthorisationRequired(req: Request): boolean {
    // determine from the url if authorisation is required
    let idx = endpoints.findIndex(x => req.url.includes(x.requestPath));
    let ep = endpoints[idx];
    return ep.requiresAuthorisation;
}
