import WalletConnect from "@walletconnect/client";
import { AsyncCallTimeOut, asyncCallWithTimeBound, isWebPlatform } from "utils/lib";
import { IncompatiblePlatform, ProviderConnectionError, ProviderRequestTimeout } from "./exceptions";
import { Address, BasicExternalProvider, BrowserSessionStruct, ConnectorType, IProviderAdapter, IProviderSessionData, ProviderChannelInterface, ProviderRequestMethodArguments, SubscriptionCallback, WalletConnectSessionStruct } from "./types";
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

    protected _isConnected = false;


    // Waiting time for request to be approved (in milliseconds)
    public requestTimeout = 6000;

    public get isConnected(): boolean { return this._isConnected }
    public get session(): IProviderSessionData | undefined { return this._session }


    /**
     * @method
     * The method @throws ProviderConnectionError if the session is not connected
     * 
     * @param data request arguments for provider request
     * @returns result of the request
     */
    async request<T = any>(data: ProviderRequestMethodArguments, timeout?: number): Promise<T> {
        if (!this.isConnected || this._provider === undefined) throw new ProviderConnectionError();
        return this._timeBoundRequest<T>(data, timeout || this.requestTimeout);
    }
    init(session?: IProviderSessionData): void {
        this._session = session;
    }



    public async defaultCheckSession(): Promise<[boolean, any]> {
        throw new Error("Method not implemented.");
    }

    /**
     * Verifies the health of session by initialising a Provider instance
     * with provided session data and calling the Provider#connect
     * which returns data on successfull connection and @throws Error on failure
     * 
     * @returns boolean indicating session is working or not and Provider instance
     */
    async checkSession(obj?: IProviderAdapter): Promise<[boolean, any]> {
        if(obj !== undefined && (obj as any).checkSession !== undefined && typeof (obj as any)["checkSession"] === "function"){
            return await obj.checkSession(this.session);
        }
        return await this.defaultCheckSession();
    }


    async defaultConnect(options?: any): Promise<void>{
        throw new Error("Method not implemented.");
    }


    // Wrapper method to connect with the provider
    async connect(options: any, obj?: IProviderAdapter): Promise<void> {
        if(obj !== undefined && (obj as any).checkSession !== undefined && typeof (obj as any)["connect"] === "function"){
            await obj.connect(options);
        }
        await this.defaultConnect(options);
    }

    /**
     * Verifies the session's health and connection and set @property isConnected based on session health
     * The returned data from the check methods is a Tuple containing [isConnected, providerInstance]
     * set @property isConnected  = tuple[0] and if the providerInstance is not null then
     * set @property provider = tuple[1]
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
        
    }

}


export class BrowserProviderChannel extends BaseProviderChannel {

    public connectorType: ConnectorType = ConnectorType.BrowserExtension;
    protected _session?: BrowserSessionStruct;
    protected _provider?: BasicExternalProvider;




    public get session(): BrowserSessionStruct { return this._session }
    public get provider(): BasicExternalProvider { return this._provider }

    constructor(session?: BrowserSessionStruct) {
        super();
        if (!isWebPlatform()) {
            throw new IncompatiblePlatform()
        }
        this.init(session);
    }

    override async _rawRequest<T = any>(data: ProviderRequestMethodArguments): Promise<T> {
        return (await this.provider.request({ method: data.method, params: data.params })) as T
    }

    override async defaultCheckSession(): Promise<[boolean, any]> {
        return [(window as any)[this.session.path] !== undefined, (window as any)[this.session.path]];
    }

    override async defaultConnect(provider: BasicExternalProvider): Promise<void> {
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


    constructor(session?: WalletConnectSessionStruct) {
        super();
        if (isWebPlatform()) {
            (window as any).Buffer = require("buffer").Buffer;
        }
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

    override async defaultConnect(options: IWalletConnectOptions, pushOpts?: IPushServerOptions): Promise<void> {
        // Setting default bridge url if none provided
        options.bridge = options.bridge || this.bridge;
        this._provider = new WalletConnect(options, pushOpts);
        if(options.session === undefined){
            this._provider.on("connect", (error, payload) => {
                this.onConnect({error, payload});
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

        if(obj !== undefined && (obj as any).onConnect !== undefined && typeof (obj as any)["onConnect"] === "function"){
            obj.onConnect(options)
        }
    }

    override async defaultCheckSession(): Promise<[boolean, any]> {
        await this.connect({session: this.session});
        return [await this.ping(), this.provider];
    }

    override async checkSession(obj?: IProviderAdapter): Promise<[boolean, any]> {
        if(obj !== undefined && (obj as any).checkSession !== undefined && typeof (obj as any)["checkSession"] === "function"){
            await this.connect({session: this.session}, obj);
            return [await this.ping(), this.provider]
        }
        return await this.defaultCheckSession();
    }

}