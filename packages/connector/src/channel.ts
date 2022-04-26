import { AsyncCallTimeOut, asyncCallWithTimeBound, isWebPlatform } from "utils/lib";
import { IncompatiblePlatform, ProviderConnectionError, ProviderRequestTimeout } from "./exceptions";
import { Address, BasicExternalProvider, BrowserSessionStruct, ConnectorType, IProviderSessionData, ProviderChannelInterface, ProviderRequestMethodArguments, SubscriptionCallback } from "./types";


/**
 * Channels are adapter for communication with wallets
 * WalletConnect and Browser-Injected Providers are two channels used for communication
 * 
 * Channels holds information regarding session and connection and request method allows to 
 * request task and operations
 * 
 */
export class BaseProviderChannel implements ProviderChannelInterface {



    static connectorType: ConnectorType;
    protected _session?: IProviderSessionData;
    protected _provider?: any;

    protected _accounts: Address[];

    protected _isConnected = false;


    // Waiting time for request to be approved (in milliseconds)
    static requestTimeout = 6000;

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
        if(!this.isConnected || this._provider === undefined) throw new ProviderConnectionError();
        return this._timeBoundRequest<T>(data, timeout);
    }
    init(session?: IProviderSessionData): void {
        this._session = session;
    }

    /**
     * Verifies the health of session by initialising a Provider instance
     * with provided session data and calling the Provider#connect
     * which returns data on successfull connection and @throws Error on failure
     * 
     * @returns boolean indicating session is working or not and Provider instance
     */
    async checkSession(): Promise<[boolean, any]> {
        throw new Error("Method not implemented.");
    }

    // Wrapper method to connect with the provider
    connect(options?: any) {
        throw new Error("Method not implemented.");
    }

    /**
     * Verifies the session's health and connection
     * The returned data from the check methods is a Tuple containing [isConnected, providerInstance]
     * set @property isConnected  = tuple[0] and if the providerInstance is not null then
     * set @property provider = tuple[1]
     * 
     * 
     * @returns boolean indicating the provider is connected
     */
    async checkConnection(): Promise<boolean> {
        throw new Error("Method not implemented.");
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
        throw new Error("Method not implemented.");
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
            const result = await asyncCallWithTimeBound(this._rawRequest<T>(data) ,timeout) as Promise<T>
            return result
        }catch(e){
            if (e instanceof AsyncCallTimeOut){
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

}


export class BrowserProviderChannel extends BaseProviderChannel {

    static connectorType: ConnectorType = ConnectorType.BrowserExtension;
    protected _session?: BrowserSessionStruct;
    protected _provider?: BasicExternalProvider;


    public get session(): BrowserSessionStruct {return this._session}
    public get provider(): BasicExternalProvider { return this._provider}

    constructor(session?: BrowserSessionStruct){
        super();
        if (!isWebPlatform()) {
            throw new IncompatiblePlatform()
        }
        (window as any).Buffer = require("buffer").Buffer;
        this.init(session);
    }

    override async _rawRequest<T = any>(data: ProviderRequestMethodArguments): Promise<T> {
        return (await this.provider.request({method: data.method, params: data.params})) as T
    }

    override async ping(): Promise<boolean> {
        try {
            await this.request({method: "ping", params:[]})
        }catch(e){
            return this.verifyPingException(e);
        }
        return false;
    }


}