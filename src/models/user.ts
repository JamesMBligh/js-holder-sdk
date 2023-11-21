export interface CdrUser {
    loginId: string; // the unique login used for authorisation, which is returned as userId 
    accountsBanking?: string[] | undefined;
    accountsEnergy?: string[] | undefined;
    scopes_supported?: string[] | undefined;
}