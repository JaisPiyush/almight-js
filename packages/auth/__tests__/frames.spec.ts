import { BrowserProviderChannel, BrowserSessionStruct, Connector, ConnectorType } from "@almight-sdk/connector";
import { expect } from "chai";
import { AllowedQueryParams, AuthenticationApp, AuthenticationFrame, AuthenticationRespondStrategy, ChannelConfigurations, IAuthenticationApp, Web3AuthenticationDelegate, Web3IdentityResolver, Web3NativeAuthenticationFrame } from "../src"
import { AlmightMockServer, LocalStorageMock } from "@almight-sdk/test-utils/src"
import { AlmightClient } from "@almight-sdk/core";
import { Providers, WebLocalStorage } from "@almight-sdk/utils";
import { JSDOM } from "jsdom";
import { EthereumChainAdapter, MetamaskIdentityProvider, MetamaskProvider } from "@almight-sdk/ethereum-chain-adapter"


describe("AuthenticationFrame", () => {

    const channelArgs = {
        [ConnectorType.WalletConnector]: {
            peerMeta: {
                name: "My website"
            }
        }
    }

    const frame = new AuthenticationFrame({
        filters: {
            allowedConnectorTypes: [ConnectorType.BrowserExtension]
        },
        channelArgs: channelArgs
    });


    it("respondStrategy", () => {
        expect(frame.respondStrategy).to.equal(AuthenticationRespondStrategy.None);
    });

    it("config is defined", () => {
        expect(frame.configs).not.to.be.undefined;
        expect(frame.configs?.channelArgs).not.to.be.undefined;
        expect((frame.configs.channelArgs as ChannelConfigurations)[ConnectorType.WalletConnector]).not.to.be.undefined;
    })

    it("getConfigForChannelWithConnectorType", () => {
        expect(frame.getConfigForChannelWithConnectorType(ConnectorType.BrowserExtension)).to.be.undefined;
        const config = frame.getConfigForChannelWithConnectorType(ConnectorType.WalletConnector);
        expect(config).not.to.be.undefined;
        expect(config).to.deep.eq(channelArgs[ConnectorType.WalletConnector]);
    });

});



describe("Web3NativeAuthenticationFrame", () => {
    const mockServer = new AlmightMockServer();
    const storage = new WebLocalStorage();
    const PORT = 8000;



    before(() => {
        mockServer.start(PORT);
        (globalThis as any).localStorage = new LocalStorageMock()
        const dom = new JSDOM(`<!DOCTYPE html><body><p>Hello world</p></body>`);
        Object.defineProperty(globalThis, "document", {
            value: dom.window.document,
            writable: true,
            configurable: true
        });
    })

    after(() => {
        mockServer.stop();
    })

    const almight = new AlmightClient({
        apiKey: "random-api-key",
        storage: storage,

    });

    const auth = new AuthenticationApp({
        almightClient: almight,
        identityProviders: [
            MetamaskIdentityProvider
        ]
    });

    const frame = new Web3NativeAuthenticationFrame();
    frame.app = <IAuthenticationApp>auth;

    it("setDelegate", () => {
        const data = {
            [AllowedQueryParams.ProjectId]: "random-project-id",
            [AllowedQueryParams.Provider]: MetamaskIdentityProvider.identifier,
            ["identityProviders"]: [MetamaskIdentityProvider]
        }

        frame.setDelegate(data);
        expect(frame.delegate).not.to.be.undefined;
        expect(frame.delegate).to.be.instanceOf(Web3AuthenticationDelegate);
        const delegate = frame.delegate;
        // expect(globalThis.localStorage).to.equal(storage)
        expect(delegate?.storage).to.eq(storage);
        expect(delegate?.identityResolversMap[Providers.MetaMask]).not.to.be.undefined;
    })

    describe("mountModal", () => {
        const data = {
            [AllowedQueryParams.ProjectId]: "random-project-id",
            [AllowedQueryParams.Provider]: MetamaskIdentityProvider.identifier,
            ["identityProviders"]: [MetamaskIdentityProvider]
        }

        frame.setDelegate(data);



        describe("expect modal to mount button to connect browser wallet only", () => {

            before(() => {
                frame.browserConnector = new Connector<BrowserSessionStruct, BrowserProviderChannel>({
                    adapter: new EthereumChainAdapter({
                        provider: new MetamaskProvider({
                            channel: new BrowserProviderChannel()
                        })
                    })
                });
                (frame.delegate as any).identityResolver = new Web3IdentityResolver(MetamaskIdentityProvider);
                frame.mountModal();
            });
            after(() => {
                frame.modal.close();
            })

            

            it("expect to have mounted the el", () => {
                expect(frame.delegate?.identityResolver).not.to.be.undefined;
                const cls = 'almight__connector_modal';
                expect(document.getElementsByClassName(cls).length).to.equal(1);
            })

            it("expect to have mounted the connect button", () => {
                const btns = document.getElementsByClassName('almight__connect')
                expect(btns).length.to.greaterThan(0);
                const btn = btns[0];
                expect(btn.innerHTML).to.equal("Connect Browser Wallet")
            })

            it("expect to have mounted the icon", () => {
                expect(frame.delegate?.identityResolver?.provider.metaData.icon).to.deep.eq(MetamaskIdentityProvider.metaData.icon)
                
                const img = document.querySelector(".almight__avatar") as HTMLImageElement
                expect(img.src).to.equal(
                    MetamaskIdentityProvider.metaData.icon
                )

                const name = document.querySelector('.almight__banner_child')?.querySelector('p') as HTMLParagraphElement;
                expect(name.innerHTML).to.eq(MetamaskIdentityProvider.identityProviderName)
            });

            it("expecting qr box to to be invisible", () => {
                const qrBox = document.querySelector('.almight__qr-box') as HTMLDivElement;
                expect(qrBox.style.display).to.equal('');
                expect(qrBox.getBoundingClientRect().height).to.equal(0);
            })  
        });


    })




    describe("handleAuthenticationOnWebNativePlatform", () => {
        before(() => {
            const data = {
                [AllowedQueryParams.ProjectId]: "random-project-id",
                [AllowedQueryParams.Provider]: MetamaskIdentityProvider.identifier,
                ["identityProviders"]: [MetamaskIdentityProvider]
            }
            frame.setDelegate(data);
            (frame.delegate as any).identityResolver = new Web3IdentityResolver(MetamaskIdentityProvider);
        });

        describe("will attach browser and walletconnect connectors", () => {
            before(async () => {
                await frame.handleAuthenticationOnWebNativePlatform();
            })
            after(() => {
                frame.modal.close()
            })

            it("expect modal to be mounted", () => {{
                expect(frame.delegate?.identityResolver).not.to.be.undefined;
                const cls = 'almight__connector_modal';
                expect(document.getElementsByClassName(cls).length).to.equal(1);
            }})

            it("expect qr code to be mounted", () => {
                expect(frame.walletconnectConnector).not.to.be.undefined
                // const qrBox = document.querySelector('.almight__qr-box') as HTMLDivElement;
                // // expect(qrBox.style.display).to.equal('flex');
                // expect(qrBox.getBoundingClientRect().height).to.be.greaterThan(0)
            })
           

            

        })
    })








})


