import { Request, NextFunction } from 'express';
import  jwt_decode from  "jwt-decode";
import { DsbResponse } from './models/dsb-response';




// Extend the request object and add scopes based on JWT access token
// This implementation expects the scopes in the JWT to be a space seperated string
export function cdrJwtScopesSpaceSeparated(req: Request, res: DsbResponse, next: NextFunction) {
    if (!req.headers || !req.headers.authorization) {
        res.status(401).json();
        return;
    }
    // check if the right scope exist
    let token = req.headers.authorization;
    let decoded = null;
    let receivedScopes = [];
    try {
        decoded = jwt_decode(token) as any;
        receivedScopes = decoded.scope.split(' ');
        let y = 9;
    } catch (error) {
        // capture corrupt or invalid token
        res.status(401).json();
        return;                 
    }
    res.scopes = receivedScopes;
    next(); 
    return;   
}


// Extend the request object and add scopes based on JWT access token
// This implementation expects the scopes in the JWT to be an array of strings
export function cdrJwtScopesListSeparated(req: Request, res: DsbResponse, next: NextFunction) {
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
    res.scopes = decoded?.scope;
    next(); 
    return;
}

