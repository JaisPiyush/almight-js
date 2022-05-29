
import { IChannelBehaviourPlugin, ProviderChannelInterface } from "./types";


export class ChannelBehaviourPlugin implements IChannelBehaviourPlugin {



    channel?: ProviderChannelInterface;
    public channelConnect?: <R = any>(options?: R, channel?: ProviderChannelInterface) =>  Promise<void>;
    public channelCheckSession?: <P = any, S = any>(session: S, channel?: ProviderChannelInterface)=> Promise<[boolean, P]>;
    public channelOnConnect?: (options?: any, channel?: ProviderChannelInterface) => void;
    public channelVerifyPingException?: (exception: Error, channel?: ProviderChannelInterface) => boolean;

    public bind(channel: ProviderChannelInterface): void {
        this.channel = channel;
    }
    


}