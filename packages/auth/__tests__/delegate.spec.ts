import { expect } from "chai";
import {LocalStorageMock, MockServer} from "@almight-sdk/test-utils"
import { beforeEach } from "mocha";
import {AlmightClient} from "@almight-sdk/core"
import { Providers, WebLocalStorage } from "@almight-sdk/utils";
import {Web2AuthenticationDelegate, Web2IdentityResolver, Web3IdentityResolver} from "../src"
import {MetamaskIdentityProvider} from "@almight-sdk/ethereum-chain-adapter"
import {DiscordIdentityProvider} from "@almight-sdk/oauth-adapters"


describe("Web2AuthenticationDelegate", () => {



    const mockServer = new MockServer();
    const PORT = 8000;
    let almightClient: AlmightClient;
    let delegate: Web2AuthenticationDelegate;
    const idr = new Web3IdentityResolver(MetamaskIdentityProvider)
    const discordIdr = new Web2IdentityResolver(DiscordIdentityProvider)

    beforeEach(() => {
        Object.defineProperty(globalThis, "localStorage", {
            value: new LocalStorageMock(),
            writable: true
        });
        almightClient = new AlmightClient({
            storage: new WebLocalStorage(),
            apiKey: process.env["ALMIGHT_API_KEY"] as string
        });

        delegate = new Web2AuthenticationDelegate({
            storage: almightClient.storage,
            identityResolvers: [idr, discordIdr]
        });
    });


    before(() => {
        mockServer.start(PORT);
    });

    after(() => {
        mockServer.stop();
    });

    describe("getOAuthUrl", () => {
        it("fail: due to invalid projectIdentifier", async () => {
            
            try {
                await delegate.getOAuthUrl(Providers.Discord, "");
                fail("Expected Error: Invalid project identifier")
            }catch(e){
                expect((e as Error).message).to.equal("Invalid project identifier provided");
            }
        });

        it("fail: due to unsupported provider", async () => {
            try {
                await delegate.getOAuthUrl(Providers.MetaMask, "");
                fail("Expected Error: Provider not supported ")
            }catch(e){
                expect((e as Error).message).to.equal(`Provider ${idr.provider.identityProviderName} not supported for current authentication strategy`)
            }
        } );

        it("success", async () => {
            mockServer.forPath("/project/verify/api_key").forPost({status: 200, data: {is_valid: true}})
            mockServer.forPath("/project/ident").forPost({status:200, data: {identifier: "project-ident-123"}})
            const projectIdentifier = await almightClient.getProjectIdentifier();
            mockServer.forPath(`/auth/provider/url/${Providers.Discord}`).forGet({
                status: 200,
                data: {
                    url: "https://discord.com",
                    verifiers: {
                        state: "random-state"
                    }
                }
            })
            const data = await delegate.getOAuthUrl(Providers.Discord, projectIdentifier);
            
            expect(data).to.have.property("url");
            expect(data).to.have.property("verifiers");
            expect(data.verifiers).to.has.property("state")
        })
    });


    describe("getConfigurationData", () => {

        Object.defineProperty(globalThis, "location", {
            writable: true,
            value: {
                search: "name=test&query=after"
            }
        });

        it("success", async () => {
            const query = await delegate.getConfigurationData();
            expect(query).has.property("name");
            expect(query).has.property("query");
            expect(query["name"]).to.equal("test");
            expect(query["query"]).to.equal("after");
        })

    });

    






})