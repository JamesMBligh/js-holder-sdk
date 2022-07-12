
import { Request, Response, NextFunction } from 'express';
import { validate as uuidValidate } from 'uuid';
import { v4 as uuidv4 } from 'uuid';


export function dsbAuthorisation (request: Request, response: Response, next: NextFunction) {
    if (!request.headers || !request.headers['authorization']) {
        response.statusCode = 403;
        response.json({ error: "Missing JWT token from the 'Authorization' header" });
    } else {
        next();
    }
};
