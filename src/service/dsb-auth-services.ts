import jwtDecode from "jwt-decode";
import { IAuthService } from "../models/auth-service.interface";
import { Introspection } from "../models/introspection";
import { JwkKey } from "../models/jwt-key";
import { CdrUser } from "../models/user";
import * as https from 'https'
import { readFileSync } from "fs";
import path from "path";
import axios, { AxiosRequestConfig } from "axios";
import { CryptoUtils } from "./crypto-utils";
import {createHash} from 'crypto'; 
import { IAuthServiceData } from "../models/auth-data.interface";

// This client side code is compatible with the authorisation server published by the ACCC
// This code will interrogate the internal introspection endpoint and
//      1. validate an access token 
//      2. Create a user object (CdrUser) from a token, including accountids
// Note this will NOT handle the OAuth authentication flows, refresh, etc
// It will simply take a token and validate it

export class DsbAuthService implements IAuthService {

    authUser: CdrUser| undefined;

    private tlsThumPrint: string | undefined;
    private introspection_endpoint_internal: string | undefined;
    private idPermanenceKey = process.env.IDPERMANENCEKEY;
    private iv = Buffer.alloc(16);
    private dbService: IAuthServiceData;

    constructor(dbService: IAuthServiceData) {
        this.dbService = dbService;
        //this.jwtEncodingAlgorithm = 'ES256';
        this.introspection_endpoint_internal = process.env.INTERNAL_INTROSPECTION;
    }


    // public methods **********************************
    async initAuthService(): Promise<boolean> {
        try {
            console.log('Initialise auth service..');
            const httpsAgent = this.buildHttpsAgent();
              let config : AxiosRequestConfig = {
                httpsAgent: httpsAgent,
              }

            this.tlsThumPrint = this.calculateTLSThumbprint();
            const url = path.join(process.env.AUTH_SERVER_URL as string, '.well-known/openid-configuration')
            console.log(`Auth server url: ${url}`);
            const response = await axios.get(url,  config)
            if (!(response.status == 200)) {
                console.log('Auth server discovery failed.');
                return false;
              }
            else {
                console.log(`Auth server discovery complete. ${JSON.stringify(response.data)}`);
                // set the various endpoints
                // this.token_endpoint = response.data?.token_endpoint;
                // this.introspection_endpoint = response.data?.introspection_endpoint;
                // this.jwks_uri = response.data?.jwks_uri;
                // this.issuer = response.data?.issuer;
                return true;
            }
            //return true;
        } catch (error: any) {
            console.log('ERROR: ', error.message);
            console.log('ERROR DETAIL', error?.response?.data);   
            return false;
        }       
    }
    
    async verifyAccessToken(token: string): Promise<boolean> {
        try {
            // no introspective endpoint exists
            if (this.introspection_endpoint_internal == undefined)
               return false;
            let hdrs = {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    } ;
            this.authUser = await this.buildUser(token);
            const httpsAgent = this.buildHttpsAgent();
              let config : AxiosRequestConfig = {
                httpsAgent: httpsAgent,
                headers: hdrs
              }
            let postBody = this.buildIntrospecticePostBody(token);
            const response = await axios.post(this.introspection_endpoint_internal, postBody, config)
            if (!(response.status == 200)) {
                return false;
              }
            else {
                let intro: Introspection = response.data as Introspection;
                return intro.active;
            }
        } catch (error: any) {
            console.log('ERROR: ', error.message);
            console.log('ERROR DETAIL', error?.response?.data);   
            return false;
        }
    }

    // private methods *********************************
    private buildHttpsAgent(): https.Agent {
        let httpsAgent = new https.Agent({
            ca: readFileSync(path.join(__dirname, '../security/cdr-auth-server/mtls', process.env.CA_FILE as string))
           })
        return httpsAgent;
    }

    private async buildUser(token: string) : Promise<CdrUser | undefined> {
        // First the JWT access token must be decoded and the signature verified
        let decoded: any = jwtDecode(token);
        // decrypt the loginId, ie the sub claim from token:
        // Requires the software_id from the token.
        // The decryption key is the concatenated software_id and the private IdPermance key
        // The IdPermanence key (private key) is kwown to the DH and the Auth server
        try {
                
            let loginId = this.decryptLoginId(token);
            let customerId = await this.dbService.getUserForLoginId(loginId, 'person');
            console.log(`Customer is ${customerId}`)
            if (customerId == undefined)
               return undefined;
            this.authUser  = {
                loginId : loginId,
                customerId: customerId,
                encodeUserId: decoded?.sub,
                encodedAccounts: decoded?.account_id,
                accounts: undefined,
                scopes_supported: decoded?.scopes
            }
            // Once the customerId (here: userId) has been the account ids can be decrypted.
            // The parameters here are the decrypted customerId from above and the software_id from the token
            // The IdPermanence key (private key) is kwown to the DH and the Auth server
            let accountIds: string[] = this.decryptAccountArray(token) 
            this.authUser.accounts = accountIds;
            return this.authUser;
        } catch(ex) {
            console.log(JSON.stringify(ex))
            return undefined;
        }
    }

    private calculateTLSThumbprint(): string {
        // TODO read the TLS certificate and calculate the thumbprint, then store in this.tlsThumbprint
        
        return '';
    }

    private buildIntrospecticePostBody(token: string): any {
        let postBody: any = {};
        postBody.token = token.replace('Bearer ', '');
        return postBody;
    }

    private verifyScope(scope: string): boolean {
        if (this.authUser?.scopes_supported == undefined)
           return false;
        else
           return this.authUser?.scopes_supported?.indexOf(scope) > -1
    }
    private getEncrptionKey(idPermanenceKey: string): Buffer {
        const utf8EncodeText = new TextEncoder();
        let alg = createHash('sha512');
        alg.write(utf8EncodeText.encode(idPermanenceKey));
        let keyH = alg.digest().slice(0,24);
        return keyH;
    }

    private decryptLoginId(token: string) : string {
        let decoded: any = jwtDecode(token);
        let encodedLoginID = decoded?.sub as string;
        let encryptionKey = `${decoded?.software_id}${this.idPermanenceKey}`;
        let buffer = Buffer.from(CryptoUtils.decode(encodedLoginID), 'base64')
        let login = CryptoUtils.decrypt(encryptionKey, buffer);
        return login;
    }

    private decryptAccountArray(token: string) : string[]{
        let decoded: any = jwtDecode(token);
        let accountIds: string [] = [];
        if (Array.isArray(decoded?.account_id) == true)
            accountIds = decoded?.account_id as string[];
        else
            accountIds.push(CryptoUtils.decode(decoded?.account_id));

        let accounts: string[] = [];
        const userNameLength = this.authUser?.loginId.length as number;
        for(let i = 0; i < accountIds.length; i++) {
            let encryptionKey = `${decoded?.software_id}${this.idPermanenceKey}`;
            let buffer = Buffer.from(CryptoUtils.decode(accountIds[i]), 'base64');
            let decryptedValue = CryptoUtils.decrypt(encryptionKey, buffer);
            let accountId = decryptedValue?.substring(userNameLength)
            accounts.push(accountId);
        }
        return accounts;
    }
}