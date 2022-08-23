import {BaseStorageInterface, Providers} from "@almight-sdk/utils"
import { IConnector, BrowserSessionStruct, ConnectorType, IdentityProvider, ISession, WalletConnectSessionStruct, CurrentSessionStruct, ConnectionFilter, SessionDetailedData } from "@almight-sdk/connector";
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
    Verifiers = "verifiers",
    Challenge = "code_challenge",
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
    MessageSignRequired = "message_sign_required",
    Sessions = "sessions"
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
    user?: UserData;
    [AllowedQueryParams.Code]?: string;
    [AllowedQueryParams.Challenge]?: string;
    sessions?: Partial<Record<ConnectorType, SendableSession>>;
    provider?: Providers
}


export type ErrorResponseMessageCallbackArgument = Required<Pick<ResponseMessageCallbackArgument, AllowedQueryParams.Error | AllowedQueryParams.ErrorCode>>

export type SuccessResponseMessageCallbackArgument = Omit<ResponseMessageCallbackArgument, AllowedQueryParams.Error| AllowedQueryParams.ErrorCode>

export interface RespondMessageData extends ResponseMessageCallbackArgument {
    respondType?: RespondType,
    messageType: RespondMessageType
}








export interface IAuthenticationFrame {
    respondStrategy: AuthenticationRespondStrategy;
    app?: IAuthenticationApp
    configs?: AuthenticationFrameConfiguration;
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
    meta_data: Record<string, string>,
    sessions: Record<ConnectorType, SendableSession[]>
}
export interface User<S = ISession> {

    user_id: string;
    project: string;
    auth_app: number;
    is_active: boolean
    current_session: CurrentSessionStruct<S>;
}

export interface UserData <S = ISession>{
    user: User<S>;
    idps: ServerSentIdentityProvider[]
}





export type ChannelConfigurations = Partial<Record<ConnectorType, Record<string, any>>>;
export interface AuthenticationFrameConfiguration {
    filters?: ConnectionFilter,
    channelArgs?: ChannelConfigurations
}

export interface IAuthenticationApp {
    storage: BaseStorageInterface;
    connector?: IConnector;
    core: IAlmightClient
    frame?: IAuthenticationFrame;
    baseAuthenticationURL: string;
    configs?: AuthenticationFrameConfiguration;



    onSuccessCallback: (data: UserData) => void;
    onFailureCallback: (data: ResponseMessageCallbackArgument) => void;
    getProjectIdentifier(): Promise<string>;
    getUserIdentifier(): Promise<string>;
    getUserData(token: string): Promise<UserData>;
    startAuthentication(provider: Providers): Promise<void>;
    getToken(): Promise<string>;
    logout(): Promise<void>;

    getCurrentSession<S extends ISession = ISession>(): Promise<CurrentSessionStruct<S>>;
    
    isCurrentSessionBeingUsed(cSession: CurrentSessionStruct): Promise<boolean>
    setCurrentSession<S=ISession>(data: CurrentSessionStruct<S>): Promise<void>;

    getIconAndNameForProvider(provider: Providers | string, connectorType?: ConnectorType | string): {icon: string, name: string} | undefined;
    getCurrentSessionStructsFromIdp(idp: ServerSentIdentityProvider): CurrentSessionStruct[];
    getAccountIdpsAsCurrentSessionStructs(): Promise<CurrentSessionStruct[]>;
   
    saveUserData(userData: UserData): Promise<void>;
    fetchAndStoreUserData(token:string): Promise<UserData>
    getIdpsFromStore(): Promise<ServerSentIdentityProvider[]>;
    setupConnector(connector?: IConnector): void;
    getIdentityProvider(provider: string): IdentityProvider
    checkConnection(): Promise<boolean>;
    isAuthenticated(): Promise<boolean>;
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

export interface IdentityResolverInterface {
    provider: IdentityProvider;
    delegate?: IAuthenticationDelegate;
    isWebVersion(version: number): boolean;
    getStates(data?: Record<string, string>): Record<string, string>;
    // initAuth(): Promise<void>;
    captureUri(data: Record<string, string>): Promise<void>;
    generateRedirectUrl(data?: Record<string, string>): string | Promise<string>;
    onAuthenticationRedirect(options?: any): void;
    authenticateAndRespond(data: Record<string, string>): Promise<void>;
    getUserRegistrationArguments(): Promise<UserRegistrationArgument>;
    getItemFromStorage<T=any>(key: string): Promise<T | null>;
    
}


export type SendableSession = SessionDetailedData<ISession> | {data: {[AllowedQueryParams.Provider]: Providers}}
export interface UserRegistrationArgument{
    [AllowedQueryParams.Provider]: string;
    sessions: Partial<Record<ConnectorType, SendableSession>>;
}
export interface Web3UserRegistrationArgument extends UserRegistrationArgument {
    [AllowedQueryParams.Address]: string;
    singature?: string;
    message_sign_required: boolean;
}

export interface Web2UserRegistrationArgument extends UserRegistrationArgument {
    [AllowedQueryParams.Code]: string;
    [AllowedQueryParams.Challenge]?: string;
    [AllowedQueryParams.State]?: string

}


export interface UserRegistrationResult {
    refresh: string;
    access: string;
}


export interface IAuthenticationDelegate {
    respondStrategy: AuthenticationRespondStrategy;
    identityResolver?: IdentityResolverInterface;
    verificationExcludedStates: string[];
    respondFrame: IOriginFrameCommunicator;


    respondFailure(data: ErrorResponseMessageCallbackArgument): Promise<void>;
    respondSuccess(data: SuccessResponseMessageCallbackArgument): Promise<void>;
    
    handleUserRegistration<T = UserRegistrationArgument>(data: T, isWeb3: boolean, connectorType?: ConnectorType): Promise<UserRegistrationResult>;
    verifyProject(projectId: string): Promise<boolean>;
    setStates(data: Record<string, any>): Promise<void>;
    verifyStates(states: Record<string, string>): Promise<boolean>;
    captureData(): Promise<void>;
    freeze(): Promise<void>;
    redirectTo(uri: string):void;
    getState<T>(key: string): Promise<T>;
    clean(): Promise<void>;
}


export interface IOriginFrameCommunicator {

    respondStrategy: AuthenticationRespondStrategy;
    respondSuccess(data: SuccessResponseMessageCallbackArgument): Promise<void>;
    respondFailure(data: ErrorResponseMessageCallbackArgument): Promise<void>;
    close(): Promise<void>;
}


export interface ConnectorModalData {
    icon: string;
    provider: string;
    hasConnectorButton: boolean;
    hasQRCode: boolean;
    buttonText?: string;
    uri?: string;
    onConnectClick?: () => void;
}


export interface IConnectorModal {
    open(data: ConnectorModalData): void;
    close(): void;
    onConnectClick?: () => void;
}


