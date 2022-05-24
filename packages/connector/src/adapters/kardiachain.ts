import { ProviderChannelInterface } from "../types";
import { MetaMaskAdapter } from "./metamask_adapter";


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