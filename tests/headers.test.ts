

import { Request, Response, NextFunction} from 'express';
import { dsbHeaders } from "../src/header";
import { ResponseErrorListV2 } from 'consumer-data-standards';
import { stringify } from 'uuid';

describe('Invalid x-v header', function () {

    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction = jest.fn();

    beforeEach(() => {
        mockRequest = {};
        mockResponse = {
            send: jest.fn(),
            setHeader: jest.fn(),
            json: jest.fn(),
            status: jest.fn()
        };
    });

    test('missing x-v value is returns error', function () {
        let returnedErrors: ResponseErrorListV2 = {
            errors: [ {
                code: 'urn:au-cds:error:cds-all:Header/Missing',
                title: 'Missing Required Header',
                detail: 'x-v'
            }]
        };
        dsbHeaders(mockRequest as Request, mockResponse as Response,nextFunction);
        expect(mockResponse.send).toBeCalledWith(returnedErrors);
        expect(mockResponse.status).toBeCalledWith(400);
    });

    test('non-numeric x-v value returns error', function () {
        let returnedErrors: ResponseErrorListV2 = {
            errors: [ {
                code: 'urn:au-cds:error:cds-all:Header/InvalidVersion',
                title: 'Invalid Version',
                detail: 'x-v'
            }]
        };
        // need to set the header for our mock
        mockRequest = {
            headers: {
                'x-v': 'some_stupid_stuff'
            }
        };
        dsbHeaders(mockRequest as Request, mockResponse as Response,nextFunction);
        expect(mockResponse.send).toBeCalledWith(returnedErrors);
        expect(mockResponse.status).toBeCalledWith(400);
    });

    test('invalid numeric x-v value returns error', function () {
        let returnedErrors: ResponseErrorListV2 = {
            errors: [ {
                code: 'urn:au-cds:error:cds-all:Header/InvalidVersion',
                title: 'Invalid Version',
                detail: 'x-v'
            }]
        };
        // need to set the header for our mock
        mockRequest = {
            headers: {
                'x-v': '1.0'
            }
        };
        dsbHeaders(mockRequest as Request, mockResponse as Response,nextFunction);
        expect(mockResponse.send).toBeCalledWith(returnedErrors);
        expect(mockResponse.status).toBeCalledWith(400);
    });

});

describe('Valid x-v header', function () {

    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction = jest.fn();

    beforeEach(() => {
        mockRequest = {};
        mockResponse = {
            send: jest.fn(),
            setHeader: jest.fn(),
            json: jest.fn(),
            status: jest.fn(),
        };
    });

    test('x-v value exists', function () {
        mockRequest = {
            headers: {
                'x-v': '1'
            }
        };
        dsbHeaders(mockRequest as Request, mockResponse as Response,nextFunction);
        expect(nextFunction).toBeCalledTimes(1);
        //expect(mockResponse.status).toBeCalledWith(200);
    });
});

describe('Validate x-fapi-header header', function () {

    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction = jest.fn(); 

    beforeEach(() => {
        mockRequest = {};
        mockResponse = {
            send: jest.fn(),
            setHeader: jest.fn(),
            getHeader: jest.fn(),
            json: jest.fn(),
            status: jest.fn(),
        };
    });
    test('x-fapi value is returned', function () {
        dsbHeaders(mockRequest as Request, mockResponse as Response,nextFunction);
        //expect(mockResponse.setHeader).toBeCalledWith("x-fapi-interaction-id", any);
        console.log(JSON.stringify(mockResponse));
        expect(nextFunction).toBeCalledTimes(1);
    });

    test('x-fapi response matches x-fapi request ', function () {
        const mockUUID = 'c24218e2-295c-497a-8085-b9b8038d8baa';
        mockRequest = {
            headers: {
                'x-v': '1',
                'x-fapi-interaction-id': mockUUID
            }
        };
        dsbHeaders(mockRequest as Request, mockResponse as Response,nextFunction);
        expect(mockResponse.setHeader).toBeCalledWith("x-fapi-interaction-id", mockUUID);
        expect(nextFunction).toBeCalledTimes(1);
    });

    test('invalid x-fapi return error ', function () {
        const mockUUID = 'I_AM_INVALID';
        mockRequest = {
            headers: {
                'x-v': '1',
                'x-fapi-interaction-id': mockUUID
            }
        };
        let returnedErrors: ResponseErrorListV2 = {
            errors: [ {
                code: 'urn:au-cds:error:cds-all:Header/Invalid',
                title: 'Invalid Header',
                detail: 'x-fapi-interaction-id'
            }]
        };
        dsbHeaders(mockRequest as Request, mockResponse as Response,nextFunction);
        expect(mockResponse.send).toBeCalledWith(returnedErrors);
        expect(mockResponse.status).toBeCalledWith(400);
    });

    test('content type is json', function () {
        dsbHeaders(mockRequest as Request, mockResponse as Response,nextFunction);
       // expect(mockResponse.).toBe(true);
    });

});

