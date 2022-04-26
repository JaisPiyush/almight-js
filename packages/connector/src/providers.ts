import WalletConnect from "@walletconnect/client";
import { ProviderConnectionError, ProviderRequestTimeout, SessionIsNotDefined } from "./exceptions";
import { Address, BasicExternalProvider, BrowserSessionStruct, ConnectorType, IBaseProvider, IProviderSessionData, ProviderRequestMethodArguments, SubscriptionCallback, WalletConnectSessionStruct } from "./types";
import { IWalletConnectOptions, IPushServerOptions } from "@walletconnect/types";
import { isWebPlatform,  asyncCallWithTimeBound, AsyncCallTimeOut} from "@almight-sdk/utils";
export class BaseProvider implements IBaseProvider {



    protected _session?: IProviderSessionData;
    protected _connectorType?: ConnectorType;
    protected _provider?: WalletConnect | BasicExternalProvider;

    protected _accounts: Address[];

    protected _isConnected = false;

    static nextId = 0;

    // Waiting time for request to be approved (in milliseconds)
    static requestTimeout = 6000;

    constructor(session?: IProviderSessionData, opts?: { requestTimeout: number }) {
        this._session = session;
        this._accounts = []
        if (this._session !== undefined) {
            // WalletConnect session will contain the bridge property
            if ((this._session as WalletConnectSessionStruct).bridge !== undefined) {
                this._connectorType = ConnectorType.WalletConnector;
            } else {
                this._connectorType = ConnectorType.BrowserExtension;
            }
        }

        if (opts !== undefined) {
            BaseProvider.requestTimeout = opts.requestTimeout ?? BaseProvider.requestTimeout;
        }
    }



    public get session(): IProviderSessionData | undefined { return this._session }
    public get connectorType(): ConnectorType | undefined { return this._connectorType }

    public get isConnected(): boolean { return this._isConnected }

    /**
     * Verifies the health of session by checking injected property in the Window
     * 
     * @param session browser extension session data
     * @returns boolean indicating session is working and browsert provider instance
     */

    static async checkBrowserProviderSession(session: BrowserSessionStruct): Promise<[boolean, BasicExternalProvider | null]> {
        return [(window as any)[session.path] !== undefined, (window as any)[session.path]]
    }

    /**
     * Verifies the health of session by initialising a WalletConnect instance
     * with provided session data and calling the WalletConnect#connect
     * which returns data on successfull connection and @throws Error on failure
     * 
     * @param session walletconnect session stored in the database
     * @returns boolean indicating session is working or not and walletconnect provider instance
     */
    static async checkWalletConnectorSession(session: WalletConnectSessionStruct): Promise<[boolean, WalletConnect | null]> {

        const walletconnect = BaseProvider.initialiseWalletConnect({ session: session })
        const pinged = await BaseProvider.pingWalletConnectProvider(walletconnect)
        return [walletconnect.connected && pinged, walletconnect]
    }
   /** 
    * Pinging provider to check the health of session.
    * Whenever WalletConnect Provider is requested with an invalid method
    * the provider should return JSON-RPC Error.
    * 
    * The request method is a TimeBound Promise to keep track of time for each request
    * and when any request during the 'ping' @throws ProviderRequestTimeout Erro then
    * the session will considered dead otherwise it'll be considered healthy
    * 
    */
    static async pingWalletConnectProvider(provider: WalletConnect | BasicExternalProvider, method: string = "ping"): Promise<boolean> {
        try { 
            return await BaseProvider._timeBoundRequest(ConnectorType.WalletConnector, provider, { method: method, params: [] }, BaseProvider.requestTimeout);
        } catch (e) {
            if (e instanceof ProviderRequestTimeout) {
                return false
            } else if ((e as Error).message.indexOf("Internal JSON-RPC error") != -1) {
                return true
            }
        }
        return false
    }

    /**
     * Verifies the session's health using different stratigies
     * If the provided session is WalletConnectSessionData than use
     * BaseProvider#checkWalletConnectorSession to verify the session
     * Else use BaseProvider#checkBrowserProviderSession to verify the session
     * 
     * The returned data from the check methods is a Tuple containing [isConnected, providerInstance]
     * set @property isConnected  = tuple[0] and if the providerInstance is not null then
     * set @property provider = tuple[1]
     * 
     * 
     * @returns boolean indicating the provider is connected
     */
    async checkConnection(): Promise<boolean> {
        if (this._session === undefined) throw new SessionIsNotDefined();

        let connectionData: [boolean, WalletConnect | BasicExternalProvider | null];
        if (this.connectorType === ConnectorType.WalletConnector) {
            connectionData = await BaseProvider.checkWalletConnectorSession(this._session as WalletConnectSessionStruct);
        } else {
            connectionData = await BaseProvider.checkBrowserProviderSession(this._session as BrowserSessionStruct);
        }
        if (connectionData !== undefined && connectionData.length > 1) {
            this._isConnected = connectionData[0];
            if (connectionData[1] !== null && connectionData[1] !== undefined) {
                this._provider = connectionData[1];
            }
        }
        return this.isConnected;
    }
    /**
     * @method
     * The method @throws ProviderConnectionError if the session is not connected
     * If the session is a WalletConnectSession, the request will be transfered to
     * @link {WalletConnect#sendCustomRequest}.
     * If the session is a Browser Session, the request will be handled by @link {Provider#request} method
     * 
     * 
     * @param data request arguments for provider request
     * @returns result of the request
     */
    async  request<T = any>(data: ProviderRequestMethodArguments, timeout?: number): Promise<T>{
        if (!this.isConnected || this._provider === undefined) throw new ProviderConnectionError();
        return BaseProvider._timeBoundRequest<T>(this.connectorType, this._provider, data, timeout?? BaseProvider.requestTimeout)
        
    }

    static async _timeBoundRequest<T>(connectorType: ConnectorType, provider: WalletConnect | BasicExternalProvider, data: ProviderRequestMethodArguments, timeout: number): Promise<T> {
        try {
            const result = await asyncCallWithTimeBound(BaseProvider._unProtectedRequest<T>(connectorType, provider, data),timeout) as Promise<T>
            return result
        }catch(e){
            if (e instanceof AsyncCallTimeOut){
                throw new ProviderRequestTimeout()
            }
            throw e
        }
    }

    // The request call is un-protected from infinite-time Promise responses
    static async _unProtectedRequest<T = any>(connectorType: ConnectorType, provider: WalletConnect | BasicExternalProvider, data: ProviderRequestMethodArguments): Promise<T> {
        if (connectorType === ConnectorType.WalletConnector) {
            return (await (provider as WalletConnect).sendCustomRequest({
                id: BaseProvider.nextId++,
                jsonrpc: "2.0",
                method: data.method,
                params: data.params as any[]
            })) as T;
        } else {
            return (await (provider as BasicExternalProvider).request({ method: data.method, params: data.params })) as T
        }
    }

    // Wrapper method to connect with wallet connect with full configurations
    static initialiseWalletConnect(options: IWalletConnectOptions, pushOpts?: IPushServerOptions): WalletConnect {
        BaseProvider.preSetUpForWalletConnect()
        return new WalletConnect(
            options,
            pushOpts
        )
    }

    static preSetUpForWalletConnect(): void {
        if (isWebPlatform()) {
            (window as any).Buffer = require("buffer").Buffer;
        }
    }


    on(name: string, callback: SubscriptionCallback): void {
        if (this._provider !== undefined && this.isConnected) {
            this._provider.on(name, callback);
        }
    }

}