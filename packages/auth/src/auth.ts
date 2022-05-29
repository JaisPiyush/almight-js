import { BaseConnector, ISession } from "connector/lib";
import { AlmightClient } from "core/lib";
import { BaseStorageInterface, Providers } from "utils/lib";
import { AuthenticationFrame } from "./frames";
import { IAuthenticationApp, ResponseMessageCallbackArgument, UserData, ErrorResponseMessageCallbackArgument, IAuthenticationFrame, AllowedQueryParams } from "./types";

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

    onSuccessCallback: (data: ResponseMessageCallbackArgument) => void;
    onFailureCallback: (data: ErrorResponseMessageCallbackArgument) => void;

    constructor(options: AuthenticationAppConstructorOptions){
        this.core = options.almightClient;
        this.frame = options.frame;
        this.frame.app = this;
        this.onSuccessCallback = options.onSuccessCallback;
        this.onFailureCallback = options.onFailureCallback;
        this.baseAuthenticationURL = options.baseAuthenticaionURL ?? this.baseAuthenticationURL;
    }
    
    


    
    

    async getProjectIdentifier(): Promise<string> {
        return await this.core.getProjectIdentifier();
    }
    async getUserIdentifier(): Promise<string> {
        throw new Error("Method not implemented.");
    }
    async getUserData(): Promise<UserData> {
        throw new Error("Method not implemented.");
    }
    async startAuthentication(provider: Providers): Promise<void> {
        const projectIdentifier = await this.getProjectIdentifier();
        this.frame.initAuth({
            [AllowedQueryParams.ProjectId]: projectIdentifier,
            [AllowedQueryParams.Provider]: provider
        });
    }
    async setCurrentSession(session: ISession): Promise<void> {
        throw new Error("Method not implemented.");
    }

    async getAuthenticationHeader(): Promise<[string, string]> {
        throw new Error("Method not implemented.");
    }
}