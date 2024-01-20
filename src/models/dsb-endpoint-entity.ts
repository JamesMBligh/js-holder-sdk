import { EndpointConfig } from "./endpoint-config";

export interface DsbEndpoint extends EndpointConfig {
    authScopesRequired?: string | null,
    requiresXFAPIAuthdate?: boolean,
    requiresCDSClientHeader?: boolean,
    requiresXv?: boolean,
    requiresCDSArrangementID?: boolean
}