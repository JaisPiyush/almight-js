import { Class, Providers } from "@almight-sdk/utils";
import { BaseChainAdapter, IChainAdapterOptions } from "./adapter";
import { BaseProviderChannel } from "./channel";
import { AdapterIsNotDefined, ConnectionEstablishmentFailed } from "./exceptions";
import { IdentityProvider } from "./identity_provider";
import { BaseProvider, IProviderOptions } from "./provider";
import { Address, ConnectionFilter, ConnectorType, CurrentSessionStruct, IConnector, ISession, SessionDetailedData, SessioUpdateArguments } from "./types";

export interface IConnectorOptions<S, C, P, A> {
    onConnect?: (options?: Partial<{ accounts: Address[], chainId: number, data: any }>) => void;
    session?: CurrentSessionStruct<S> | SessionDetailedData<S>;
    filters?: ConnectionFilter;
    channel?: Class<C> | C;
    provider?: Class<P> | P;
    identityProvider?: IdentityProvider | string | Providers,
    adapter?: Class<A> | A;
    adapters?: Class<A>[],
    args?: {
        adapterArgs?: IChainAdapterOptions,
        providerArgs?: IProviderOptions,
        channelArgs?: S
    },
    identityProvidersMap?: Record<string, IdentityProvider>,
    onSessionUpdate?: (options: SessioUpdateArguments) => void;
}




