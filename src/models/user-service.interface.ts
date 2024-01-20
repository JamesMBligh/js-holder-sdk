import { CdrUser } from "./user"

export interface IUserService {   
    getUser(): CdrUser | undefined;
}