import { BaseConnector, ISession } from "@almight-sdk/connector";
import { AlmightClient, authAxiosInstance, projectAxiosInstance } from "@almight-sdk/core";
import { BaseStorageInterface, Providers } from "utils/lib";
import { AuthenticationFrame } from "./frames";
import { IAuthenticationApp, ResponseMessageCallbackArgument, UserData, ErrorResponseMessageCallbackArgument, IAuthenticationFrame, AllowedQueryParams, ServerSentIdentityProvider } from "./types";

export interface AuthenticationAppConstructorOptions {
    almightClient: AlmightClient;
    frame: AuthenticationFrame;
    onSuccessCallback: (data: ResponseMessageCallbackArgument) => void;
    onFailureCallback: (data: ErrorResponseMessageCallbackArgument) => void;
    baseAuthenticaionURL?: string;
}

export class AuthenticationApp implements IAuthenticationApp{
    
    
    
    core: AlmightClient;
    frame: IAuthenticationFrame;
    storage: BaseStorageInterface;
    connector?: BaseConnector;
    sessions: ISession = [];
    baseAuthenticationURL: string = "http://localhost:3000"

    readonly userKeyName = "almight_user";
    readonly userIdpsName = "almight_user_idps"

    onSuccessCallback: (data: ResponseMessageCallbackArgument) => void;
    onFailureCallback: (data: ErrorResponseMessageCallbackArgument) => void;

    constructor(options: AuthenticationAppConstructorOptions){
        this.core = options.almightClient;
        this.storage = this.core.storage;
        this.frame = options.frame;
        this.frame.app = this;
        this.onSuccessCallback = options.onSuccessCallback;
        this.onFailureCallback = options.onFailureCallback;
        this.baseAuthenticationURL = options.baseAuthenticaionURL ?? this.baseAuthenticationURL;
    }


    async storeJWTToken(token: string): Promise<void>{
        await this.convertTokenToCookie(token)
    }


    async getIdpsFromStore(): Promise<ServerSentIdentityProvider[]> {
       return await this.storage.getItem<ServerSentIdentityProvider[]>(this.userIdpsName);
    }

    async saveUserData(user: UserData): Promise<void> {
        await this.storage.setItem(this.userKeyName, user.user);
        await this.storage.setItem(this.userIdpsName, user.idps);
    }
    
    

    async convertTokenToCookie(token: string): Promise<void>{
        const res = await projectAxiosInstance.post("/cooking", {
            "type": "jwt",
            "token": token
        })
    }
    

    async getProjectIdentifier(): Promise<string> {
        return await this.core.getProjectIdentifier();
    }
    async getUserIdentifier(): Promise<string> {
        throw new Error("Method not implemented.");
    }
    async getUserData(token: string): Promise<UserData> {
        const res = await authAxiosInstance.get<{data:UserData}>("/me", {
            headers: {
                "AUTHORIZATION": `Bearer ${token}`
            }
        });
        return res.data.data
    }
    async startAuthentication(provider: Providers): Promise<void> {
        const projectIdentifier = await this.getProjectIdentifier();
        this.frame.initAuth({
            [AllowedQueryParams.ProjectId]: projectIdentifier,
            [AllowedQueryParams.Provider]: provider
        });
    }
    /**
     * In case of web3 session data, update the current session on server
     * Fetch new User data and setup connector
     * 
     * 
     * @param data 
     */
    async setCurrentSession(data: {
        uid: string,
        provider: string,
        session: ISession,
        connector_type: string
    }): Promise<void> {
        throw new Error("Method not implemented.");
    }

    async getAuthenticationHeader(): Promise<[string, string]> {
        throw new Error("Method not implemented.");
    }
}