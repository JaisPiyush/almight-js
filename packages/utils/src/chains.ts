import { ChainData, IChainset } from "./types";


export enum Chains {
    Ethereum = "ethereum",
    Binance = "binance",
    Polygon = "polygon",
    Fantom = "fantom",
    Avalanche = "avalanche",
    Kardiachain = "kardiachain"
}

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
    public chainIds: number[] = [];
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
    }),
    [Chains.Kardiachain]: new Chainset({
        name: "Kardiachain",
        identifier: Chains.Kardiachain,
        icon:"data:image/jpeg;base64,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",
        mainnetId:24,
        currency: "KAI"
    })
}
