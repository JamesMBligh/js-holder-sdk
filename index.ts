

import { cdrHeaders } from './src/cdr-header'
import { cdrAuthorisation } from './src/cdr-authorisation'
import { cdrJwtScopes} from './src/cdr-jwtscopes';
import defaultEnergyEndpoints  from './src/data/default-energy.json';
import defaultBankingEndpoints from './src/data/default-banking.json';
import { EndpointConfig } from './src/models/endpoint-config';
import { getEndpoint } from './src/cdr-utils';

import { DsbResponse } from './src/models/dsb-response';
import { DsbRequest } from './src/models/dsb-request';
// import { DsbAuthConfig } from './src/models/dsb-auth-config';
// import { CdrConfig } from './src/models/cdr-config';



const DefaultEnergyEndpoints = [...defaultEnergyEndpoints] as EndpointConfig[];
const DefaultBankingEndpoints = [...defaultBankingEndpoints] as EndpointConfig[];

export { DsbAuthConfig } from './src/models/dsb-auth-config';
export { CdrConfig } from './src/models/cdr-config';
export { EndpointConfig } from './src/models/endpoint-config';
export { DsbRequest } from './src/models/dsb-request';
export { DsbResponse } from './src/models/dsb-response';


export {
     cdrHeaders, cdrAuthorisation, cdrJwtScopes,
     DefaultEnergyEndpoints, DefaultBankingEndpoints, getEndpoint
}

