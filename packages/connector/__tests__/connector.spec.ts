import { expect, assert } from "chai";
import { AdapterIsNotDefined, BaseChainAdapter, BaseProvider, BaseProviderChannel, BrowserSessionStruct, Connector, ConnectorType, CurrentSessionStruct, getConfiguredWeb2IdentityProvider, IdentityProvider } from "../src"
import { MockEthereumChainAdapter } from "../src/mocks/adapters";
import { startGanache, closeGanahceServer } from "@almight-sdk/utils/src/mocks"
import { Providers } from "@almight-sdk/utils";

describe("Connector", () => {


    describe("Testing memeber functions", () => {
        let connector: Connector;
        const channel = new BaseProviderChannel({path: "ethereum", chainId: 0});
        const idp = getConfiguredWeb2IdentityProvider(Providers.Google);


        beforeEach(() => {
            connector = new Connector({});


        })
        it("isClass", () => {

            expect(connector.isClass(BaseProviderChannel)).to.be.true;
            expect(connector.isClass(channel)).to.be.false;
        });

        it("isClassInstance", () => {
            expect(connector.isClassInstance(channel, BaseProviderChannel)).to.be.true;
            expect(connector.isClassInstance(BaseProviderChannel, BaseProviderChannel)).to.be.false;
            expect(connector.isClassInstance(channel, Connector)).to.be.false;
        });

        describe("validateArguments", () => {
            it("must throw error", () => {
                try {
                    connector.validateArguments();
                    fail("`validateArguments` was expected to throw error")
                } catch (e) {
                    expect(e).to.be.instanceOf(Error);
                    expect((e as Error).message).to.equal("Insufficient arguments to create Connector")
                }
            });

            describe('validateArguments must not throw error', () => {
                it("identityProvider is provided", () => {


                    const connector = new Connector({
                        identityProvider: idp
                    });
                    expect(connector.validateArguments()).to.be.undefined;

                });

                it("channel is provided", () => {
                    const connector = new Connector({
                        channel: new BaseProviderChannel()
                    });
                    expect(connector.validateArguments()).to.be.undefined;
                })
            })
        });

        describe("checkAdapterDefined", () => {
            it("must throw error", () => {
                try {
                    connector.checkAdapterDefined();
                    fail("`checkAdapterDefined` was expected to throw error")
                } catch (e) {
                    expect(e).to.be.instanceOf(AdapterIsNotDefined)
                }
            });
            it("must not throw error", () => {
                const connector = new Connector({
                    adapter: new BaseChainAdapter({
                        provider: new BaseProvider({ channel: new BaseProviderChannel() })
                    })
                });

                expect(connector.checkAdapterDefined()).to.be.undefined
            })
        });

        describe("hasSession", () => {
            it("must return false", () => {
                expect(connector.hasSession()).to.be.false;
            });
            it("must return true", () => {
                const connector = new Connector({
                    session: { path: Providers.Google, chainId: 0 }
                });

                assert(connector.hasSession());
            })
        });

        describe("setupSession", () => {
            it("sending currentSession", () => {
                assert(!connector.hasSession());
                const cSession: CurrentSessionStruct<BrowserSessionStruct> = {
                    uid: "random-uid",
                    provider: Providers.MetaMask,
                    connector_type: ConnectorType.BrowserExtension,
                    session: {path: "eth", chainId: 0}
                }

                connector.setupSession(cSession);
                assert(connector.hasSession());
                expect(connector.currentSession).not.to.be.undefined;
                expect(connector.currentSession).to.deep.equal(cSession);
                expect(connector.session).to.deep.eq(cSession.session)
            });

            it("sending sessions", () => {
                assert(!connector.hasSession());
                const session: BrowserSessionStruct = {path: "eth", chainId: 0};
                connector.setSession(session);
                assert(connector.hasSession());
                expect(connector.session).to.deep.eq(session);
                expect(connector.currentSession).to.be.undefined
            })
        })

        describe("setupChannel", () => {
            it("sending channelClass", () => {
                connector.setupChannel(BaseProviderChannel);
                expect((connector as any).channel).to.be.undefined;
                expect((connector as any).channelClass).to.equal(BaseProviderChannel)
                expect((connector as any).channelClass).not.instanceOf(BaseProviderChannel)
                
            });
            it("sending channel instance", () => {
                const connector = new Connector({});
                connector.setupChannel(new BaseProviderChannel());
                expect((connector as any).channel).not.to.be.undefined;
                expect((connector as any).channel).to.be.instanceOf(BaseProviderChannel);
                expect((connector as any).channelClass).to.be.undefined
            })
        });

        describe("setupProvider", () => {
            it("sending providerClass", () => {
                connector.setupProvider(BaseProvider);
                expect((connector as any).providerClass).not.to.be.undefined;
                expect((connector as any).provider).to.be.undefined;
                expect((connector as any).providerClass).to.eq(BaseProvider)
            });
            it("sending provider instance", () => {
                connector.setupProvider(new BaseProvider({channel: channel}));
                expect((connector as any).providerClass).to.be.undefined;
                expect((connector as any).provider).not.to.be.undefined;
                expect((connector as any).provider).to.be.instanceOf(BaseProvider);
                expect((connector as any).channel).not.to.be.undefined;
                expect((connector as any).channel).to.eq(channel)
            });
        });

        it("setChainAdapter", () => {
            const provider = new BaseProvider({channel: channel})
            const adapter = new BaseChainAdapter({
                provider: provider
            })
            connector.setChainAdapter(adapter);

            expect(connector.adapter).not.to.be.undefined;
            expect(connector.adapter).to.eq(adapter);
            expect((connector as any).provider).to.eq(provider);
            expect((connector as any).channel).to.eq(channel)
        });




    })

})