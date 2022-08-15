import { ResponseErrorListV2 } from 'consumer-data-standards/common';
import { NextFunction, Response } from 'express';
import { cdrAuthorisation } from '../src/cdr-authorisation';
import { cdrJwtScopesListSeparated } from '../src/cdr-jwtscopes';
import { DsbRequest } from '../src/models/dsb-request';
import { DsbResponse } from '../src/models/dsb-response';
import { EndpointConfig } from '../src/models/endpoint-config';

describe('Authorization middleware', () => {
    let mockRequest: Partial<DsbRequest>;
    let mockResponse: Partial<DsbResponse>;
    let nextFunction: NextFunction = jest.fn();
    let mockStatus : Partial<DsbResponse>;
    let standardsVersion = '/cds-au/v1';

    let options: EndpointConfig[] = [];

    beforeEach(() => {
        nextFunction = jest.fn() ;
        mockStatus = {
         send: jest.fn(),
         setHeader: jest.fn(),
         json: jest.fn(),
       }
       mockRequest = { 
        url: '/energy/electricity/servicepoints'          
    };
        mockResponse = {
             send: jest.fn(),
             setHeader: jest.fn(),
             json: jest.fn(),
             status: jest.fn().mockImplementation(() =>  mockStatus)
        };
     });


    test('With "authorization" header - invalid token', async () => {
        mockRequest = {
            method: 'GET',
            url: `${standardsVersion}/energy/accounts`,
            headers: {
                'authorization': 'Bearer hgfjgjjg'
            }
        }

        let options: EndpointConfig[] = [{
            "requestType": "GET",
            "requestPath": "/energy/accounts",
            "minSupportedVersion": 1,
            "maxSupportedVersion": 4
        }]
        let auth = cdrJwtScopesListSeparated(mockRequest as DsbRequest, mockResponse as DsbResponse, nextFunction as NextFunction);
        expect(mockResponse.status).toBeCalledWith(401);
    });        
});
