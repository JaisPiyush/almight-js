
import { BaseProviderChannel } from "./channel";

import { BaseProvider } from "./providers";
import { Address, BalanceReturnType, IProviderAdapter, ISession, ProviderRequestMethodArguments, RequestReturnType, SignMessageArgument, SignMessageReturnType, SubscriptionCallback, TransactionData, TransactionReturnType } from "./types";

/**
 * ChainAdapters wrap individual setup and method calls for different chains
 * to one plug&play class.
 * 
 * The Base class will later be extended for creating method wrappers such as
 * Account methods, Transaction methods, etc.
 * Each ChainMethodAdapter will have their own implementation of common methods with
 * description input and output typing along with extended set of un-common methods
 * 
 * Initialisation with channel
 * 
 * const chainAdapter = new BaseChainAdapter({channel: new BaseProviderChannel(...)}) 
 * chainAdapter.request(...)
 * 
 */


interface IChainAdapterOptions {
    provider: BaseProvider,
    onConnect?: (options?: any) => void
}
export class BaseChainAdapter<C extends BaseProviderChannel = BaseProviderChannel, 
P extends BaseProvider<C> = BaseProvider<C>
> implements IProviderAdapter<C> {

    provider: P;
    bridge: any;
    onConnectCallback?: (options?: any) => void

    public get accounts(): Address[] {return this.provider.accounts}
    public get chainId(): number {return this.provider.chainId}

    constructor(options: IChainAdapterOptions) {
        this.setProvider(options.provider as P)
        this.onConnectCallback = options.onConnect;
        this.provider.onConnectCallback = (options?: any): void => {
            this.onConnect(options);
            this.onConnectCallback(options)
        }
    }


    public onConnect(options: any): void {
        
    }

    public setProvider(provider: P): void {
        this.provider = provider;
        this.provider.adapter = this;
    }

    public setBridge(bridge: any): void {
        this.bridge = bridge;
    }

    public getChannel(): C {
        return this.provider.channel;
    }

    getSession(): ISession {
       return this.provider.getSession();
    }


    isConnected(): boolean {
        return this.provider.isConnected();
    }

    async getAccounts(): Promise<Address[]> {
        throw new Error("Method not implemented")
    }

    async getChainId(): Promise<number> {
        throw new Error("Method not implemented")
    }

    

    sendTransaction(data: TransactionData): Promise<TransactionReturnType> {
        throw new Error("Method not implemented.");
    }
    signTransaction(data: TransactionData): Promise<TransactionReturnType> {
        throw new Error("Method not implemented.");
    }
    signPersonalMessage(data: SignMessageArgument): Promise<SignMessageReturnType> {
        throw new Error("Method not implemented.");
    }
    getNetworkId(): Promise<RequestReturnType> {
        throw new Error("Method not implemented.");
    }
    getBalance(account?: string, blockTag?: string): Promise<BalanceReturnType> {
        throw new Error("Method not implemented.");
    }
    getTransactionCount(): Promise<number> {
        throw new Error("Method not implemented.");
    }
    


    async checkSession<T>(): Promise<[boolean, T]> {
        return await this.provider.checkSession<T>()
    }

    async connect(options?: any): Promise<void> {
        await this.provider.connect(options)

    }

    async request<T = any>(data: ProviderRequestMethodArguments, timeout?: number): Promise<T> {
       return await this.provider.request<T>(data, timeout) as T;
    }


    async checkConnection(): Promise<boolean> {
        return await this.provider.checkConnection();
    }

    on(event: string, callback: SubscriptionCallback): void {
        this.provider.on(event, callback);
    }
}



