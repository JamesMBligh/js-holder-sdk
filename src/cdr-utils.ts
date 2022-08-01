
import { ResponseErrorListV2 } from 'consumer-data-standards/common';
import { Request, Response, NextFunction } from 'express';
import { validate as uuidValidate } from 'uuid';
import { v4 as uuidv4 } from 'uuid';
import { Endpoint } from './models/endpoint-entity';
import { ErrorEntity } from './models/error-entity';
import energyEndpoints from './data/energy-endpoints.json';
import bankingEndpoints from './data/banking-endpoints.json';
import { EndpointConfig } from './models/endpoint-config';

const endpoints = [...energyEndpoints, ...bankingEndpoints];

export function isAuthorisationRequired(req: Request): boolean {
    // determine from the url if authorisation is required
    let idx = endpoints.findIndex(x => req.url.includes(x.requestPath));
    let ep = endpoints[idx];
    return ep.authScopesRequired != null;
}

export function getEndpoint(req: Request): Endpoint {
    // remove the host and assign to urlId
    // incrementally remove part of the urlId until a match is found
    // once a match is found and the last part is a url parameter as per endpoint defintions
    //  => look forward to identify if there is a url component after the paramenter
    //  => there is nothing after the url (ie it matched the enpoint definition exactly)
    //  => the last part of the url is a parameter AND it is the last part
    //  => the next part of the url is a parameter, but it is NOT the last part

    let idx = endpoints.findIndex(x => req.url.includes(x.requestPath));
    let ep = endpoints[idx];
    return ep as Endpoint;
}

export function findXFapiRequired(req: Request): boolean {
    try {
        let idx = endpoints.findIndex(x => req.url.includes(x.requestPath));
        let ep = endpoints[idx];
        return ep.requiresXFAPI ??= true;
    } catch(e) {
        return true;
    }
}