export interface Endpoint {
    requestType: string,
    requestPath: string,
    requiresXFAPIAuthdate: boolean,
    requiresAuthorisation: boolean,
    requiresCDSClientHeader: boolean,
    requiresXv: boolean,
    requiresCDSArrangementID: boolean
}