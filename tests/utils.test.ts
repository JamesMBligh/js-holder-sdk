import { NextFunction, Request, Response } from 'express';
import { cdrAuthorisation } from '../src/cdr-authorisation';
import energyEndpoints from '../src/data/energy-endpoints.json';
import bankingEndpoints from '../src/data/banking-endpoints.json'
import { EndpointConfig } from '../src/models/endpoint-config';
import { getEndpoint } from '../src/cdr-utils';
import { ResponseErrorListV2 } from 'consumer-data-standards/common';

describe('Utility functions', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction = jest.fn();
    let mockStatus : Partial<Response>;

    let options: EndpointConfig[] = [];
    let errorList : ResponseErrorListV2;

    beforeEach(() => {
        nextFunction = jest.fn() ;
        mockStatus = {
         send: jest.fn(),
         setHeader: jest.fn(),
         json: jest.fn(),
       }
        mockResponse = {
             send: jest.fn(),
             setHeader: jest.fn(),
             json: jest.fn(),
             status: jest.fn().mockImplementation(() =>  mockStatus)
        };
        options = [{
            "requestType": "GET",
            "requestPath": "/energy/electricity/servicepoints",
            "minSupportedVersion": 1,
            "maxSupportedVersion": 4
            },
            {
                "requestType": "GET",
                "requestPath": "/banking/accounts/{accountId}/balance",
                "minSupportedVersion": 1,
                "maxSupportedVersion": 4
            },
            {
                "requestType": "GET",
                "requestPath": "/banking/accounts/{accountId}",
                "minSupportedVersion": 1,
                "maxSupportedVersion": 4
            }
        ];
        errorList  = {
            errors:  []
        }
     });


    test('Find endpoints - no parameters', async () => {
        
        const endpoints = [...energyEndpoints, ...bankingEndpoints];  
        mockRequest = {
            url: 'http://locahost:1234/energy/electricity/servicepoints',
        }

        //req: Request, options: EndpointConfig[], errorList : ResponseErrorListV2 
        let ep = getEndpoint(mockRequest as Request, options, errorList);
        expect(ep).not.toBeNull()

    });

    test.skip('Find endpoints - parameters at end', async () => {
        
        const endpoints = [...energyEndpoints, ...bankingEndpoints];  
        mockRequest = {
            url: 'http://locahost:1234//banking/accounts/1234567',
        }
        let ep = getEndpoint(mockRequest as Request, options, errorList);
        expect(ep).not.toBeNull()

    });

    test.skip('Find endpoints - parameters embedded', async () => {
        
        const endpoints = [...energyEndpoints, ...bankingEndpoints];  
        mockRequest = {
            url: 'http://locahost:1234//energy/accounts/123456/balance',
        }
        let ep = getEndpoint(mockRequest as Request, options, errorList);
        expect(ep).not.toBeNull()

    });

    test('Find endpoints - invalid', async () => {
        
        const endpoints = [...energyEndpoints, ...bankingEndpoints];  
        mockRequest = {
            url: 'http://locahost:1234/energy/all-customer',
        }
        let ep = getEndpoint(mockRequest as Request, options, errorList);
        expect(ep).toBeNull();

    });
});
