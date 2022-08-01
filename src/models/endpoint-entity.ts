export interface Endpoint {
    requestType: string,
    requestPath: string,
    authScopesRequired: string | null,
    requiresXFAPIAuthdate: boolean,
    requiresCDSClientHeader: boolean,
    requiresXv: boolean,
    requiresCDSArrangementID: boolean
}