
import { Request, Response, NextFunction } from 'express';
import { authorisedForAccount, getEndpoint, scopeForRequestIsValid } from './cdr-utils';
import { IUserService } from './models/user-service.interface';


export function cdrResourceValidator(userService: IUserService): any {

    return async function auth(req: Request, res: Response, next: NextFunction) {
            console.log("cdrResourceValidator.....");
            let user = userService.getUser();
            // check the requested accountId or other url parameters specific to a logged in user
            if (authorisedForAccount(req, user) == false) {
                res.status(404).json('Not Found');
                return;                    
            }   
            next();    
    } 
}
