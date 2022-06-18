import { expect } from "chai";
import {LocalStorageMock} from "@almight-sdk/utils/src/mocks"
import { beforeEach } from "mocha";
import {AlmightClient} from "@almight-sdk/core"
import { Providers, WebLocalStorage } from "@almight-sdk/utils";
import {IDENTITY_RESOLVERS, Web2AuthenticationDelegate} from "../src"


describe("Web2AuthenticationDelegate", () => {

    let almightClient: AlmightClient;
    let delegate: Web2AuthenticationDelegate;

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
            storage: almightClient.storage
        })
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
                const idr = IDENTITY_RESOLVERS[Providers.MetaMask]
                expect((e as Error).message).to.equal(`Provider ${idr.provider.identityProviderName} not supported for current authentication strategy`)
            }
        } );

        it("success", async () => {
            const projectIdentifier = await almightClient.getProjectIdentifier();
            const data = await delegate.getOAuthUrl(Providers.Discord, projectIdentifier);
            expect(data, JSON.stringify(data)).to.have.property("url");
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