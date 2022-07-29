

import { Request, Response, NextFunction, json} from 'express';
import { cdrHeaders } from "../src/cdr-header";
import { ResponseErrorListV2 } from 'consumer-data-standards/common';
import { stringify } from 'uuid';
import { EndpointConfig } from '../src/models/endpoint-config';

describe('Invalid x-v header', function () {

    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction;
    let mockStatus : Partial<Response>;
    
//  mockResponse

    let options: EndpointConfig[] = [];

    beforeEach(() => {

       nextFunction = jest.fn() 
       mockRequest = {};
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
    }});
    
    test('Missing x-v value is returns error', function () {
        let returnedErrors: ResponseErrorListV2 = {
            errors: [ {
                code: 'urn:au-cds:error:cds-all:Header/Missing',
                title: 'Missing Required Header',
                detail: 'x-v'
            }]
        };

        mockRequest.url = "https://localhost:1234/energy/plans/";
        cdrHeaders(mockRequest as Request, mockResponse as Response, nextFunction, options);
        expect(mockStatus.json).toBeCalledWith(returnedErrors);
        expect(mockResponse.status).toBeCalledWith(400);
    });

    test('Non-numeric x-v value returns error', function () {
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
        cdrHeaders(mockRequest as Request, mockResponse as Response,nextFunction, options);
        expect(mockStatus.json).toBeCalledWith(returnedErrors);
        expect(mockResponse.status).toBeCalledWith(400);
    });

    test('Invalid numeric x-v value returns error', function () {
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
        cdrHeaders(mockRequest as Request, mockResponse as Response,nextFunction, options);
        expect(mockStatus.json).toBeCalledWith(returnedErrors);
        expect(mockResponse.status).toBeCalledWith(400);
    });

});

describe('Valid x-v header', function () {

    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction;
    let mockStatus : Partial<Response>;
    let options: EndpointConfig[] = [];

    beforeEach(() => {

        nextFunction = jest.fn() 
        mockRequest = {};
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
     }});

    test('x-v value exists', function () {
        mockRequest = {
            headers: {           
                'x-v': '1'
            },
            url: "https://localhost:1234/energy/plans/"
        };
        cdrHeaders(mockRequest as Request, mockResponse as Response,nextFunction, options);
        expect(nextFunction).toBeCalledTimes(1);
        //expect(mockResponse.status).toBeCalledWith(200);
    });
});

describe('Invalid x-v-min header', function () {

    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction;
    let mockStatus : Partial<Response>;

    let options: EndpointConfig[] = [{
        "requestType": "GET",
        "requestPath": "/energy/plans",
        "minSupportedVersion": 1,
        "maxSupportedVersion": 4
    }]

    beforeEach(() => {
       nextFunction = jest.fn() ;
       mockStatus = {
        send: jest.fn(),
        setHeader: jest.fn(),
        json: jest.fn(),
     }
       mockRequest = {};
       mockResponse = {
            send: jest.fn(),
            setHeader: jest.fn(),
            json: jest.fn(),
            status: jest.fn().mockImplementation(() =>  mockStatus)
       };
    });


    test('Non-numeric x-min-v value returns error', function () {
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
                'x-v': '1',
                'x-min-v': 'some_stupid_stuff'
            }
        };
        cdrHeaders(mockRequest as Request, mockResponse as Response,nextFunction, options);
        expect(mockStatus.json).toBeCalledWith(returnedErrors);
        expect(mockResponse.status).toBeCalledWith(400);
        //expect(nextFunction).toBeCalledTimes(1);
    });

    test('Invalid numeric x-min-v value returns error', function () {
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
                'x-v': '1',
                'x-min-v': '1.0'
            }
        };
        cdrHeaders(mockRequest as Request, mockResponse as Response,nextFunction, options);
        expect(mockStatus.json).toBeCalledWith(returnedErrors);
        expect(mockResponse.status).toBeCalledWith(400);
        //expect(nextFunction).toBeCalledTimes(1);
    });

});

describe('Valid x-v-min header', function () {

    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction = jest.fn();
    let mockStatus : Partial<Response>;

    let options: EndpointConfig[] = [{
        "requestType": "GET",
        "requestPath": "/energy/plans",
        "minSupportedVersion": 1,
        "maxSupportedVersion": 4
    }]

    beforeEach(() => {
        nextFunction = jest.fn() ;
        mockStatus = {
         send: jest.fn(),
         setHeader: jest.fn(),
         json: jest.fn(),
       }
        mockRequest = {};
        mockResponse = {
             send: jest.fn(),
             setHeader: jest.fn(),
             json: jest.fn(),
             status: jest.fn().mockImplementation(() =>  mockStatus)
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
        cdrHeaders(mockRequest as Request, mockResponse as Response,nextFunction, options);
        expect(nextFunction).toBeCalledTimes(1);
        //expect(mockResponse.status).toBeCalledWith(200);
    });

    test('x-min-v is supported', function () {
        mockRequest = {
            headers: {           
                'x-v': '5',
                'x-min-v': '3'
            },
            url: "https://localhost:1234/energy/plans/"
        };
        cdrHeaders(mockRequest as Request, mockResponse as Response,nextFunction, options);
        expect(nextFunction).toBeCalledTimes(1);
        //expect(mockResponse.status).toBeCalledWith(200);
    });

    test('x-min-v is NOT supported', function () {

        let returnedErrors: ResponseErrorListV2 = {
            errors: [ {
                code: 'urn:au-cds:error:cds-all:Header/UnsupportedVersion',
                title: 'Unsupported Version',
                detail: '5'
            }]
        };
        mockRequest = {
            headers: {           
                'x-v': '6',
                'x-min-v': '5'
            },
            url: "https://localhost:1234/energy/plans/"
        };

        cdrHeaders(mockRequest as Request, mockResponse as Response,nextFunction, options);
        //expect(nextFunction).toBeCalledTimes(1);
        expect(mockStatus.json).toBeCalledWith(returnedErrors);
        expect(mockResponse.status).toBeCalledWith(406);
    });
});

describe('Validate x-fapi-header header', function () {

    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction; 
    let mockStatus : Partial<Response>;
    let options: EndpointConfig[] = [];

    beforeEach(() => {
        nextFunction = jest.fn(); 
        mockRequest = {
            headers: {
                'x-v': '1'
            }
        }
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
      }
    });

    test('x-fapi value is returned', function () {
        mockRequest.url = "https://localhost:1234/energy/plans/";
        cdrHeaders(mockRequest as Request, mockResponse as Response, nextFunction, options);
        expect(mockResponse.setHeader).toBeCalledWith('x-v', 1);
        expect(mockResponse.setHeader).toBeCalledWith('x-fapi-interaction-id', expect.any(String));
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
        cdrHeaders(mockRequest as Request, mockResponse as Response,nextFunction, options);
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
        cdrHeaders(mockRequest as Request, mockResponse as Response,nextFunction, options);
        expect(mockStatus.json).toBeCalledWith(returnedErrors);
        expect(mockResponse.status).toBeCalledWith(400);
    });


    test('Missing x-fapi header', function () {
        mockRequest = {
            url: "https://localhost:1234/energy/plans/",
            headers: {
                'x-v': '1',
            }
        };
        cdrHeaders(mockRequest as Request, mockResponse as Response,nextFunction, options);
        expect(mockResponse.setHeader).toBeCalledWith('x-v', 1);
        expect(mockResponse.setHeader).toBeCalledWith('x-fapi-interaction-id', expect.any(String));
        expect(nextFunction).toBeCalledTimes(1);
    });

});

