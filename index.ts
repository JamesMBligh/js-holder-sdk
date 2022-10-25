

import { cdrHeaderValidator } from './src/cdr-header-validator'
import { cdrTokenValidator } from './src/cdr-token-validator'
import { cdrJwtScopes} from './src/cdr-jwtscopes';
import defaultEnergyEndpoints  from './src/data/default-energy.json';
import defaultBankingEndpoints from './src/data/default-banking.json';
import { EndpointConfig } from './src/models/endpoint-config';
import { getEndpoint } from './src/cdr-utils';

const DefaultEnergyEndpoints = [...defaultEnergyEndpoints] as EndpointConfig[];
const DefaultBankingEndpoints = [...defaultBankingEndpoints] as EndpointConfig[];

export { DsbAuthConfig } from './src/models/dsb-auth-config';
export { CdrConfig } from './src/models/cdr-config';
export { EndpointConfig } from './src/models/endpoint-config';
export { DsbRequest } from './src/models/dsb-request';
export { DsbResponse } from './src/models/dsb-response';


export {
     cdrHeaderValidator, cdrTokenValidator, cdrJwtScopes,
     DefaultEnergyEndpoints, DefaultBankingEndpoints, getEndpoint
}

