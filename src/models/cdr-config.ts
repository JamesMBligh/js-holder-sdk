import { EndpointConfig } from "./endpoint-config";

export interface  CdrConfig {
    specifiedEndpointsOnly?: boolean;
    basePath?: string;
    endpoints: EndpointConfig[];
}