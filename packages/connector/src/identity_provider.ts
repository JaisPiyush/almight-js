import { Class } from "utils/lib";
import { BaseChainAdapter } from "./adapter";
import { BaseProviderChannel } from "./channel";
import { ConnectorType, IdentityProviderInterface, IProtocolDefinition, IProviderAdapter, ProviderChannelInterface } from "./types";

interface IdentityProviderConstructor { 
    name: string, 
    identifier: string
    webVersion: number, 
    allowedConnectorTypes?: ConnectorType[], 
    metaData?: Record<string, any>
    adapter_class: Class<BaseChainAdapter>,
    channels: Class<BaseProviderChannel>[]
}

export class IdentityProvider implements IdentityProviderInterface {
    identityProviderName: string;
    webVersion: number;
    allowedConnectorTypes: ConnectorType[];
    identifier: string | number;
    metaData: Record<string, any>;
    adapter_class: Class<BaseChainAdapter>;
    channels: Class<BaseProviderChannel>[];

    constructor({ allowedConnectorTypes = [], ...data }: IdentityProviderConstructor) {
        this.identityProviderName = data.name;
        this.identifier = data.identifier;
        this.webVersion = data.webVersion;
        this.allowedConnectorTypes = allowedConnectorTypes;
        this.metaData = data.metaData;
        this.adapter_class = data.adapter_class;
        this.channels = data.channels;
    }
    getProtocolDefination(): Class<IProtocolDefinition> {
        throw new Error("Method not implemented.");
    }

    getAdapterClass(): Class<IProviderAdapter> {
        return this.adapter_class;
    }
    getChannels(): Class<BaseProviderChannel>[] {
        return this.channels;
    }

}