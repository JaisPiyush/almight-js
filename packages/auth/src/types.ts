import { ConnectorType, IChannelBehaviourPlugin, IProviderAdapter } from "connector";

export interface IAuthenticationDelegate { }


export interface IdentityProviderInterface {
    identityProviderName: string;
    webVersion: number;

    // chainId or unique id for web2 providers
    identifier: string | number;

    // Meta Datas such as icon, name, url , etc
    metaData: Record<string, any>;

}




// export interface IdentityResolverInterface extends IdentityProviderInterface {

//     setDelegate(delegate: IAuthenticationDelegate): void;

//     setStates(): Promise<void>;
//     initAuth(): Promise<void>;
//     captureResponse(): Promise<void>;

// }


// export interface Web3IdentityResolverInterface extends IdentityResolverInterface {
//     adapter: IProviderAdapter;
//     behaviourPluginMap: Record<ConnectorType, IChannelBehaviourPlugin>;
//     defaultBhaviourPlugin?: IChannelBehaviourPlugin;

// }