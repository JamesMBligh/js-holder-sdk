
import { Request } from 'express';
import { DsbEndpoint } from './models/dsb-endpoint-entity';
import energyEndpoints from './data/cdr-energy-endpoints.json';
import bankingEndpoints from './data/cdr-banking-endpoints.json';
import { EndpointConfig } from './models/endpoint-config';
import { ResponseErrorListV2 } from 'consumer-data-standards/common';

const endpoints = [...energyEndpoints, ...bankingEndpoints];


export function getEndpoint(req: Request, options: EndpointConfig[], errorList : ResponseErrorListV2 ): DsbEndpoint | null {
    // remove the host and assign to urlId
    // incrementally remove part of the urlId until a match is found
    // once a match is found and the last part is a url parameter as per endpoint defintions
    //  => look forward to identify if there is a url component after the paramenter
    //  => there is nothing after the url (ie it matched the enpoint definition exactly)
    //  => the last part of the url is a parameter AND it is the last part
    //  => the next part of the url is a parameter, but it is NOT the last part

    let idx = endpoints.findIndex(x => req.url.includes(x.requestPath));
    let idx1 = -1;
    if (idx < 0) {
        /// this url is not an endpoint supported
        errorList.errors.push({code: 'urn:au-cds:error:cds-all:Resource/NotFound', title: 'NotFound', detail: 'This endpoint is not a CDR endpoint'})
    }
    else {
        idx1 = options.findIndex(x => x.requestPath == endpoints[idx].requestPath);
        if (idx1 < 0) {
            // this is a CDR endpoint but it has not been implemenetd by this server
            errorList.errors.push({code: 'urn:au-cds:error:cds-all:Resource/NotImplemented', title: 'NotImplemented', detail: 'This endpoint has not been implemented'})
        }
    }
    if (errorList.errors.length == 0)
        return endpoints[idx] as DsbEndpoint;
    else
        return null;
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