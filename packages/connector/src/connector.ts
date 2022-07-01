import { Class, isWebPlatform, Providers } from "@almight-sdk/utils";
import { BaseChainAdapter, IChainAdapterOptions } from "./adapter";
import { BaseProviderChannel } from "./channel";
import { AdapterIsNotDefined, ConnectionEstablishmentFailed } from "./exceptions";
import { IdentityProvider } from "./identity_provider";
import { BaseProvider, IProviderOptions } from "./provider";
import { Address, ConnectionFilter, ConnectorType, CurrentSessionStruct, IConnector, IConnectorSessionFilter, ISession } from "./types";

export interface IConnectorOptions<S, C, P, A> {
    onConnect?: (options?: { accounts: Address[], chainId: number }) => void;
    session?: CurrentSessionStruct<S> | S;
    filters?: ConnectionFilter;
    channel?: Class<C> | C;
    provider?: Class<P> | P;
    identityProvider?: IdentityProvider | string | Providers,
    adapter?: Class<A> | A;
    args?: {
        adapterArgs?: IChainAdapterOptions,
        providerArgs?: IProviderOptions,
        channelArgs?: S
    }
}




export class Connector<S extends ISession = ISession,
    C extends BaseProviderChannel<S> = BaseProviderChannel<S>,
    P extends BaseProvider<C> = BaseProvider<C>,
    A extends BaseChainAdapter<C, P> = BaseChainAdapter<C, P>

    > implements IConnector<S> {

    filter?: ConnectionFilter;
    identityProvidersMap: Record<string, IdentityProvider>;
    readonly options: IConnectorOptions<S, C, P, A>;


    currentSession?: CurrentSessionStruct<S>;
    session?: S;
    protected channelClass?: Class<C>;
    protected channel?: C;
    protected provider?: P;
    protected providerIdentifier?: string | Providers;
    protected identityProvider?: IdentityProvider;
    protected adapterClass: Class<A>;
    protected providerClass: Class<P>;
    adapter?: A;

    onConnectCallback: (options?: { accounts: Address[], chainId: number }) => void

    readonly deadCallback = (options?: { accounts: Address[], chainId: number }): void => { }



    constructor(options: IConnectorOptions<S, C, P, A>) {
        this.options = options;
        this.init(options)
    }

    isClass(arg: any): boolean {
        return (arg.prototype !== undefined) && arg.constructor.name === "Function"
    }

    isClassInstance(arg: any, cls: any): boolean {
        return (arg.prototype === undefined) && arg instanceof cls;
    }

    setupSession(session: CurrentSessionStruct<S> | S): void {
        if ((session as CurrentSessionStruct<S>).uid !== undefined) {
            this.currentSession = session as CurrentSessionStruct<S>;
            this.session = (session as CurrentSessionStruct<S>).session;
            this.providerIdentifier = this.currentSession.provider;
            this.identityProvider = this.identityProvidersMap[this.providerIdentifier]
        } else {
            this.session = session as S;
        }
    }


    setupChannel(channel: Class<C> | C): void {
        if (this.isClass(channel)) {
            this.channelClass = channel as Class<C>;
        } else if (this.isClassInstance(channel, BaseProviderChannel)) {
            this.channel = channel as C;
        }

    }

    setupProvider(provider: Class<P> | P): void {
        if (this.isClass(provider)) {
            this.providerClass = provider as Class<P>;
        } else if (this.isClassInstance(provider, BaseProvider)) {
            this.provider = provider as P;
        }
    }


    setupIdentityProvider(idp: IdentityProvider | string | Providers): void {
        if (idp instanceof IdentityProvider) {
            this.identityProvider = idp;
            this.providerIdentifier = idp.identifier as string;
        } else if (this.identityProvidersMap[idp as string] !== undefined) {
            this.identityProvider = this.identityProvidersMap[idp as string];
            this.providerIdentifier = this.identityProvider.identifier as string;
        }
    }

    setupAdapter(adapter: Class<A> | A): void {
        if (this.isClass(adapter)) {
            this.adapterClass = adapter as Class<A>;
        } else if (this.isClassInstance(adapter, BaseChainAdapter)) {
            this.adapter = adapter as A;
        }
    }





    init(options: IConnectorOptions<S, C, P, A>): void {
        this.onConnectCallback = options.onConnect ?? this.deadCallback;
        this.filter = options.filters;
        if (options.channel !== undefined) {
            this.setupChannel(options.channel);
        }
        if (options.provider !== undefined) {
            this.setupProvider(options.provider);
        }
        if (options.identityProvider !== undefined) {
            this.setupIdentityProvider(options.identityProvider);
        }
        if (options.adapter !== undefined) {
            this.setupAdapter(options.adapter);
        }
        if (options.session !== undefined) {
            this.setupSession(options.session);
        }

    }

    validateArguments(): void {
        if (this.identityProvider === undefined && this.channel === undefined && this.channelClass === undefined &&
            this.provider === undefined && this.providerClass === undefined && this.adapter === undefined &&
            this.adapterClass === undefined
        ) {
            throw new Error("Insufficient arguments to create Connector")
        }
    }


    checkAdapterDefined(): void {
        if (this.adapter === undefined) throw new AdapterIsNotDefined()
    }

    hasSession(): boolean {
        return this.session !== undefined;
    }
    setSession(session: S): void {
        this.session = session;
    }
    setCurrentSession(cSession: CurrentSessionStruct<S>): void {
        this.setupSession(cSession);
    }

    getFormatedSession(): S {
        this.checkAdapterDefined();
        if (!this.isConnected()) {
            throw new ConnectionEstablishmentFailed("No connection is able to establish, cannot produce session")
        }
        return this.adapter.getSession() as S;
    }

    getFormatedCurrentSession(): CurrentSessionStruct<S> {
        const session = this.getFormatedSession();
        const currentSession: CurrentSessionStruct<S> = {
            uid: this.adapter.accounts[0],
            provider: this.providerIdentifier,
            connector_type: this.channel.connectorType,
            session: session
        }
        return currentSession;
    }

    getIdentityProvider(): IdentityProvider {
        return this.identityProvider;
    }

    getAdapterConstructorArguments(): IChainAdapterOptions {
        const provider = this.getProvider()
        let args: IChainAdapterOptions = { provider: provider };
        if (this.options.args !== undefined && this.options.args.adapterArgs !== undefined) {
            args = this.options.args.adapterArgs;
        }
        args.provider = provider;
        args.onConnect = this.onConnectCallback;
        return args
    }

    getChainAdapter(): A {
        if (this.adapter !== undefined) return this.adapter;
        if (this.identityProvider !== undefined) {
            const cls: Class<A> = this.identityProvider.getAdapterClass() as Class<A>;
            return new cls(this.getAdapterConstructorArguments());
        }
        if (this.adapterClass !== undefined) {
            return new this.adapterClass(this.getAdapterConstructorArguments())
        }
        throw new Error("Not able to find any adapter for the connector")
    }


    getProviderConstructorArguments(): IProviderOptions {
        let channel = this.getChannel();
        let args: IProviderOptions = { channel: channel };
        if (this.options.args !== undefined && this.options.args.providerArgs !== undefined) {
            args = this.options.args.providerArgs;
        }
        args.channel = channel;
        if (this.filter !== undefined) {
            args.filter = {
                allowedChains: this.filter.allowedChains,
                restrictedChains: this.filter.restrictedChains
            }
        }
        return args
    }

    getProvider(): P {
        if (this.provider !== undefined) return this.provider;
        if (this.identityProvider !== undefined) {
            const cls: Class<P> = this.identityProvider.getProviderClass() as Class<P>;
            return new cls(this.getProviderConstructorArguments());
        }
        if (this.providerClass !== undefined) {
            return new this.providerClass(this.getProviderConstructorArguments());
        }
        throw new Error("Not able to find any provider for the connector")
    }

    getChannelConstructorArguments(): S | undefined {
        if (this.session !== undefined) return this.session;
        if (this.options.args !== undefined && this.options.args.channelArgs !== undefined) {
            return this.options.args.channelArgs;
        }
        return;
    }

    getChannel(): C {
        if (this.channel !== undefined) return this.channel;
        if (this.identityProvider !== undefined) {
            const channelClasses: Class<C>[] = this.identityProvider.getChannels() as Class<C>[];
            for (const cls of channelClasses) {
                const connectorType: ConnectorType = (cls as any).connectorType;
                if (this.filter !== undefined && this.filter.allowedConnectorTypes !== undefined && !this.filter.allowedConnectorTypes.includes(connectorType)) {
                    continue;
                }

                if (this.session !== undefined && (cls as any).validateSession(this.session)) {
                    const channel = new cls(this.getChannelConstructorArguments());
                    return channel;
                }
            }
        }
        if (this.channelClass !== undefined) {
            return new this.channelClass(this.getChannelConstructorArguments())
        }
        throw new Error("Not able to find any channel for the connector")
    }

    setChainAdapter(adapter: A): void {
        this.adapter = adapter;
        this.provider = this.adapter.provider;
        this.channel = this.adapter.provider.channel;
    }

    async checkConnection(raiseError: boolean = false): Promise<boolean> {
        this.checkAdapterDefined()
        return await this.adapter.checkConnection(raiseError);
    }
    isConnected(): boolean {
        return this.adapter !== undefined && this.adapter.isConnected();
    }
    async checkSession(): Promise<boolean> {
        this.checkAdapterDefined()
        return (await this.adapter.checkSession())[0]
    }

    async connect(opts?: {
        provider?: string | Providers | IdentityProvider,

        options?: any
    }): Promise<void> {
        if (opts !== undefined && opts.provider !== undefined) {
            this.setupIdentityProvider(opts.provider);
            this.validateArguments();
            const adapter = this.getChainAdapter();
            this.setChainAdapter(adapter);
        }
        this.checkAdapterDefined();
        if (!this.isConnected()) {
            const options = opts !== undefined ? opts.options : undefined;
            await this.adapter.connect(options);
        }
        await this.adapter.checkConnection(true)
    }
}