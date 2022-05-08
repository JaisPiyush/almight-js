
import { IChannelBehaviourPlugin, ProviderChannelInterface } from "./types";


export class ChannelBehaviourPlugin implements IChannelBehaviourPlugin {



    channel?: ProviderChannelInterface;
    public connect?: <R = any>(options?: R, channel?: ProviderChannelInterface) =>  Promise<void>;
    public checkSession?: <P = any, S = any>(session: S, channel?: ProviderChannelInterface)=> Promise<[boolean, P]>;
    public onConnect?: (options?: any, channel?: ProviderChannelInterface) => void;
    public verifyPingException?: (exception: Error, channel?: ProviderChannelInterface) => boolean;

    public bind(channel: ProviderChannelInterface): void {
        this.channel = channel;
    }
    


}