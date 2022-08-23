import { Address, BaseChainAdapter, BaseProvider, BaseProviderChannel, ConnectorType, ProviderChannelInterface, WalletConnectChannel } from "@almight-sdk/connector";
import { Providers } from "@almight-sdk/utils";

export class MetamaskProvider<C extends BaseProviderChannel = BaseProviderChannel, 
A extends BaseChainAdapter = BaseChainAdapter> extends BaseProvider<C, A> {
    
    public static providerPath = "ethereum";
    readonly deepLinkUri: string = "https://metamask.app.link/";


    override async checkConnection(): Promise<boolean> {
        const result = await super.checkConnection();

        if (this.channel.connectorType === ConnectorType.BrowserExtension) {
            this.channel.onConnect({
                accounts: this.accounts,
                chainId: this.chainId
            }, this)
        }
        return result;
    }


    notMetaMaskSupportingWallets(provider: any):boolean {
        return provider.isCoinbaseWallet === true;
    }


    verifyBrowserSession(provider: any): boolean {
        return provider.isMetaMask === true && ! this.notMetaMaskSupportingWallets(provider);
    }



    public bindChannelDelegations(): void {
        super.bindChannelDelegations();
        let self = this;

        this.channelConnect = async (options?: any): Promise<void> => {
            await self.channel.defaultConnect(options, self)
            if (self.channel.connectorType === ConnectorType.WalletConnector) {
                if (((self.channel as unknown) as WalletConnectChannel).isSessionConnected()) await self.checkConnection();
                return;
            }
            self.accounts = await self.request<Address[]>({ method: "eth_requestAccounts", params: [] });
            self.checkConnection();
        }


        this.channelCheckSession = async <P = any, S = any>(session: S, channel?: ProviderChannelInterface): Promise<[boolean, P]> => {
            let [isSessionValid, _provider] = await self.channel.defaultCheckSession(self);
            if (self.channel.connectorType === ConnectorType.BrowserExtension && isSessionValid && _provider !== undefined) {
                if ((_provider as any).provider !== undefined && (_provider as any).providers.length > 1) {
                    for (const provider of (_provider as any).providers) {
                        if (this.verifyBrowserSession(provider)) return provider;
                    }
                }
                else if (this.verifyBrowserSession(_provider)) {
                    return [true, _provider];
                }
                return [false, undefined]
            }
            return [isSessionValid, _provider];

        }

    }

}


export class KardiaChainProvider extends MetamaskProvider {

    public static providerPath = Providers.KardiaChain;
    readonly deepLinkUri = undefined;

    override verifyBrowserSession(provider: any): boolean {
        return (provider as any).isKaiWallet === true
    }

}


export class CoinbaseWalletProvider extends MetamaskProvider {

    readonly deepLinkUri: string = "https://go.cb-w.com/"

    override verifyBrowserSession(provider: any): boolean {
        return (provider as any).isCoinbaseWallet === true;
    }

}