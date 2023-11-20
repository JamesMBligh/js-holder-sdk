export type CustomerModel = {
    CustomerId: string,
    LoginId: string,
    Accounts: AccountModel[]
}

export type AccountModel = {
    AccountId: string,
    DisplayName: string,
    ProductName?: string,
    MaskedName?: string,
    AccountNumber?:string
}