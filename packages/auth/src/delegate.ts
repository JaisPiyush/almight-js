import { Connector, IdentityProvider } from "@almight-sdk/connector";
import { authAxiosInstance, projectAxiosInstance } from "@almight-sdk/core";
import { BaseStorageInterface, Class, Providers, WebLocalStorage, WebVersion } from "@almight-sdk/utils";
import { InvalidProjectIdError, StorageIsNotConnected } from "./exceptions";
import { BaseOriginFrameCommunicator, WebOriginCommunicator } from "./frame_communicator";
import { IdentityResolver, Web2IdentityResolver, Web3IdentityResolver } from "./resolver";
import {
    AllowedQueryParams, AuthenticationRespondStrategy, IAuthenticationDelegate, ResponseMessageCallbackArgument,
    SuccessResponseMessageCallbackArgument, UserRegistrationArgument, UserRegistrationResult
} from "./types";


export interface AuthenticationDelegateInitArgs {
    [AllowedQueryParams.Provider]?: string;
    [AllowedQueryParams.RespondStrategy]?: AuthenticationRespondStrategy;
    // Replacement code for JWT of user similar to ProjectIdentifier
    // It can only be generated by JWT to register/update new provider
    [AllowedQueryParams.UserIdentifier]?: string;
    // In-case of re-authentication
    // Address along with UserIdentifier is required for re-authentication
    // While every unique_id like email_id, username, publicKey will be called as address
    [AllowedQueryParams.Address]?: string;
}


export interface AuthenticationDelegateOptions {
    storage?: BaseStorageInterface,
    respondFrame?: BaseOriginFrameCommunicator,
    respondStrategy?: AuthenticationRespondStrategy,
    identityProviders?: IdentityProvider[];
    identityResolvers?: IdentityResolver[];

}

export class AuthenticationDelegate implements IAuthenticationDelegate {



    respondStrategy: AuthenticationRespondStrategy;
    identityResolver?: IdentityResolver;
    respondFrame: BaseOriginFrameCommunicator;

    identityResolversMap: Record<string, IdentityResolver> = {};


    protected _state: Record<string, string> = {};


    readonly frozenStateKey = "frozen_auth_delegate"

    // States that are by default excluded from verification of state
    // They can be stored in state but won't be verified for a match
    // Most of them are generated params, that are generated by the process
    readonly verificationExcludedStates: string[] = [AllowedQueryParams.Code,
    AllowedQueryParams.Error,
    AllowedQueryParams.ErrorCode,
    ];

    // Query Parameters of url that can appear in a response url types
    // Respose urls are final stage urls from which results will be deduced
    // And then responded back to the origin
    // readonly responseQueryParams: string[] = [];
    readonly nonStorableQueryParams = []

    public static respondStrategyMap: Record<string, BaseOriginFrameCommunicator> = {
        [AuthenticationRespondStrategy.Web]: new WebOriginCommunicator()
    }

    readonly identityResolversClassMap: Record<string | number, Class<IdentityResolver>> = {
        [WebVersion.Decentralized]: Web3IdentityResolver,
        [WebVersion.Centralized]: Web2IdentityResolver
    }

    connector?: Connector;

    public storage: BaseStorageInterface;

    constructor(options?: AuthenticationDelegateOptions) {
        if (options !== undefined) {
            this.storage = options.storage ?? new WebLocalStorage();
            this.respondFrame = options.respondFrame;

            this.respondStrategy = options.respondStrategy;
            if (options.identityProviders !== undefined) {
                this.setupIdentityResolversFromIdentityProviders(options.identityProviders);
            }
            if (options.identityResolvers !== undefined) {
                for (const idr of options.identityResolvers) {
                    this.identityResolversMap[idr.provider.identifier] = idr;
                }
            }


        }
        const call = async () => {
            // (this.storage as any).prefix = "authentication"
            await this.storage.connect();
            // await this.captureUriData();
        }
        call();
    }


    getIdentityResolverClassForidentityProvider(idp: IdentityProvider): Class<IdentityResolver> {
        if(this.identityResolversClassMap[idp.identifier] !== undefined) return this.identityResolversClassMap[idp.identifier];
        if(this.identityResolversClassMap[idp.webVersion] !== undefined) return this.identityResolversClassMap[idp.webVersion];
        throw new Error(`No Identity Resolver found for the provider ${idp.identifier}`)
    }


    setupIdentityResolversFromIdentityProviders(idps: IdentityProvider[]): void {
        for (const idp of idps) {
            const idrClass = this.getIdentityResolverClassForidentityProvider(idp)
            this.identityResolversMap[idp.identifier] = new idrClass(idp);
        }
    }


    async respondSuccess(data: SuccessResponseMessageCallbackArgument): Promise<void> {
        if (this.respondFrame !== undefined) {
            await this.respondFrame.respondSuccess(data);
        }
        await this.close();
    }

