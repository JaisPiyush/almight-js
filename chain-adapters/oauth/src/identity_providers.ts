import {getConfiguredWeb2IdentityProvider} from "@almight-sdk/connector"
import { Providers, META_DATA_SET } from "@almight-sdk/utils"


export const DiscordIdentityProvider = getConfiguredWeb2IdentityProvider(Providers.Discord, META_DATA_SET);
export const GoogleIdenttityProvier = getConfiguredWeb2IdentityProvider(Providers.Google, META_DATA_SET);
export const FacebookIdentityProvider = getConfiguredWeb2IdentityProvider(Providers.Facebook, META_DATA_SET);
export const GithubIdentityProvider = getConfiguredWeb2IdentityProvider(Providers.Github, META_DATA_SET);
export const TwitterIdentityProvider = getConfiguredWeb2IdentityProvider(Providers.Twitter, META_DATA_SET);

export const OAuthProviders = [
    DiscordIdentityProvider,
    GoogleIdenttityProvier,
    FacebookIdentityProvider,
    GithubIdentityProvider,
    TwitterIdentityProvider
]