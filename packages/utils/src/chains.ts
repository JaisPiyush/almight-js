import { IMetaDataSet, Providers, WebVersion } from "./constants";
import { ChainData, IChainset } from "./types";

interface ChainsetConstructorOptions {
    name: string;
    identifier: string;
    mainnetId: number;
    chainNets?: ChainData[],
    icon: string,
    currency: string
}

export class Chainset implements IChainset {

    readonly name: string;
    readonly identifier: string;
    readonly chainIds: number[];
    readonly mainnetId: number;
    chainNets: ChainData[] = [];
    readonly mainnet: ChainData;
    readonly icon: string;
    readonly currency: string;

    constructor(options: ChainsetConstructorOptions) {
        this.name = options.name;
        this.identifier = options.identifier;
        this.mainnetId = options.mainnetId;
        this.icon = options.icon;
        this.currency = options.currency
        this.mainnet = {
            name: this.name,
            chainId: this.mainnetId,
            isTestnet: false,
            currency: this.currency
        }
        this.addChain(this.mainnet)
        if (options.chainNets !== undefined) {
            options.chainNets.forEach((chain) => {
                this.addChain(chain);
            })
        }
    }


    addChain(chain: ChainData): void {
        if(chain.currency === undefined){
            chain.currency = this.currency;
        }
        this.chainIds.push(chain.chainId);
        this.chainNets.push(chain);
    }
    getChainDataFromName(name: string): ChainData | undefined {
        if (name === this.mainnet.name) return this.mainnet;
        for (const chain of this.chainNets) {
            if (chain.name === name) return chain;
        }
    }
    isChainPartOfChainSet(chainId: number): boolean {
        for (const chain of this.chainNets) {
            if (chainId === chain.chainId) return true;
        }
        return false;
    }
    getChainDataFromChainId(chainId: number): ChainData | undefined {
        if (chainId === this.mainnet.chainId) return this.mainnet;
        for (const chain of this.chainNets) {
            if (chain.chainId === chainId) return chain;
        }
    }
    getChainIds(): number[] {
        return this.chainNets.map((chain) => chain.chainId);
    }
}



export class ChainsManager {
    readonly metaData: Record<Providers, IMetaDataSet>;

    constructor(metaData: Record<Providers, IMetaDataSet>) {
        this.metaData = metaData;
    }

    getProvidersFromChainId(chainId: number): Providers[] {
        const providers: Providers[] = [];
        for (const [provider, data] of Object.entries(this.metaData)) {
            if (data.webVersion === WebVersion.Centralized || data.chainsets.length === 0) continue;
            for (const chainsetIdentifier of data.chainsets) {
                const chainset = CHAINSET_RECORD[chainsetIdentifier]
                if (chainset.isChainPartOfChainSet(chainId)) {
                    providers.push(provider as Providers);
                }
            }
        }
        return providers
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



export enum Chains {
    Ethereum = "ethereum",
    Binance = "binance",
    Polygon = "polygon",
    Fantom = "fantom",
    Avalanche = "avalanche"
}


export const CHAINSET_RECORD: Record<string, Chainset> = {
    [Chains.Ethereum]: new Chainset({
        name: "Ethereum",
        identifier: Chains.Ethereum,
        mainnetId: 1,
        chainNets: [],
        icon: "https://app.1inch.io/assets/images/network-logos/ethereum.svg",
        currency: "ETH"
    }),
    [Chains.Binance]: new Chainset({
        name: "Binance",
        identifier: Chains.Binance,
        icon: "https://app.1inch.io/assets/images/network-logos/bsc_2.svg",
        chainNets: [],
        mainnetId: 56,
        currency: "BNB"
    }),
    [Chains.Polygon]: new Chainset({
        name: "Polygon",
        identifier: Chains.Polygon,
        mainnetId: 137,
        chainNets: [],
        icon: "https://app.1inch.io/assets/images/network-logos/polygon.svg",
        currency: "MATIC"
    }),
    [Chains.Fantom]: new Chainset({
        name: "Fantom",
        identifier: Chains.Fantom,
        icon: "https://app.1inch.io/assets/images/network-logos/fantom.svg",
        mainnetId: 250,
        currency: "FTM"
    }),
    [Chains.Avalanche]: new Chainset({
        name: "Avalanche",
        identifier: Chains.Avalanche,
        icon: "https://app.1inch.io/assets/images/network-logos/avalanche.svg",
        mainnetId: 43114,
        currency: "AVAX"
    })
}


export const EVM_CHAINSETS = [Chains.Ethereum, Chains.Binance, Chains.Avalanche, Chains.Fantom, Chains.Polygon];