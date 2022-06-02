import { Address, ConnectorType, IdentityProvider } from "@almight-sdk/connector";
import { WebLocalStorage } from "@almight-sdk/utils";
import { AuthenticationDelegate } from "./delegate";
import { AllowedQueryParams, IdentityResolverInterface, UserRegistrationArgument, Web3UserRegistrationArgument } from "./types";


export class IdentityResolver implements IdentityResolverInterface {
    public provider: IdentityProvider;

    public get identifier(): string | number { return this.provider.identifier }

    public delegate: AuthenticationDelegate;


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
        // const url = this.generateRedirectUrl(data);
        // this.delegate.redirectTo(url);
    }





    override generateRedirectUrl(data?: Record<string, any>, pathname?: string): string {
        // let url = pathname ?? "/auth/v1/connector_page";
        // if (data !== undefined) {
        //     url += "?"
        //     for (const [key, value] of Object.entries(data)) {
        //         if (value !== undefined) {
        //             url += `${key}=${value}&`
        //         }
        //     }

        // }
        // return encodeURI(url);
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
            const data = {
                [AllowedQueryParams.Address]: options.accounts, [AllowedQueryParams.ChainId]: options.chainId,
                [AllowedQueryParams.Error]: options.data[AllowedQueryParams.Error],
                [AllowedQueryParams.ErrorCode]: options.data[AllowedQueryParams.ErrorCode],

            }
            this.delegate.setStates(options).then(() => {
                // const url = this.generateRedirectUrl(data, "/");
                // this.delegate.redirectTo(url);
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

    override async authenticateAndRespond(data: Record<string, string>): Promise<void> {
        // if (data[AllowedQueryParams.Address] !== undefined && data[AllowedQueryParams.ChainId] !== undefined) {
        //     /// Authenticate the user using user handle registration
        //     /// respond with data
        //     try {
        //         if (await this.delegate.storage.hasKey(this.serverRequestTickKey) && !(await this.delegate.storage.getItem<boolean>(this.serverRequestTickKey))) {
        //             const res = await this.delegate.handleUserRegistration();
        //             await this.delegate.storage.setItem(this.serverRequestTickKey, true);
        //             await this.delegate.respondFrame.respondSuccess({
        //                 "access": res.access,
        //                 "refresh": res.refresh
        //             });
        //         }

        //     } catch (e) {
        //         await this.delegate.respondFrame.respondFailure({
        //             [AllowedQueryParams.Error]: (e as Error).message,
        //             [AllowedQueryParams.ErrorCode]: "10000"
        //         });

        //     }
        // } else if (data[AllowedQueryParams.Error] !== undefined) {
        //     await this.delegate.respondFrame.respondFailure(data);

        // }
        // await this.delegate.close()
    }



}



const IDENTITY_RESOLVERS: Record<string, IdentityResolver> = {}


export { IDENTITY_RESOLVERS }