import { BaseProtocolDefination } from "../protocol_definition";
import { AccountsReturnType, Address, BalanceReturnType, SignMessageArgument, SignMessageReturnType, TransactionData, TransactionReturnType } from "../types";





export interface EthereumAccountsReturnType extends AccountsReturnType {
    result: Address[]
}

export class EthereumProtocolDefinition extends BaseProtocolDefination {

    chainIds: number[] = [1,3,4,5,2018,61,63,6,212]

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

    async getNetworkId(): Promise<number> {
        throw new Error("Method not implemented.");
    }

    async getChainId(): Promise<number> {
        const chainId = await this.request<number>({
            method: "eth_chainId",
            params: []
        });
        return chainId;
    }

    async getAccounts(): Promise<EthereumAccountsReturnType> {
   
        const accounts = await this.request<Address[]>({
                method: "eth_accounts",
                params: []
            });
        return {result: accounts};
        
    }

    async getBalance(address?: Address): Promise<BalanceReturnType>{
        throw new Error("Method not implemented.");
    }
}