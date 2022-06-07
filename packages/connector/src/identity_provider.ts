import { Class, META_DATA_SET, Providers } from "@almight-sdk/utils";
import { BaseChainAdapter } from "./adapter";
import { KardiaChainAdapter } from "./adapters";
import { MetaMaskAdapter } from "./adapters";
import { BaseProviderChannel, BrowserProviderChannel, WalletConnectChannel } from "./channel";
import { BaseProtocolDefination } from "./protocol_definition";
import { ConnectorType, IdentityProviderInterface, IProtocolDefinition, IProviderAdapter, ProviderChannelInterface } from "./types";

interface IdentityProviderConstructor { 
    name: string, 
    identifier: string
    webVersion: number, 
    allowedConnectorTypes?: ConnectorType[], 
    metaData?: Record<string, any>
    adapterClass: Class<BaseChainAdapter>,
    channels: Class<BaseProviderChannel>[],
    protocolDefinition?: Class<BaseProtocolDefination>;
}

export class IdentityProvider implements IdentityProviderInterface {
    identityProviderName: string;
    webVersion: number;
    allowedConnectorTypes: ConnectorType[];
    identifier: string | number;
    metaData: Record<string, any>;
    adapterClass: Class<BaseChainAdapter>;
    channels: Class<BaseProviderChannel>[];
    protocolDefinition?: Class<BaseProtocolDefination>;

    constructor({ allowedConnectorTypes = [], ...data }: IdentityProviderConstructor) {
        this.identityProviderName = data.name;
        this.identifier = data.identifier;
        this.webVersion = data.webVersion;
        this.allowedConnectorTypes = allowedConnectorTypes;
        this.metaData = data.metaData;
        this.adapterClass = data.adapterClass;
        this.channels = data.channels;
        this.protocolDefinition = data.protocolDefinition;
    }
    getProtocolDefination(): Class<IProtocolDefinition> {
        return this.protocolDefinition;
    }

    getAdapterClass(): Class<IProviderAdapter> {
        return this.adapterClass;
    }
    getChannels(): Class<BaseProviderChannel>[] {
        return this.channels;
    }

}



const IDENTITY_PROVIDERS: Record<string, IdentityProvider> = {
    [Providers.MetaMask]: new IdentityProvider({
        name: META_DATA_SET[Providers.MetaMask].name,
        webVersion: 3,
        identifier: Providers.MetaMask,
        metaData: {
            icon: META_DATA_SET[Providers.MetaMask].icon

        },
        adapterClass: MetaMaskAdapter,
        channels: [BrowserProviderChannel, WalletConnectChannel]
    }),
    [Providers.KardiaChain]: new IdentityProvider({
        name: META_DATA_SET[Providers.KardiaChain].name,
        webVersion: 3,
        identifier: Providers.KardiaChain,
        metaData: {
            icon:META_DATA_SET[Providers.KardiaChain].icon
        },
        adapterClass: KardiaChainAdapter,
        channels: [BrowserProviderChannel, WalletConnectChannel]
    })
}

export {IDENTITY_PROVIDERS}