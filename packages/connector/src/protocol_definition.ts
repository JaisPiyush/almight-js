import { AdapterIsNotDefined } from "./exceptions";
import { AccountsReturnType, BalanceReturnType, IProtocolDefinition, IProviderAdapter, ProviderRequestMethodArguments, RequestReturnType, SignMessageArgument, SignMessageReturnType, TransactionData, TransactionReturnType } from "./types";



export class BaseProtocolDefinition<P = any> implements IProtocolDefinition {

    adapter: IProviderAdapter;
    chainIds: number[] = [];
    provider: P;


    setProvider(provider: P): void {
        this.provider = provider;
    }

    setAdapter(adapter: IProviderAdapter): void {
        this.adapter = adapter;
    }


    constructor(adapter: IProviderAdapter){
        this.setAdapter(adapter);
    }


    checkProvider(): boolean {
        if (this.provider === undefined) throw new Error("Provider is not connected");
        return true;
    }


    validateChainId(chainId: number): boolean {
        return this.chainIds.length === 0 || this.chainIds.includes(chainId)
    }


    async getTransactionCount(): Promise<number> {
        throw new Error("Method not implemented.");
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

    async getBalance(options?: any): Promise<BalanceReturnType>{
        throw new Error("Method not implemented.");
    }

}


