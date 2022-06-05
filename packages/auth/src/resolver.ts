import { Address, BrowserSessionStruct, ConnectorType, IdentityProvider, IDENTITY_PROVIDERS, WalletConnectSessionStruct } from "@almight-sdk/connector";
import { Providers, WebLocalStorage } from "@almight-sdk/utils";
import { AuthenticationDelegate } from "./delegate";
import { AllowedQueryParams, CurrentSessionStruct, IdentityResolverInterface, UserRegistrationArgument, Web3UserRegistrationArgument } from "./types";


export class IdentityResolver implements IdentityResolverInterface {
    public provider: IdentityProvider;

    public get identifier(): string | number { return this.provider.identifier }

    public delegate: AuthenticationDelegate;


    async getItemFromStorage<T = any>(key: string): Promise<T | null> {
        if (this.delegate === undefined) return null;
        return this.delegate.storage.getItem<T>(key);
    }


    isWebVersion(version: number): boolean {
        return this.provider.webVersion === version;
    }

    getStates(data?: Record<string, string>): Record<string, string> {
        throw new Error("Method not implemented.");
    }

    async initAuth(): Promise<void> {
        throw new Error("Method not implemented.");
    }

    /**
     * This function will verify all required 
     * 
     * @param data 
     */
    async captureUri(data: Record<string, string>): Promise<void> {
        throw new Error("Method not implemented.");
    }

    generateRedirectUrl(data?: Record<string, string>): string {
        throw new Error("Method not implemented.");
    }

    async cleanup(storage: WebLocalStorage): Promise<void> {
        throw new Error("Method not implemented")
    }

    async authenticateAndRespond(data: Record<string, string>): Promise<void> {
        throw new Error("Method not implemented")
    }

    onAuthenticationRedirect(options?: any): void { }

    async getUserRegistrationArguments(): Promise<UserRegistrationArgument> {
        throw new Error("Method not implemented")
    }

}


export class Web3IdentityResolver extends IdentityResolver {

    readonly serverRequestTickKey = "hasServerRequested";


    constructor(provider: IdentityProvider) {
        super()
        this.provider = provider;
    }

    /**
     * Redirect to connector page with the requrired query params
     * 
     */
    override async initAuth(): Promise<void> {
        const providedParams = [AllowedQueryParams.Provider, AllowedQueryParams.ProjectId, AllowedQueryParams.UserIdentifier, AllowedQueryParams.RespondStrategy];
        const data: Record<string, string> = {};
        for (const paramName of providedParams) {
            if (await this.delegate.storage.hasKey(paramName)) {
                data[paramName] = await this.delegate.getState<string>(paramName);
            }
        }
        await this.delegate.freeze();
        // TODO: Init Authe implementation for different platform
    }





    override generateRedirectUrl(data?: Record<string, any>, pathname?: string): string {
        throw new Error("Method not implemented")
    }


    override async captureUri(data: Record<string, string>): Promise<void> {

        // Cleaup of mess
        await this.delegate.setStates({ "webVersion": 3 })
        // if (this.delegate !== undefined && await this.delegate.storage.isConnected()) {
        //     await this.cleanup(this.delegate.storage);
        // }
        // const requiredParams = [AllowedQueryParams.Provider, AllowedQueryParams.RespondStrategy];
        // if (requiredParams.every(async (param: AllowedQueryParams) => await this.delegate.storage.hasKey(param))) {
        //     return;
        // }
        // this.delegate.errorRedirect(`${requiredParams.join(",")} , every parameters must be provided`);
        // return;
    }

    override async cleanup(storage: WebLocalStorage): Promise<void> {
        if (await storage.hasKey("walletconnect")) {
            await storage.removeItem("walletconnect")
        }
    }

    override onAuthenticationRedirect(options?: { accounts?: Address[], chainId?: number, data: any, session?: any, connectorType?: ConnectorType, hasServerRequested?: boolean }): void {
        if (options !== undefined) {

            if (options.data !== undefined) {
                options.accounts = options.data.accounts ?? options.accounts;
                options.chainId = options.data.chainId ?? options.chainId;
            }
            options[this.serverRequestTickKey] = false //Guard method against race condition
            const data = options;

            if (options.accounts !== undefined) {
                data[AllowedQueryParams.Address] = options.accounts[0];
            }
            if (options.chainId !== undefined) {
                data[AllowedQueryParams.ChainId] = options.chainId
            }
            if (options.data.error !== undefined) {
                data[AllowedQueryParams.Error] = options.data.error;
            }
            if (options.data.error_code !== undefined) {
                data[AllowedQueryParams.ErrorCode] = options.data.error_code
            }
            this.delegate.setStates(data).then(() => {
                this.authenticateAndRespond().then(() => { });
            })

        }
    }

    override async getUserRegistrationArguments(): Promise<Web3UserRegistrationArgument> {
        const connectorType = await this.delegate.storage.getItem<string>(AllowedQueryParams.ConnectorType) as string
        const data: Web3UserRegistrationArgument = {
            [AllowedQueryParams.Address]: await this.delegate.storage.getItem<string>(AllowedQueryParams.Address) as string,
            [AllowedQueryParams.MessageSignRequired]: await this.delegate.storage.hasKey("signature"),
            [AllowedQueryParams.Provider]: await this.delegate.storage.getItem<string>(AllowedQueryParams.Provider) as string,
            sessions: {
                [connectorType]: await this.delegate.storage.getItem("session")
            }
        };
        return data
    }

    override async authenticateAndRespond(): Promise<void> {
        if (!(await this.delegate.storage.isConnected())) return;
        const account = await this.getItemFromStorage<string>(AllowedQueryParams.Address);
        const chainId = await this.getItemFromStorage<string>(AllowedQueryParams.ChainId);
        const error = await this.getItemFromStorage<string>(AllowedQueryParams.Error);
        const errorCode = await this.getItemFromStorage<string>(AllowedQueryParams.ErrorCode)
        const session  = await this.getItemFromStorage<WalletConnectSessionStruct | BrowserSessionStruct>("session")
        const connectorType = await this.getItemFromStorage<ConnectorType>(AllowedQueryParams.ConnectorType);
        const provider = await this.getItemFromStorage<string>(AllowedQueryParams.Provider);

        if (account !== null && chainId !== null && session !== null) {
            try {
                const res = await this.delegate.handleUserRegistration();
                // TODO: Exempting from updating details
                // const res = await this.delegate.handleUserRegistration();
                await this.delegate.close()
                await this.delegate.respondFrame.respondSuccess({
                    refresh: res.refresh,
                    access: res.access
                });
            } catch (e) {
                await this.delegate.close()
                await this.delegate.respondFrame.respondFailure({
                    [AllowedQueryParams.Error]: (e as Error).message,
                    [AllowedQueryParams.ErrorCode]: "10000"
                });
            }
        } else if (error !== undefined) {
            await this.delegate.close()
            await this.delegate.respondFrame.respondFailure({
                error: error,
                errorCode: errorCode !== null? errorCode: "10000"
            });
        } else {
            await this.delegate.close()
            await this.delegate.respondFrame.respondFailure({
                error: "Authentication Failed due to unknown reason",
                errorCode: errorCode !== null? errorCode: "10000"
            });
         }
        
    }



}



const IDENTITY_RESOLVERS: Record<string, IdentityResolver> = {

}

for (const [provider, Idp] of Object.entries(IDENTITY_PROVIDERS)) {
    IDENTITY_RESOLVERS[provider] = new Web3IdentityResolver(Idp)
}


export { IDENTITY_RESOLVERS }