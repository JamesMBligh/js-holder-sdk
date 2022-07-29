import express from 'express';
import { EndpointConfig } from './src/models/endpoint-config';


declare module cdr {
    
    function cdrHeaders(req: express.Request, res: express.Response, next: express.NextFunction, options: EndpointConfig[]): any;
    function cdrAuthorisation(req: express.Request, res: express.Response, next: express.NextFunction, options: EndpointConfig[]): any;
}

export = cdr;