export class Connector<S extends ISession = ISession,
    C extends BaseProviderChannel<S> = BaseProviderChannel<S>,
    P extends BaseProvider<C> = BaseProvider<C>,
    A extends BaseChainAdapter<C, P> = BaseChainAdapter<C, P>

    > implements IConnector<S> {

    filter?: ConnectionFilter;
    identityProvidersMap: Record<string, IdentityProvider> = {};
    adapterClassesMap: Record<string, Class<BaseChainAdapter, IChainAdapterOptions>> = {}
    readonly options: IConnectorOptions<S, C, P, A>;


    currentSession?: CurrentSessionStruct<S>;
    session?: SessionDetailedData<S>;
    protected channelClass?: Class<C>;
    protected channel?: C;
    protected provider?: P;
    providerIdentifier?: string | Providers;
    identityProvider?: IdentityProvider;
    protected adapterClass: Class<A>;
    protected providerClass: Class<P>;
    adapter?: A;

    onConnectCallback: (options: Partial<{ accounts: Address[], chainId: number, data: any }>) => void;
    onSessionUpdateCallback: (options: SessioUpdateArguments) => void;

    readonly deadCallback = (options?: Partial<{ accounts: Address[], chainId: number, data: any }>): void => { }


    public get accounts(): Address[] {
        this.checkAdapterDefined();
        return this.adapter.accounts;
    }

    public get chainId(): number {
        this.checkAdapterDefined();
        return this.adapter.chainId;
    }

    public get selectedAccount(): Address {
        this.checkAdapterDefined();
        return this.adapter.provider.selectedAccount;
    }

    public set selectedAccount(account: Address) {
        this.checkAdapterDefined();
        this.adapter.provider.setSelectedAccount(account);
    }

    public set onSessionUpdate(fn: (options: SessioUpdateArguments) => void) {
        this.onSessionUpdateCallback = (opt: SessioUpdateArguments) => {
            if (opt.accounts !== undefined || opt.chainId !== undefined) {
                this.setupSession(this.getFormatedCurrentSession());
            }
            if (fn !== undefined) {
                fn(opt)
            }
        }
    }

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

    setupSession(session: CurrentSessionStruct<S> | SessionDetailedData<S>): void {
        if ((session as CurrentSessionStruct<S>).uid !== undefined) {
            this.currentSession = session as CurrentSessionStruct<S>;
            this.session = (session as CurrentSessionStruct<S>).session;
            this.providerIdentifier = this.currentSession.provider;
            this.setupIdentityProvider(this.providerIdentifier)
            if(this.filter === undefined){
                this.filter = {}
            }
            if(this.filter.allowedConnectorTypes === undefined){
                this.filter.allowedConnectorTypes = []
            }
            this.filter.allowedConnectorTypes.push(this.currentSession.connector_type)
        } else {
            this.session = session as SessionDetailedData<S>;
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
            this.channel = this.provider.channel;
        }
    }

    setupAdapterClassMap(adapterClasses: Class<BaseChainAdapter, IChainAdapterOptions>[]): void {
        for (const adapterClass of adapterClasses) {
            this.adapterClassesMap[(adapterClass as any).adapterIdentifier] = adapterClass;
        }
    }


    setupIdentityProvider(idp: IdentityProvider | string | Providers): void {
        let _idp: IdentityProvider;
        if (idp instanceof IdentityProvider) {
            _idp = idp
        } else if (this.identityProvidersMap[idp as string] !== undefined) {
            _idp = this.identityProvidersMap[idp as string]
        }
        if(_idp === undefined) return;
        this.identityProvider = _idp;
        this.providerIdentifier = _idp.identifier as string;
    }

    setupAdapter(adapter: Class<A> | A): void {
        if (this.isClass(adapter)) {
            this.adapterClass = adapter as Class<A>;
        } else if (this.isClassInstance(adapter, BaseChainAdapter)) {
            this.setChainAdapter(adapter as A);
        }
    }





    init(options: IConnectorOptions<S, C, P, A>): void {
        this.onConnectCallback = options.onConnect;
        this.filter = options.filters;
        if (options.identityProvidersMap !== undefined) {
            for (const [key, value] of Object.entries(options.identityProvidersMap)) {
                this.identityProvidersMap[key] = value;
            }
        }
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
        if (options.onSessionUpdate !== undefined) {
            this.onSessionUpdate = options.onSessionUpdate;
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
    setSession(session: SessionDetailedData<S>): void {
        this.session = session;
    }
    setCurrentSession(cSession: CurrentSessionStruct<S>): void {
        this.setupSession(cSession);
    }

    getFormatedSession(): SessionDetailedData<S> {
        this.checkAdapterDefined();
        if (!this.isConnected()) {
            throw new ConnectionEstablishmentFailed("No connection is able to establish, cannot produce session")
        }
        const session = this.adapter.getSession() as S;
        return {
            data: session,
            meta: {
                adapter_indentifier: this.adapter.adapterIdentifier,
                provider: this.providerIdentifier,
                last_interaction: (new Date()).getTime()
            }
        }
    }

    getFormatedCurrentSession(): CurrentSessionStruct<S> {

        if (this.providerIdentifier === undefined || this.adapter === undefined) {
            throw new Error("providerIdentifier is not defined or connection not established to produce current session")
        }
        if(this.selectedAccount === undefined){
            throw new Error("no account is connected")
        }
        const session = this.getFormatedSession();

        const currentSession: CurrentSessionStruct<S> = {
            uid: this.selectedAccount,
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
        args.onSessionUpdate = this.onSessionUpdateCallback;
        return args
    }

    getChainAdapter(): A {
        if (this.adapter !== undefined) {
            return this.adapter;
        }
        const adapterArgs = this.getAdapterConstructorArguments()
        if (this.adapterClass !== undefined) {
            return new this.adapterClass(adapterArgs)
        }
        if (this.session !== undefined && this.session.meta !== undefined && this.session.meta.adapter_indentifier !== undefined &&
            this.adapterClassesMap[this.session.meta.adapter_indentifier] !== undefined) {
            const cls = this.adapterClassesMap[this.session.meta.adapter_indentifier] as Class<A, IChainAdapterOptions>;
            return new cls(adapterArgs);
        }
        if (this.identityProvider !== undefined) {
            const cls: Class<A> = this.identityProvider.getAdapterClass() as Class<A>;
            return new cls(adapterArgs);
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
        const providerArgs = this.getProviderConstructorArguments()
        if (this.providerClass !== undefined) {
            return new this.providerClass(providerArgs);
        }
        if (this.identityProvider !== undefined) {
            const cls: Class<P> = this.identityProvider.getProviderClass() as Class<P>;
            return new cls(providerArgs);
        }

        throw new Error("Not able to find any provider for the connector")
    }

    getChannelConstructorArguments(): S | undefined {
        if (this.session !== undefined) return this.session.data;
        if (this.options.args !== undefined && this.options.args.channelArgs !== undefined) {
            return this.options.args.channelArgs;
        }
        return;
    }

    getChannel(): C {
        if (this.channel !== undefined) return this.channel;
        const channelArgs = this.getChannelConstructorArguments()
        if (this.channelClass !== undefined) {
            if (channelArgs !== undefined && channelArgs.chainId !== undefined) {
                (<any>this.channelClass).validateSession(channelArgs);
            }
            return new this.channelClass(this.getChannelConstructorArguments())
        }
        if (this.identityProvider !== undefined) {
            const channelClasses: Class<C>[] = this.identityProvider.getChannels() as Class<C>[];
            for (const cls of channelClasses) {
                const connectorType: ConnectorType = (cls as any).connectorType;
                if (this.filter !== undefined && this.filter.allowedConnectorTypes !== undefined && !this.filter.allowedConnectorTypes.includes(connectorType)) {
                    continue;
                }
                if (this.session !== undefined && (cls as any).validateSessionWithoutError(this.session.data)) {
                    const channel = new cls(channelArgs);
                    return channel;
                }
            }
        }
        throw new Error("Not able to find any channel for the connector")
    }

    setChainAdapter(adapter: A): void {
        this.adapter = adapter;
        if (this.onConnectCallback !== undefined) {
            this.adapter.onConnectCallback = this.onConnectCallback
        }
        if (this.onSessionUpdateCallback !== undefined) {
            this.adapter.onSessionUpdate = this.onSessionUpdateCallback;
        }
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

        }

        if (this.adapter === undefined) {
            const adapter = this.getChainAdapter();
            this.setChainAdapter(adapter);
        }


        this.checkAdapterDefined();
        if (!this.isConnected()) {
            const options = opts !== undefined ? opts.options : undefined;
            await this.adapter.connect(options);
        }

    }
}