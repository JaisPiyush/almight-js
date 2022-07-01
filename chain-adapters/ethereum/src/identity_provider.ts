import {getConfiguredWeb3IdentityProvider} from "@almight-sdk/connector";
import { Providers } from "packages/utils/lib";
import { EthereumChainAdapter } from "./adapter";
import { CoinbaseWalletProvider, KardiaChainProvider, MetamaskProvider } from "./providers";



export const MetamaskIdentityProvider = getConfiguredWeb3IdentityProvider(Providers.MetaMask, {
    adapterClass: EthereumChainAdapter,
    providerClass: MetamaskProvider
});

export const KardiachainIdentityProvider = getConfiguredWeb3IdentityProvider(Providers.KardiaChain, {
    adapterClass: EthereumChainAdapter,
    providerClass: KardiaChainProvider
});

export const CoinbaseIdentityProvider = getConfiguredWeb3IdentityProvider(Providers.Coinbase, {
    adapterClass: EthereumChainAdapter,
    providerClass: CoinbaseWalletProvider
});
