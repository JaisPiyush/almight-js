import { AdapterIsNotDefined } from "./exceptions";
import { AccountsReturnType, BalanceReturnType, IProtocolDefinition, IProviderAdapter, ProviderRequestMethodArguments, RequestReturnType, SignMessageArgument, SignMessageReturnType, TransactionData, TransactionReturnType } from "./types";



export class BaseProtocolDefination implements IProtocolDefinition {
    adapter?: IProviderAdapter;
    chainIds: number[] = [];

    constructor (adapter?: IProviderAdapter) {
       if(adapter !== undefined){
           adapter.bindProtocol(this);
       }
    }

    bindAdapter(adapter: IProviderAdapter): void {
        this.adapter = adapter;
    }

    /**
     * The function will check whether the adapter is defined and connected
     * otherwise it'll throw @error AdapterIsNotDefined
     */
    checkAdapter(): void {
        if(this.adapter === undefined && this.adapter.isConnected()) throw new AdapterIsNotDefined();
    }



    async request<T = any>(args: ProviderRequestMethodArguments): Promise<T> {
        this.checkAdapter();
        return await this.adapter.request<T>(args);
    }

    async sendTransaction(data: TransactionData): Promise<TransactionReturnType> {
        throw new Error("Method not implemented.");
    }

    async signTransaction(data: TransactionData): Promise<TransactionReturnType> {
        throw new Error("Method not implemented.");
    }

    async signPersonalMessage(data: SignMessageArgument): Promise<SignMessageReturnType> {
        throw new Error("Method not implemented.");
    }

    async sign(data: SignMessageArgument): Promise<SignMessageReturnType> {
        throw new Error("Method not implemented.");
    }
    async signTypedData(data: SignMessageArgument): Promise<SignMessageReturnType> {
        throw new Error("Method not implemented.");
    }

    async getNetworkId(): Promise<RequestReturnType> {
        throw new Error("Method not implemented.");
    }

    async getChainId(): Promise<RequestReturnType> {
        throw new Error("Method not implemented.");
    }

    async getAccounts(): Promise<AccountsReturnType> {
        throw new Error("Method not implemented.");
    }

    async getBalance(): Promise<BalanceReturnType>{
        throw new Error("Method not implemented.");
    }

}
