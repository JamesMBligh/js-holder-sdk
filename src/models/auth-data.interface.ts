import { CustomerModel } from "./login";

export interface IAuthServiceData {
    
    getUserForLoginId(loginId: string, userType: string): Promise<string| undefined>;

}