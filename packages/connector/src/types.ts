import WalletConnect from "@walletconnect/client";
import { Chains, Class, Providers } from "@almight-sdk/utils";

export interface NetworkData {
    name?: string,
    chainId: number
}

export interface ISession {
    chainId: number
}

export interface BrowserSessionStruct extends ISession { path: string, network?: NetworkData, chainId: number };

interface WalletConnectMetaInterface {
    description: string
    url: string
    icons: string[]
    name: string
    ssl?: boolean
}
export interface WalletConnectSessionStruct extends ISession {
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


export interface HTTPSessionStruct extends ISession {
    endpoint: string;
}

export interface SessionDetailedData<S = ISession> {
    data: S;
    meta?: {
        adapter_indentifier?: string;
        provider?: string;
        last_interaction?: number;
    }
}

/**
 * Session structure formats used to save and load sessions
 * SDK is based on injection based browser provider and walletconnect provider
 * Single IdP can have many sessions and thus they required different procedure to load
 * based on the providers
 */
export interface ProviderSessionStruct {
    [ConnectorType.BrowserExtension]: Array<BrowserSessionStruct>;
    [ConnectorType.WalletConnector]: Array<WalletConnectSessionStruct>
}


export interface CurrentSessionStruct <S = ISession> {
    uid: string;
    provider: string;
    connector_type: ConnectorType;
    session: SessionDetailedData<S>;
}

export type ExternalProvider = BasicExternalProvider | WalletConnect | any;



export interface SessioUpdateArguments {
    accounts?: Address[];
    chainId?: number
}


export interface ProviderChannelInterface {


    connectorType: ConnectorType;
    requestTimeout: number;

    getCompleteSessionForStorage(): ISession;

    setProvider(provider: ExternalProvider): void;
    init(session?: IProviderSessionData): void;
    checkSession(obj?: IProvider): Promise<[boolean, any | null]>;
    checkEnvironment(): Promise<boolean>;
    connect(options?: any, obj?: IProvider): Promise<void>;
    _onSessionUpdate(options?: SessioUpdateArguments): void;
    bindSessionListener(obj?: IProvider): void;
    defaultbindSessionListener(): void;
    checkConnection(obj?: IProvider, raiseError?: boolean): Promise<boolean>;
    ping(data?: { method?: string, obj?: IProvider }): Promise<boolean>;
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

export type IProviderSessionData = ISession;


export enum ConnectorType {
    BrowserExtension = "browser_extension",
    WalletConnector = "walletconnect",
    OAuth = "oauth",
    JsonRpc = "jsonrpc"
}

export interface SubscriptionCallback {
    (...args: any[]): void;
}



export interface IProviderAdapter<C extends ProviderChannelInterface = ProviderChannelInterface, P extends IProvider<C> = IProvider<C>> extends IProtocolDefinition {

    provider: P;

    getSession(): ISession;
    getChannel(): C;
    isConnected(): boolean;
    on(event: string, callback: SubscriptionCallback): void;
    request<T>(data: ProviderRequestMethodArguments, timeout?: number): Promise<T>;
    checkSession<P>(): Promise<[boolean, P]>;
    checkConnection(raiseError: boolean): Promise<boolean>
    connect(options?: any): Promise<void>;
    onConnect(options: any): void
}



export interface IProvider<C = ProviderChannelInterface> {

    channel: C;
    accounts?: Address[];
    selectedAccount?: Address;
    chainId?: number;
    deepLinkUri?: string;

    setChannel(channel: C);


    isConnected(): boolean;

    getSession(): ISession;
    getProvider<T = any>(): T
    bindChannelDelegations(): void
    setSelectedAccount(account: Address): void

    channelConnect?: (options?: any) => Promise<void>;
    channelCheckSession?: (session: any) => Promise<[boolean, unknown]>;
    channelPing?: (options?: any) => Promise<boolean>;
    channelOnConnect?: (options: any) => void;
    channelbindSessionListener?: (channel: ProviderChannelInterface) => void;
    on(event: string, callback: SubscriptionCallback): void;
    isDeepLinkPlantable(): boolean;
    getDeepLinkUri(): string;

    request<T>(data: ProviderRequestMethodArguments, timeout?: number): Promise<T>;
    verifyConnectedChain(chainId: number): void;
    getCompleteSessionForStorage(): Promise<ISession>;
    checkSession<P>(): Promise<[boolean, P]>;
    checkConnection(raiseError: boolean): Promise<boolean>
    connect(): Promise<void>;
}



export interface ConnectionFilter {
    allowedConnectorTypes?: ConnectorType[];
    allowedChains?: Array<string | number>;
    restrictedChains?: Array<string | number>;
}

export type ProviderFilter = Omit<ConnectionFilter, "allowedConnectorTypes">;

export interface IdentityProviderInterface {
    identityProviderName: string;
    webVersion: number;

    filter?: ConnectionFilter;

    // chainId or unique id for web2 providers
    identifier: string | number | Providers;

    // Meta Datas such as icon, name, url , etc
    metaData: Record<string, any>;

    getProviderClass(): Class<IProvider>;
    getAdapterClass(): Class<IProviderAdapter> | null;
    getChannels(): Class<ProviderChannelInterface>[];

}







export interface IConnectorSessionFilter {
    chainId?: number;
    path?: string;
    clientId?: string;
    peerId?: string;
    handshakeId?: number;
    handshakeTopic?: string;
}

export interface IConnectorConnectArguments {
    channel?: Class<ProviderChannelInterface> | ProviderChannelInterface;
    session?: ISession;
    filters?: IConnectorSessionFilter
}


export interface IConnector<S = ISession> {
    currentSession?: CurrentSessionStruct<S>;
    session?: SessionDetailedData<S>;
    filter?: ConnectionFilter;
    identityProvidersMap: Record<string, IdentityProviderInterface>;
    adapter?: IProviderAdapter;
    onConnectCallback: (options?: {accounts: Address[], chainId: number}) => void;

    isConnected(): boolean;
    hasSession(): boolean;
    setSession(session: SessionDetailedData<S>): void;
    setCurrentSession(cSession: CurrentSessionStruct<S>): void;
    getFormatedSession(): SessionDetailedData<S>;
    getFormatedCurrentSession(): CurrentSessionStruct<S>;
    getIdentityProvider(): IdentityProviderInterface;
    getChainAdapter(): IProviderAdapter;
    getProvider(): IProvider;
    getChannel(): ProviderChannelInterface;
    setChainAdapter(adapter: IProviderAdapter): void; 
    checkConnection(raiseError: boolean): Promise<boolean>;
    checkSession(): Promise<boolean>;
    connect(options?: any): Promise<void>;

}

export interface TransactionData { }


export interface SignMessageArgument { }


export interface TransactionReturnType { }
export interface SignMessageReturnType { }
export interface BalanceReturnType { }
export interface RequestReturnType { }


export interface IProtocolDefinition {


    sendTransaction(data: TransactionData): Promise<TransactionReturnType>;

    signTransaction(data: TransactionData): Promise<TransactionReturnType>;

    signPersonalMessage(data: SignMessageArgument): Promise<SignMessageReturnType>;


    getNetworkId(): Promise<RequestReturnType>;
    getChainId(): Promise<number>;
    getAccounts(): Promise<Address[]>;
    getBalance(account?: string, blockTag?: string): Promise<BalanceReturnType>;
    getTransactionCount(): Promise<number>;



}
