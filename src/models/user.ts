export interface CdrUser {
    accountsBanking?: string[] | undefined;
    accountsEnergy?: string[] | undefined;
    bankingPayees?: string[] | undefined;
    energyServicePoints?: string[] | undefined;
    scopes_supported?: string[] | undefined;
}