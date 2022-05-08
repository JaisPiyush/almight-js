import { BaseProviderChannel, BrowserProviderChannel } from "./channel";
import { ChannelIsNotDefined } from "./exceptions";
import { Address, BasicExternalProvider, ConnectorType, IProviderAdapter, ProviderChannelInterface, ProviderRequestMethodArguments, ProviderSessionStruct, WalletConnectSessionStruct } from "./types";

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
    channel: BaseProviderChannel,
    onConnect?: (options?: any) => void
}
export class BaseChainAdapter implements IProviderAdapter {

    protected _channel: BaseProviderChannel;

    protected _methodNameMap: Record<string, string> = {};



    public connect?: <T = any, R = any>(options?: R) => Promise<T>;
    public checkSession?: <P = any, S = any>(session: S) => Promise<[boolean, P]>;

    public onConnect?: (options?: any) => void;


    public onConnectCallback?: (options?: any) => void;

    protected getMethodName(name: string): string {
        return this._methodNameMap[name] ?? name;
    }

    public setMethodName(key: string, value: string): void {
        this._methodNameMap[key] = value;
    }

    public get channel(): BaseProviderChannel { return this._channel }

    public set channel(_channel: BaseProviderChannel) { this._channel = _channel }



    constructor(options: IChainAdapterOptions) {
        this.channel = options.channel;
        this.onConnectCallback = options.onConnect;
    }

    protected checkChannel(): void {
        if (this.channel === undefined) throw new ChannelIsNotDefined(this.constructor.name);
    }

    async request<T = any>(data: ProviderRequestMethodArguments, timeout?: number): Promise<T> {
        this.checkChannel();
        return await this.channel.request<T>(data, timeout);
    }

    async checkConnection(): Promise<boolean> {
        return await this.channel.checkConnection(this);
    }


    protected async _getAccounts(provider: BasicExternalProvider): Promise<Address[]> {
        return await provider.request(
            {
                method: this.getMethodName("getAccounts"),
                params: []
            }) as Address[];
    }

    public async getAccounts(): Promise<Address[]> {
        return await this._getAccounts(this.channel);
    }


}



export class EthereumChainAdapter extends BaseChainAdapter {

    providerPath = "ethereum";

    protected _methodNameMap: Record<string, string> = {
        "getAccounts": "eth_accounts"
    }

    bindChannelDelegations(): void {
        let self = this;
        if (this.channel instanceof BrowserProviderChannel) {
            this.channel.providerPath = this.providerPath;
        }

        this.onConnect = function (options?: any): void {
            self.onConnectCallback(options);
        }
    }

    constructor(options: IChainAdapterOptions) {
        super(options);
        this.checkChannel()
        this.bindChannelDelegations();
    }

}
