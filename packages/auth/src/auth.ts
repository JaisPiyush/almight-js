import { Connector, ISession, IdentityProvider, ConnectorType, CurrentSessionStruct, ConnectionFilter, BaseChainAdapter, SessionDetailedData, IChainAdapterOptions } from "@almight-sdk/connector";
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
    channelArgs?: ChannelConfigurations;
    adapters?: Class<BaseChainAdapter, IChainAdapterOptions>[]
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
    adapterClassMap: Record<string, Class<BaseChainAdapter, IChainAdapterOptions>> = {}

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
        if (options.adapters !== undefined) {
            this.setupAdapterClassMap(options.adapters)
        }
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

    setupAdapterClassMap(adapterClasses: Class<BaseChainAdapter>[]): void {
        for (const adapterClass of adapterClasses) {
            this.adapterClassMap[(adapterClass as any).adapterIdentifier] = adapterClass;
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
            const adapterClass = idp.getAdapterClass() as Class<BaseChainAdapter>
            if (adapterClass !== undefined) {
                this.setupAdapterClassMap([adapterClass])
            }
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
                //TODO: Add function in backend to verify whether any idp with given session exists or not
                // And then an OAuth Connector will be created for covering such the process
                await this.setupConnector();
                return await this.checkConnection();
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
        if (frame instanceof Web3NativeAuthenticationFrame) {
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

    async updateSessionOnServer(data: CurrentSessionStruct, token?: string): Promise<void> {
        const res = await authAxiosInstance.put(`/idps?uid=${data.uid}&provider=${data.provider}`, {
            "sessions": {
                [data.connector_type]: data.session
            }
        }, {
            headers: this.getAuthenticationHeaders(await this.getToken(token))
        });
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

    async logout(token?: string): Promise<void> {
        const res = await projectAxiosInstance.post("/logout", {}, {
            headers: this.getAuthenticationHeaders(await this.getToken(token))
        })
        await this.cleanUserData();
    }

    async cleanUserData(): Promise<void> {
        await this.storage.clear()
    }


    getIconAndNameForProvider(provider: Providers | string, connectorType?: ConnectorType | string): { icon: string, name: string } | undefined {
        const idp = this.getIdentityProvider(provider);
        if (idp === undefined) return undefined;
        return {
            icon: idp.metaData.icon as string,
            name: idp.identityProviderName,

        }
    }


    // async isCurrentSession(cSession: CurrentSessionStruct): boolean {
    //     // TODO: neet to implement this
    // }


    getCurrentSessionStructsFromIdp(idp: ServerSentIdentityProvider): CurrentSessionStruct[] {
        const cSessions = [];
        for (const [connectorType, sessions] of Object.entries(idp.sessions)) {
            for (const session of sessions) {
                const cSess: CurrentSessionStruct = {
                    uid: idp.uid,
                    provider: idp.provider,
                    connector_type: connectorType as ConnectorType,
                    session: session as SessionDetailedData<ISession>

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



    protected _constructConnectorFromCurrentSession(currentSession: CurrentSessionStruct<ISession>): Connector {
        const idp = this.getIdentityProvider(currentSession.provider);
        if (idp === undefined) throw new Error(`IdentityProvider ${currentSession.provider} is not present`)
        if (idp.webVersion === WebVersion.Centralized) return;
        const connector = new Connector({
            session: currentSession,
            identityProvider: idp
        });
        return connector;

    }



    async setupConnector(connector?: Connector, throw_no_conn: boolean = true): Promise<void> {
        const currentSession = (await this.getCurrentSession()) ?? null;
        if (connector === undefined) {
            if (currentSession === null) {
                if (throw_no_conn) throw new Error("No connection history available, try to reconnect")
                return;
            }
            connector = this._constructConnectorFromCurrentSession(currentSession)
            connector.adapterClassesMap = this.adapterClassMap;
        }
        this.connector = connector;
        if (currentSession !== null) {
            this.connector.setupSession(currentSession)
        }

    }

    async checkConnection(raiseError:boolean = true): Promise<boolean> {
        if (!this.connector.isConnected()) {
            await this.connector.connect();
        }
        return await this.connector.checkConnection(raiseError);
    }






    async getCurrentSession<S extends ISession = ISession>(): Promise<CurrentSessionStruct<S>> {
        if (this.connector === undefined || this.connector.session === undefined) {
            return await this.storage.getItem<CurrentSessionStruct<S>>(this.currentSessionName);
        }
        return this.connector.getFormatedCurrentSession() as CurrentSessionStruct<S>;
    }





}