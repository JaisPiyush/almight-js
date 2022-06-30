import { Class,  getMetaDataSet,  Providers, WebVersion } from "@almight-sdk/utils";
import { BaseChainAdapter } from "./adapter";

import { EthereumChainAdapter, } from "./adapters";
import { BaseProviderChannel, BrowserProviderChannel, WalletConnectChannel } from "./channel";
import { BaseProvider, CoinbaseWalletProvider, KardiaChainProvider, MetamaskProvider } from "./providers";
import { ConnectionFilter, ConnectorType, IdentityProviderInterface, IProvider, IProviderAdapter, ProviderChannelInterface, ProviderFilter } from "./types";

interface IdentityProviderConstructor { 
    name: string, 
    identifier: string
    webVersion: number, 
    filter?: ConnectionFilter
    metaData?: Record<string, any>
    adapterClass: Class<BaseChainAdapter>,
    channels: Class<BaseProviderChannel>[],
    providerClass?: Class<BaseProvider>
   
}

export class IdentityProvider implements IdentityProviderInterface {
    identityProviderName: string;
    webVersion: number;
    identifier: string | number;
    metaData: Record<string, any>;
    filter?: ConnectionFilter;
    adapterClass: Class<BaseChainAdapter>;
    channels: Class<BaseProviderChannel>[];
    providerClass: Class<BaseProvider>;

    constructor(data: IdentityProviderConstructor) {
        this.identityProviderName = data.name;
        this.identifier = data.identifier;
        this.webVersion = data.webVersion;
        this.filter = data.filter;
        this.metaData = data.metaData;
        this.adapterClass = data.adapterClass;
        this.channels = data.channels;
        this.providerClass = data.providerClass;
    }
    
    getProviderClass(): Class<IProvider<ProviderChannelInterface>> {
        return this.providerClass;
    }

    getAdapterClass(): Class<IProviderAdapter> {
        return this.adapterClass;
    }
    getChannels(): Class<BaseProviderChannel>[] {
        return this.channels;
    }

}


function getConfiguredWeb3IdentityProvider(provider: Providers,data: {adapterClass: Class<BaseChainAdapter>,     
    providerClass: Class<BaseProvider>,filter?: ConnectionFilter,
    channels?: Class<BaseProviderChannel>[], identifier?: string, allowedConnectorTypes?: ConnectorType[]}): IdentityProvider {
    const META_DATA_SET = getMetaDataSet()
    return new IdentityProvider({
        name: META_DATA_SET[provider].name,
        webVersion:WebVersion.Decentralized,
        identifier: data.identifier ?? provider,
        filter: data.filter,
        providerClass: data.providerClass,
        metaData: META_DATA_SET[provider],
        adapterClass: data.adapterClass,
        channels: data.channels ?? [BrowserProviderChannel, WalletConnectChannel]
    });
}


export class CentralizedChainAdapter extends BaseChainAdapter{}


function getConfiguredWeb2IdentityProvider(provider: Providers): IdentityProvider {
    const META_DATA_SET = getMetaDataSet()
    return new IdentityProvider({
        name: META_DATA_SET[provider].name,
        filter: {
            allowedConnectorTypes: [ConnectorType.OAuth]
        },
        webVersion: WebVersion.Centralized,
        identifier: META_DATA_SET[provider].identifier,
        metaData: META_DATA_SET[provider],
        adapterClass: CentralizedChainAdapter,
        channels: []
    })
}



const IGNORED_PROVIDER = ["walletconnect"]

const IDENTITY_PROVIDERS: Record<string, IdentityProvider> = {
    [Providers.MetaMask]: getConfiguredWeb3IdentityProvider(Providers.MetaMask, {
        adapterClass: EthereumChainAdapter,
        providerClass: MetamaskProvider
    }),
    [Providers.KardiaChain]: getConfiguredWeb3IdentityProvider(Providers.KardiaChain, {
        adapterClass: EthereumChainAdapter,
        providerClass: KardiaChainProvider
    }),
    [Providers.Coinbase]: getConfiguredWeb3IdentityProvider(Providers.Coinbase, {
        adapterClass:EthereumChainAdapter,
        providerClass: CoinbaseWalletProvider
    }),
}
const META_DATA_SET = getMetaDataSet()
for(const [provider, metaData] of Object.entries(META_DATA_SET)){
    if(metaData.webVersion === WebVersion.Centralized){
        IDENTITY_PROVIDERS[provider] = getConfiguredWeb2IdentityProvider(provider as Providers);
    }
}

export {IDENTITY_PROVIDERS}