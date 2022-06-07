import { BaseChainAdapter } from "../adapter";
import { WalletConnectChannel } from "../channel";
import { BaseProtocolDefination } from "../protocol_definition";
import { IProviderAdapter, TransactionData, TransactionReturnType, SignMessageArgument, SignMessageReturnType, BalanceReturnType, Address, ProviderChannelInterface, ConnectorType } from "../types";
import { ethers, BigNumber } from "ethers";


export class MetaMaskAdapter extends BaseChainAdapter implements BaseProtocolDefination {

    public static providerPath = "ethereum";

    adapter?: IProviderAdapter;
    chainIds: number[];

    override async checkConnection(): Promise<boolean> {
        const result  = await super.checkConnection();
        if(this.channel.connectorType === ConnectorType.BrowserExtension){
            this.channel.onConnect({
                accounts: this.accounts,
                chainId: this.chainId
            }, this)
        }
        return result;
    }

    public bindChannelDelegations(): void {
        super.bindChannelDelegations();
        let self = this;
        this.channelPing = async (options?: any): Promise<boolean>  => {
            const accounts = await self.getAccounts();
            self.accounts = accounts;
            const chainId = await self.getChainId();
            self.chainId = chainId;
            return true;
        }

        this.channelCheckSession = async <P = any, S = any>(session: S, channel?: ProviderChannelInterface) : Promise<[boolean, P]> => {
            let [isSessionValid, _provider] = await self.channel.defaultCheckSession();
            if(self.channel.connectorType === ConnectorType.BrowserExtension){
                if(isSessionValid && _provider !== undefined && (_provider as any).isMetaMask) {
                    return [true, _provider];
                }
                return [false, undefined]
            }
            return [isSessionValid, _provider];
            
        }


        this.channelConnect = async (options?: any): Promise<void> => {
            await self.channel.defaultConnect(options, self)
            if(self.channel.connectorType === ConnectorType.WalletConnector){
                await self.channel.defaultConnect(options, self);
                if((self.channel as WalletConnectChannel).isSessionConnected()) await self.checkConnection();
                return;
            }
            await self.channel.defaultConnect(options, self)
            self.accounts = await self.request<Address[]>({method: "eth_requestAccounts", params:[]});
            self.checkConnection();

        }



       


    }

    bindAdapter(adapter: IProviderAdapter): void {
        return;
    }
    checkAdapter(): void {
        return;
    }
    async sendTransaction(data: TransactionData): Promise<TransactionReturnType> {
        throw new Error("Method not implemented.");
    }
    async signTransaction(data: TransactionData): Promise<TransactionReturnType> {
        throw new Error("Method not implemented.");
    }
    async signPersonalMessage(data: {message: string, address?: string}): Promise<string> {
        data.address = data.address?? this.accounts[0];
        return await this.request<string>({
            method: "personal_sign",
            params: [data.message, data.address]
        });
    }
    async sign(data: SignMessageArgument): Promise<SignMessageReturnType> {
        throw new Error("Method not implemented.");
    }
    async signTypedData(data: SignMessageArgument): Promise<SignMessageReturnType> {
        throw new Error("Method not implemented.");
    }
    async getNetworkId(): Promise<number> {
        try{
            const chainId = await this.request<string>({method: "net_version", params:[]});
            return parseInt(chainId);
        }catch(e){
            throw e;
        }
    }

    async getChainId(): Promise<number> {
        try{
            const chainId = await this.request<string>({method: "eth_chainId", params:[]});
            return parseInt(chainId);
        }catch(e){
            throw e;
        }
    }
    async getAccounts(): Promise<Address[]> {
       return await this.request<Address[]>({
           method: "eth_accounts",
           params: []
       });
    }
    async getBalance(): Promise<BalanceReturnType> {
        const hexBalance =  await this.request<string>({method: "eth_getBalance", params:[this.accounts[0], "latest"]})
        const bNBalance = BigNumber.from(hexBalance);
        const balance = ethers.utils.formatEther(bNBalance);
        return parseFloat(balance);
    }


}

export class KardiaChainAdapter extends MetaMaskAdapter {

    public static providerPath = "kardiachain";

    bindChannelDelegations(): void {
        super.bindChannelDelegations();
        let self = this;
        this.channelCheckSession = async <P = any, S = any>(session: S, channel?: ProviderChannelInterface) : Promise<[boolean, P]> => {
            let [isSessionValid, _provider] = await self.channel.defaultCheckSession();
            if(isSessionValid && _provider !== undefined && (_provider as any).isMetaMask === true && (_provider as any).isKaiWallet === true) {
                return [true, _provider];
            }
            return [false, undefined]
        }

    }

    
}