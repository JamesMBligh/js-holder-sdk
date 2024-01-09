import { ResponseErrorListV2 } from 'consumer-data-standards/common';
import { cdrScopeValidator } from '../src/cdr-scope-validator';
import { CdrConfig } from '../src/models/cdr-config';
import { EndpointConfig } from '../src/models/endpoint-config';
import { cdrResourceValidator } from '../src/cdr-resource-validator';
import { CdrUser } from '../src/models/user';
import { IUserService } from '../src/models/user-service.interface';
import { Request, Response, NextFunction } from 'express';

describe('Resource validation middleware', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction = jest.fn();
    let mockStatus: Partial<Response>;
    let standardsVersion = '/cds-au/v1';

    let mockEnergyUserService: IUserService = {
        getUser(): CdrUser | undefined {
            let usr : CdrUser = {
                accountsEnergy:['12345'],
                scopes_supported: ['energy:billing:read', 'energy:accounts.basic:read']
            }
            return usr;
        }
    }

    beforeEach(() => {
        nextFunction = jest.fn();
        
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
             status: jest.fn().mockImplementation(() => mockStatus)
        };
    });

    test('Without user object - resource in url', async () => {

        let endpoints: EndpointConfig[] = [{
            "requestType": "GET",
            "requestPath": "/energy/electricity/servicepoints/{servicePointId}",
            "minSupportedVersion": 1,
            "maxSupportedVersion": 4
        }]
        mockRequest = {
            method: 'GET',
            url: `${standardsVersion}/energy/electricity/servicepoints/123453`
        };
        let authConfig: CdrConfig = {

            endpoints: endpoints
        }
        let userSvc: IUserService = {
            getUser(): CdrUser | undefined {
                return undefined;
            }
        }

        let auth = cdrResourceValidator(userSvc);
        auth(mockRequest, mockResponse,  nextFunction);
        expect(mockResponse.status).toBeCalledWith(404);
    });

    test('Access account - valid case', async () => {

        let endpoints: EndpointConfig[] = [{
            "requestType": "GET",
            "requestPath": "/energy/accounts/{accountId}/balance",
            "minSupportedVersion": 1,
            "maxSupportedVersion": 4
        }]
        mockRequest = {
            method: 'GET',
            url: `${standardsVersion}/energy/accounts/12345/balance`,
            headers: {
                authorization: "Bearer ytweryuuyuyiuyyuwer"
            }
        };
        let authConfig: CdrConfig = {

            endpoints: endpoints
        }
        let auth = cdrResourceValidator(mockEnergyUserService);
        auth(mockRequest, mockResponse,  nextFunction);
        expect(nextFunction).toBeCalledTimes(1);
    });

    test('Access account - valid case 2', async () => {

        let endpoints: EndpointConfig[] = [{
            "requestType": "GET",
            "requestPath": "/energy/accounts/",
            "minSupportedVersion": 1,
            "maxSupportedVersion": 4
        }]
        mockRequest = {
            method: 'GET',
            url: `${standardsVersion}/energy/accounts/`,
            headers: {
                authorization: "Bearer ytweryuuyuyiuyyuwer"
            }
        };
        let authConfig: CdrConfig = {

            endpoints: endpoints
        }

        //let user = mockUserService.getUser();
        let auth = cdrResourceValidator(mockEnergyUserService);
        auth(mockRequest, mockResponse,  nextFunction);
        expect(nextFunction).toBeCalledTimes(1);
    });

    test('Access account - Invalid case', async () => {

        let endpoints: EndpointConfig[] = [{
            "requestType": "GET",
            "requestPath": "/energy/accounts/{accountId}/balance",
            "minSupportedVersion": 1,
            "maxSupportedVersion": 4
        }]
        mockRequest = {
            method: 'GET',
            url: `${standardsVersion}/energy/accounts/123456/balance`,
            headers: {
                authorization: "Bearer ytweryuuyuyiuyyuwer"
            }
        };
        let authConfig: CdrConfig = {

            endpoints: endpoints
        }

        let user = mockEnergyUserService.getUser();
        let auth = cdrResourceValidator(mockEnergyUserService);
        auth(mockRequest, mockResponse,  nextFunction);
        expect(mockResponse.status).toBeCalledWith(404);
    });  
});
