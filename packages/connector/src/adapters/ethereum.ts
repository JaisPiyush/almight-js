import { BaseChainAdapter } from "../adapter";
import { BaseProtocolDefination } from "../protocol_definition";
import { IProviderAdapter, TransactionData, TransactionReturnType, SignMessageArgument, SignMessageReturnType, BalanceReturnType, Address, ProviderChannelInterface } from "../types";


export class MetaMaskAdapter extends BaseChainAdapter implements BaseProtocolDefination {

    public static providerPath = "ethereum";

    adapter?: IProviderAdapter;
    chainIds: number[];

    public bindChannelDelegations(): void {
        super.bindChannelDelegations();
        let self = this;
        this.channelPing = async (options?: any): Promise<boolean>  => {
            try {
                const accounts = await self.getAccounts();
                self.accounts = accounts;
                const chainId = await self.getChainId();
                self.chainId = chainId;
                return true;
            }catch(e){
                return false;
            }
        }

        this.channelCheckSession = async <P = any, S = any>(session: S, channel?: ProviderChannelInterface) : Promise<[boolean, P]> => {
            let [isSessionValid, _provider] = await self.channel.defaultCheckSession();
            if(isSessionValid && _provider !== undefined && (_provider as any).isMetaMask) {
                return [true, _provider];
            }
            return [false, undefined]
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
        throw new Error("Method not implemented.");
    }


}

export class KardiaChainAdapter extends MetaMaskAdapter {


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