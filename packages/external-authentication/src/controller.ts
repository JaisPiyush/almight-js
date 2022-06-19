import { AllowedQueryParams, AuthenticationDelegate, Web2AuthenticationDelegate } from "@almight-sdk/auth"
import { Class, WebLocalStorage, WebVersion } from "@almight-sdk/utils"
import { IDENTITY_PROVIDERS } from "@almight-sdk/connector"

export enum PageRoute {
    InitPage = "/auth/v1/init"
}

export const DELEGATE_MAP: Record<string | number, Class<AuthenticationDelegate>> = {
    [WebVersion.Centralized]: Web2AuthenticationDelegate
}

export class Controller {

    isCurrentPage(route: PageRoute): boolean {
        return window.location.pathname.includes(route);
    }

    async getProviderFromWebLocalStorage(): Promise<string> {
        const storage = new WebLocalStorage();
        await storage.connect();
        return (await storage.getItem<string>(AllowedQueryParams.Provider)) as string;
    }

    getQueryParams(): Record<string, string> {
        const params = new URLSearchParams(globalThis.location.search);
        let query: Record<string, string> = {}
        for (const [param, value] of Array.from(params)) {
            query[param] = decodeURIComponent(value)
        }
        return query;
    }

    async getCurrentAuthenticationDelegateClass(): Promise<Class<AuthenticationDelegate>> {
        const params = this.getQueryParams();
        const provider = (params[AllowedQueryParams.Provider] !== undefined) ? params[AllowedQueryParams.Provider]: await this.getProviderFromWebLocalStorage()

        if (DELEGATE_MAP[provider] !== undefined) return DELEGATE_MAP[provider];
        const idp = IDENTITY_PROVIDERS[provider];
        return DELEGATE_MAP[idp.webVersion];
    }

    async initControll(): Promise<void>{
        const delegateClass = await this.getCurrentAuthenticationDelegateClass();
        const delegate = new delegateClass({});
        if(this.isCurrentPage(PageRoute.InitPage)){   
            window.delegate = delegate;
        }else{
            window.delegate = await delegate.fromFrozenState()
        }

        await window.delegate.captureData();
        
    }

}

