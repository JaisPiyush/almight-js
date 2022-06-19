import { AllowedQueryParams, AuthenticationDelegate, Web2AuthenticationDelegate } from "@almight-sdk/auth"
import { Class, WebVersion } from "@almight-sdk/utils"
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

    getQueryParams(): Record<string, string> {
        const params = new URLSearchParams(globalThis.location.search);
        let query: Record<string, string> = {}
        for (const [param, value] of Array.from(params)) {
            query[param] = decodeURIComponent(value)
        }
        return query;
    }

    getCurrentAuthenticationDelegateClass(): Class<AuthenticationDelegate> {
        const params = this.getQueryParams();
        if (params[AllowedQueryParams.Provider] === undefined) throw new Error("Provider is not defined");
        const provider = params[AllowedQueryParams.Provider];
        if (DELEGATE_MAP[provider] !== undefined) return DELEGATE_MAP[provider];
        const idp = IDENTITY_PROVIDERS[provider];
        return DELEGATE_MAP[idp.webVersion];
    }

    async initControll(): Promise<void>{
        const delegateClass = this.getCurrentAuthenticationDelegateClass();
        if(this.isCurrentPage(PageRoute.InitPage)){
            const delegate = new delegateClass({});
            window.delegate = delegate;
        }

        await window.delegate.captureData();
        
    }

}

