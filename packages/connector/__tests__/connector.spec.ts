import { expect, assert } from "chai";
import { AdapterIsNotDefined, BaseChainAdapter, BaseProvider, BaseProviderChannel, BrowserProviderChannel, BrowserSessionStruct, ConnectionEstablishmentFailed, Connector, ConnectorType, CurrentSessionStruct, getConfiguredWeb2IdentityProvider, getConfiguredWeb3IdentityProvider, IdentityProvider, IncompatibleSessionData, ISession, WalletConnectChannel } from "../src"
import { MockEthereumChainAdapter } from "../src/mocks/adapters";
import { startGanache, closeGanahceServer, Server} from "@almight-sdk/test-utils"
import { Providers } from "@almight-sdk/utils";

describe("Connector", () => {


    describe("Testing memeber functions", () => {
        let connector: Connector;
        const channel = new BaseProviderChannel({ path: "ethereum", chainId: 0 });
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
                    session: { path: "eth", chainId: 0 }
                }

                connector.setupSession(cSession);
                assert(connector.hasSession());
                expect(connector.currentSession).not.to.be.undefined;
                expect(connector.currentSession).to.deep.equal(cSession);
                expect(connector.session).to.deep.eq(cSession.session)
            });

            it("sending sessions", () => {
                assert(!connector.hasSession());
                const session: BrowserSessionStruct = { path: "eth", chainId: 0 };
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
                connector.setupProvider(new BaseProvider({ channel: channel }));
                expect((connector as any).providerClass).to.be.undefined;
                expect((connector as any).provider).not.to.be.undefined;
                expect((connector as any).provider).to.be.instanceOf(BaseProvider);
                expect((connector as any).channel).not.to.be.undefined;
                expect((connector as any).channel).to.eq(channel)
            });
        });

        it("setChainAdapter", () => {
            const provider = new BaseProvider({ channel: channel })
            const adapter = new BaseChainAdapter({
                provider: provider
            })
            connector.setChainAdapter(adapter);

            expect(connector.adapter).not.to.be.undefined;
            expect(connector.adapter).to.eq(adapter);
            expect((connector as any).provider).to.eq(provider);
            expect((connector as any).channel).to.eq(channel)
        });



        describe("getChannelConstructorArguments", () => {
            const session: BrowserSessionStruct = { path: "ethereum", chainId: 0 };
            it("session is provided", () => {
                const connector = new Connector<BrowserSessionStruct>({
                    session: session
                });
                expect(connector.session).not.to.be.undefined;
                expect(connector.getChannelConstructorArguments()).to.deep.eq(session)

            });

            it("channelArgs provided", () => {
                const connector = new Connector<BrowserSessionStruct>({
                    args: {
                        channelArgs: session
                    }
                });
                expect(connector.session).to.be.undefined;
                expect(connector.getChannelConstructorArguments()).to.deep.eq(session)

            });
        });

        describe("getChannel", () => {
            it("channel is provided", () => {
                const connector = new Connector({
                    channel: channel
                });

                expect((connector as any).channel).not.to.undefined;
                expect(connector.getChannel()).to.eq(channel)
            });
            describe("identityProvider is provided", () => {
                const idp = getConfiguredWeb3IdentityProvider(Providers.MetaMask, {
                    adapterClass: MockEthereumChainAdapter,
                    providerClass: BaseProvider
                });
                it("identityProvider is provided along with session", () => {

                    const session: BrowserSessionStruct = { path: "ethereuem", chainId: 0 }

                    const connector = new Connector<BrowserSessionStruct>({
                        identityProvider: idp,
                        session: session
                    });
                    expect((connector as any).identityProvider).to.equal(idp);
                    expect((connector as any).providerIdentifier).to.eq(Providers.MetaMask);
                    const channel = connector.getChannel();
                    expect(channel).not.to.be.undefined;
                    expect(channel).to.be.instanceOf(BrowserProviderChannel);
                    expect(channel.session).to.deep.eq(session)

                });
                it("failing to produce any channel due to filters and invalid session", () => {
                    const session: BrowserSessionStruct = { path: "ethereuem", chainId: 0 }

                    const connector = new Connector<BrowserSessionStruct>({
                        identityProvider: idp,
                        session: session,
                        filters: {
                            allowedConnectorTypes: [ConnectorType.WalletConnector]
                        }
                    });

                    expect((connector as any).identityProvider).to.equal(idp);
                    expect((connector as any).channel).to.be.undefined;
                    try {
                        connector.getChannel();
                        fail("getChannel was expected to throw error")
                    } catch (e) {
                        expect((<Error>e).message).to.eq("Not able to find any channel for the connector")
                    }
                });


            });

            describe("channelClass is provided", () => {
                it("channelClass without any session will succeed", () => {
                    const connector = new Connector<ISession, WalletConnectChannel>({
                        channel: WalletConnectChannel
                    });
                    expect((<any>connector).channelClass).not.to.be.undefined;
                    const channel = connector.getChannel();
                    expect(channel).not.to.be.undefined;
                    expect(channel.session).to.be.undefined;
                });
                it("channelClass with a wrong session will fail", () => {
                    const session: BrowserSessionStruct = { path: "ethereuem", chainId: 0 }
                    const connector = new Connector({
                        channel: WalletConnectChannel,
                        session: session as ISession
                    });
                    expect((<any>connector).channelClass).not.to.be.undefined;
                    expect(connector.session).to.deep.eq(session);
                    try {
                        connector.getChannel();
                    } catch (e) {
                        expect(e).to.be.instanceOf(IncompatibleSessionData)
                    }
                });
                it("channelClass with correct session will succeed", () => {
                    const session: BrowserSessionStruct = { path: "ethereuem", chainId: 0 }
                    const connector = new Connector<BrowserSessionStruct, BrowserProviderChannel>({
                        channel: BrowserProviderChannel,
                        session: session
                    });
                    expect((<any>connector).channelClass).not.to.be.undefined;
                    expect(connector.session).to.deep.eq(session);

                    const channel = connector.getChannel();
                    expect(channel).to.be.instanceOf(BrowserProviderChannel);
                    expect(channel.session).to.deep.eq(session)
                })
            })
        })




    });


    describe("Testing with BrowserProviderChannel and Ganache", () => {
        const PORT = 8545;
        const path = "ethereum";
        let server: Server<"ethereum">;

        before(async () => {
            server = await startGanache({ port: PORT });
            if (globalThis[path] === undefined) {
                Object.defineProperty(globalThis, path, {
                    value: server.provider,
                    writable: true,
                    configurable: true
                })
            }
        });

        after(async () => {
            await closeGanahceServer(server);
            Object.defineProperty(globalThis, path, {
                value: undefined,
                writable: true,
                configurable: true
            })
        });
        const idp = getConfiguredWeb3IdentityProvider(Providers.MetaMask, {
            adapterClass: MockEthereumChainAdapter,
            providerClass: BaseProvider
        });

        describe("Providing IdentityProvider", () => {

            const session: BrowserSessionStruct = { path: path, chainId: 0 }
            it("identityProvider instance in the constructor", async () => {
                const connector = new Connector({
                    identityProvider: idp,
                    session: session
                });

                await connector.connect();
                expect(connector.isConnected()).to.true;
                expect(connector.adapter?.accounts.length).to.be.greaterThan(0)

            });

            it("identityProvider instance in connect", async () => {
                const connector = new Connector({
                    session: session
                });

                await connector.connect({ provider: idp });
                expect(connector.isConnected()).to.true;
                expect(connector.adapter?.accounts.length).to.be.greaterThan(0)
            });

            it("using identityProviderMap and correct provider will succeed", async () => {
                const connector = new Connector({
                    session: session,
                    identityProvidersMap: {
                        [Providers.MetaMask]: idp
                    }
                });

                await connector.connect({ provider: Providers.MetaMask });
                expect(connector.isConnected()).to.true;
                expect(connector.adapter?.accounts.length).to.be.greaterThan(0)
            })

            it("using identityProviderMap and wrong provider will fail", async () => {
                const connector = new Connector({
                    session: session,
                    identityProvidersMap: {
                        [Providers.MetaMask]: idp
                    }
                });

                try {
                    await connector.connect({ provider: Providers.Discord });
                    fail("Must throw error due to validateArguments")
                } catch (e) {
                    expect((<Error>e).message).to.eq("Insufficient arguments to create Connector")
                }
            })
        });

        it("Providing provider class", async () => {
            class MockEthereumProvider extends BaseProvider<BrowserProviderChannel> {
                public static providerPath: string = path
            }

            const connector = new Connector<BrowserSessionStruct, BrowserProviderChannel, MockEthereumProvider>({
                provider: MockEthereumProvider,
                channel: BrowserProviderChannel
            })

            await connector.connect({ provider: idp });
            expect(connector.isConnected()).to.true;
            expect(connector.accounts.length).to.be.greaterThan(0);
            expect(connector.selectedAccount).to.eq(connector.accounts[0]);
        });

        describe("testing getFormatedSession and getFormatedCurrerntSession", () => {

            class MockEthereumProvider extends BaseProvider<BrowserProviderChannel> {
                public static providerPath: string = path
            }

            const connector = new Connector<BrowserSessionStruct, BrowserProviderChannel, MockEthereumProvider>({
                provider: MockEthereumProvider,
                channel: BrowserProviderChannel,
                identityProvidersMap: {
                    [Providers.MetaMask]: idp
                }
            });

            it("will throw error due to no connection", () => {
                connector.setupIdentityProvider(idp)
                connector.setChainAdapter(
                    connector.getChainAdapter()
                )
                try {
                    connector.getFormatedSession();
                    fail("must throw connection establishment failed")
                }catch(e){
                    expect(e).to.be.instanceOf(ConnectionEstablishmentFailed)
                }
            });

            it("will produce BrowserSessionStruct", async () => {
                connector.adapter = undefined;
                await connector.connect({provider: Providers.MetaMask});
                const session = connector.getFormatedSession();
                expect(session).not.to.be.undefined;
                expect(session.path).to.equal(path);
                expect(session.chainId).to.equal(connector.chainId)
                expect(session.chainId).not.to.eq(0)
            });

            it("will produce current session", async() => {
                await connector.connect({provider: Providers.MetaMask});
                const currentSession = connector.getFormatedCurrentSession();
                expect(currentSession.uid).to.eq(connector.selectedAccount);
                expect(currentSession.provider).to.eq(idp.identifier);
                expect(currentSession.session).to.deep.eq(connector.getFormatedSession())
                
            })




        })


    })

})