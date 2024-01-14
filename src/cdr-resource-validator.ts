
import { Request, Response, NextFunction } from 'express';
import { authorisedForAccount, getEndpoint, scopeForRequestIsValid } from './cdr-utils';
import { IUserService } from './models/user-service.interface';
import { ResponseErrorListV2 } from 'consumer-data-standards/common';


export function cdrResourceValidator(userService: IUserService): any {

    return async function auth(req: Request, res: Response, next: NextFunction) {
            console.log("cdrResourceValidator.....");
            let errorList: ResponseErrorListV2 = {
                errors: []
            }
            let user = userService.getUser();
            // check the requested accountId or other url parameters specific to a logged in user
            if (authorisedForAccount(req, user) == false) {
                errorList.errors.push({ code: 'urn:au-cds:error:cds-all:Resource/Invalid', title: 'Invalid', detail: `${req.url}` });

                res.status(404).json(errorList);
                return;                    
            }   
            next();    
    } 
}
