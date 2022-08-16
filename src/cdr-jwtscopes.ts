import { Request, NextFunction } from 'express';
import  jwt_decode from  "jwt-decode";
import { DsbAuthConfig } from './models/dsb-auth-config';
import { DsbRequest } from './models/dsb-request';
import { DsbResponse } from './models/dsb-response';



export function cdrJwtScopes(authOptions: DsbAuthConfig) {  
    // Extend the request object and add scopes based on JWT access token
    // This implementation expects the scopes in the JWT to be a space seperated string
    return function scopes(req: DsbRequest, res: DsbResponse, next: NextFunction) {
        if (!req.headers || !req.headers.authorization) {
            next();
            return;
        }
        // check if the right scope exist
        let token = req.headers.authorization;
        let decoded = null;
       // let receivedScopes = [];
        try {
            decoded = jwt_decode(token) as any;
            if (authOptions.scopeFormat == 'STRING') {
                req.scopes = decoded?.scope.split(' ');
            }
            if (authOptions.scopeFormat == 'LIST') {
                req.scopes = decoded?.scope;
            }
            
        } catch (error) {
            // capture corrupt or invalid token
            next();
            return;                 
        }
        //req.scopes = receivedScopes;
        next(); 
    }
}