    getIdentityResolver(provider: string): IdentityResolver {
        if (this.identityResolversMap[provider] === undefined) throw new Error("No resolver associated with provider is found");
        return this.identityResolversMap[provider];
    }


    async respondFailure(data: Required<Pick<ResponseMessageCallbackArgument, AllowedQueryParams.Error | AllowedQueryParams.ErrorCode>>): Promise<void> {
        if (this.respondFrame !== undefined) {
            await this.respondFrame.respondFailure(data);
        }
        await this.close();
    }


    async clean(): Promise<void> {
        if (await this.storage.isConnected()) {
            for (const query of Object.values(AllowedQueryParams)) {
                await this.storage.removeItem(query);
            }
            const removableProps = ["hasServerRequested",this.frozenStateKey, "webVersion", "data", "adapterClass" , "accounts","session"]
            for(const prop of removableProps ){
                await this.storage.removeItem(prop)
            }
        }
    }

    async close(): Promise<void> {
        await this.clean();
        if (await this.storage.hasKey("walletconnect")) {
            await this.storage.removeItem("walletconnect");
        }
        if (this.respondFrame !== undefined) {
            await this.respondFrame.close()
        }
    }


    public getTokenHeaders(tokens: { projectIdentifier?: string, userIdentifier?: string }): Record<string, string> {
        const headers = {};
        if (tokens.projectIdentifier !== undefined) {
            headers["X-PROJECT-IDENT"] = tokens.projectIdentifier
        }
        if (tokens.userIdentifier !== undefined) {
            headers["X-USER-IDENT"] = tokens.userIdentifier
        }
        return headers

    }


    redirectTo(uri: string): void {
        // globalThis.location.replace(uri);
        throw new Error("Method not implemented")
    }

    /**
     * Initialisation of Authentication Delegate with IdentityResolver and others
     * This method will mount required properties such as @property identityResolver
     * or @property respondStrategy. Along with this, the method will also create
     * a in-memory state of all the args in order to revive the exact class on page redirect
     * 
     * The state will be directly saved into the storage as frozen object, in order to change 
     * any of these state values one will need to create the new instance
     * 
     * @param args 
     */
    init(args: AuthenticationDelegateInitArgs): void {
        for (const [key, value] of Object.entries(args)) {

            switch (key) {
                case AllowedQueryParams.Provider:
                    if (this.identityResolver === undefined) {
                        this.identityResolver = this.identityResolversMap[value];
                    }

                    if (this.identityResolver !== undefined) this.identityResolver.delegate = this;
                    break;
                case AllowedQueryParams.RespondStrategy:
                    if (this.respondStrategy === undefined) {
                        this.respondStrategy = value;
                    }
                    if (this.respondFrame === undefined) {
                        this.respondFrame = (this.constructor as any).respondStrategyMap[this.respondStrategy as string];
                    }

                    break;
                case AllowedQueryParams.TargetOrigin:
                    if (this.respondFrame !== undefined && this.respondFrame instanceof WebOriginCommunicator) {
                        this.respondFrame.targetOrigin = value;
                    }
                    break;
                default:
                    this.storage.setItem(key, value);
                    break;



            }
            this._state[key] = value;
            this.setStates(this._state);
            this.freeze();
        }

    }

    setIdentityResolver(idr: IdentityResolver): void {
        this.identityResolver = idr;
        this.identityResolver.delegate = this;
    }



    async registerUser<T = UserRegistrationArgument>(data: T, tokens: { project_identifier: string, token?: string }): Promise<UserRegistrationResult> {
        const headers: Record<string, string> = this.getTokenHeaders({
            projectIdentifier: tokens.project_identifier,
            userIdentifier: tokens.token
        })
        const res = await authAxiosInstance.post<UserRegistrationResult>("/token", data, { headers: headers });
        return res.data;
    }



    async handleUserRegistration(): Promise<UserRegistrationResult> {

        if (!(await this.storage.hasKey(AllowedQueryParams.ProjectId))) throw new Error("Project Identifier is not provided");
        const data = await this.identityResolver?.getUserRegistrationArguments();
        const tokens: { project_identifier: string, token?: string } = {
            [AllowedQueryParams.ProjectId]: await this.storage.getItem<string>(AllowedQueryParams.ProjectId) as string,
        }
        const userIdentifier = await this.storage.getItem<string>(AllowedQueryParams.UserIdentifier);
        if (userIdentifier !== null) {
            tokens[AllowedQueryParams.UserIdentifier] = userIdentifier;
        }
        // this.clean();
        return await this.registerUser<typeof data>(data, tokens);

    }


