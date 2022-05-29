import { BrowserSessionStruct, WalletConnectSessionStruct } from "@almight-sdk/connector";


export interface IdentityProviderData {
    uid: string;
    provider: string;
    sessions: Array<BrowserSessionStruct | WalletConnectSessionStruct>
}
