import { BaseChainAdapter, BaseProvider, BaseProviderChannel, BrowserProviderChannel, BrowserSessionStruct, Connector, ConnectorType, IChainAdapterOptions, IdentityProvider, IProviderOptions, ISession, WalletConnectChannel, WalletConnectSessionStruct } from "@almight-sdk/connector";
import { Class, isWebPlatform } from "@almight-sdk/utils";
import { WebConnectorModal } from "../components";
import { Web3AuthenticationDelegate } from "../delegate";
import { AuthenticationFrame } from "../frame";
import { Web3NativeOriginFrameCommunicator } from "../frame_communicator";
import { AllowedQueryParams, AuthenticationRespondStrategy, RespondMessageData } from "../types";


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
        return this.getConfigForChannelWithConnectorType(connectorType);
    }



    // Element will dispatch 'buttonclick' event on button click
    mountModal(): void {

        this.modal.open({
            hasConnectorButton: this.browserConnector !== undefined,
            hasQRCode: this.walletconnectConnector !== undefined,
            buttonText: (this.browserConnector !== undefined) ? "Connect Browser Wallet" : "Connect",
            uri: (this.walletconnectConnector !== undefined) ? this.walletconnectConnector.adapter.provider.channel.getConnectorUri() : undefined,
            icon: this.delegate.identityResolver.provider.metaData.icon,
            provider: this.delegate.identityResolver.provider.identityProviderName,
            onConnectClick: () => {
                if (this.deeplinkConnector !== undefined) {
                    window.location.href = this.deeplinkConnector.adapter.provider.getDeepLinkUri();
                } else if (this.browserConnector !== undefined) {
                    this.browserConnector.connect(this.getConfigsForConnectorType(ConnectorType.BrowserExtension)).then(() => {
                    }).catch(err => {
                        if (this.browserConnector !== undefined && this.browserConnector.onConnectCallback !== undefined) {
                            this.modal.close();
                            this.connectionCount += 1;
                            this.delegate.identityResolver.onAuthenticationRedirect({
                                data: {
                                    [AllowedQueryParams.Error]: err.message,
                                    [AllowedQueryParams.ErrorCode]: err.code
                                }});
                            
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

        const connector = new Connector<S, C, P, A>({
            adapter: adapterClass,
            provider: provider,
            filters: this.configs.filters,
            identityProvider: this.delegate.identityResolver.provider,
            onConnect: (options?: any) => {
                // console.trace()
                if (this.connectionCount !== 0) return;
                this.connectionCount += 1;
                this.connector = connector;
                this.connector.checkConnection(true);
                this.modal.close();
                options[AllowedQueryParams.ConnectorType] = provider.channel.connectorType;
                const session = this.connector.adapter.getSession();
                options["session"] = session
                this.delegate.identityResolver.onAuthenticationRedirect(options);
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
                this.browserConnector = connector
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
            if (allConnectorConnected.length === channelClasses.length) {
                this.mountModal()
            }
        }
    }

    setDelegate(data: Record<string, any>): void {
        this.delegate = new Web3AuthenticationDelegate({
            storage: this.app.storage,
            identityProviders: (<any>data["identityProviders"] ?? []) as IdentityProvider[],
            respondFrame: new Web3NativeOriginFrameCommunicator({
                onResponse: (data: RespondMessageData) => {
                    this.captureResponse((data as unknown) as RespondMessageData);
                }
            })
        });
    }

    override async initAuth(data: Record<string, any>): Promise<void> {
        super.initAuth(data);


        this.adapterClass = data["adapterClass"]

        /// setup the delegate and call authentication
        this.setDelegate(data);
        delete data["identityProviders"];

        await this.delegate.clean();

        await this.delegate.setStates(data);

        await this.delegate.captureData();
        if(this.delegate.identityResolver === undefined){
            throw new Error("Identity Resolver not found");
        }

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
