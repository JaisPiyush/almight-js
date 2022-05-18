import {expect, assert} from "chai"
import {EthereumChainAdapter} from "../src/adapter";
import { BrowserProviderChannel, WalletConnectChannel, IdentityProvider} from "../src";


/**
 * Unittesting Connector
 * 
 */

describe('Unit-testing Connector Class', () => { 
    const metamask = new IdentityProvider({
        name: "Metamask",
        webVersion: 3.0,
        identifier: "meta-mask",
        adapter_class: EthereumChainAdapter,
        channels: [BrowserProviderChannel, WalletConnectChannel]
    });
    


})