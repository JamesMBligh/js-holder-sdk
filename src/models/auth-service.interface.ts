import { CdrUser } from "./user"

export interface IAuthService { 
    
    authUser: CdrUser | undefined;
    verifyAccessToken(token: string): Promise<boolean> 
}