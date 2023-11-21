import { NextFunction, Request, Response } from 'express';
import energyEndpoints from '../src/data/cdr-energy-endpoints.json';
import bankingEndpoints from '../src/data/cdr-banking-endpoints.json'
import { EndpointConfig } from '../src/models/endpoint-config';
import { authorisedForAccount, getEndpoint, scopeForRequestIsValid } from '../src/cdr-utils';
import { ResponseErrorListV2 } from 'consumer-data-standards/common';
import { CdrUser } from '../src/models/user';

describe('Utility functions', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction = jest.fn();
    let mockStatus : Partial<Response>;

    let options: EndpointConfig[] = [];
    let errorList : ResponseErrorListV2;

    let standardsVersion = '/cds-au/v1';

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
                "requestPath": "/energy/accounts/{accountId}/balance",
                "minSupportedVersion": 1,
                "maxSupportedVersion": 4
            },
            {
                "requestType": "GET",
                "requestPath": "/banking/accounts/{accountId}",
                "minSupportedVersion": 1,
                "maxSupportedVersion": 4
            },
            {
                "requestType": "GET",
                "requestPath": "/banking/accounts",
                "minSupportedVersion": 1,
                "maxSupportedVersion": 4
            },
            {
                "requestType": "GET",
                "requestPath": "/banking/accounts/{accountId}/payments/scheduled",
                "minSupportedVersion": 2,
                "maxSupportedVersion": 2
            }
        ];
        errorList  = {
            errors:  []
        }
     });


    test('Find endpoints - no parameters', async () => {
        
        const endpoints = [...energyEndpoints, ...bankingEndpoints];  
        mockRequest = {
            method: 'GET',
            url: `${standardsVersion}/energy/electricity/servicepoints`,
        }

        //req: Request, options: EndpointConfig[], errorList : ResponseErrorListV2 
        let ep = getEndpoint(mockRequest as Request, options, errorList);
        expect(ep).not.toBeNull()
        expect(ep?.requestPath).toEqual('/energy/electricity/servicepoints');
    });

    test('Find endpoints - parameters at end', async () => {
        
        const endpoints = [...energyEndpoints, ...bankingEndpoints];  
        mockRequest = {
            method: 'GET',
            url: `${standardsVersion}/banking/accounts/1234567`,
        }
        let ep = getEndpoint(mockRequest as Request, options, errorList);
        expect(ep).not.toBeNull()
        expect(ep?.requestPath).toEqual('/banking/accounts/{accountId}');

    });

    test('Find endpoints - parameters embedded', async () => {
        
        const endpoints = [...energyEndpoints, ...bankingEndpoints];  
        mockRequest = {
            method: 'GET',
            url: `${standardsVersion}/energy/accounts/123456/balance`,
        }
        let ep = getEndpoint(mockRequest as Request, options, errorList);
        expect(ep).not.toBeNull();
        expect(ep?.requestPath).toEqual('/energy/accounts/{accountId}/balance');

    });

    // test('Find endpoints - parameters embedded v2', async () => {
        
    //     const endpoints = [...energyEndpoints, ...bankingEndpoints];  
    //     mockRequest = {
    //         method: 'GET',
    //         url: `${standardsVersion}/banking/accounts/123456/payments/scheduled`,
    //     }
    //     let ep = getEndpoint(mockRequest as Request, options, errorList);
    //     expect(ep).not.toBeNull();
    //     expect(ep?.requestPath).toEqual('/banking/accounts/{accountId}/payments/scheduled');

    // });

    test('Find endpoints - trailing slash', async () => {
        
        const endpoints = [...energyEndpoints, ...bankingEndpoints];  
        mockRequest = {
            method: 'GET',
            url: `${standardsVersion}/energy/accounts/123456/balance/`,
        }
        let ep = getEndpoint(mockRequest as Request, options, errorList);
        expect(ep).not.toBeNull();
        expect(ep?.requestPath).toEqual('/energy/accounts/{accountId}/balance');

    });

    test('Find endpoints - invalid', async () => {
        
        const endpoints = [...energyEndpoints, ...bankingEndpoints];  
        mockRequest = {
            method: 'GET',
            url: `${standardsVersion}/energy/all-customer`,
        }
        let ep = getEndpoint(mockRequest as Request, options, errorList);
        expect(ep).toBeUndefined();

    });

    test('Find endpoints - with query string', async () => {
        
        const endpoints = [...energyEndpoints, ...bankingEndpoints];  
        mockRequest = {
            method: 'GET',
            url: `${standardsVersion}/banking/accounts/1234567?page=2&page-size=5`,
        }
        let ep = getEndpoint(mockRequest as Request, options, errorList);
        expect(ep).not.toBeNull()
        expect(ep?.requestPath).toEqual('/banking/accounts/{accountId}');

    });

    // tests for authorisedForAccount - banking
    test('Find account id in url and test - valid case', async () => {
        
        const endpoints = [...energyEndpoints, ...bankingEndpoints];  
        mockRequest = {
            method: 'GET',
            url: `${standardsVersion}/banking/accounts/1234567?page=2&page-size=5`,
        }
        let usr: CdrUser = {
            customerId: '12345',
            loginId: 'Doe.John',
            encodeUserId: 'asdasd',
            encodedAccounts: ['GHRET456'],
            accounts: ['1234567', '786545'],
            scopes_supported: ['banking']
        }
        let isValid = authorisedForAccount(mockRequest as Request, usr);
        expect(isValid).toEqual(true);

    });

    test('Find account id in payments url and test - valid case', async () => {
        
        const endpoints = [...energyEndpoints, ...bankingEndpoints];  
        mockRequest = {
            method: 'GET',
            url: `${standardsVersion}/banking/accounts/1234567/payments/scheduled?page=2&page-size=5`,
        }
        let usr: CdrUser = {
            customerId: '12345',
            loginId: 'Doe.John',
            encodeUserId: 'asdasd',
            encodedAccounts: ['GHRET456'],
            accounts: ['1234567', '786545'],
            scopes_supported: ['banking']
        }
        let isValid = authorisedForAccount(mockRequest as Request, usr);
        expect(isValid).toEqual(true);

    });

    test('Test for account id: No account ID with trailing  returns true', async () => {
        
        const endpoints = [...energyEndpoints, ...bankingEndpoints];  
        mockRequest = {
            method: 'GET',
            url: `${standardsVersion}/banking/accounts/`,
        }
        let usr: CdrUser = {
            customerId: '12345',
            loginId: 'Doe.John',
            encodeUserId: 'asdasd',
            encodedAccounts: ['GHRET456'],
            accounts: ['1234567', '786545'],
            scopes_supported: ['banking']
        }
        let isValid = authorisedForAccount(mockRequest as Request, usr);
        expect(isValid).toEqual(true);
    });

    test('Test for account id: No account ID / no trailing slash returns true ', async () => {
        
        const endpoints = [...energyEndpoints, ...bankingEndpoints];  
        mockRequest = {
            method: 'GET',
            url: `${standardsVersion}/banking/accounts`,
        }
        let usr: CdrUser = {
            customerId: '12345',
            loginId: 'Doe.John',
            encodeUserId: 'asdasd',
            encodedAccounts: ['GHRET456'],
            accounts: ['1234567', '786545'],
            scopes_supported: ['banking']
        }
        let isValid = authorisedForAccount(mockRequest as Request, usr);
        expect(isValid).toEqual(true);

    });    

    test('Test for account id: Invalid url return false', async () => {
        
        const endpoints = [...energyEndpoints, ...bankingEndpoints];  
        mockRequest = {
            method: 'GET',
            url: `${standardsVersion}/banking/account-list/`,
        }
        let usr: CdrUser = {
            customerId: '12345',
            loginId: 'Doe.John',
            encodeUserId: 'asdasd',
            encodedAccounts: ['GHRET456'],
            accounts: ['1234567', '786545'],
            scopes_supported: ['banking']
        }
        let isValid = authorisedForAccount(mockRequest as Request, usr);
        expect(isValid).toEqual(false);
    });

    test('Find account id in transaction url and test - valid case', async () => {
        
        const endpoints = [...energyEndpoints, ...bankingEndpoints];  
        mockRequest = {
            method: 'GET',
            url: `${standardsVersion}/banking/accounts/1234567/transactions?page=2&page-size=5`,
        }
        let usr: CdrUser = {
            customerId: '12345',
            loginId: 'Doe.John',
            encodeUserId: 'asdasd',
            encodedAccounts: ['GHRET456'],
            accounts: ['1234567', '786545'],
            scopes_supported: ['banking']
        }
        let isValid = authorisedForAccount(mockRequest as Request, usr);
        expect(isValid).toEqual(true);

    });

    test('Find account id in balance url and test - valid case', async () => {
        
        const endpoints = [...energyEndpoints, ...bankingEndpoints];  
        mockRequest = {
            method: 'GET',
            url: `${standardsVersion}/banking/accounts/786545/balance`,
        }
        let usr: CdrUser = {
            customerId: '12345',
            loginId: 'Doe.John',
            encodeUserId: 'asdasd',
            encodedAccounts: ['GHRET456'],
            accounts: ['1234567', '786545'],
            scopes_supported: ['banking']
        }
        let isValid = authorisedForAccount(mockRequest as Request, usr);
        expect(isValid).toEqual(true);

    });

    test('Find account id in direct debits url and test - valid case', async () => {
        
        const endpoints = [...energyEndpoints, ...bankingEndpoints];  
        mockRequest = {
            method: 'GET',
            url: `${standardsVersion}/banking/accounts/786545/direct-debits`,
        }
        let usr: CdrUser = {
            customerId: '12345',
            loginId: 'Doe.John',
            encodeUserId: 'asdasd',
            encodedAccounts: ['GHRET456'],
            accounts: ['1234567', '786545'],
            scopes_supported: ['banking']
        }
        let isValid = authorisedForAccount(mockRequest as Request, usr);
        expect(isValid).toEqual(true);

    });

    // tests for authorisedForAccount - energy
    test('Find account id in url and test - valid case', async () => {
        
        const endpoints = [...energyEndpoints, ...bankingEndpoints];  
        mockRequest = {
            method: 'GET',
            url: `${standardsVersion}/energy/accounts/1234567?page=2&page-size=5`,
        }
        let usr: CdrUser = {
            customerId: '12345',
            loginId: 'Doe.John',
            encodeUserId: 'asdasd',
            encodedAccounts: ['GHRET456'],
            accounts: ['1234567', '786545'],
            scopes_supported: ['banking']
        }
        let isValid = authorisedForAccount(mockRequest as Request, usr);
        expect(isValid).toEqual(true);

    });

    test('Find account id in payments url and test - valid case', async () => {
        
        const endpoints = [...energyEndpoints, ...bankingEndpoints];  
        mockRequest = {
            method: 'GET',
            url: `${standardsVersion}/energy/accounts/1234567/payment-schedule`,
        }
        let usr: CdrUser = {
            customerId: '12345',
            loginId: 'Doe.John',
            encodeUserId: 'asdasd',
            encodedAccounts: ['GHRET456'],
            accounts: ['1234567', '786545'],
            scopes_supported: ['banking']
        }
        let isValid = authorisedForAccount(mockRequest as Request, usr);
        expect(isValid).toEqual(true);

    });

    test('Test for account id: No account ID with trailing  returns true', async () => {
        
        const endpoints = [...energyEndpoints, ...bankingEndpoints];  
        mockRequest = {
            method: 'GET',
            url: `${standardsVersion}/energy/accounts/`,
        }
        let usr: CdrUser = {
            customerId: '12345',
            loginId: 'Doe.John',
            encodeUserId: 'asdasd',
            encodedAccounts: ['GHRET456'],
            accounts: ['1234567', '786545'],
            scopes_supported: ['banking']
        }
        let isValid = authorisedForAccount(mockRequest as Request, usr);
        expect(isValid).toEqual(true);
    });

    test('Test for account id: No account ID / no trailing slash returns true ', async () => {
        
        const endpoints = [...energyEndpoints, ...bankingEndpoints];  
        mockRequest = {
            method: 'GET',
            url: `${standardsVersion}/energy/accounts`,
        }
        let usr: CdrUser = {
            customerId: '12345',
            loginId: 'Doe.John',
            encodeUserId: 'asdasd',
            encodedAccounts: ['GHRET456'],
            accounts: ['1234567', '786545'],
            scopes_supported: ['banking']
        }
        let isValid = authorisedForAccount(mockRequest as Request, usr);
        expect(isValid).toEqual(true);

    });    

    test('Test for account id: Invalid url return false', async () => {
        
        const endpoints = [...energyEndpoints, ...bankingEndpoints];  
        mockRequest = {
            method: 'GET',
            url: `${standardsVersion}/energy/account-list/`,
        }
        let usr: CdrUser = {
            customerId: '12345',
            loginId: 'Doe.John',
            encodeUserId: 'asdasd',
            encodedAccounts: ['GHRET456'],
            accounts: ['1234567', '786545'],
            scopes_supported: ['banking']
        }
        let isValid = authorisedForAccount(mockRequest as Request, usr);
        expect(isValid).toEqual(false);
    });

    test('Find account id in concession url and test - valid case', async () => {
        
        const endpoints = [...energyEndpoints, ...bankingEndpoints];  
        mockRequest = {
            method: 'GET',
            url: `${standardsVersion}/energy/accounts/1234567/concessions?page=2&page-size=5`,
        }
        let usr: CdrUser = {
            customerId: '12345',
            loginId: 'Doe.John',
            encodeUserId: 'asdasd',
            encodedAccounts: ['GHRET456'],
            accounts: ['1234567', '786545'],
            scopes_supported: ['banking']
        }
        let isValid = authorisedForAccount(mockRequest as Request, usr);
        expect(isValid).toEqual(true);

    });

    test('Find account id in billing url and test - valid case', async () => {
        
        const endpoints = [...energyEndpoints, ...bankingEndpoints];  
        mockRequest = {
            method: 'GET',
            url: `${standardsVersion}/energy/accounts/786545/billing`,
        }
        let usr: CdrUser = {
            customerId: '12345',
            loginId: 'Doe.John',
            encodeUserId: 'asdasd',
            encodedAccounts: ['GHRET456'],
            accounts: ['1234567', '786545'],
            scopes_supported: ['banking']
        }
        let isValid = authorisedForAccount(mockRequest as Request, usr);
        expect(isValid).toEqual(true);

    });

    test('Find account id in direct balance url and test - valid case', async () => {
        
        const endpoints = [...energyEndpoints, ...bankingEndpoints];  
        mockRequest = {
            method: 'GET',
            url: `${standardsVersion}/energy/accounts/786545/balance`,
        }
        let usr: CdrUser = {
            customerId: '12345',
            loginId: 'Doe.John',
            encodeUserId: 'asdasd',
            encodedAccounts: ['GHRET456'],
            accounts: ['1234567', '786545'],
            scopes_supported: ['banking']
        }
        let isValid = authorisedForAccount(mockRequest as Request, usr);
        expect(isValid).toEqual(true);

    });

    test('scopeForRequestIsValid: no scope required', async () => {
        const endpoints = [...energyEndpoints, ...bankingEndpoints];  
        mockRequest = {
            method: 'GET',
            url: `${standardsVersion}/energy/plans`
        }
        let isValid = scopeForRequestIsValid(mockRequest as Request, undefined);
        expect(isValid).toEqual(true);  
        isValid = scopeForRequestIsValid(mockRequest as Request, ['energy:billing:read']);
        expect(isValid).toEqual(true);      
    });

    test('scopeForRequestIsValid: no scope required, url trailing slash', async () => {
        const endpoints = [...energyEndpoints, ...bankingEndpoints];  
        mockRequest = {
            method: 'GET',
            url: `${standardsVersion}/energy/plans/`
        }
        let isValid = scopeForRequestIsValid(mockRequest as Request, undefined);
        expect(isValid).toEqual(true);    
    });  
    
    test('scopeForRequestIsValid: no scope required valid scope', async () => {
        const endpoints = [...energyEndpoints, ...bankingEndpoints];  
        mockRequest = {
            method: 'GET',
            url: `${standardsVersion}/energy/accounts/`
        }
        let isValid = scopeForRequestIsValid(mockRequest as Request, ['energy:accounts.basic:read']);
        expect(isValid).toEqual(true);    
    });  
    
    test('scopeForRequestIsValid: no scope required invalid scope', async () => {
        const endpoints = [...energyEndpoints, ...bankingEndpoints];  
        mockRequest = {
            method: 'GET',
            url: `${standardsVersion}/energy/accounts/`
        }
        let isValid = scopeForRequestIsValid(mockRequest as Request, ['energy:accounts.detail:read']);
        expect(isValid).toEqual(false);    
    });   
    

});
