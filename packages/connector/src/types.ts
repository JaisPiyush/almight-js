import WalletConnect from "@walletconnect/client";

export interface NetworkData {
    name?: string,
    chainId: number
}

export type BrowserSessionStruct = {path: string, network?: NetworkData, chainId: number};

interface WalletConnectMetaInterface {
    description: string
    url: string
    icons: string[]
    name: string
    ssl?: boolean
}
export interface WalletConnectSessionStruct {
    connected: boolean,
    accounts: Array<string>
    chainId: number
    bridge: string
    key: string
    clientId: string
    clientMeta: WalletConnectMetaInterface
    peerId: string
    peerMeta: WalletConnectMetaInterface
    handshakeId: number
    handshakeTopic: string
}

/**
 * Session structure formats used to save and load sessions
 * SDK is based on injection based browser provider and walletconnect provider
 * Single IdP can have many sessions and thus they required different procedure to load
 * based on the providers
 */
export interface ProviderSessionStruct {
    browser: Array<BrowserSessionStruct>;
    walletconnect: Array<WalletConnectSessionStruct>
}


export type ExternalProvider = BasicExternalProvider | WalletConnect | any;

export interface ProviderChannelInterface {


    connectorType: ConnectorType;
    requestTimeout: number;

    setProvider(provider: ExternalProvider): void;

    init(session?: IProviderSessionData): void;
    checkSession(obj?: IProviderAdapter): Promise<[boolean, any | null]>;
    connect(options?: any, obj?: IProviderAdapter): Promise<void>;
    checkConnection(obj?: IProviderAdapter): Promise<boolean>;
    ping(data?: {method?: string, obj?: IProviderAdapter}): Promise<boolean>;
    request<T = any>(data: ProviderRequestMethodArguments, timeout?: number): Promise<T>
    /**
     * Method to subscribe events 
     */
     on(name: string, callback: SubscriptionCallback): void;
}

export interface ProviderRequestMethodArguments {
    method: string
    params: any[] | object
}

export type BasicExternalProvider = {
    request: (args: ProviderRequestMethodArguments) => Promise<unknown>
    on(name: string, callback: (value: any) => void): void;
}

export type Address = string;

export type IProviderSessionData = BrowserSessionStruct | WalletConnectSessionStruct


export enum ConnectorType{
    BrowserExtension = "browser_extension",
    WalletConnector = "walletconnect"
}

export interface SubscriptionCallback {
    (payload: any): void;
    (error: Error, payload: any | null): void;
}
export interface IBaseProvider {

    

    /**
     * Check the connection of session is valid and working
     * @param session 
     */
    checkConnection(): Promise<boolean>;

    /**
     * 
     * Returns result from provider request
     * 
     * Makes JSON RPC request through provider using the session
     * @param data
     * 
     */
    request<T = any>(data: ProviderRequestMethodArguments): Promise<T>;

    /**
     * Method to subscribe events 
     */
    on(name: string, callback: SubscriptionCallback): void;

 

}


export interface IProviderAdapter {

    connect?: <R = any>(options?: R) =>  Promise<void>;
    checkSession?: <P = any, S = any>(session: S)=> Promise<[boolean, P]>;
    onConnect?: (options?: any) => void;
}


export interface IChannelBehaviourPlugin {
    connect?: <R = any>(options?: R, channel?: ProviderChannelInterface) =>  Promise<void>;
    checkSession?: <P = any, S = any>(session: S, channel?: ProviderChannelInterface)=> Promise<[boolean, P]>;
    onConnect?: (options?: any, channel?: ProviderChannelInterface) => void;
    verifyPingException?: (exception: Error, channel?: ProviderChannelInterface) => boolean;
    bind(channel: ProviderChannelInterface): void;

}

export interface IdentityProviderInterface {
    identityProviderName: string;
    webVersion: number;

    // chainId or unique id for web2 providers
    identifier: string | number;

    // Meta Datas such as icon, name, url , etc
    metaData: Record<string, any>;

    getAdapter(): IProviderAdapter;
    getChannel(): Promise<ProviderChannelInterface>;

}

export interface IConnector {
    setAdapter(adapter: IProviderAdapter): void;
    updateSession(session: ProviderSessionStruct): Promise<void>;
}

