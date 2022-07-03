import { Class, isWebPlatform, Providers } from "@almight-sdk/utils";
import { BaseChainAdapter, Connector, BaseProviderChannel, BrowserProviderChannel, ConnectorType, WalletConnectChannel, IdentityProvider, BaseProvider, IChainAdapterOptions, IProviderOptions, BrowserSessionStruct, WalletConnectSessionStruct, ISession } from "@almight-sdk/connector";
import { Web3AuthenticationDelegate } from "./delegate";
import { AuthenticationAppIsNotDefinedProperly } from "./exceptions";
import { Web3NativeOriginFrameCommunicator } from "./frame_communicator";
import { AllowedQueryParams, AuthenticationFrameConfiguration, AuthenticationRespondStrategy, IAuthenticationApp, IAuthenticationFrame, RespondMessageData, RespondType } from "./types";
import { WebConnectorModal } from "./components";
import { Web2IdentityResolver } from "./resolvers";


export class AuthenticationFrame implements IAuthenticationFrame {



    respondStrategy: AuthenticationRespondStrategy = AuthenticationRespondStrategy.None;
    app?: IAuthenticationApp;
    configs?: AuthenticationFrameConfiguration;


    async initAuth(data: Record<string, string>): Promise<void> {
        data[AllowedQueryParams.RespondStrategy] = this.respondStrategy;
        // data[AllowedQueryParams.TargetOrigin] = globalThis.location.origin;
    }


    constructor(configs?: AuthenticationFrameConfiguration) {
        this.configs = configs
    }


    getConfigForProvider(provider: Providers | string, connectorType: ConnectorType): Record<string, any> | undefined {
        if (this.configs === undefined || this.configs[provider] === undefined) return;
        return this.configs[provider][connectorType];
    }



    bindListener(): void {
        throw new Error("Method not implemented.");
    }

    async close(): Promise<void> {

        throw new Error("Method not implemented.");
    }

    async captureResponse(data: RespondMessageData): Promise<void> {
        await this.close();
        this.onResponsCallback(data);
    }

    onResponsCallback(data: RespondMessageData): void {
        // console.log("response", data, this.app)
        if (this.app === undefined) throw new AuthenticationAppIsNotDefinedProperly()
        if ((data.respondType === RespondType.Error && data[AllowedQueryParams.Error] !== "Request aborted")) {
            this.app.onFailureCallback({
                [AllowedQueryParams.Error]: data[AllowedQueryParams.Error],
                [AllowedQueryParams.ErrorCode]: data[AllowedQueryParams.ErrorCode]
            });
            return;
        }
        // Implement Success
        try {
            this.handleSuccessResponse(data);
        } catch (e) {
            this.app.onFailureCallback({
                [AllowedQueryParams.Error]: (e as Error).message,
                [AllowedQueryParams.ErrorCode]: data[AllowedQueryParams.ErrorCode]
            });
        }
    }

    async handleSuccessResponse(data: RespondMessageData): Promise<void> {
        delete data.messageType;
        delete data.respondType;
        if (data.refresh !== undefined) {
            delete data.refresh;
            delete data.access;
        }
        this.app.onSuccessCallback(data.user);
    }

    generateFrameUri(data: Record<string, string>): string {
        const baseUrl = `${this.app.baseAuthenticationURL}/auth/v1/init`;
        const url = new URL(baseUrl);
        for (const [key, value] of Object.entries(data)) {
            if (value !== undefined) {
                url.searchParams.append(key, value)
            }
        }

        return encodeURI(url.toString());

    }

}



export class Web3NativeAuthenticationFrame extends AuthenticationFrame {
    respondStrategy: AuthenticationRespondStrategy = AuthenticationRespondStrategy.None;
    delegate?: Web3AuthenticationDelegate;

    adapterClass?: Class<BaseChainAdapter>;

    connectionCount: number = 0;

    browserConnector?: Connector<BrowserSessionStruct, BrowserProviderChannel>
    walletconnectConnector?: Connector<WalletConnectSessionStruct, WalletConnectChannel>;
    deeplinkConnector?: Connector<WalletConnectSessionStruct, WalletConnectChannel>;

