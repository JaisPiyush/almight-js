import { Address, ConnectorType, IdentityProvider, ISession } from "@almight-sdk/connector";
import { AllowedQueryParams, Web3UserRegistrationArgument } from "../types";
import { IdentityResolver } from "./resolver";
import { WebLocalStorage, WebVersion } from "@almight-sdk/utils";

export class Web3IdentityResolver extends IdentityResolver {

    readonly serverRequestTickKey = "hasServerRequested";


    constructor(provider: IdentityProvider) {
        super()
        this.provider = provider;
    }







    override generateRedirectUrl(data?: Record<string, any>, pathname?: string): string | Promise<string> {
        throw new Error("Method not implemented")
    }


    override async captureUri(data: Record<string, string>): Promise<void> {

        // Cleaup of mess
        await this.delegate.setStates({ "webVersion": WebVersion.Decentralized });
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
        const session  = await this.getItemFromStorage<ISession>("session")
        // const connectorType = await this.getItemFromStorage<ConnectorType>(AllowedQueryParams.ConnectorType);
        // const provider = await this.getItemFromStorage<string>(AllowedQueryParams.Provider);

        if (account !== null && chainId !== null && session !== null) {
            try {
                const res = await this.delegate.handleUserRegistration();
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
                [AllowedQueryParams.Error]: error,
                [AllowedQueryParams.ErrorCode]: errorCode !== null? errorCode: "10000"
            });
        } else {
            await this.delegate.close()
            await this.delegate.respondFrame.respondFailure({
                [AllowedQueryParams.Error]: "Authentication Failed due to unknown reason",
                [AllowedQueryParams.ErrorCode]: errorCode !== null? errorCode: "10000"
            });
         }
        
    }



}
