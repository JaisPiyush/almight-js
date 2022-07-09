import { AlmightClient } from "@almight-sdk/core";
import { Providers, WebLocalStorage } from "@almight-sdk/utils";
import { expect } from "chai";
import { AuthenticationApp } from "../src"
import { EthereumChainAdapter, MetamaskIdentityProvider, MetamaskProvider } from "@almight-sdk/ethereum-chain-adapter"
import { closeGanahceServer, LocalStorageMock, Server, startGanache } from "@almight-sdk/test-utils"
import { BrowserProviderChannel, BrowserSessionStruct, ConnectorType, CurrentSessionStruct } from "@almight-sdk/connector";


describe("AuthenticationApp", () => {

    let storage: WebLocalStorage;
    let almight: AlmightClient;
    const PORT = 8545;
    const CHAIN_ID = 1337;
    let server: Server<"ethereum">;
    const path = MetamaskProvider.providerPath;

    after(async () => {
        await closeGanahceServer(server)

    });

    before(async () => {
        server = await startGanache({ port: PORT });
        const provider = server.provider;
        Object.defineProperty(provider, "isMetaMask", {
            value: true,
            writable: true,
            configurable: true
        })
        Object.defineProperty(globalThis, path, {
            value: provider,
            writable: true,
            configurable: true
        })
        Object.defineProperty(globalThis, "localStorage", {
            value: new LocalStorageMock(),
            writable: true,
            configurable: true
        })
        Object.defineProperty(globalThis, "document", {
            value: {},
            writable: true,
            configurable: true
        })

        storage = new WebLocalStorage()
        almight = new AlmightClient({
            apiKey: "test-api-key",
            storage: storage
        })

    });



    describe("testing by providing adapterClass", () => {

        class PolygonChainAdapter extends EthereumChainAdapter {
            public static adapterIdentifier: string = "polygon-chain-adapter"
        }

        

        it("setupConnector must work according to session", async () => {
            const app = new AuthenticationApp({
                almightClient: almight,
                identityProviders: [
                    MetamaskIdentityProvider
                ],
                adapters: [PolygonChainAdapter],
            })

            
            const cSession = {
                uid: "random-uid",
                connector_type: ConnectorType.BrowserExtension,
                provider: Providers.MetaMask,
                session: {
                    data: { path: path , chainId: 1337 },
                    meta: {
                        adapter_indentifier: PolygonChainAdapter.adapterIdentifier
                    }
                }
            } as CurrentSessionStruct<BrowserSessionStruct>
            await storage.setItem(app.currentSessionName, cSession);
            expect(await storage.getItem(app.currentSessionName)).to.deep.eq(cSession)
            expect(await app.getCurrentSession()).to.deep.eq(cSession);
            await app.setupConnector()
            expect(app.connector?.currentSession).to.deep.eq(cSession);
            expect(app.connector?.session?.data).to.deep.eq(cSession.session.data)
            expect(app.connector?.identityProvider).to.equal(MetamaskIdentityProvider)
            const adapter = app.connector?.getChainAdapter() as PolygonChainAdapter;
            expect(adapter).to.be.instanceOf(PolygonChainAdapter);
            expect(adapter?.provider).to.be.instanceOf(MetamaskProvider);
            expect(adapter?.provider.channel).to.be.instanceOf(BrowserProviderChannel)
            expect(adapter?.provider.channel.session).to.deep.eq(cSession.session.data)
            const [isSessionValid, provider] = await adapter.checkSession()
            expect(isSessionValid).to.be.true;
        })
    })
})