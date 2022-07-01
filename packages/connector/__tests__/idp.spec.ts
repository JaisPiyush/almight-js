import {expect, assert} from "chai";
import  {IdentityProvider, BrowserProviderChannel} from "../src";
import {MockEthereumChainAdapter} from "../src/mocks/adapters"


describe('Testing IdentityProvider class', () => {

    

    it("Testing construction of class with different options", () => {
        const idp = new IdentityProvider({
            name: "TestIdentityProvider",
            identifier: "test-identity-provider",
            webVersion: 3.0,
            adapterClass: MockEthereumChainAdapter,
            channels: [BrowserProviderChannel]
        });


        expect(idp.identityProviderName).to.eq("TestIdentityProvider");
        expect(idp.getChannels().length).to.equal(1);
        expect(idp.getChannels()).to.includes(BrowserProviderChannel)
        expect(idp.getAdapterClass()).to.eq(MockEthereumChainAdapter)
    })
});