import { Connector, ISession, IdentityProvider, ConnectorType, CurrentSessionStruct, ConnectionFilter, BaseChainAdapter } from "@almight-sdk/connector";
import { AlmightClient, authAxiosInstance, projectAxiosInstance } from "@almight-sdk/core";
import { BaseStorageInterface, Class, getMetaDataSet, isWebPlatform, Providers, WebVersion } from "@almight-sdk/utils";
import { AuthenticationFrame, Web2NativePopupAuthenticationFrame, Web3NativeAuthenticationFrame } from "./frames";
import {
    IAuthenticationApp, UserData, ErrorResponseMessageCallbackArgument, AllowedQueryParams,
    ServerSentIdentityProvider, ChannelConfigurations, AuthenticationFrameConfiguration
} from "./types";




export interface AuthenticationAppConstructorOptions {
    almightClient: AlmightClient;
    frame?: AuthenticationFrame;
    onSuccessCallback?: (data: UserData) => void;
    onFailureCallback?: (data: ErrorResponseMessageCallbackArgument) => void;
    baseAuthenticaionURL?: string;
    identityProviders: Array<IdentityProvider>;
    filters?: ConnectionFilter;
    channelArgs?: ChannelConfigurations
}

export class AuthenticationApp implements IAuthenticationApp {

    core: AlmightClient;
    frame?: AuthenticationFrame;
    storage: BaseStorageInterface;
    connector?: Connector;
    sessions: ISession[] = [];
    baseAuthenticationURL: string = "http://localhost:3080";
    identityProvidersMap: Record<string, IdentityProvider> = {};
    identityProviders: IdentityProvider[] = [];

    configs?: AuthenticationFrameConfiguration;
    readonly userKeyName = "almight_user";
    readonly userIdpsName = "almight_user_idps";
    readonly currentSessionName = "almight_connector_current_session"
    readonly AUTH_HEADER_KEY = "AUTHORIZATION"
    readonly identifierStorageName = "csid_track_id"

    onSuccessCallback: (data: UserData) => void;
    onFailureCallback: (data: ErrorResponseMessageCallbackArgument) => void;


    constructor(options: AuthenticationAppConstructorOptions) {
        this.core = options.almightClient;
        this.storage = this.core.storage;
        this.setFrame(options.frame);
        this.onSuccessCallback = options.onSuccessCallback ?? this.deadFunction;
        this.onFailureCallback = options.onFailureCallback ?? this.deadFunction;
        this.baseAuthenticationURL = options.baseAuthenticaionURL ?? this.baseAuthenticationURL;
        this.setupAuthenticationFrameConfigurations(options)
        this.setupIdentityProviders(options.identityProviders);
        this.initLoadings().then()

    }

    public set onSuccess(fn: (data: UserData) => void) {
        this.onSuccessCallback = fn;
    }

    public set onFailure(fn: (data: ErrorResponseMessageCallbackArgument) => void) {
        this.onFailureCallback = fn;
    }

    setFrame(frame?: AuthenticationFrame): void {
        if (frame !== undefined) {
            this.frame = frame;
            this.frame.app = this;
        }
    }


    getIdentityProvider(provider: string, silent: boolean = false): IdentityProvider {
        if (this.identityProvidersMap[provider] !== undefined) return this.identityProvidersMap[provider];
        if (!silent) throw new Error(`IdentityProvider associated with ${provider} is not present`)
    }


    getPassableArguments(): AuthenticationFrameConfiguration {
        if (this.configs === undefined) return;
        return {
            filters: this.configs.filters,
            channelArgs: this.configs.channelArgs
        }
    }


    getFrame(provider: string): AuthenticationFrame {
        const idp = this.getIdentityProvider(provider)
        const args = this.getPassableArguments()
        if (idp.webVersion === WebVersion.Decentralized) {
            const frame = new Web3NativeAuthenticationFrame(args);
            return frame
        }
        if (isWebPlatform()) {
            return new Web2NativePopupAuthenticationFrame(args);
        }
    }

    deadFunction = (data?: any): void => { }


    setupIdentityProviders(idps: IdentityProvider[]): void {
        this.identityProviders = idps;
        for (const idp of idps) {
            this.identityProvidersMap[idp.identifier] = idp;
        }
    }



    async initLoadings(): Promise<void> {

    }


    setupAuthenticationFrameConfigurations(options: AuthenticationAppConstructorOptions): void {
        this.configs = {}
        if (options.filters !== undefined) {
            this.configs.filters = options.filters
        }
        if (options.channelArgs !== undefined) {
            this.configs.channelArgs = options.channelArgs;
        }
    }



    async getToken(token?: string): Promise<string> {
        if (token !== undefined && token !== null) return token;
        return await this.storage.getItem<string>(this.identifierStorageName)
    }


    async isAuthenticated(): Promise<boolean> {

        try {
            const user = await this.getUserData();
            if (user.user !== undefined && user.user.user_id !== undefined) {
                await this.saveUserData(user);
                await this.setupConnector();
                return true
            }

        } catch (e) {

        }
        return false;


    }



    async verifyToken(token: string): Promise<boolean> {
        const res = await authAxiosInstance.post("/verify", { "token": token });
        return res.status === 200
    }




    async storeJWTToken(token: string): Promise<void> {
        await this.convertTokenToCookie(token);
        //TODO: Need cover aspects of react native
    }


