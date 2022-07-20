

import { Request, Response, NextFunction} from 'express';
import { dsbHeaders } from "../src/header";
import { ResponseErrorListV2 } from 'consumer-data-standards/common';
import { stringify } from 'uuid';

describe('Invalid x-v header', function () {

    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction;

    let options = {}

    beforeEach(() => {
       nextFunction = jest.fn() 
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
        mockRequest.url = "https://localhost:1234/energy/plans/";
        dsbHeaders(mockRequest as Request, mockResponse as Response, nextFunction, options);
        expect(mockResponse.json).toBeCalledWith(returnedErrors);
        expect(mockResponse.status).toBeCalledWith(400);
        expect(nextFunction).toBeCalledTimes(1);
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
            url: "https://localhost:1234/energy/plans/",
            headers: {
                'x-v': 'some_stupid_stuff'
            }
        };
        dsbHeaders(mockRequest as Request, mockResponse as Response,nextFunction, options);
        expect(mockResponse.json).toBeCalledWith(returnedErrors);
        expect(mockResponse.status).toBeCalledWith(400);
        expect(nextFunction).toBeCalledTimes(1);
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
            url: "https://localhost:1234/energy/plans/",
            headers: {
                'x-v': '1.0'
            }
        };
        dsbHeaders(mockRequest as Request, mockResponse as Response,nextFunction, options);
        expect(mockResponse.json).toBeCalledWith(returnedErrors);
        expect(mockResponse.status).toBeCalledWith(400);
        expect(nextFunction).toBeCalledTimes(1);
    });

});

describe('Valid x-v header', function () {

    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction = jest.fn();

    let options = {

    };

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
            },
            url: "https://localhost:1234/energy/plans/"
        };
        dsbHeaders(mockRequest as Request, mockResponse as Response,nextFunction, options);
        expect(nextFunction).toBeCalledTimes(1);
        expect(mockResponse.status).toBeCalledWith(200);
    });
});


describe('Invalid x-v-min header', function () {

    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction;

    let options = {
        "requestType": "GET",
        "requestPath": "/energy/plans",
        "minSupportedVersion": 1,
        "maxSupportedVersion": 4
    }

    beforeEach(() => {
       nextFunction = jest.fn() 
       mockRequest = {};
       mockResponse = {
            send: jest.fn(),
            setHeader: jest.fn(),
            json: jest.fn(),
            status: jest.fn()
       };
    });


    test('non-numeric x-min-v value returns error', function () {
        let returnedErrors: ResponseErrorListV2 = {
            errors: [ {
                code: 'urn:au-cds:error:cds-all:Header/InvalidVersion',
                title: 'Invalid Version',
                detail: 'x-min-v'
            }]
        };
        // need to set the header for our mock
        mockRequest = {
            url: "https://localhost:1234/energy/plans/",
            headers: {
                'x-min-v': 'some_stupid_stuff'
            }
        };
        dsbHeaders(mockRequest as Request, mockResponse as Response,nextFunction, options);
        expect(mockResponse.json).toBeCalledWith(returnedErrors);
        expect(mockResponse.status).toBeCalledWith(400);
        expect(nextFunction).toBeCalledTimes(1);
    });

    test('invalid numeric x-min-v value returns error', function () {
        let returnedErrors: ResponseErrorListV2 = {
            errors: [ {
                code: 'urn:au-cds:error:cds-all:Header/InvalidVersion',
                title: 'Invalid Version',
                detail: 'x-min-v'
            }]
        };
        // need to set the header for our mock
        mockRequest = {
            url: "https://localhost:1234/energy/plans/",
            headers: {
                'x-min-v': '1.0'
            }
        };
        dsbHeaders(mockRequest as Request, mockResponse as Response,nextFunction, options);
        expect(mockResponse.json).toBeCalledWith(returnedErrors);
        expect(mockResponse.status).toBeCalledWith(400);
        expect(nextFunction).toBeCalledTimes(1);
    });

});

