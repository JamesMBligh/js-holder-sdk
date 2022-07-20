import { NextFunction, Request, Response } from 'express';
import { dsbAuthorisation } from '../src/authorisation';

describe('Authorization middleware', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction;

    beforeEach(() => {
        nextFunction = jest.fn();
        mockRequest = { 
            url: 'http://locahost:1234/energy/electricity/servicepoints'          
        };
        mockResponse = {
            json: jest.fn()
        };
    });

    test('Without headers', async () => {
        const expectedResponse = {
            error: "Missing JWT token from the 'Authorization' header"
        };
        mockRequest = { 
            url: 'http://locahost:1234/energy/electricity/servicepoints'          
        };
        dsbAuthorisation(mockRequest as Request, mockResponse as Response, nextFunction);
        expect(mockResponse.json).toBeCalledWith(expectedResponse);
    });

    test('No authorization required', async () => {
        mockRequest = { 
            url: 'http://locahost:1234/energy/plans'          
        };
        dsbAuthorisation(mockRequest as Request, mockResponse as Response, nextFunction);
        expect(nextFunction).toBeCalledTimes(1);
    });

    test('Without "authorization" header', async () => {
        const expectedResponse = {
            "error": "Missing JWT token from the 'Authorization' header"
        };
        mockRequest = {
            url: 'http://locahost:1234/energy/electricity/servicepoints',
            headers: {
            }
        }
        dsbAuthorisation(mockRequest as Request, mockResponse as Response, nextFunction);

        expect(mockResponse.json).toBeCalledWith(expectedResponse);
    });

    test('With "authorization" header', async () => {
        mockRequest = {
            url: 'http://locahost:1234/energy/electricity/servicepoints',
            headers: {
                'Authorization': 'Bearer abc'
            }
        }
        dsbAuthorisation(mockRequest as Request, mockResponse as Response, nextFunction);

        expect(nextFunction).toBeCalledTimes(1);
    });
});
