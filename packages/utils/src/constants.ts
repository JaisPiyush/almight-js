
// Inst: Upon adding any new provider one will have to add it in
// @almight-sdk/utils/constants::META_DATA_SET
// Add them in providers and identity_providers in respective chain adapters
// buster/authentication/providers::Provider
// buster/authentication/proviers::WEB3_PROVIDERS


// buster/authentication/providers::WEB2_PROVIDERS
import { Chains, Chainset, CHAINSET_RECORD } from "./chains";

export enum Providers {
    MetaMask = "metamask",
    KardiaChain = "kardiachain",
    Coinbase = "coinbase",
    Discord = "discord",
    Google = "google",
    Facebook = "facebook",
    Github = "github",
    Twitter = "twitter"
}




export enum WebVersion {
    Centralized = 2,
    Decentralized = 3
}



export class ChainsManager {
    readonly metaData: Record<Providers, IMetaDataSet>;
    readonly chainsetRecord: Record<string, Chainset>;

    constructor(metaData: Record<Providers, IMetaDataSet>, chainsetRecord: Record<string, Chainset>) {
        this.metaData = metaData;
        this.chainsetRecord = chainsetRecord;
    }

    getChainsetFromIdentifier(identifier: string): Chainset {
        return this.chainsetRecord[identifier]
    }

    getProvidersFromChainId(chainId: number): Providers[] {

        const providers: Providers[] = [];
        for (const [provider, data] of Object.entries(this.metaData)) {
            if (data.webVersion === WebVersion.Centralized || data.chainsets.length === 0) continue;
            for (const chainsetIdentifier of data.chainsets) {
                const chainset = this.chainsetRecord[chainsetIdentifier]
                if (chainset.isChainPartOfChainSet(chainId)) {
                    providers.push(provider as Providers);
                }
            }
        }
        return providers
    }


    getChainIdfromIdentifier(identifier: string, network?: string): number | null {
        const chainset = this.getChainsetFromIdentifier(identifier);
        if (chainset === undefined) return null;
        if (network !== undefined) {
            for (const chainNet of chainset.chainNets) {
                if (chainNet.name === network) return chainNet.chainId;
            }
        }
        return chainset.mainnetId

    }


    getChainsetFromChainId(chainId: number): Chainset | null {
        for (const chainset of Object.values(this.chainsetRecord)) {
            if (chainset.isChainPartOfChainSet(chainId)) {
                return chainset
            }
        }
        return null;
    }


    getProvidersFromChainIds(chainIds: number[]): Providers[] {
        const providers: Providers[] = []
        for (const chainId of chainIds) {
            const _provs = this.getProvidersFromChainId(chainId);
            _provs.forEach((provider) => {
                if (providers.includes(provider) === false) {
                    providers.push(provider);
                }
            })
        }
        return providers;

    }


    getProvidersFromIdentifier(identifier: string): Providers[] {
        const providers: Providers[] = [];
        for (const [provider, data] of Object.entries(this.metaData)) {
            if (data.webVersion === WebVersion.Centralized || data.chainsets.length === 0) continue;
            for (const chainsetIdentifier of data.chainsets) {
                if (chainsetIdentifier === identifier) {
                    providers.push(provider as Providers);
                }
            }
        }
        return providers
    }

    getProvidersFromidentifiers(identifiers: string[]): Providers[] {
        const providers: Providers[] = []
        for (const identifier of identifiers) {
            const _provs = this.getProvidersFromIdentifier(identifier);
            _provs.forEach((provider) => {
                if (providers.includes(provider) === false) {
                    providers.push(provider);
                }
            })
        }
        return providers;

    }
}







export const EVM_CHAINSETS = [Chains.Ethereum, Chains.Kardiachain, Chains.Binance, Chains.Avalanche, Chains.Fantom, Chains.Polygon];

export interface IMetaDataSet {
    name: string;
    identifier: string;
    icon: string;
    url?: string;
    webVersion: WebVersion,
    deeplinkUri?: string,
    supportDeepLink: boolean,
    chainsets: Chains[]
}

export const META_DATA_SET: Record<string, IMetaDataSet> = {
    [Providers.MetaMask]: {
        name: "MetaMask",
        identifier: Providers.MetaMask,
        icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/MetaMask_Fox.svg/1024px-MetaMask_Fox.svg.png",
        url: "https://metamask.io/",
        webVersion: WebVersion.Decentralized,
        deeplinkUri: "https://metamask.app.link/",
        supportDeepLink: true,
        chainsets: EVM_CHAINSETS

    },

    [Providers.KardiaChain]: {
        name: "KardiaChain",
        identifier: Providers.KardiaChain,
        icon: "data:image/jpeg;base64,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",
        url: "http://www.kardiachain.io/",
        webVersion: WebVersion.Decentralized,
        supportDeepLink: false,
        chainsets: [Chains.Kardiachain]
    },

    "walletconnect": {
        name: "WalletConnect",
        url: "https://walletconnect.com/",
        icon: "https://seeklogo.com/images/W/walletconnect-logo-EE83B50C97-seeklogo.com.png",
        identifier: "walletconnect",
        webVersion: WebVersion.Decentralized,
        supportDeepLink: true,
        chainsets: []
    },
    [Providers.Coinbase]: {
        icon: "https://pngset.com/images/coinbase-wallet-crypto-dapp-facebook-messenger-round-icon-moon-outer-space-night-astronomy-transparent-png-2620840.png",
        name: "Coinbase Wallet",
        url: "https://www.coinbase.com/wallet",
        identifier: Providers.Coinbase,
        webVersion: WebVersion.Decentralized,
        supportDeepLink: true,
        deeplinkUri: "https://go.cb-w.com/",
        chainsets: EVM_CHAINSETS
    },
    [Providers.Discord]: {
        name: "Discord",
        identifier: Providers.Discord,
        icon: "https://www.svgrepo.com/show/331368/discord-v2.svg",
        url: "https://discord.com/",
        webVersion: WebVersion.Centralized,
        supportDeepLink: false,
        chainsets: []
    },
    [Providers.Google]: {
        icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Google_%22G%22_Logo.svg/2048px-Google_%22G%22_Logo.svg.png",
        name: "Google",
        identifier: Providers.Google,
        url: "https://google.com/",
        webVersion: WebVersion.Centralized,
        supportDeepLink: false,
        chainsets: []
    },
    [Providers.Facebook]: {
        icon: "https://1000logos.net/wp-content/uploads/2021/04/Facebook-logo.png",
        name: "Facebook",
        identifier: Providers.Facebook,
        url: "https://www.facebook.com/",
        webVersion: WebVersion.Centralized,
        supportDeepLink: false,
        chainsets: []
    },
    [Providers.Github]: {
        icon: "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png",
        name: "Github",
        identifier: Providers.Github,
        url: "https://github.com/",
        webVersion: WebVersion.Centralized,
        supportDeepLink: false,
        chainsets: []
    },
    [Providers.Twitter]: {
        icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Twitter-logo.svg/2491px-Twitter-logo.svg.png",
        name: "Twitter",
        identifier: Providers.Twitter,
        url: "https://twitter.com/home",
        webVersion: WebVersion.Centralized,
        supportDeepLink: false,
        chainsets: []
    }
}



export const DefaultChainManager = new ChainsManager(META_DATA_SET, CHAINSET_RECORD);