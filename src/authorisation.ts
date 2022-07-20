
import { Request, Response, NextFunction } from 'express';
import { validate as uuidValidate } from 'uuid';
import { v4 as uuidv4 } from 'uuid';
import endpoints from './data/energy-endpoints.json'

export function dsbAuthorisation (request: Request, response: Response, next: NextFunction) {
    
    if (isAuthorisationRequired(request) == false) {
        next();
        return;
    }     
    if (!request.headers || !request.headers['Authorization']) {
        response.statusCode = 403;
        response.json({ error: "Missing JWT token from the 'Authorization' header" });
    } else {
        next();
    }
};

function isAuthorisationRequired(req: Request): boolean {
    // determine from the url if authorisation is required
    let idx = endpoints.findIndex(x => req.url.includes(x.requestPath));
    let ep = endpoints[idx];
    return ep.requiresAuthorisation;
}
