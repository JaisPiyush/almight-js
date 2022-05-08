import WalletConnect from "@walletconnect/client";
import { AsyncCallTimeOut, asyncCallWithTimeBound, isWebPlatform } from "@almight-sdk/utils";
import { IncompatiblePlatform, ProviderConnectionError, ProviderRequestTimeout, SessionIsNotDefined } from "./exceptions";
import { Address, BasicExternalProvider, BrowserSessionStruct, ConnectorType, IChannelBehaviourPlugin, IProviderAdapter, 
    IProviderSessionData, ProviderChannelInterface, ProviderRequestMethodArguments, 
    SubscriptionCallback, WalletConnectSessionStruct } from "./types";
import { IWalletConnectOptions, IPushServerOptions } from "@walletconnect/types";

/**
 * Channels are adapter for communication with wallets
 * WalletConnect and Browser-Injected Providers are two channels used for communication
 * 
 * Channels holds information regarding session and connection and request method allows to 
 * request task and operations
 * 
 */
export class BaseProviderChannel implements ProviderChannelInterface {



    public connectorType: ConnectorType;
    protected _session?: IProviderSessionData;
    protected _provider?: any;

    protected _accounts: Address[];
    public get provider(): any { return this._provider }

    protected _isConnected = false;
    protected _behaviourPlugin?: IChannelBehaviourPlugin;


    // Waiting time for request to be approved (in milliseconds)
    public requestTimeout = 6000;

    public get isConnected(): boolean { return this._isConnected }
    public get session(): IProviderSessionData | undefined { return this._session }


    constructor(session?: IProviderSessionData, plugin?: IChannelBehaviourPlugin){
        this.init(session)
        if(plugin !== undefined){
            this._behaviourPlugin = plugin;
        }
    }


    getBehaviourMethod(name: string, obj?: IProviderAdapter): any {
        if(obj !== undefined && (obj as any)[name] !== undefined && typeof (obj as any)[name] === "function"){
            return (obj as any)[name];
        }else if(this._behaviourPlugin !== undefined && (this._behaviourPlugin as any)[name] !== undefined){
            return (this._behaviourPlugin as any)[name];
        }
        return undefined;
    }


    /**
     * @method
     * The method @throws ProviderConnectionError if the session is not connected
     * 
     * @param data request arguments for provider request
     * @returns result of the request
     */
    async request<T = any>(data: ProviderRequestMethodArguments, timeout?: number): Promise<T> {
        if (!this.isConnected || this._provider === undefined) throw new ProviderConnectionError();
        return await this._timeBoundRequest<T>(data, timeout || this.requestTimeout);
    }
    init(session?: IProviderSessionData): void {
        this._session = session;
    }

    // The method is added for making it compatible with ethersjs.BaseProvider
    async send<T=any>(method, params, timeout?: number): Promise<T> {
        return await this.request<T>({method:method, params:params}, timeout);
    }



    public async defaultCheckSession(obj?: IProviderAdapter): Promise<[boolean, any]> {
        throw new Error("Method not implemented.");
    }

    /**
     * Verifies the health of session by initialising a Provider instance
     * with provided session data and calling the Provider#connect
     * which returns data on successfull connection and @throws Error on failure
     * 
     * When overriding this method, make sure to implement @method getBehaviourMethod to
     * update the behaviour of channel by plugin or @interface IProivderAdapter
     * 
     * @returns boolean indicating session is working or not and Provider instance
     */
    async checkSession(obj?: IProviderAdapter): Promise<[boolean, any]> {
        const method = this.getBehaviourMethod("checkSession", obj)
        if(method !== undefined){
            return await method(this.session);
        }
        return await this.defaultCheckSession(obj);
    }


    async defaultConnect(options?: any, obj?: IProviderAdapter): Promise<void>{
        throw new Error("Method not implemented.");
    }


    /**
     * The method required to test the session's connection or connect with the provider
     * When overriding the default implementation, proper care of connection procedure must 
     * be taken care when connecting with or without session
     * 
     * @param options 
     * @param obj 
     * @returns 
     */
    async connect<T = void, R = any>(options: R, obj?: IProviderAdapter): Promise<T> {
        const method = this.getBehaviourMethod("connect", obj)
        if(method !== undefined){
            return await method(options);
        }
        await this.defaultConnect(options, obj);
        this.onConnect(options, obj);
    }

    /**
     * Verifies the session's health and connection and set @property isConnected based on session health
     * The returned data from the check methods is a Tuple containing [isConnected, providerInstance]
     * set @property isConnected  = tuple[0] and if the providerInstance is not null then
     * set @property provider = tuple[1]
     * 
     * When overriding this method, one must take care to run @method checkSession
     * and if @method checkSession doesn't call @method connect, then required to call the same
     * with IProivderAdapter as an argument and must update @property isConnected 
     * 
     * 
     * @returns boolean indicating the provider is connected
     */
    async checkConnection(obj?: IProviderAdapter): Promise<boolean> {
        const connectionData = await this.checkSession(obj);
        this._isConnected = connectionData[0];
        return this.isConnected;
    }

