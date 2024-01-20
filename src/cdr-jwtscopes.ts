import { Request, NextFunction } from 'express';
import  jwt_decode from  "jwt-decode";
import { DsbAuthConfig } from './models/dsb-auth-config';
import { DsbRequest } from './models/dsb-request';
import { DsbResponse } from './models/dsb-response';



export function cdrJwtScopes(authOptions: DsbAuthConfig): any {  
    // Extend the request object and add scopes based on JWT access token
    // This implementation expects the scopes in the JWT to be a space seperated string
    return function scopes(req: DsbRequest, res: DsbResponse, next: NextFunction) {
        console.log("cdrJwtScopes.....");
        if (!req.headers || !req.headers.authorization) {
            next();
            return;
        }
        // check if the right scope exist
        let token = req.headers.authorization;
        let decoded = null;
        try {
            decoded = jwt_decode(token) as any;
            if (authOptions.scopeFormat == 'STRING') {
                console.log("cdrJwtScopes: scopes read as single string");
                req.scopes = decoded?.scope.split(' ');
            }
            if (authOptions.scopeFormat == 'LIST') {
                console.log("cdrJwtScopes: scopes read as list");
                req.scopes = decoded?.scope;
            }
            
        } catch (error) {
            // capture corrupt or invalid token
            console.log("cdrJwtScopes: missing, corrupt or invalid token");
            next();
            return;                 
        }
        console.log("cdrJwtScopes: OK.");
        next(); 
    }
}


