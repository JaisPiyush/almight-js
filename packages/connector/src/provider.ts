import { BaseProviderChannel, BrowserProviderChannel, WalletConnectChannel } from "./channel";
import { ChannelIsNotDefined, ConnectedChainNotAllowedError } from "./exceptions";
import { Address, ConnectorType, CurrentSessionStruct, IProvider, IProviderAdapter, ISession, ProviderChannelInterface, ProviderFilter, ProviderRequestMethodArguments, SessioUpdateArguments, SubscriptionCallback } from "./types";
import { Chains, Chainset, getChainManager, isMobileWebPlatform, isWebPlatform } from "@almight-sdk/utils"


export interface IProviderOptions {
    channel: BaseProviderChannel,
    onConnect?: (options: any) => void,
    filter?: ProviderFilter,
    onSessionUpdate?: (options: SessioUpdateArguments) => void;
}

export class BaseProvider<C extends BaseProviderChannel = BaseProviderChannel, A extends IProviderAdapter = IProviderAdapter> implements IProvider<C> {

    public static providerPath: string = null;

    public adapter: A;

    public get providerPath(): string { return (this.constructor as any).providerPath }
    public accounts?: Address[];
    public selectedAccount?: Address;
    public chainId?: number;
    public chainset?: Chainset;
    public filter?: ProviderFilter
    public allowedChainIds: number[] = [];
    public restrictedChainIds: number[] = [];
    readonly deepLinkUri?: string;

    channelConnect?: (options?: any) => Promise<void>;
    channelCheckSession?: (session: any) => Promise<[boolean, unknown]>;
    channelPing?: (options?: any) => Promise<boolean>;
    channelOnConnect?: (options: any) => void;
    channelbindSessionListener?: (channel: BaseProviderChannel) => void;


    channel: C;

    public onConnectCallback: (optionsS: any) => void = (opt?: any): void => {};


    constructor(options: IProviderOptions) {
        this.setChannel(options.channel as C);
        this.onConnectCallback = options.onConnect;
        this.checkChannel()
        this.bindChannelDelegations();
        this.onSessionUpdate = options.onSessionUpdate;
        if(options.filter !== undefined){
            this.setFilter(options.filter);
        }
    }


    setFilter(filter: ProviderFilter): void {
        this.filter = filter;
        this.enflateFilter()
    }

    public set onSessionUpdate(fn: (options: SessioUpdateArguments) => void) {
        this.channel.onSessionUpdate = (options: SessioUpdateArguments): void => {
            if(options.accounts !== undefined){
                this.accounts = options.accounts;
                this.setSelectedAccount(this.accounts[0])

            }
            if(options.chainId !== undefined){
                this.chainId = options.chainId;
            }
            fn(options);
        }
    }

    setChannel(channel: C) {
        this.channel = channel;
        if(this.channel.connectorType === ConnectorType.BrowserExtension && this.providerPath !== null){
            (this.channel as any).providerPath = this.providerPath
        }
    }

    setAdapter(adapter: A): void {
        this.adapter = adapter;
    }

    isDeepLinkPlantable(): boolean {
        if(this.channel !== undefined && this.deepLinkUri !== undefined && this.channel instanceof WalletConnectChannel){
            if(isWebPlatform()){
                return isMobileWebPlatform()
            }
            return true;
        }
        return false;
    }

    getDeepLinkUri(): string {
        if(this.deepLinkUri === undefined) throw new Error("Deeplink uri is not provided");
        return `${this.deepLinkUri}wc?uri=${(<WalletConnectChannel>(this.channel as any)).getConnectorUri()}`
    }

