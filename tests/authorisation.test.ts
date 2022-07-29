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
        url: 'http://locahost:1234/energy/electricity/servicepoints'          
    };
        mockResponse = {
             send: jest.fn(),
             setHeader: jest.fn(),
             json: jest.fn(),
             status: jest.fn().mockImplementation(() =>  mockStatus)
        };
     });

    test('Without headers', async () => {
        // const expectedResponse = {
        //     error: "Missing JWT token from the 'Authorization' header"
        // };

    let options: EndpointConfig[] = [{
        "requestType": "GET",
        "requestPath": "/energy/plans",
        "minSupportedVersion": 1,
        "maxSupportedVersion": 4
    }]
        mockRequest = { 
            url: 'http://locahost:1234/energy/electricity/servicepoints'          
        };
        cdrAuthorisation(mockRequest as Request, mockResponse as Response, nextFunction, options);
       // expect(mockResponse.json).toBeCalledWith(expectedResponse);
        expect(mockResponse.status).toBeCalledWith(401);
    });

    test('No authorization required', async () => {
        mockRequest = { 
            url: 'http://locahost:1234/energy/plans'          
        };

    let options: EndpointConfig[] = [{
        "requestType": "GET",
        "requestPath": "/energy/plans",
        "minSupportedVersion": 1,
        "maxSupportedVersion": 4
    }]
        cdrAuthorisation(mockRequest as Request, mockResponse as Response, nextFunction, options);
        expect(nextFunction).toBeCalledTimes(1);
    });

    test('Without "authorization" header', async () => {
        // const expectedResponse = {
        //     "error": "Missing JWT token from the 'Authorization' header"
        // };

    let options: EndpointConfig[] = [{
        "requestType": "GET",
        "requestPath": "/energy/accounts",
        "minSupportedVersion": 1,
        "maxSupportedVersion": 4
    }]
        mockRequest = {
            url: 'http://locahost:1234/energy/energy/accounts',
            headers: {
            }
        }
        cdrAuthorisation(mockRequest as Request, mockResponse as Response, nextFunction, options);

      //  expect(mockResponse.json).toBeCalledWith(expectedResponse);
        expect(mockResponse.status).toBeCalledWith(401);
    });

    test('With "authorization" header', async () => {
        mockRequest = {
            url: 'http://locahost:1234/energy/electricity/servicepoints',
            headers: {
                'Authorization': 'Bearer abc'
            }
        }

    let options: EndpointConfig[] = [{
        "requestType": "GET",
        "requestPath": "/energy/accounts",
        "minSupportedVersion": 1,
        "maxSupportedVersion": 4
    }]
        cdrAuthorisation(mockRequest as Request, mockResponse as Response, nextFunction, options);
        expect(nextFunction).toBeCalledTimes(1);
    });
});
