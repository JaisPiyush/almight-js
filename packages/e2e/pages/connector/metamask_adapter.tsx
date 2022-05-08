import {BasicExternalProvider, BrowserProviderChannel, EthereumChainAdapter} from "@almight-sdk/connector"
import { useEffect } from "react";


class MetaMaskBrowserAdapter extends EthereumChainAdapter {

    bindChannelDelegations(): void {
        let self = this;
        super.bindChannelDelegations();
        this.connect = async function <T = any, R = any>(options?: R):Promise<T> {
            if(options !== undefined && (options as any).providers !== undefined){
                self.channel.defaultConnect((options as any).providers[4]);
            }
            return {} as T;
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
    })

    

    return (
        <div></div>
    )
}


export default MetamaskAdapter;