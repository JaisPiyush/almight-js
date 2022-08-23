import { BaseProviderChannel, BrowserProviderChannel, HTTPProviderChannel } from "../src/channel";
import { ChannelConnectionEstablishmentFailed, IncompatiblePlatform } from "../src/exceptions";
import { expect, assert } from "chai"
import { BasicExternalProvider, IProvider, ProviderChannelInterface, SessioUpdateArguments } from "../src/types";
import { MockEthereumChainAdapter } from "../src/mocks/adapters"
import { BaseProvider } from "../src/provider";
import { startGanache, closeGanahceServer } from "@almight-sdk/test-utils"

let chainName = () => {

    
    return {
        isServiceProvider: () => true,
        request: async (data: { method: string, params: any[] }) => {
            if (data.method === "ping") {
                throw new Error("Invalid JSON-RPC error")
            }
            return `${data.method}__${data.params.join("..")}`;
        },
        on: (name: string, callback: Function): void => {
            callback();
        },
       
    }
}




describe("Mock Testing BrowserProviderChannel class with injected prop", () => {

    it("Throws IncompatiblePlatform when called on non browser platform", () => {
        try {
            new BrowserProviderChannel();
        } catch (e) {
            expect(e).to.be.instanceOf(IncompatiblePlatform);
        }
    });

    const path = "darwin"

    // Mocking browser behaviour
    Object.defineProperty(globalThis, "document", { value: {}, writable: true })
    Object.defineProperty(globalThis, path, { value: chainName(), writable: true })



    it("without any provider path, checkSession must fail to find any provider", async function () {
        const emptyChannel = new BrowserProviderChannel();
        const [isConnected, provider] = await emptyChannel.checkSession();
        expect(isConnected).to.be.false;
        expect(provider).to.be.undefined;
    })

    it("checkSession must pass to find the provider", async function () {
        const emptyChannel = new BrowserProviderChannel();
        emptyChannel.providerPath = path;
        const [isConnected, provider] = await emptyChannel.checkSession();
        expect(isConnected).to.be.true;
        expect(provider).not.to.be.undefined;
    })

    const channel = new BrowserProviderChannel({ path: path, chainId: 1 });

    it("without calling connect provider must be undefined", async function () {
        expect(channel.provider).to.be.undefined;
    });

    it("testing #connect method", async function () {
        await channel.connect();
        try {
            await channel.connect();
            fail("Must fail becuase of .on listener")
        } catch (e) {
            expect(e).not.to.be.undefined;
        }
        expect(channel.provider).not.to.be.undefined;

        try {
            await channel.connect(({ name: "testing", on: (name: string, callback: Function) => { callback() } } as unknown) as BasicExternalProvider);
        } catch (e) {
            expect(e).to.be.instanceOf(ChannelConnectionEstablishmentFailed)
        }

    });

    it("testing checkConnection and #onConnect on insertion", async function () {

        let obj: Partial<IProvider> = {
            channelOnConnect: function (options: any) {
                // expect(2).to.be.equal(3)
                expect(options).to.deep.eq({})
                // assert(options.isServiceProvider());
            }
        }
        await channel.connect(undefined, obj as IProvider)
        expect(channel.isConnected).to.be.true;
        expect(channel.provider).not.to.be.undefined;
        expect(channel.provider).to.have.property("isServiceProvider");
        setTimeout(() => {}, 1500);

    });
    it("testing onSessionUpdate", async function() {
        let obj = {
            channelbindSessionListener: (channel: BaseProviderChannel): void => {
               channel.on("session_update", () => {
                channel._onSessionUpdate({accounts: ["account-1"], chainId: 1337})
               });
            }
        }

        channel.onSessionUpdate = (options: SessioUpdateArguments): void => {
            expect(options.accounts).not.to.be.undefined;
            expect(options.accounts).length.to.be.greaterThan(0);
            expect(options.chainId).to.equal(1337)
            // expect(2).to.be.equal(4)

        }

        await channel.connect(undefined, obj as IProvider);
        expect(channel.isConnected).to.be.true;
        expect(channel.provider).not.to.be.undefined;
        // (channel.provider as any).dispatch("session_update", {accounts: ["account-1"], chainId: 1337})
        channel.onSessionUpdate = undefined as any

    })

    it("testing rawRequest, getSessionForStorage and  request", async function () {
        await channel.connect(undefined)
        expect(channel.isConnected).to.be.true;
        expect(channel.provider).not.to.be.undefined;

        // Test getSessionForStorage
        expect(channel.getCompleteSessionForStorage()).to.deep.equal({
            path: channel.providerPath,
            chainId: 0
        })

        // Testing _rawRequest
        const data = { method: "eth_test", params: ["hello"] };
        const expected = `${data.method}__${data.params.join(',')}`
        const _res = await channel._rawRequest(data);
        expect(_res).to.eq(expected)

        expect(await channel.request(data)).to.eq(expected)
    });

});


describe("HTTPProviderChannel", () => {

    const PORT = 8545;
    let server;
    const url = `http://localhost:${PORT}`

    before(async () => {
        server = await startGanache({ port: PORT });
    })

    after(async () => {
        await closeGanahceServer(server);
    })

    it("testing connect", async () => {

        const provider = new BaseProvider<HTTPProviderChannel>({
            channel: new HTTPProviderChannel({
                endpoint: url,
                chainId: 0
            }),

        });

        const adapter = new MockEthereumChainAdapter({
            provider: provider,
            onConnect: (data): void => {
                expect(data).to.have.property("accounts");
                expect(data["accounts"]).length.to.greaterThan(0)
                expect(data).to.have.property("chainId");
                expect(data["chainId"]).not.equal(0)
            }
        })

        const [isSessionValid, _prov] = await adapter.checkSession();
        expect(isSessionValid).to.be.true;
        expect(_prov).not.to.be.undefined;
        await adapter.connect();
        expect(adapter.accounts).not.to.be.undefined;
        expect(adapter.accounts?.length).not.to.equal(0);
        expect(adapter.bridge).not.to.undefined;
        expect(await adapter.getSession()).to.deep.equal({
            endpoint: url,
            chainId: await adapter.getChainId()
        });
        expect((await adapter.getBalance()).gt(0)).to.be.true;
    })
})