    async verifyProject(projectIdentifier: string): Promise<boolean> {
        const url = encodeURI(`/project/ident`);
        const res = await projectAxiosInstance.get<{ is_verified: boolean }>(url, {
            headers: {
                "X-PROJECT-IDENT": projectIdentifier
            }
        });
        return res.data.is_verified === true;
    }

    async setStates(data: Record<string, any>): Promise<void> {
        if (await this.storage.isConnected()) {
            for (const [key, value] of Object.entries(data)) {
                if (!this.nonStorableQueryParams.includes(key as AllowedQueryParams)) {
                    await this.storage.setItem(key, value);
                }
            }
        }
    }




    async verifyStates(states: Record<string, string>): Promise<boolean> {
        if (await this.storage.isConnected()) {
            for (const [key, value] of Object.entries(states)) {
                if ((!this.verificationExcludedStates.includes(key)) && (!(await this.storage.hasKey(key)) || JSON.stringify((await this.storage.getItem(key))) !== JSON.stringify(value))) {
                    return false
                }
            }
            return true;
        }
        return false;
    }


    public errorRedirect(error: string, errorCode?: number): void {

        // this.redirectTo(encodeURI(`/?${AllowedQueryParams.Error}=${error}&${AllowedQueryParams.ErrorCode}=${errorCode}`))
        throw new Error("Method to be implemented")
    }

    /**
     * Get configuration data from query param or stored data
     */
    async getConfigurationData(): Promise<Record<string, string>> {

        throw new Error("Method not implemneted")
    }


    async captureData(): Promise<void> {
        let query = await this.getConfigurationData();

        if (await this.storage.hasKey("walletconnect")) {
            await this.storage.removeItem("walletconnect");
        }

        if (query[AllowedQueryParams.ProjectId] !== undefined) {
            // Verify the project through the project id
            try {
                const res = await this.verifyProject(query[AllowedQueryParams.ProjectId]);
                if (!res) {
                    throw new InvalidProjectIdError(query[AllowedQueryParams.ProjectId]);
                }
                // Save the project id in the storage for future use
                this.storage.setItem(AllowedQueryParams.ProjectId, query[AllowedQueryParams.ProjectId]);
            } catch (_) {
                let _e = new InvalidProjectIdError(query[AllowedQueryParams.ProjectId]);
                this.errorRedirect(_e.message, 100000);

            }
        }
        this.init(query);
        // Identity Resolver is defined then process will depend upon resolver
        if (this.identityResolver !== undefined) {
            this.identityResolver.delegate = this;
            return await this.identityResolver.captureUri(query);
        }
    }


    async freeze(): Promise<void> {
        await this.setStates({ [this.frozenStateKey]: this._state });
    }


    async getState<T>(key: string): Promise<T> {
        if (!await this.storage.isConnected()) throw new StorageIsNotConnected();
        return await this.storage.getItem<T>(key) as T;
    }


    public async fromFrozenState(): Promise<AuthenticationDelegate> {
        const states = await this.getState<AuthenticationDelegateInitArgs>(this.frozenStateKey);
        this.init(states);
        return this;
    }


}




export class Web3AuthenticationDelegate extends AuthenticationDelegate {



    override async getConfigurationData(): Promise<Record<string, string>> {
        const data = {};
        for (const query of Object.values(AllowedQueryParams)) {
            const _value = await this.storage.getItem<string>(query)
            if (_value !== null && _value !== undefined) {
                data[query] = _value
            }
        }
        return data
    }
}



export class Web2AuthenticationDelegate extends AuthenticationDelegate {


    /**
     * URL location https://example.com/page?q1=v1&q2=v2
     * q1,q2 are query params and the function is responsible to return them as
     * {q1: v1, q2: v2}
     * 
     * @returns Record of query params
     */
    override async getConfigurationData(): Promise<Record<string, string>> {
        const params = new URLSearchParams(globalThis.location.search);
        let query: Record<string, string> = {}
        for (const [param, value] of params) {
            query[param] = decodeURIComponent(value)
        }
        return query;
    }

    async getOAuthUrl(provider: Providers | string, projectIdentifier: string): Promise<{ url: string, verifiers: Record<string, string> }> {

        const idr = this.getIdentityResolver(provider);
        if (idr.provider.webVersion !== WebVersion.Centralized) {
            throw new Error(`Provider ${idr.provider.identityProviderName} not supported for current authentication strategy`)
        }

        if (projectIdentifier.length === 0) throw new Error("Invalid project identifier provided");



        const res = await authAxiosInstance.get<{ url: string, verifiers: Record<string, string> }>(`/provider/url/${provider}`, {
            headers: this.getTokenHeaders({ projectIdentifier: projectIdentifier })
        });
        return res.data;

    }



    override redirectTo(uri: string): void {
        globalThis.location.replace(uri);
    }
}