describe('Valid x-v-min header', function () {

    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction = jest.fn();

    let options = {
        "requestType": "GET",
        "requestPath": "/energy/plans",
        "minSupportedVersion": 1,
        "maxSupportedVersion": 4
    };

    beforeEach(() => {
        mockRequest = {};
        mockResponse = {
            send: jest.fn(),
            setHeader: jest.fn(),
            json: jest.fn(),
            status: jest.fn(),
        };
    });

    test('x-min-v value is greater than x-v', function () {
        mockRequest = {
            headers: {           
                'x-v': '1',
                'x-min-v': '3'
            },
            url: "https://localhost:1234/energy/plans/"
        };
        dsbHeaders(mockRequest as Request, mockResponse as Response,nextFunction, options);
        expect(nextFunction).toBeCalledTimes(1);
        expect(mockResponse.status).toBeCalledWith(200);
    });

    test('x-min-v is supported', function () {
        mockRequest = {
            headers: {           
                'x-v': '5',
                'x-min-v': '3'
            },
            url: "https://localhost:1234/energy/plans/"
        };
        dsbHeaders(mockRequest as Request, mockResponse as Response,nextFunction, options);
        expect(nextFunction).toBeCalledTimes(1);
        //expect(mockResponse.status).toBeCalledWith(200);
    });

    test('x-min-v is NOT supported', function () {
        mockRequest = {
            headers: {           
                'x-v': '6',
                'x-min-v': '5'
            },
            url: "https://localhost:1234/energy/plans/"
        };

        dsbHeaders(mockRequest as Request, mockResponse as Response,nextFunction, options);
        expect(nextFunction).toBeCalledTimes(1);
        expect(mockResponse.status).toBeCalledWith(406);
    });
});

describe('Validate x-fapi-header header', function () {

    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction; 

    let options = {};

    beforeEach(() => {
        nextFunction = jest.fn(); 
        mockRequest = {
            headers: {
                'x-v': '1'
            }
        }
        mockResponse = {        
            send: jest.fn(),
            setHeader: jest.fn(),
            getHeader: jest.fn(),
            json: jest.fn(),
            status: jest.fn(),
        };
    });

    test('x-fapi value is returned', function () {
        mockRequest.url = "https://localhost:1234/energy/plans/";
        dsbHeaders(mockRequest as Request, mockResponse as Response, nextFunction, options);
        expect(mockResponse.setHeader).toBeCalledTimes(1);
        expect(nextFunction).toBeCalledTimes(1);
    });

    test('x-fapi response matches x-fapi request ', function () {
        const mockUUID = 'c24218e2-295c-497a-8085-b9b8038d8baa';
        mockRequest = {
            url: "https://localhost:1234/energy/plans/",
            headers: {
                'x-v': '1',
                'x-fapi-interaction-id': mockUUID
            }
        };
        dsbHeaders(mockRequest as Request, mockResponse as Response,nextFunction, options);
        expect(mockResponse.setHeader).toBeCalledWith("x-fapi-interaction-id", mockUUID);
        expect(nextFunction).toBeCalledTimes(1);
    });

    test('Invalid x-fapi return error ', function () {
        const mockUUID = 'I_AM_INVALID';
        mockRequest = {
            url: "https://localhost:1234/energy/plans/",
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
        dsbHeaders(mockRequest as Request, mockResponse as Response,nextFunction, options);
        expect(mockResponse.json).toBeCalledWith(returnedErrors);
        expect(mockResponse.status).toBeCalledWith(400);
    });

    test('content type is json', function () {
        mockRequest.url = "https://localhost:1234/energy/plans/";
        dsbHeaders(mockRequest as Request, mockResponse as Response,nextFunction, options);
       expect(nextFunction).toBeCalledTimes(1);
    });

    test('Missing x-fapi header', function () {
        mockRequest = {
            url: "https://localhost:1234/energy/plans/",
            headers: {
                'x-v': '1',
            }
        };
        dsbHeaders(mockRequest as Request, mockResponse as Response,nextFunction, options);
        expect(mockResponse.setHeader).toBeCalledTimes(1);
        expect(nextFunction).toBeCalledTimes(1);
    });

});

