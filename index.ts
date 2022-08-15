import express from 'express';
import *  as ep from './src/models/endpoint-config';


import { cdrHeaders } from './src/cdr-header'
import { cdrAuthorisation } from './src/cdr-authorisation'
import defaultEnergyEndpoints  from './src/data/default-energy.json';
import defaultBankingEndpoints from './src/data/default-banking.json';
import { EndpointConfig } from './src/models/endpoint-config';
import { getEndpoint } from './src/cdr-utils';
import { cdrJwtScopesListSeparated, cdrJwtScopesSpaceSeparated } from './src/cdr-jwtscopes';
import { DsbResponse } from './src/models/dsb-response';
import { DsbRequest } from './src/models/dsb-request';



const DefaultEnergyEndpoints = [...defaultEnergyEndpoints] as ep.EndpointConfig[];
const DefaultBankingEndpoints = [...defaultBankingEndpoints] as ep.EndpointConfig[];

export {

     cdrHeaders, cdrAuthorisation, cdrJwtScopesListSeparated, cdrJwtScopesSpaceSeparated, 
     DsbResponse, DsbRequest,
     DefaultEnergyEndpoints, DefaultBankingEndpoints, getEndpoint
}

export {
     ep
}