    /** 
    * Pinging provider to check the health of session.
    * Whenever Provider is requested with an invalid method
    * the provider should return defined JSON-RPC Error.
    * 
    * The request method is a TimeBound Promise to keep track of time for each request
    * and when any request during the 'ping' @throws ProviderRequestTimeout Erro then
    * the session will considered dead otherwise it'll be considered healthy
    * 
    */
    async ping(method: string = "ping"): Promise<boolean> {
        try {
            await this.request({ method: method, params: [] })
        } catch (e) {
            const method = this.getBehaviourMethod("verifyPingException");
            if(method !== undefined) return method(e)
            return this.verifyPingException(e);
        }
        return false;
    }
    /**
     * Each provider on different platform has different way of telling
     * the Invalid  request. 
     * 
     * This method will verify the exception and indicates whether the exception is 
     * equivalent to the required execption or not.
     * @param exception 
     */
    verifyPingException(exception: Error): boolean {
        throw new Error("Method not implemented.");
    }

    async _timeBoundRequest<T>(data: ProviderRequestMethodArguments, timeout: number): Promise<T> {
        try {
            const result = await asyncCallWithTimeBound(this._rawRequest<T>(data), timeout) as Promise<T>
            return result
        } catch (e) {
            if (e instanceof AsyncCallTimeOut) {
                throw new ProviderRequestTimeout()
            }
            throw e
        }
    }

    async _rawRequest<T = any>(data: ProviderRequestMethodArguments): Promise<T> {
        throw new Error("Method not implemented.");
    }

    on(name: string, callback: SubscriptionCallback): void {
        if (this._provider !== undefined && this.isConnected) {
            this._provider.on(name, callback);
        }
    }

    onConnect(options: any, obj?: IProviderAdapter): void{
        const method = this.getBehaviourMethod("onConnect", obj);
        if(method !== undefined) return method(options)
    }

}


export class BrowserProviderChannel extends BaseProviderChannel {

    public connectorType: ConnectorType = ConnectorType.BrowserExtension;
    protected _session?: BrowserSessionStruct;
    protected _provider?: BasicExternalProvider;


    protected _providerPath?: string;

    public get session(): BrowserSessionStruct { return this._session }
    public get provider(): BasicExternalProvider { return this._provider }
    public get providerPath(): string { return (this.session !== undefined && this.session.path !== undefined)? this.session.path: this._providerPath}
    public set providerPath(_path: string) {this._providerPath = _path}

    init(session?: BrowserSessionStruct) {
        
        
        super.init(session)
    }

    override async _rawRequest<T = any>(data: ProviderRequestMethodArguments): Promise<T> {
        return (await this.provider.request({ method: data.method, params: data.params })) as T
    }

    override async defaultCheckSession(obj?: IProviderAdapter): Promise<[boolean, any]> {
        const status:[boolean, any] = [this.providerPath !== undefined && (globalThis as any)[this.providerPath] !== undefined, (globalThis as any)[this.providerPath]];
        if (status[0]){
            this.connect(status[1], obj)
        }
        return status;
    }


    override async checkConnection(obj?: IProviderAdapter): Promise<boolean> {
        if (!isWebPlatform()) {
            throw new IncompatiblePlatform()
        }
        return await super.checkConnection(obj)
    }

    override async defaultConnect(provider: BasicExternalProvider, obj?: IProviderAdapter): Promise<void> {
        this._provider = provider;
    }

}


export class WalletConnectChannel extends BaseProviderChannel {

    public connectorType: ConnectorType = ConnectorType.WalletConnector;
    protected _session?: WalletConnectSessionStruct;
    protected _provider?: WalletConnect;

    protected _params?: any;

    static nextId = 0;
    public bridge = "https://bridge.walletconnect.org";

    public get session(): WalletConnectSessionStruct { return this._session }
    public get provider(): WalletConnect { return this._provider }


    init(session?: WalletConnectSessionStruct) {
        if (isWebPlatform()) {
            (globalThis as any).Buffer = require("buffer").Buffer;
        }
        super.init(session)
    }

    override async _rawRequest<T = any>(data: ProviderRequestMethodArguments): Promise<T> {
        return await this.provider.sendCustomRequest({
            id: WalletConnectChannel.nextId,
            jsonrpc: "2.0",
            method: data.method,
            params: data.params as any[]
        }) as T
    }

    override verifyPingException(exception: Error): boolean {
        return (!(exception instanceof ProviderRequestTimeout) && (exception.message.indexOf("Internal JSON-RPC error") != -1));
    }

    override async defaultConnect({options, pushOpts}:{options: IWalletConnectOptions, pushOpts?: IPushServerOptions}, obj?: IProviderAdapter): Promise<void> {
        // Setting default bridge url if none provided
        options.bridge = options.bridge || this.bridge;
        this._provider = new WalletConnect(options, pushOpts);
        if(options.session === undefined){
            this._provider.on("connect", (error, payload) => {
                this.onConnect({error, payload}, obj);
            })
        }

    }

    /**
     * Walletconnect protocol generates a unique uri for each session connection
     * the uri will later be used to redirect Dapps using QR codes or direct visits
     * 
     * The function will extract the uri the uri from walletconnect provider
     * 
     * @returns uri string for wallet connect connection
     */
    getConnectorUri(): string {
        return this.provider.uri;
    }

    onConnect(options:{error?: Error, payload?: {params: any[]}}, obj?: IProviderAdapter) {
        const {error, payload} = options;
        if (error) throw error;
        const {accounts} = payload.params[0];
        this._params = payload.params;
        this._accounts = accounts;
        this._session = this._provider.session;

        const method = this.getBehaviourMethod("onConnect", obj);
        if(method !== undefined) method(options)
    }

    override async defaultCheckSession(obj?: IProviderAdapter): Promise<[boolean, any]> {
        if(this.session === undefined){
            return [false, undefined];
        }
        await this.connect({session: this.session}, obj);
        return [await this.ping(), this.provider];
    }

}