import {BaseConnector, IdentityProvider, WalletConnectChannel , BrowserProviderChannel, EthereumChainAdapter, BaseChainAdapter, BaseProviderChannel, ConnectorType} from "@almight-sdk/connector"
import { useEffect } from "react";


class MetaMaskBrowserAdapter extends EthereumChainAdapter {

    bindChannelDelegations(): void {
        let self = this;
        super.bindChannelDelegations();
        this.channelConnect = async function <T = any, R = any>(options?: R):Promise<T> {
            const [isSessionValid, _provider] = await self.channel.checkSession(self);
            if(isSessionValid && _provider !== undefined && (_provider as any).providers !== undefined){
                self.channel.defaultConnect((_provider as any).providers[4]);
            }else{
                self.channel.defaultConnect(_provider);
            }
            return {} as T;
        }     
    }
}


class PhantomAdapter extends BaseChainAdapter {

    public static providerPath = "solana";

    bindChannelDelegations(): void {
        let self = this;
        super.bindChannelDelegations();
        this.channelConnect = async function <T = any, R = any>(options?: R):Promise<T> {
            const [isSessionValid, _provider] = await self.checkSession();
            
            if(isSessionValid && _provider !== undefined){
                if(self.channel.connectorType === ConnectorType.BrowserExtension && (_provider as any).isPhantom === true){
                    await (_provider as any).connect()
                }
                self.channel.defaultConnect(_provider);
            }
            return {} as T

        }
    }

}


const MetamaskAdapter: React.FC = () => {

    const channel = new BrowserProviderChannel();
    const adapter = new MetaMaskBrowserAdapter({channel: channel, onConnect: (options: any) => {
        console.log(options)
    }});

    useEffect(() => {
        (window as any).adapter = adapter;
        (window as any).toolset = {
            adapterClass: PhantomAdapter,
            channelClasses: [BrowserProviderChannel, WalletConnectChannel],
            connector: BaseConnector,
            baseProviderChannel: BaseProviderChannel
        }
    })

    

    return (
        <div></div>
    )
}


export default MetamaskAdapter;