    async getIdpsFromStore(): Promise<ServerSentIdentityProvider[]> {
        return await this.storage.getItem<ServerSentIdentityProvider[]>(this.userIdpsName);
    }

    async saveUserData(user: UserData): Promise<void> {
        await this.storage.setItem(this.userKeyName, user.user);
        await this.storage.setItem(this.userIdpsName, user.idps);
        await this.setCurrentSession(user.user.current_session);
    }



    async convertTokenToCookie(token: string): Promise<void> {
        await projectAxiosInstance.post("/cooking", {
            "type": "jwt",
            "token": token
        })
    }


    async getProjectIdentifier(): Promise<string> {
        return await this.core.getProjectIdentifier();
    }


    async getUserIdentifier(user_id?: string, token?: string): Promise<string> {

        user_id = user_id ?? (await this.getUserData()).user.user_id;
        if (user_id === undefined) throw new Error("No user is defined")

        const res = await authAxiosInstance.post<{ identifier: string }>("/user/ident", {
            "user_id": user_id
        }, {
            headers: this.getAuthenticationHeaders(token)
        }
        )
        return res.data.identifier;
    }

    getAuthenticationHeaders(token?: string): Record<string, string> {
        return (token === undefined && token !== null) ? {} : {
            [this.AUTH_HEADER_KEY]: `Bearer ${token}`
        }
    }

    async getUserData(token?: string): Promise<UserData> {
        const res = await authAxiosInstance.get<{ data: UserData }>("/me", {
            headers: this.getAuthenticationHeaders(token)
        });
        return res.data.data
    }

    async fetchAndStoreUserData(token: string): Promise<UserData> {
        await this.storeJWTToken(token);
        const userData = await this.getUserData(token);
        await this.saveUserData(userData);
        return userData;
    }




    async startAuthentication(provider: Providers, adapterClass?: Class<BaseChainAdapter>): Promise<void> {
        const frame = this.getFrame(provider)
        this.setFrame(frame);
        const projectIdentifier = await this.getProjectIdentifier();
        const data = {
            [AllowedQueryParams.ProjectId]: projectIdentifier,
            [AllowedQueryParams.Provider]: provider,

        }
        if(frame instanceof Web3NativeAuthenticationFrame){
            data["identityProviders"] = this.identityProviders;
            data["adapterClass"] = adapterClass;
        }
        if (await this.isAuthenticated()) {
            data[AllowedQueryParams.UserIdentifier] = await this.getUserIdentifier()
        }
        this.frame.initAuth(data);
    }
    /**
     * In case of web3 session data, update the current session on server
     * Fetch new User data and setup connector
     * 
     * 
     * @param data 
     */
    async setCurrentSession<S = ISession>(data: CurrentSessionStruct<S>): Promise<void> {
        await this.storage.setItem(this.currentSessionName, data);
        await this.setupConnector();
    }

    async updateCurrentSession(data: CurrentSessionStruct, token?: string): Promise<UserData> {
        const res = await authAxiosInstance.post<{ data: UserData }>("/me", { "current_session": data }, {
            headers: this.getAuthenticationHeaders(await this.getToken(token))
        })
        if (res.status === 200) {
            this.saveUserData(res.data.data);
        }
        return res.data.data;
    }


    getIconAndNameForProvider(provider: Providers | string, connectorType?: ConnectorType | string): { icon: string, name: string } | undefined {
        const META_DATA_SET = getMetaDataSet();
        const data = META_DATA_SET[provider];
        if (data === undefined) return undefined;
        let icon = data.icon;
        if (connectorType !== undefined) {
            switch (connectorType) {
                case ConnectorType.WalletConnector:
                    icon = META_DATA_SET["walletconnect"].icon;
                    break;
            }
        }
        return { icon: icon, name: data.name };
    }


    getCurrentSessionStructsFromIdp(idp: ServerSentIdentityProvider): CurrentSessionStruct[] {
        const cSessions = [];
        for (const [connectorType, sessions] of Object.entries(idp.sessions)) {
            for (const session of sessions) {
                const cSess: CurrentSessionStruct = {
                    uid: idp.uid,
                    provider: idp.provider,
                    connector_type: connectorType as ConnectorType,
                    session: session as ISession

                };
                cSessions.push(cSess);
            }
        }
        return cSessions;
    }



    async getAccountIdpsAsCurrentSessionStructs(): Promise<CurrentSessionStruct[]> {
        if (!await this.storage.hasKey(this.userIdpsName)) return [];
        let cSessions = []
        const idps: ServerSentIdentityProvider[] = await this.getIdpsFromStore();
        for (const idp of idps) {
            const cSess = this.getCurrentSessionStructsFromIdp(idp);
            cSessions = cSessions.concat(cSess);
        }
        return cSessions;
    }




    async setupConnector(connector?: Connector): Promise<void> {
        if (connector === undefined) {
            const currentSession = await this.getCurrentSession();
            if (currentSession === null) throw new Error("No connection history available, try to reconnect")
            const idp = this.getIdentityProvider(currentSession.provider);
            connector = new Connector({
                session: currentSession,
                identityProvider: idp
            });
        }
        this.connector = connector;
    }



    async getCurrentSession<S = ISession>(): Promise<CurrentSessionStruct<S>> {
        return await this.storage.getItem<CurrentSessionStruct<S>>(this.currentSessionName);
    }



}