import express from 'express';

declare namespace dsbapi {
    
    export function dsbHeaders(req: express.Request, res: express.Response, next: express.NextFunction)
}

export = dsbapi;