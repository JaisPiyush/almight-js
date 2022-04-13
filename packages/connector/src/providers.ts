import WalletConnect from "@walletconnect/client";
import { ProviderConnectionError, SessionIsNotDefined } from "./exceptions";
import { Address, BasicExternalProvider, BrowserSessionStruct, ConnectorType, IBaseProvider, IProviderSessionData, ProviderRequestMethodArguments, SubscriptionCallback, WalletConnectSessionStruct } from "./types";
        import { IWalletConnectOptions, IPushServerOptions } from "@walletconnect/types";

export class BaseProvider implements IBaseProvider {




    protected _session?: IProviderSessionData;
    protected _connectorType?: ConnectorType;
    protected _provider?: WalletConnect | BasicExternalProvider;

    protected _accounts: Address[];

    protected _isConnected = false;

    public nextId = 0;

    constructor(session?: IProviderSessionData) {
        this._session = session;
        this._accounts = []
        if (this._session !== undefined) {
            // WalletConnect session will contain the bridge property
            if (this._session['bridge'] !== undefined) {
                this._connectorType = ConnectorType.WalletConnector;
            } else {
                this._connectorType = ConnectorType.BrowserExtension;
            }
        }
    }
    


    public get session(): IProviderSessionData { return this._session }
    public get connectorType(): ConnectorType { return this._connectorType }

    public get isConnected(): boolean { return this._isConnected }

    /**
     * Verifies the health of session by checking injected property in the Window
     * 
     * @param session browser extension session data
     * @returns boolean indicating session is working and browsert provider instance
     */

    static async checkBrowserProviderSession(session: BrowserSessionStruct): Promise<[boolean, BasicExternalProvider | null]> {
        return [window[session.path] !== undefined, window[session.path]]
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
        const walletconnect = BaseProvider.initialiseWalletConnect({session: session})
        try {
            const _iSess = await walletconnect.connect({ chainId: session.chainId });
            return [walletconnect.connected && _iSess.chainId == session.chainId, walletconnect]
        } catch (e) {
            return [false, null]
        }
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
            if (connectionData[1] !== null) {
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
    async request<T = any>(data: ProviderRequestMethodArguments): Promise<T> {
        if (!this.isConnected) throw new ProviderConnectionError()
        if (this.connectorType === ConnectorType.WalletConnector) {
            return (await (this._provider as WalletConnect).sendCustomRequest({
                id: this.nextId++,
                jsonrpc: "2.0",
                method: data.method,
                params: data.params as any[]
            })) as T;
        } else {
            return (await (this._provider as BasicExternalProvider).request({ method: data.method, params: data.params })) as T
        }
    }

    // Wrapper method to connect with wallet connect with full configurations
    static initialiseWalletConnect(options: IWalletConnectOptions, pushOpts?: IPushServerOptions): WalletConnect {
        return new WalletConnect(
            options,
            pushOpts
        )
    }


    on(name: string, callback: SubscriptionCallback): void {
        if(this._provider !== undefined && this.isConnected){
            this._provider.on(name, callback);
        }
    }

}