    connector?: Connector

    modal: WebConnectorModal = new WebConnectorModal();

    override async close(): Promise<void> {

    }

    override bindListener(): void {

    }

    getConfigsForConnectorType(connectorType: ConnectorType): Record<string, any> | undefined {
        if (this.delegate === undefined) return;
        return this.getConfigForProvider(this.delegate.identityResolver.provider.identifier as string, connectorType);
    }



    // Element will dispatch 'buttonclick' event on button click
    mountModal(): void {

        this.modal.open({
            hasConnectorButton: this.browserConnector !== undefined,
            hasQRCode: this.walletconnectConnector !== undefined,
            buttonText: (this.browserConnector !== undefined) ? "Connect Browser Wallet" : "Connect",
            uri: (this.walletconnectConnector !== undefined) ? (this.walletconnectConnector.adapter.provider.channel as WalletConnectChannel).getConnectorUri() : undefined,
            icon: this.delegate.identityResolver.provider.metaData.icon,
            provider: this.delegate.identityResolver.provider.identityProviderName,
            onConnectClick: () => {
                if (this.deeplinkConnector !== undefined) {
                    window.location.href = this.deeplinkConnector.adapter.provider.getDeepLinkUri();
                } else if (this.browserConnector !== undefined && this.browserConnector.adapter.provider.channel.connectorType === ConnectorType.BrowserExtension) {
                    this.browserConnector.connect(this.getConfigsForConnectorType(ConnectorType.BrowserExtension)).catch(err => {
                        if (this.browserConnector !== undefined && this.browserConnector.onConnectCallback !== undefined) {
                            this.connectionCount += 1;
                            this.browserConnector.adapter.onConnectCallback({
                                data: {
                                    [AllowedQueryParams.Error]: err.message,
                                    [AllowedQueryParams.ErrorCode]: err.code
                                }
                            })
                        }
                    })

                }
            }
        });
    }


    createConnector<S extends ISession, C extends BaseProviderChannel<S>,
        P extends BaseProvider<C> = BaseProvider<C>,
        A extends BaseChainAdapter<C, P> = BaseChainAdapter<C, P>>(
            channel: C,
            providerClass: Class<P, IProviderOptions>,
            adapterClass: Class<A, IChainAdapterOptions>
        ): Connector<S, C, P, A> {
        const provider = new providerClass({
            channel: channel,

        });

        const adapter = new adapterClass({
            provider: provider
        });

        const connector = new Connector<S, C, P, A>({
            adapter: adapter,
            onConnect: (options?: any) => {
                if (this.connectionCount !== 0) return;
                this.connectionCount += 1;
                this.connector = connector;
                this.modal.close();
                options[AllowedQueryParams.ConnectorType] = provider.channel.connectorType;
                provider.getCompleteSessionForStorage().then((session) => {
                    options["session"] = session;
                    this.delegate.identityResolver.onAuthenticationRedirect(options);
                })

            }
        })

        return connector;

    }

    async handleAuthenticationOnWebNativePlatform(): Promise<void> {
        const adapterClass = this.adapterClass ?? this.delegate.identityResolver.provider.getAdapterClass() as Class<BaseChainAdapter>;
        const providerClass = this.delegate.identityResolver.provider.getProviderClass() as Class<BaseProvider>;
        const channelClasses: Class<BaseProviderChannel>[] = this.delegate.identityResolver.provider.getChannels();

        const allConnectorConnected = [];


        for (const channelClass of channelClasses) {

            const channel = new channelClass()

            if (channel.connectorType === ConnectorType.BrowserExtension) {
                const connector = this.createConnector<BrowserSessionStruct, BrowserProviderChannel>(
                    <BrowserProviderChannel>channel,
                    providerClass as Class<BaseProvider<BrowserProviderChannel>, IProviderOptions>,
                    adapterClass as Class<BaseChainAdapter<BrowserProviderChannel>>
                );
                allConnectorConnected.push(true);

            } else if (channel.connectorType === ConnectorType.WalletConnector) {
                const connector = this.createConnector<WalletConnectSessionStruct, WalletConnectChannel>(
                    <WalletConnectChannel>channel,
                    providerClass as Class<BaseProvider<WalletConnectChannel>, IProviderOptions>,
                    adapterClass as Class<BaseChainAdapter<WalletConnectChannel>>
                )

                const args = this.getConfigsForConnectorType(ConnectorType.WalletConnector);
                await connector.connect({ options: args })
                this.walletconnectConnector = connector;
                allConnectorConnected.push(true);

                if (this.walletconnectConnector.adapter.provider.isDeepLinkPlantable()) {
                    this.browserConnector = undefined;
                    this.deeplinkConnector = this.walletconnectConnector;
                }

            }
            if (allConnectorConnected.length === channelClass.length) {
                this.mountModal()
            }
        }
    }

