
import { Request, Response, NextFunction } from 'express';
import { authorisedForAccount, getEndpoint, scopeForRequestIsValid } from './cdr-utils';
import { ResponseErrorListV2 } from 'consumer-data-standards/common';
import { DsbRequest } from './models/dsb-request';
import { DsbResponse } from './models/dsb-response';
import { CdrConfig } from './models/cdr-config';
import { IAuthService } from './models/auth-service.interface';




export function cdrAuthenticationValidator(config: CdrConfig, authService: IAuthService): any {

    return async function auth(req: Request, res: Response, next: NextFunction) {

            let token = req.headers?.authorization as string;
            console.log(`Token received is ${token}`);

            if (token == null) {
                console.log("No token was found");
                res.status(401).json('Not authorized');
                return;        
            }
            let tokenIsValid = await authService?.verifyAccessToken(token)
            if (tokenIsValid == false) {
                console.log("Tken was checked and found to be invalid");
                res.status(401).json('Not authorized');
                return;
            }

            let errorList : ResponseErrorListV2 = {
                errors:  []
            }

            // check if a user object exdists
            if (authService.authUser == null) {
                console.log("No authenticatid user object has been set.");
                res.status(401).json('Not authorized');
                return;            
            }
            // check if the right scope exist 
            if (scopeForRequestIsValid(req, authService.authUser?.scopes_supported) == false) {
                errorList.errors.push({code: 'urn:au-cds:error:cds-all:Authorisation/InvalidConsent', title: 'InvalidConsent', detail: 'Invalid scope'})
                res.status(403).json(errorList);
                return;         
            } 

            // check the requested accountId or other url parameters specific to a logged in user
            if (authorisedForAccount(req, authService.authUser) == false) {
                // errorList.errors.push({code: 'urn:au-cds:error:cds-all:Authorisation/InvalidConsent', title: 'InvalidConsent', detail: 'Invalid scope'})
                // res.status(403).json(errorList);
                res.status(404).json('Not Found');
                return;                    
            }   
            next();
       
    } 
}



