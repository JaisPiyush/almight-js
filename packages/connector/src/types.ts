

export interface ConnectionPayload {
    accounts: string[];
    chainId: number;
}

/**
 * 
 * 
 * BaseWalletConnector is wrapper around existing providers
 * for communication with Providers using basic methods
 * 
 * The BaseWalletConnector is aware of only small details
 * and WalletConnectors dedicated to a single provider must extend the BaseWalletConnector
 * 
 * @abstract
 * 
 */
export interface BaseWalletConnectorInterface {

    isConnected(): Promise<boolean>;

    setSession()



}