    public bindChannelDelegations(): void {
        let self = this;
        if (this.channel instanceof BrowserProviderChannel) {
            this.channel.providerPath = this.providerPath;
        }

        this.channelOnConnect = function (options?: any): void {
            if (self.onConnectCallback !== undefined) {
                self.onConnectCallback({
                    data: options,
                    accounts: options.accounts ?? self.accounts,
                    chainId: options.chainId ?? self.chainId
                });
            }
        }

        this.channelPing = async (options?: any): Promise<boolean> => {
            const accounts = await self.adapter.getAccounts();
            self.accounts = accounts;
            if(accounts !== undefined && accounts.length > 0){
                self.setSelectedAccount(accounts[0])
            }
            const chainId = await self.adapter.getChainId();
            self.verifyConnectedChain(chainId);
            self.chainId = chainId;
            return true;
        }
    }


    public setSelectedAccount(account: Address): void {
        if(this.accounts === undefined || this.accounts.length === 0 || this.accounts.includes(account)){
            this.selectedAccount = account;
        }
    }


    protected isChainFilterAvailable(): boolean {
        return this.allowedChainIds.length > 0 || this.restrictedChainIds.length > 0;
    }


    protected checkChannel(): void {
        if (this.channel === undefined) throw new ChannelIsNotDefined(this.constructor.name);
    }


    protected enflateChains(chains: (string | number)[]): number[] {
        const chainManager = getChainManager();
        let chainIds: number[] = [];
        for (const chain of chains) {
            if (typeof chain === "string") {
                const chainset = chainManager.chainsetRecord[chain];
                if (chainset === undefined) {
                    throw new Error(`Provided chain ${chain} is not available in chainset record`)
                }
                chainIds = chainIds.concat(chainset.getChainIds());
            } else if (typeof chain === "number") {
                chainIds.push(chain);
            }
        }
        return chainIds;
    }


    public enflateFilter(): void {
        if (this.filter === undefined) return;

        if (this.filter.allowedChains !== undefined) {
            this.allowedChainIds = this.enflateChains(this.filter.allowedChains);
        }
        if (this.filter.restrictedChains !== undefined) {
            this.restrictedChainIds = this.enflateChains(this.filter.restrictedChains)
        }
    }



    verifyConnectedChain(chainId: number): void {

        const chainManager = getChainManager();
        const chainset = chainManager.getChainsetFromChainId(chainId);
        if (chainset !== null) {
            this.chainset = chainset;
        }

        if (this.restrictedChainIds.length > 0 && this.restrictedChainIds.includes(chainId)) {
            throw new ConnectedChainNotAllowedError(chainId);
        }
        else if (this.allowedChainIds.length > 0 && !this.allowedChainIds.includes(chainId)) {
            throw new ConnectedChainNotAllowedError(chainId);
        }


    }

    isConnected(): boolean {
        return this.channel !== undefined && this.channel.isConnected;
    }

    public getProvider<T = any>(): T {
        if (this.channel === undefined || this.channel.provider === undefined) throw new Error("No connection exists");
        return this.channel.provider as T;
    }

    getSession<S extends ISession = ISession>(): S {
        let sesion = this.channel.getCompleteSessionForStorage();
        if (this.chainId !== undefined) {
            sesion["chainId"] = this.chainId
        }
        return sesion as S;
    }




    on(event: string, callback: SubscriptionCallback): void {
        if (this.channel === undefined) throw new ChannelIsNotDefined(this.constructor.name)
        this.channel.on(event, callback);
    }
    async request<T = any>(data: ProviderRequestMethodArguments, timeout?: number): Promise<T> {
        this.checkChannel();
        return await this.channel.request<T>(data, timeout);
    }

    async getCompleteSessionForStorage(): Promise<ISession> {
        if (this.channel !== undefined) {
            const sesion = this.channel.getCompleteSessionForStorage();
            sesion.chainId = await this.adapter.getChainId();
            return sesion;
        }
    }

    async checkConnection(raiseError: boolean = false): Promise<boolean> {
        return await this.channel.checkConnection(this, raiseError);
    }
    async checkSession<P>(): Promise<[boolean, P]> {
        this.checkChannel()
        return await this.channel.checkSession(this)
    }
    async connect(options?: any): Promise<void> {
        this.checkChannel()
        await this.channel.connect(options, this)
    }


}