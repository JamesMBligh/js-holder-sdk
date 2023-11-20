

import { cdrHeaderValidator } from './src/cdr-header-validator'
import { cdrTokenValidator } from './src/cdr-token-validator'
import { cdrJwtScopes} from './src/cdr-jwtscopes';
import defaultEnergyEndpoints  from './src/data/default-energy.json';
import defaultBankingEndpoints from './src/data/default-banking.json';
import defaultCommonEndpoints from './src/data/default-common.json';
import { EndpointConfig } from './src/models/endpoint-config';
import { getEndpoint } from './src/cdr-utils';
import { IAuthServiceData } from './src/models/auth-data.interface';
import { AccountModel, CustomerModel } from './src/models/login';
import { cdrAuthentication } from './src/cdr-authentication';
import { DsbAuthServerConfig } from './src/models/dsb-auth-server-config';
import { DsbAuthService } from './src/service/dsb-auth-services';
import { IAuthService } from './src/models/auth-service.interface';

const DefaultEnergyEndpoints = [...defaultEnergyEndpoints] as EndpointConfig[];
const DefaultBankingEndpoints = [...defaultBankingEndpoints] as EndpointConfig[];
const DefaultCommonEndpoints = [...defaultCommonEndpoints] as EndpointConfig[];

export { DsbAuthConfig } from './src/models/dsb-auth-config';
export { CdrConfig } from './src/models/cdr-config';
export { EndpointConfig } from './src/models/endpoint-config';
export { DsbRequest } from './src/models/dsb-request';
export { DsbResponse } from './src/models/dsb-response';


export {
     cdrHeaderValidator, cdrTokenValidator, cdrJwtScopes, cdrAuthentication, IAuthService,
     DefaultEnergyEndpoints, DefaultBankingEndpoints, DefaultCommonEndpoints, getEndpoint, IAuthServiceData,
     AccountModel, CustomerModel, DsbAuthServerConfig, DsbAuthService
}

