import { NextFunction, Request, Response } from 'express';
import { cdrAuthorisation } from '../src/cdr-authorisation';
import { EndpointConfig } from '../src/models/endpoint-config';

describe('Authorization middleware', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction = jest.fn();
    let mockStatus : Partial<Response>;

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

    test('Without headers', async () => {

        let options: EndpointConfig[] = [{
            "requestType": "GET",
            "requestPath": "/energy/electricity/servicepoints",
            "minSupportedVersion": 1,
            "maxSupportedVersion": 4
        }]
        mockRequest = { 
            url: '/energy/electricity/servicepoints'          
        };
        let auth = cdrAuthorisation(options);
        auth(mockRequest as Request, mockResponse as Response, nextFunction as NextFunction);
        expect(mockResponse.status).toBeCalledWith(401);
    });

    test('No authorization required', async () => {
        mockRequest = { 
            url: '/energy/plans'          
        };

        let options: EndpointConfig[] = [{
            "requestType": "GET",
            "requestPath": "/energy/plans",
            "minSupportedVersion": 1,
            "maxSupportedVersion": 4
        }]
        let auth = cdrAuthorisation(options);
        auth(mockRequest as Request, mockResponse as Response, nextFunction as NextFunction);
        expect(nextFunction).toBeCalledTimes(1);
    });

    test('Without "authorization" header', async () => {

    let options: EndpointConfig[] = [{
        "requestType": "GET",
        "requestPath": "/energy/accounts",
        "minSupportedVersion": 1,
        "maxSupportedVersion": 4
    }]
        mockRequest = {
            url: '/energy/accounts',
            headers: {
            }
        }
        let auth = cdrAuthorisation(options);
        auth(mockRequest as Request, mockResponse as Response, nextFunction as NextFunction);
        expect(mockResponse.status).toBeCalledWith(401);
    });

    test('With "authorization" header', async () => {
        mockRequest = {
            url: '/energy/electricity/servicepoints',
            headers: {
                'authorization': 'Bearer abc'
            }
        }

        let options: EndpointConfig[] = [{
            "requestType": "GET",
            "requestPath": "/energy/electricity/servicepoints",
            "minSupportedVersion": 1,
            "maxSupportedVersion": 4
        }]
        let auth = cdrAuthorisation(options);
        auth(mockRequest as Request, mockResponse as Response, nextFunction as NextFunction);
        expect(nextFunction).toBeCalledTimes(1);
    });
});
