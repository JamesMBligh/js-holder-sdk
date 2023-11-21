
import { Request, Response, NextFunction } from 'express';
import { getEndpoint } from './cdr-utils';
import { ResponseErrorListV2 } from 'consumer-data-standards/common';
import { CdrConfig } from './models/cdr-config';
import { IUserService } from './models/user-service.interface';

export function cdrScopeValidator(authOptions: CdrConfig, userService: IUserService): any {

    return function token(req: Request, res: Response, next: NextFunction): any {

        let errorList: ResponseErrorListV2 = {
            errors: []
        }
        let ep = getEndpoint(req, authOptions.endpoints, errorList);
        if (ep != null) {
            // if there no authorisation required
            if (ep.authScopesRequired == null) {
                next();
                return;
            }

            // get the user
            let usr = userService.getUser();
            // check if a user exists at all    
            if (!usr) {
                res.status(401).json();
                return;
            }
            // check if a token exists at all    
            if (!req.headers || !req.headers.authorization) {
                res.status(401).json();
                return;
            }

            // check if the right scope exist        
            let availableScopes = usr?.scopes_supported;
            // If there is no scopes property on the request object, go the next()
            if (availableScopes == undefined) {
                next();
                return;
            }

            // read the scope and compare to the scope required
            if (availableScopes == undefined || availableScopes?.indexOf(ep.authScopesRequired) == -1) {
                errorList.errors.push({ code: 'urn:au-cds:error:cds-all:Authorisation/InvalidConsent', title: 'InvalidConsent', detail: 'Invalid scope' })
                res.status(403).json(errorList);
                return;
            }
        }
        next();
    }
}
