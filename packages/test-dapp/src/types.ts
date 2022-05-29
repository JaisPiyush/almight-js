import { BrowserSessionStruct, ConnectorType, WalletConnectSessionStruct } from "@almight-sdk/connector";


export interface IdentityProviderData {
    uid: string;
    provider: string;
    sessions: {
        [ConnectorType.BrowserExtension]?: BrowserSessionStruct[],
        [ConnectorType.WalletConnector]?: WalletConnectSessionStruct[]
    }
}
