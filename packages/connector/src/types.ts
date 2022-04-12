import WalletConnect from "@walletconnect/client";
import { providers } from "ethers";

export type BrowserSessionStruct = Array<{property: string}>;

interface WalletConnectMetaInterface {
    description: string
    url: string
    icons: string[]
    name: string
    ssl?: boolean
}
export interface WalletConnectSessionStruct {
    connected: boolean,
    accounts: Array<string>
    chainId: number
    bridge: string
    key: string
    clientId: string
    clientMeta: WalletConnectMetaInterface
    peerId: string
    peerMeta: WalletConnectMetaInterface
    handshakeId: number
    handshakeTopic: string
}

/**
 * Session structure formats used to save and load sessions
 * SDK is based on injection based browser provider and walletconnect provider
 * Single IdP can have many sessions and thus they required different procedure to load
 * based on the providers
 */
export interface ProviderSessionStruct {
    browser: Array<BrowserSessionStruct>;
    walletconnect: Array<WalletConnectSessionStruct>
}


interface ProviderRequestMethodArguments {
    method: string
    id: number
    jsonrpc: string
    params: unknown[] | object
}

export type Address = string;

export type IProviderSessionData = BrowserSessionStruct | WalletConnectSessionStruct

export interface IBaseProvider {
    _session?: IProviderSessionData;

    chainId?: number;
    account?: string;

    /**
     * Check the connection of session is valid and working
     * @param session 
     */
    _checkConnection(session: IProviderSessionData): Promise<boolean>;

    /**
     * 
     * Returns result from provider request
     * 
     * Makes JSON RPC request through provider using the session
     * @param data
     * 
     */
    request<T = any>(data: ProviderRequestMethodArguments): Promise<T>;

}
