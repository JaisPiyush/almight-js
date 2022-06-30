import { BaseChainAdapter } from "../adapter";
import { IProviderAdapter, Address, IProtocolDefinition } from "../types";
import { ethers } from "ethers";






export class EthereumAdapter extends BaseChainAdapter implements IProtocolDefinition {


    public bridge: ethers.providers.Web3Provider;

    

    public onConnect(options: any): void {
        this.bridge = new ethers.providers.Web3Provider(this.provider.channel as ethers.providers.ExternalProvider);
    }


    async sendTransaction(data: ethers.providers.TransactionRequest): Promise<ethers.providers.TransactionResponse> {
        return await this.bridge.getSigner().sendTransaction(data);
    }
    async signTransaction(data: ethers.providers.TransactionRequest): Promise<string> {
        return await this.bridge.getSigner().signTransaction(data);
    }

    async signPersonalMessage(data: { message: string, address?: string }): Promise<string> {
        data.address = data.address ?? this.accounts[0];
        return await this.request<string>({
            method: "personal_sign",
            params: [data.message, data.address]
        });
    }


    async getNetworkId(): Promise<number> {
        try {
            const chainId = await this.request<string>({ method: "net_version", params: [] });
            return parseInt(chainId);
        } catch (e) {
            throw e;
        }
    }

    async getChainId(): Promise<number> {
        try {
            const chainId = await this.request<string>({ method: "eth_chainId", params: [] });
            return parseInt(chainId);
        } catch (e) {
            throw e;
        }
    }
    async getAccounts(): Promise<Address[]> {
        return await this.request<Address[]>({
            method: "eth_accounts",
            params: []
        });
    }
    async getBalance(account?: Address, blockTag: string = "latest"): Promise<ethers.BigNumber> {
        return (await this.bridge.getBalance(account ?? this.accounts[0], blockTag));
    }
    async getTransactionCount(account?: Address, block: string = "latest"): Promise<number> {
        return await this.bridge.getTransactionCount(account ?? this.accounts[0], block);
    }
}







