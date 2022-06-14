import { BrowserProviderChannel, MetaMaskAdapter } from "@almight-sdk/connector";
import { useEffect } from "react";



const MetamaskAdapter: React.FC = () => {

    

    useEffect(() => {
        const adapter = new MetaMaskAdapter({
            channel: new BrowserProviderChannel()
        });
        (window as any).adapter = adapter
    },[])
    

    return (
        <div></div>
    )
}


export default MetamaskAdapter;