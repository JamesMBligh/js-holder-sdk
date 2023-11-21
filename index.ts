

import { cdrHeaderValidator } from './src/cdr-header-validator'
import { cdrScopeValidator } from './src/cdr-scope-validator'

import defaultEnergyEndpoints  from './src/data/default-energy.json';
import defaultBankingEndpoints from './src/data/default-banking.json';
import defaultCommonEndpoints from './src/data/default-common.json';
import { EndpointConfig } from './src/models/endpoint-config';
import { getEndpoint } from './src/cdr-utils';

//import { AccountModel, CustomerModel } from './src/models/login';
// import { DsbAuthServerConfig } from './src/models/dsb-auth-server-config';
import { IUserService } from './src/models/user-service.interface';
import { cdrAuthenticationValidator } from './src/cdr-authentication';
import { cdrEndpointValidator } from './src/cdr-endpoint-validator';

const DefaultEnergyEndpoints = [...defaultEnergyEndpoints] as EndpointConfig[];
const DefaultBankingEndpoints = [...defaultBankingEndpoints] as EndpointConfig[];
const DefaultCommonEndpoints = [...defaultCommonEndpoints] as EndpointConfig[];

//export { DsbAuthConfig } from './src/models/dsb-auth-config';
export { CdrConfig } from './src/models/cdr-config';
export { EndpointConfig } from './src/models/endpoint-config';

export {
     cdrHeaderValidator, cdrScopeValidator, cdrAuthenticationValidator, cdrEndpointValidator, IUserService,
     DefaultEnergyEndpoints, DefaultBankingEndpoints, DefaultCommonEndpoints, getEndpoint
}

