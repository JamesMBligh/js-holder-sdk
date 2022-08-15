import { EndpointConfig } from "./endpoint-config";

export abstract class  AuthConfig {
    endpoints: EndpointConfig[];
    abstract readScopesFromToken(): string[];
    constructor() {
        this.endpoints = [];
    }
}