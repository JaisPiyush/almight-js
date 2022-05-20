import { expect, assert} from "chai"
import { EthereumChainAdapter } from "../src/adapter";
import { BrowserProviderChannel, WalletConnectChannel, IdentityProvider, BaseConnector, BaseProvider, ConnectorType } from "../src";


let chainName = () => {
    return {
        isServiceProvider: () => true,
        request: async (data: { method: string, params: any[] }) => {
            if (data.method === "ping") {
                throw new Error("Invalid JSON-RPC error")
            }
            return `${data.method}__${data.params.join("..")}`;
        }
    }
}




describe('Unit-testing Connector Class', () => {

    class AnotherBroweserChannel extends BrowserProviderChannel{
        // public static connectorType: ConnectorType = ConnectorType.BrowserExtension
    }

    const metamask = new IdentityProvider({
        name: "Metamask",
        webVersion: 3.0,
        identifier: "meta-mask",
        adapter_class: EthereumChainAdapter,
        channels: [BrowserProviderChannel, AnotherBroweserChannel, WalletConnectChannel]
    });


    Object.defineProperty(globalThis, "document", {value: {}, writable: true})
    Object.defineProperty(globalThis, EthereumChainAdapter.providerPath, {value: chainName(), writable: true})
  


    it("Testing class property access", () => {
        expect((EthereumChainAdapter as any).isAdapterClass).to.be.true;
        expect(EthereumChainAdapter.providerPath).to.eq("ethereum");
        expect(globalThis[EthereumChainAdapter.providerPath]).not.to.be.undefined;
    });
    
    it("Testing constructor with Idp", async() => {
        let connector = new BaseConnector({idp: metamask, allowedConnectorTypes: [ConnectorType.BrowserExtension]});
        
        expect(connector.idp.identifier).to.equal(metamask.identifier);
        expect(connector.findAdapter()).to.eq(metamask.getAdapterClass());
        expect(connector.findChannels()).to.have.all.members(metamask.getChannels());
        expect(connector.allowedConnectorTypes.length).to.be.greaterThan(0);
        expect(await connector.getChannels()).to.have.all.members([BrowserProviderChannel, AnotherBroweserChannel, WalletConnectChannel]);
        expect(await connector.getChannels()).not.to.have.any.members([WalletConnectChannel]);
        
        // Testing connect
        try {
            await connector.connect();
            fail("It must throw an erro");
        }catch(e){
            expect(e).to.be.instanceOf(Error);
            expect((e as Error).message).to.eq("Must provider either channel, session or filters to proceed")
        }
    });

    it("Testing constructor only by providing adapter and connecting by providing channel as argument", async () => {
        const connector2 = new BaseConnector({adapter: EthereumChainAdapter});

        expect(connector2.adapter).to.be.undefined;
        expect((await connector2.getChannels()).length).to.equal(0);
        await connector2.connect({channel: BrowserProviderChannel});
        expect(connector2.adapter).not.to.undefined;
        expect(connector2.adapter.channel.isConnected).to.be.true;
        expect(await connector2.adapter.request({method: "parajoint", params: []})).to.equal("parajoint__")
    });

    it("Testing constructor only by providing adapter and channel along with onConnect", async() => {
        const connector2 = new BaseConnector({adapter: EthereumChainAdapter, onConnect: (options) => {
            expect(options).to.be.undefined;
        }});

        expect(connector2.adapter).to.be.undefined;
        expect((await connector2.getChannels()).length).to.equal(0);
        await connector2.connect({channel: BrowserProviderChannel});
        expect(connector2.adapter).not.to.undefined;
        expect(connector2.adapter.channel.isConnected).to.be.true;
    });

});


describe("Testing connector with walletchannel connector", () => {

    it("Testing with providing adapter and channel", async() => {
        const connector = new BaseConnector({adapter: EthereumChainAdapter});
        await connector.connect({channel: WalletConnectChannel});
        expect(connector.adapter).not.to.undefined;
        expect(connector.adapter.channel).not.to.be.undefined;
        expect(connector.adapter.channel.provider).not.to.be.undefined;
        expect((connector.adapter.channel.provider as any).session).not.to.be.undefined;
        expect(connector.adapter.channel.isConnected).to.be.false;
        expect((connector.adapter.channel as WalletConnectChannel).getConnectorUri()).not.to.be.undefined;
        expect((connector.adapter.channel as WalletConnectChannel).getConnectorUri().length).to.be.greaterThan(0);

    })
})