    override async initAuth(data: Record<string, any>): Promise<void> {
        super.initAuth(data);


        this.adapterClass = data["adapterClass"]

        /// setup the delegate and call authentication
        this.delegate = new Web3AuthenticationDelegate({
            storage: this.app.storage,
            identityProviders: (<any>data["identityProviders"]) as IdentityProvider[],
            respondFrame: new Web3NativeOriginFrameCommunicator({
                onResponse: (data: RespondMessageData) => {
                    this.captureResponse((data as unknown) as RespondMessageData);
                }
            })
        });

        delete data["identityProviders"];

        await this.delegate.clean();

        await this.delegate.setStates(data);

        await this.delegate.captureData()

        // TODO: Show UI for authentication for web
        if (isWebPlatform()) {
            await this.handleAuthenticationOnWebNativePlatform();
        }


    }


    override async handleSuccessResponse(data: RespondMessageData): Promise<void> {
        if (data.access === undefined) return;
        data.user = await this.app.fetchAndStoreUserData(data.access)
        await this.app.setupConnector(this.connector);
        super.handleSuccessResponse(data);

    }


}


export class Web2ExternalAuthenticationFrame extends AuthenticationFrame {

    callCount: number = 0

    override async handleSuccessResponse(data: RespondMessageData): Promise<void> {
        // Duplicate call guard
        if (this.callCount !== 0) return;
        this.callCount += 1;

        delete data.messageType;
        delete data.respondType;
        if (data.code !== undefined) {
            const delegate = new Web3AuthenticationDelegate({
                storage: this.app.storage,
            });
            delegate.setIdentityResolver(new Web2IdentityResolver(this.app.getIdentityProvider(data.provider)));
            await delegate.setStates(data);
            const res = await delegate.handleUserRegistration();
            for (const key of Object.keys(data)) {
                await delegate.storage.removeItem(key);
            }
            await delegate.storage.removeItem(AllowedQueryParams.ProjectId);
            if (res.access === undefined) return;
            data.user = await this.app.fetchAndStoreUserData(res.access);
            super.handleSuccessResponse(data);
        }
    }
}



export class Web2NativePopupAuthenticationFrame extends Web2ExternalAuthenticationFrame {
    respondStrategy: AuthenticationRespondStrategy = AuthenticationRespondStrategy.Web;
    frame?: Window;

    override bindListener(): void {
        globalThis.addEventListener("message", (event) => {
            if (event.origin === this.app.baseAuthenticationURL && event.data.channel === "almight_communication_channel") {
                this.onResponsCallback(event.data);
            }
        })
    }

    override async initAuth(data: Record<string, string>): Promise<void> {
        super.initAuth(data);
        await this.app.storage.setItem(AllowedQueryParams.ProjectId, data[AllowedQueryParams.ProjectId]);
        data[AllowedQueryParams.TargetOrigin] = globalThis.location.origin;
        const url = this.generateFrameUri(data);
        const features = "width=800, height=800"
        this.frame = globalThis.open(url, "Authentication Frame", features)
        this.bindListener()

    }

    override async close(): Promise<void> {
        if (!this.frame.closed) this.frame.close();
    }
}
