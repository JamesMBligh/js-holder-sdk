import { ResponseErrorListV2 } from 'consumer-data-standards/common';
import { NextFunction, Response } from 'express';
import { cdrAuthorisation } from '../src/cdr-authorisation';
import { cdrJwtScopes } from '../src/cdr-jwtscopes';
import { DsbAuthConfig } from '../src/models/dsb-auth-config';
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

     test('No authorisation header calls next()', async () => {
        mockRequest = {
            method: 'GET',
            url: `${standardsVersion}/energy/accounts`,
            headers: {
                'other': 'hgfjgjjgABDRETYTT'
            }
        }

        let endpoints: EndpointConfig[] = [{
            "requestType": "GET",
            "requestPath": "/energy/accounts",
            "minSupportedVersion": 1,
            "maxSupportedVersion": 4
        }]

        let authConfig: DsbAuthConfig = {
            endpoints: endpoints,
            scopeFormat: 'LIST'
        }
        let scopes = cdrJwtScopes(authConfig);
        scopes(mockRequest as DsbRequest, mockResponse as Response, nextFunction as NextFunction);
        expect(nextFunction).toBeCalledTimes(1);
        expect(mockRequest.scopes).toBeUndefined();
    });    

    test('Invalid token calls next()', async () => {
        mockRequest = {
            method: 'GET',
            url: `${standardsVersion}/energy/accounts`,
            headers: {
                'authorization': 'Bearer hgfjgjjg'
            }
        }

        let endpoints: EndpointConfig[] = [{
            "requestType": "GET",
            "requestPath": "/energy/accounts",
            "minSupportedVersion": 1,
            "maxSupportedVersion": 4
        }]

        let authConfig: DsbAuthConfig = {
            endpoints: endpoints,
            scopeFormat: 'LIST'
        }
        let scopes = cdrJwtScopes(authConfig);
        scopes(mockRequest as DsbRequest, mockResponse as Response, nextFunction as NextFunction);
        expect(nextFunction).toBeCalledTimes(1);
        expect(mockRequest.scopes).toBeUndefined();
    });    
    
    test('Valid token - Scopes as list, configured as LIST', async () => {
        mockRequest = {
            method: 'GET',
            url: `${standardsVersion}/energy/accounts`,
            headers: {
                'authorization': 'Bearer eyJhbGciOiJQUzI1NiIsImtpZCI6IjdDNTcxNjU1M0U5QjEzMkVGMzI1QzQ5Q0EyMDc5NzM3MTk2QzAzREIiLCJ4NXQiOiJmRmNXVlQ2YkV5N3pKY1Njb2dlWE54bHNBOXMiLCJ0eXAiOiJhdCtqd3QifQ.eyJuYmYiOjE2NTU4OTE4MDYsImV4cCI6MTY1NTg5MjEwNiwiaXNzIjoiaHR0cHM6Ly9ob3N0LmRvY2tlci5pbnRlcm5hbDo4MTAxIiwiYXVkIjoiY2RzLWF1IiwiY2xpZW50X2lkIjoiM2JhNzM3OWMtZTBlMC00ZWUxLWEzMTQtNmQwODZmYmE1YTg5IiwiYXV0aF90aW1lIjoxNjU1ODkxODA0LCJpZHAiOiJsb2NhbCIsImNkcl9hcnJhbmdlbWVudF9pZCI6IjVlM2VlMjcyLTE4MjItNDIyZi1iMTRhLTdmMmUwNTY3MmQ5MyIsImp0aSI6ImNWdmJuNUJNTTBiYU9YbGhYdVVUb0EiLCJzb2Z0d2FyZV9pZCI6ImM2MzI3Zjg3LTY4N2EtNDM2OS05OWE0LWVhYWNkM2JiODIxMCIsInNlY3Rvcl9pZGVudGlmaWVyX3VyaSI6Imhvc3QuZG9ja2VyLmludGVybmFsIiwiYWNjb3VudF9pZCI6Imp1aEk1ZmIzV0ZVUCUyRmRCZml4MlhGRFYxazhqbGREenBOWmFVZGhXMjZQbzZNdkVYcUZmWGs1c251QjdEaTBIcSIsInN1YiI6InBBdmJJaTQvL3BmOWVyMDJMUXhteHlsdFE0ZXBnbmNBT0hTNlJpZmF6OTFVV2pFSTkvUEJScHZZOUpTRmhoTGUiLCJjbmYiOnsieDV0I1MyNTYiOiI3MTVDREQwNEZGNzMzMkNDREE3NENERjlGQkVEMTZCRUJBNURENzQ0In0sInNjb3BlIjpbIm9wZW5pZCIsInByb2ZpbGUiLCJjZHI6cmVnaXN0cmF0aW9uIiwiZW5lcmd5OmFjY291bnRzLmJhc2ljOnJlYWQiLCJlbmVyZ3k6YWNjb3VudHMuY29uY2Vzc2lvbnM6cmVhZCIsImNvbW1vbjpjdXN0b21lci5iYXNpYzpyZWFkIl0sImFtciI6WyJwd2QiXX0.Ps37mcQ5dZ1Zle14uIq8UPWv612WKCWxIwc5My9LCMEQ0h4b-4_Zwj1hOQXwBC1l7IHBntpVlK4wQn-2t1hGPJY1mtdRSuHzUI8mCYTa7kP4Sgqss-ISeNwyvoyksSIpOGQi0V2a_YDOBYo393BFk2sKj7IsnZoWVoGHLWv4DfBpYd7kIHctpcN0DvRDBCnIoc2NHJqp_HmlqV1rCQGb7RCCrIRGJXWfkBAkYzokcR__z2BjriPbbuUjmHXyisL29GFaJAmS64_scjP6cQLwChaijKdoDcy4L2gITEr4Z01qQngRRyVns5oN9f-yulmAnkaZOm1yB_4HUXHvdRdIsFZzzRTBVK3weGntWXuP7hdVbHGvh1IFX5sSngr5srWvRznRnS0cOgYZdKPS3PIj4Z6D8mYfFVr8yyFrOqFP15KYiYo6KA2QqE9tcYIYqj2pSraO3LguO5uL8TNu5wdIK34L59HukOxWOaW3OkGM8G1mV04SkX7IlOFh5JHlCQ06'
            }
        }

        let endpoints: EndpointConfig[] = [{
            "requestType": "GET",
            "requestPath": "/energy/accounts",
            "minSupportedVersion": 1,
            "maxSupportedVersion": 4
        }]

        let authConfig: DsbAuthConfig = {
            endpoints: endpoints,
            scopeFormat: 'LIST'
        }
        let scopes = cdrJwtScopes(authConfig);
        scopes(mockRequest as DsbRequest, mockResponse as Response, nextFunction as NextFunction);
        expect(nextFunction).toBeCalledTimes(1);
        expect(mockRequest.scopes?.length).toBeGreaterThan(0);
    });  

    test('Valid token - Scopes as string, configured as LIST', async () => {
        mockRequest = {
            method: 'GET',
            url: `${standardsVersion}/energy/accounts`,
            headers: {
                'authorization': 'Bearer hgfjgjjg'
            }
        }

        let endpoints: EndpointConfig[] = [{
            "requestType": "GET",
            "requestPath": "/energy/accounts",
            "minSupportedVersion": 1,
            "maxSupportedVersion": 4
        }]

        let authConfig: DsbAuthConfig = {
            endpoints: endpoints,
            scopeFormat: 'LIST'
        }
        let scopes = cdrJwtScopes(authConfig);
        scopes(mockRequest as DsbRequest, mockResponse as Response, nextFunction as NextFunction);
        expect(nextFunction).toBeCalledTimes(1);
        expect(mockRequest.scopes).toBeUndefined();
    });
    
    test('Valid token - Scopes as string, configured as STRING', async () => {
        mockRequest = {
            method: 'GET',
            url: `${standardsVersion}/energy/accounts`,
            headers: {
                'authorization': 'Bearer eyJraWQiOiJyc2ExIiwiYWxnIjoiUlMyNTYifQ.eyJzdWIiOiJ1c2VyIiwicmVmcmVzaF90b2tlbl9leHBpcmVzX2F0IjoxODg0ODYzMzU1LCJhenAiOiJjbGllbnQiLCJzY29wZSI6ImJhbms6YWNjb3VudHMuZGV0YWlsOnJlYWQgYmFuazphY2NvdW50cy5iYXNpYzpyZWFkIGFkZHJlc3Mgb3BlbmlkIGNvbW1vbjpjdXN0b21lci5kZXRhaWw6cmVhZCBiYW5rOnRyYW5zYWN0aW9uczpyZWFkIHByb2ZpbGUgY29tbW9uOmN1c3RvbWVyLmJhc2ljOnJlYWQgYmFuazpyZWd1bGFyX3BheW1lbnRzOnJlYWQgYmFuazpwYXllZXM6cmVhZCBlbmVyZ3k6YmlsbGluZzpyZWFkIGVuZXJneTphY2NvdW50cy5jb25jZXNzaW9uczpyZWFkIGVuZXJneTphY2NvdW50cy5iYXNpYzpyZWFkIGVuZXJneTphY2NvdW50cy5kZXRhaWw6cmVhZCBlbmVyZ3k6YWNjb3VudHMucGF5bWVudHNjaGVkdWxlOnJlYWQgZW5lcmd5OmVsZWN0cmljaXR5LmRlcjpyZWFkIGVuZXJneTplbGVjdHJpY2l0eS5zZXJ2aWNlcG9pbnRzLmJhc2ljOnJlYWQgZW5lcmd5OmVsZWN0cmljaXR5LnNlcnZpY2Vwb2ludHMuZGV0YWlsOnJlYWQgZW5lcmd5OmVsZWN0cmljaXR5LnVzYWdlOnJlYWQgcGhvbmUgb2ZmbGluZV9hY2Nlc3MgZW1haWwiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvY2RzLW9wZW5pZC1jb25uZWN0LXNlcnZlci8iLCJleHAiOjE4ODQ4NTY5NTUsImlhdCI6MTg4NDg1MzM1NSwianRpIjoiODBmNDliMWUtNGUzNS00YzViLWI5YTctOGEwZTg4ZTMzMmFiIn0.Oj6iOrrIWicXz8ZU5Fe_tmX19ee-7Z7YaNOZLYje_9CGVyJ8sW7940dtOuuAIH-TmwZ_mNA8Mb4q_5Mska01sYG7IBNo2vNlvyBF-G50LkIrSwj9eGwxLJ20fqpJ5oSyQ9b320bNJm4TBSXpZPvuuwb8OLiKp5NDCYzcdc1PNTOqczLo8fEEdvkYAF4UQpRKYxfR402vwsCNtDdjRz4rP6Ck-6rpPvy0uNKTOjlIEzadpTEWqzOth1yqPuagEKzq0P6VSeGj-ubFo_pRfMNDo5N497qpdUIC4eVM_r2a3Wmn0mTcZ7zq3P-ZK4njlGJFVX9YSrRZ0MgkBMsBR50wIA'
            }
        }

        let endpoints: EndpointConfig[] = [{
            "requestType": "GET",
            "requestPath": "/energy/accounts",
            "minSupportedVersion": 1,
            "maxSupportedVersion": 4
        }]

        let authConfig: DsbAuthConfig = {
            endpoints: endpoints,
            scopeFormat: 'STRING'
        }
        let scopes = cdrJwtScopes(authConfig);
        scopes(mockRequest as DsbRequest, mockResponse as Response, nextFunction as NextFunction);
        expect(nextFunction).toBeCalledTimes(1);
        expect(mockRequest.scopes?.length).toBeGreaterThan(0);
    });      
});
