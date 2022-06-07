import { Class } from "@almight-sdk/utils"
import { BaseChainAdapter } from "./adapter";
import { BaseProviderChannel } from "./channel";
import { AdapterIsNotDefined, ConnectionEstablishmentFailed, NoSuitableAdapterFound } from "./exceptions";
import { BrowserSessionStruct, ConnectorType, IConnector, IConnectorConnectArguments, IConnectorSessionFilter, IdentityProviderInterface, IProviderAdapter, ISession, ProviderChannelInterface, ProviderSessionStruct, SubscriptionCallback, WalletConnectSessionStruct } from "./types";

export interface IConnectorOptions {
    idp?: IdentityProviderInterface;
    adapter?: Class<IProviderAdapter> | IProviderAdapter;
    channel?: Class<ProviderChannelInterface>;
    sessions?: ProviderSessionStruct;
    allowedConnectorTypes?: ConnectorType[];
    metaData?: Record<string, any>;
    onConnect?: (options?: any) => void;
}



export class BaseConnector implements IConnector {

    protected _idp?: IdentityProviderInterface;
    protected _adapter_class?: Class<IProviderAdapter>;
    protected _adapter?: IProviderAdapter;
    protected _channel?: Class<ProviderChannelInterface>;
    public sessions?: ProviderSessionStruct;
    public allowedConnectorTypes: ConnectorType[] = [];
    protected _currentSession?: ISession;
    public metaData?: Record<string, any> = {}
    protected _sortedChannels: Class<BaseProviderChannel>[] = [];

    protected connectorTypePriorityIndex = { [ConnectorType.BrowserExtension]: 0, [ConnectorType.WalletConnector]: 1 }

    public get sortedChannels(): Class<BaseProviderChannel>[] { return this._sortedChannels };

    protected _onConnect: (options?: any) => void = (options?: any) => { ; }

    public get adapter(): BaseChainAdapter { return this._adapter as BaseChainAdapter }

    public get idp(): IdentityProviderInterface { return this._idp }
    public get session(): ISession { return this._currentSession }

    constructor(args: IConnectorOptions) {
        this._idp = args.idp;
        if (args.adapter !== undefined) {
            if ((args.adapter as any).isAdapterClass === true) {
                this._adapter_class = args.adapter as Class<IProviderAdapter>;

            } else if (args.adapter instanceof BaseChainAdapter) {
                this._adapter = args.adapter as IProviderAdapter;
            }
        }
        this._channel = args.channel;
        this.sessions = args.sessions;
        this.allowedConnectorTypes = args.allowedConnectorTypes ?? [];
        if (this.allowedConnectorTypes.length === 0 && this._idp !== undefined) {
            this.allowedConnectorTypes = this._idp.allowedConnectorTypes;
        }
        this.metaData = args.metaData;
        if (args.onConnect !== undefined) {
            this._onConnect = args.onConnect;
        }
    }

    findChannels(): Class<BaseProviderChannel>[] {
        if (this._idp !== undefined) return this._idp.getChannels() as Class<BaseProviderChannel>[];
        return [];
    }

    findAdapter(): Class<IProviderAdapter> {
        if (this._adapter_class !== undefined) return this._adapter_class;
        if (this._idp !== undefined) return this._idp.getAdapterClass();
        throw new NoSuitableAdapterFound();
    }


    bindAdapter(adapter: Class<BaseChainAdapter>, channel: BaseProviderChannel): BaseChainAdapter {
        channel.setClientMeta(this.metaData);
        return new adapter({ channel: channel, onConnect: this._onConnect });
    }


    protected async _baseConnect(args: IConnectorConnectArguments = {}): Promise<void> {
        if (this._adapter !== undefined) {
            if (!(this._adapter as BaseChainAdapter).channel.isConnected) {
                await this._adapter.connect();
            }
            return;
        }

        if (this._adapter_class === undefined) {
            const _adapter_class = this.findAdapter();
            if (_adapter_class === undefined) throw new AdapterIsNotDefined();
            this._adapter_class = _adapter_class;
        }

        let channel_class = args.channel ?? this._channel;
        let channel: BaseProviderChannel;
        // Argument guard to force user to define atleast one thing
        if (channel_class === undefined && args.session === undefined && args.filters === undefined) {
            throw new Error("Must provider either channel, session or filters to proceed")
        }

        let session = args.session ?? this._currentSession;
        if (session === undefined && args.filters !== undefined && this.sessions !== undefined) {
            const sessions = this.getSessions().filter((session) => this.validateSessionStructure(session as any, args.filters));
            if (sessions.length > 0) {
                session = sessions[0] as any;
                this._currentSession = session;
            }
        }







        if (channel_class === undefined) {
            // If session is not defined then throw the error
            if (this._currentSession === undefined) {
                throw new ConnectionEstablishmentFailed("A valid session must be provided to establish the connection");
            }

            let channel_classes = await this.getChannels();
            for (const channel_cls of channel_classes) {
                const _channel = await this.mountSessionOnChannel(channel_cls as any, session);
                if (_channel !== undefined) {
                    this._channel = this._channel ?? channel_cls;
                    this._currentSession = session;
                    channel = _channel;
                    break;
                }
            }
        } else if (channel_class instanceof BaseProviderChannel) {
            channel = channel_class as BaseProviderChannel;
        } else if ((channel_class as any).isChannelClass === true) {
            channel = new (channel_class as Class<BaseProviderChannel>)(this._currentSession);
            this._channel = this._channel ?? (channel_class as Class<BaseProviderChannel>);
        }



        if (channel === undefined) {
            throw new ConnectionEstablishmentFailed("Not able to find any suitable channel for connection establishment")
        }


        this._adapter = this.bindAdapter(this._adapter_class as any, channel);
        await this._adapter.connect();

    }


