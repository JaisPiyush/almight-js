import { ChannelIsNotDefined } from "./exceptions";
import { IProviderAdapter, ProviderChannelInterface, ProviderRequestMethodArguments, ProviderSessionStruct, WalletConnectSessionStruct } from "./types";

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
 * 
 */
export class BaseChainAdapter implements IProviderAdapter {

    protected _channel: ProviderChannelInterface;


    public connect?: <T = any, R = any>(options?: R) => Promise<T>;
    public checkSession?: <P = any, S = any>(session: S) => Promise<[boolean, P]>;

    public onConnect?: (options?: any) => void;

    public get channel(): ProviderChannelInterface { return this._channel }

    public set channel(_channel: ProviderChannelInterface) { this._channel = _channel }

 

    constructor(options: { channel: ProviderChannelInterface }) {
        this.channel = options.channel;
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


}

