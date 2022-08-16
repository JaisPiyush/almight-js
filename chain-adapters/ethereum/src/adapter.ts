import { BaseChainAdapter, Address, BaseProviderChannel, BaseProvider } from "@almight-sdk/connector";
import { ethers } from "ethers";


export class EthereumChainAdapter<C extends BaseProviderChannel = BaseProviderChannel,
    P extends BaseProvider<C> = BaseProvider<C>>
    extends BaseChainAdapter<C, P>{

    public static adapterIdentifier = "ethereum_chain_adapter"
    public bridge: ethers.providers.Web3Provider;
    public provider: P;



    public onConnect(options: unknown): void {
        if (this.provider.isConnected()) {
            this.bridge = new ethers.providers.Web3Provider(this.provider.channel as ethers.providers.ExternalProvider);
        }

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
        const chainId = await this.request<string>({ method: "net_version", params: [] });
        return parseInt(chainId);
        
    }

    async getChainId(): Promise<number> {
        const chainId = await this.request<string>({ method: "eth_chainId", params: [] });
        return parseInt(chainId);
       
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










