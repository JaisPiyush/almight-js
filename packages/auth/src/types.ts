import {BaseStorageInterface, Providers} from "@almight-sdk/utils"
import { BaseConnector, BrowserSessionStruct, ConnectorType, ISession, WalletConnectSessionStruct } from "@almight-sdk/connector";
import {IAlmightClient} from "@almight-sdk/core"

export enum AuthenticationRespondStrategy {
    Web = "web",
    Android = "android_intent",
    IOS = "ios_intent",
    None = "none"
}


export enum AllowedQueryParams {
    ProjectId = "project_identifier",
    ChainId = "chainId",
    Address = "public_key",
    Provider = "provider",
    State = "state",
    Challenge = "challenge",
    Error = "error",
    ErrorCode = "error_code",
    ConnectorType = "connector_type",
    UserIdentifier = "token",
    RespondStrategy = "respond_strategy",
    // Device i.e Desktop or mobile
    // This property will tell connecto page whether to use 
    //browser injected wallets or deeplinks to connect
    OriginIdentifier = "origin_identifier", 
    TargetOrigin = "target_origin",
    Code = "code",
    CauseEvent = "cause_event",
    MessageSignRequired = "message_sign_required"
}


export enum RespondType{
    Success = "success",
    Error = "error"
}

export enum ConnectionCause {
    Authentication = "authenticate", // Authentication of provider
    // Connection just for payement; only for web3
    // Needs implementations to support amount and other things
    Pay = "pay",  
}

export enum RespondMessageType {
    Message = "message",
    CloseEvent = "close_event"
}







export interface ResponseMessageCallbackArgument {
    access?: string;
    refresh?: string;
    [AllowedQueryParams.Error]?: string;
    [AllowedQueryParams.ErrorCode]?: string;
    user?: UserData
}


export type ErrorResponseMessageCallbackArgument = Required<Omit<ResponseMessageCallbackArgument, "access" | "refresh" | "user">>

export interface RespondMessageData extends ResponseMessageCallbackArgument {
    respondType?: RespondType,
    messageType: RespondMessageType
}



export interface IAuthenticationFrame {
    respondStrategy: AuthenticationRespondStrategy;
    app?: IAuthenticationApp
    initAuth(data: Record<string, string>): Promise<void>;
    bindListener(): void;
    close(): Promise<void>;
    captureResponse(data: RespondMessageData): Promise<void>;
    onResponsCallback(data: RespondMessageData): void;
}

export interface ServerSentIdentityProvider {
    uid: string;
    user: string;
    web_version: number,
    provider: string,
    meta_data: {
        sessions: {
            [ConnectorType.BrowserExtension]?: BrowserSessionStruct[],
            [ConnectorType.WalletConnector]?: WalletConnectSessionStruct[]
        }
    }
}
export interface User {

    user_id: string;
    project: string;
    auth_app: number;
    is_active: boolean
}

export interface UserData{
    user: User;
    idps: ServerSentIdentityProvider[]
}


export interface IAuthenticationApp {
    storage: BaseStorageInterface;
    connector?: BaseConnector;
    core: IAlmightClient
    frame: IAuthenticationFrame;
    baseAuthenticationURL: string;
    onSuccessCallback: (data: ResponseMessageCallbackArgument) => void;
    onFailureCallback: (data: ResponseMessageCallbackArgument) => void;
    getProjectIdentifier(): Promise<string>;
    getUserIdentifier(): Promise<string>;
    getUserData(token: string): Promise<UserData>;
    startAuthentication(provider: Providers): Promise<void>;
    setCurrentSession(session: ISession): Promise<void>;
    getAuthenticationHeader(): Promise<[string, string]>;
    saveUserData(userData: UserData): Promise<void>;
    getIdpsFromStore(): Promise<ServerSentIdentityProvider[]>;
}

export interface IAuthenticationDelegate { }


export interface IdentityProviderInterface {
    identityProviderName: string;
    webVersion: number;

    // chainId or unique id for web2 providers
    identifier: string | number;

    // Meta Datas such as icon, name, url , etc
    metaData: Record<string, any>;

}



