import { BaseProviderChannel, BrowserProviderChannel } from "../channel";
import { ChannelIsNotDefined, ConnectedChainNotAllowedError } from "../exceptions";
import { Address, IProvider, IProviderAdapter, ISession, ProviderChannelInterface, ProviderFilter, ProviderRequestMethodArguments, SubscriptionCallback } from "../types";
import { Chains, Chainset, getChainManager } from "@almight-sdk/utils"


interface IProviderOptions {
    channel: BaseProviderChannel,
    onConnect?: (options?: any) => void,
    filter?: ProviderFilter
}

export class BaseProvider<C extends BaseProviderChannel = BaseProviderChannel, A extends IProviderAdapter = IProviderAdapter> implements IProvider<C> {

    public static providerPath = null;

    public adapter: A;

    public get providerPath(): string { return (this.constructor as any).providerPath }
    public accounts?: Address[];
    public chainId?: number;
    public chainset?: Chainset;
    public filter?: ProviderFilter
    public allowedChainIds: number[] = [];
    public restrictedChainIds: number[] = [];

    channelConnect?: (options?: any) => Promise<void>;
    channelCheckSession?: (session: any) => Promise<[boolean, unknown]>;
    channelPing?: (options?: any) => Promise<boolean>;
    channelOnConnect?: (options?: any) => void;
    channelbindSessionListener?: () => void;


    channel: C;

    public onConnectCallback: (options?: any) => void = (opt?: any): void => {};


    constructor(options: IProviderOptions) {
        this.setChannel(options.channel as C);
        this.onConnectCallback = options.onConnect;
        this.checkChannel()
        this.bindChannelDelegations();
        if(options.filter !== undefined){
            this.setFilter(options.filter);
        }
    }


    setFilter(filter: ProviderFilter): void {
        this.filter = filter;
        this.enflateFilter()
    }

    setChannel(channel: C) {
        this.channel = channel;
    }

    setAdapter(adapter: A): void {
        this.adapter = adapter;
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
            const chainId = await self.adapter.getChainId();
            self.verifyConnectedChain(chainId);
            self.chainId = chainId;
            return true;
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

    getSession(): ISession {
        let sesion = this.channel.getCompleteSessionForStorage();
        if (this.chainId !== undefined) {
            sesion["chainId"] = this.chainId
        }
        return sesion;
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