    async connect(args?: IConnectorConnectArguments): Promise<void> {
        await this._baseConnect(args)
    }



    async mountSessionOnChannel(channel: Class<BaseProviderChannel>, session: ISession, filter?: IConnectorSessionFilter): Promise<BaseProviderChannel | undefined> {
        if (filter !== undefined && !this.validateSessionStructure(session as any, filter)) return;
        if (await this.validateChannelSession(channel, session as any)) return new channel(session);
    }

    /**
     * The function will verify that the channel is allowed based on the @property allowedConnectorType
     * if @property allowedConnectorType is empty then every channel will be valid
     * 
     * @param channel 
     * @returns boolean indicating channel's connectorType is allowed in the connector
     */
    validateConnectorTypeOfChannel(channel: BaseProviderChannel): boolean {
        return this.valdiateConnectorType(channel.connectorType)
    }

    protected valdiateConnectorType(type: ConnectorType): boolean {
        return this.allowedConnectorTypes.length === 0 || this.allowedConnectorTypes.includes(type)
    }


    protected getConnectorPriorityIndex(channel_class: Class<BaseProviderChannel>): number {
        return this.connectorTypePriorityIndex[(channel_class as any).connectorType];
    }

    protected appendChannelClass(channel: Class<BaseProviderChannel>): void {
        for (let i = 0; i < this._sortedChannels.length; i++) {
            const channel_class = this._sortedChannels[i];
            if (this.getConnectorPriorityIndex(channel) < this.getConnectorPriorityIndex(channel_class)) {
                this._sortedChannels = this._sortedChannels.slice(0, i).concat([channel]).concat(this._sortedChannels.slice(i, this._sortedChannels.length));
                return;
            }
        }
        this._sortedChannels.push(channel);
    }


    protected sortChannels(channel_classes?: Class<BaseProviderChannel>[]): void {
        for (const channel_class of channel_classes) {
            this.appendChannelClass(channel_class);
        }
    }

    async getChannels(): Promise<Class<ProviderChannelInterface>[]> {
        if (this.sortedChannels.length === 0) {
            this.sortChannels(this.findChannels().filter((channel) => this.validateChannel(channel)))
        }
        return this.sortedChannels;
    }

    getSessions(): ISession[] {
        let sessions = [];
        if (this.sessions !== undefined) {
            for (const connectorType of Object.keys(this.connectorTypePriorityIndex)) {
                if (this.sessions[connectorType] !== undefined && this.valdiateConnectorType(connectorType as ConnectorType)) {
                    sessions = sessions.concat(this.sessions[connectorType as ConnectorType])
                }
            }
        }
        return sessions;
    }

    /**
     * @method validateSession will be used be the user/connector methods whenever
     * sessions are required to filtered for particular usecases.
     * 
     * For e.g if user wants only to proceed with @enum ConnectorType.BrowserExtension sessions
     * then they can filter session based on connectorTypes. Many other properties such as handshakeId,
     * peerId, etc can be used to directly target any particular session
     * 
     * @param session - Session data
     * @param filters - Filter to validate session data
     * @returns boolean indicating validity of session data
     */
    validateSessionStructure(session: BrowserSessionStruct | WalletConnectSessionStruct, filters: IConnectorSessionFilter = {}): boolean {
        let filterTruthy: boolean[] = []
        for (const [prop, value] of Object.entries(filters)) {
            // Session must contain the named prop or else it will directly be invalidated
            if (session[prop] === undefined) return false;
            filterTruthy.push(false);
            let subFilterTruthy: boolean[] = []

            /// Comparision of object upto 1 deepth level
            if (value instanceof Object) {
                for (const [subProp, subValue] of Object.entries(value)) {
                    subFilterTruthy.push(false);
                    subFilterTruthy[subFilterTruthy.length - 1] = session[prop][subProp] === subValue;
                }
            } else if (value instanceof Array) {
                // Provided array filter will always works as an OR operator
                subFilterTruthy.push(value.includes(session[prop]))
            } else {
                subFilterTruthy.push(value === session[prop])
            }
            filterTruthy[filterTruthy.length - 1] = subFilterTruthy.every((val, index, arr) => val)
        }
        return filterTruthy.length === 0 ? true : filterTruthy.every((val, index, arr) => val);
    }

    /**
     * Every channel must implement @member checkEnvironment to validate the 
     * working environment, such as BrowserBased channels must validate that
     * the code is being executed inside a browser
     * 
     * This method is resoponsible to validate the connectType of channel i.e 
     * only allowedConnectorType channels should validate and also the environment validity
     * 
     * @param channel_class 
     * @returns boolean indicating validity of channel in current environment
     */
    async validateChannel(channel_class: Class<BaseProviderChannel>): Promise<boolean> {
        const _chan = new channel_class();
        return this.validateConnectorTypeOfChannel(_chan) && (await _chan.checkEnvironment())
    }

    /**
     * Validate ChannelClass and Session pair using @method channel#checkSession
     * @param channel_class 
     * @param session 
     * @returns boolean indicating validity of pair
     */
    async validateChannelSession(channel_class: Class<ProviderChannelInterface>, session?: BrowserSessionStruct | WalletConnectSessionStruct): Promise<boolean> {
        const channel = new channel_class(session);
        const adpater = new this._adapter_class({ channel: channel });
        try {
            return (adpater as any).channel !== undefined && (await (adpater as any).channel.checkSession(adpater))[0];
        } catch (e) {
            return false;
        }
    }


}