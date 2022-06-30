import { expect } from "chai";
import { startGanache, closeGanahceServer, Server } from "@almight-sdk/utils/src/mocks";
import { BaseProvider, BrowserProviderChannel, BrowserSessionStruct, ChannelConnectionEstablishmentFailed, ConnectedChainNotAllowedError, EthereumChainAdapter } from "../src"
import { Chains } from "@almight-sdk/utils";


describe("EthereumChainAdapter", () => {

    const PORT = 8545;
    const CHAIN_ID = 1337;
    let server: Server<"ethereum">;
    before(async () => {
        server = await startGanache({ port: PORT });
    });

    after(async () => {
        await closeGanahceServer(server)

    });

    describe("BrowserProviderChannel", () => {
        const path = "spector"
        before(() => {
            Object.defineProperty(globalThis, path, {
                writable: true,
                configurable: true,
                value: server.provider
            })
        });

        const channel = new BrowserProviderChannel({ path: path, chainId: 0 });
        const provider = new BaseProvider<BrowserProviderChannel>({
            channel: channel
        });

        const adapter = new EthereumChainAdapter<BrowserProviderChannel, typeof provider>({
            provider: provider,
            onConnect: (options?: any): void => { }
        });

        it("pretest of mounting", async () => {
            expect(adapter.provider).not.to.be.undefined;
            expect(adapter.provider.channel).not.to.be.undefined;
            expect(adapter.bridge).to.be.undefined;
        });

        describe("checkSession", () => {
            it("checkSession must fail", async () => {
                const adapter = new EthereumChainAdapter({
                    provider: new BaseProvider({
                        channel: new BrowserProviderChannel({ path: "stocks", chainId: 0 })
                    })
                });

                expect(adapter.provider.channel).not.to.be.undefined;
                expect(adapter.provider.channel.session).to.deep.equal({ path: "stocks", chainId: 0 });
                expect(adapter.isConnected()).to.be.false;
                const sessionStatus = await adapter.checkSession<typeof server.provider>();
                expect(sessionStatus[0]).to.be.false;
                expect(sessionStatus[1]).to.be.undefined;
                expect(adapter.isConnected()).to.be.false;
                expect(adapter.bridge).to.be.undefined;
            });

            it("checkSession will pass", async () => {
                expect(adapter.provider.channel).not.to.be.undefined;
                expect(adapter.provider.channel.session).to.deep.equal({ path: path, chainId: 0 });
                expect(adapter.isConnected()).to.be.false;
                const sessionStatus = await adapter.checkSession<typeof server.provider>();
                expect(sessionStatus[0]).to.be.true;
                expect(sessionStatus[1]).not.to.be.undefined;
                expect(adapter.isConnected()).to.be.false;
                expect(adapter.bridge).to.be.undefined;
            });
        });


        describe("connect", () => {
            describe("connect will fail", () => {
                it("restrictedChains providing chain", async () => {
                    adapter.provider.setFilter({
                        restrictedChains: [Chains.Ethereum]
                    });

                    try {
                        await adapter.connect();
                        fail("Not throwing expected error `ConnectedChainNotAllowedError` ")
                    } catch (e) {
                        expect(e).to.be.instanceOf(ConnectedChainNotAllowedError);
                    }
                    expect(adapter.isConnected()).to.be.false
                });

                it("restrictedChains providing number", async () => {
                    adapter.provider.setFilter({
                        restrictedChains: [CHAIN_ID]
                    });

                    try {
                        await adapter.connect();
                        fail("Not throwing expected error `ConnectedChainNotAllowedError` ")
                    } catch (e) {
                        expect(e).to.be.instanceOf(ConnectedChainNotAllowedError);
                    }
                    expect(adapter.isConnected()).to.be.false
                });

                it("allowedChains providing chain", async () => {
                    adapter.provider.setFilter({
                        allowedChains: [Chains.Polygon]
                    });

                    try {
                        await adapter.connect();
                        fail("Not throwing expected error `ConnectedChainNotAllowedError` ")
                    } catch (e) {
                        expect(e).to.be.instanceOf(ConnectedChainNotAllowedError);
                    }
                    expect(adapter.isConnected()).to.be.false
                });
                it("allowedChains providing number", async () => {
                    adapter.provider.setFilter({
                        allowedChains: [24]
                    });

                    try {
                        await adapter.connect();
                        fail("Not throwing expected error `ConnectedChainNotAllowedError` ")
                    } catch (e) {
                        expect(e).to.be.instanceOf(ConnectedChainNotAllowedError);
                    }
                    expect(adapter.isConnected()).to.be.false
                })

                it("fail due to wrong session", async () => {
                    const _adapter = new EthereumChainAdapter({
                        provider: new BaseProvider<BrowserProviderChannel>({
                            channel: new BrowserProviderChannel({ path: "stocks", chainId: 0 })
                        }),
                        onConnect: (opt?: any): void => { }
                    });

                    try {
                        await _adapter.connect();
                        fail("Must raise error")
                    } catch (e) {
                        expect(e).to.be.instanceOf(ChannelConnectionEstablishmentFailed)
                    }
                    expect(_adapter.isConnected()).to.be.false;
                    expect((_adapter.provider.channel.session as BrowserSessionStruct).path).to.equal("stocks")
                    expect(_adapter.bridge).to.be.undefined;
                });

            });


            describe("connect will succeed", () => {
                it("connect without any filters", async () => {
                    adapter.provider.setFilter({
                        allowedChains: [],
                        restrictedChains: []
                    })
                    await adapter.connect();
                    expect(adapter.isConnected()).to.be.true;
                    expect(adapter.bridge).not.to.be.undefined;
                    expect((await adapter.getAccounts()).length).to.be.greaterThan(0);
                    const chainId = await adapter.getChainId();
                    expect(chainId).to.be.equal(adapter.getSession().chainId)
                    expect(chainId).not.equal(0)
                    expect(adapter.accounts.length).to.be.greaterThan(0);
                    expect(adapter.chainId).to.eq(CHAIN_ID)

                });

                it("connect with filters", async () => {
                    adapter.provider.setFilter({
                        allowedChains: [Chains.Ethereum],
                        restrictedChains: []
                    })
                    await adapter.connect();
                    expect(adapter.isConnected()).to.be.true;
                    expect(adapter.bridge).not.to.be.undefined;
                    expect((await adapter.getAccounts()).length).to.be.greaterThan(0);
                    const chainId = await adapter.getChainId();
                    expect(chainId).to.be.equal(adapter.getSession().chainId)
                    expect(chainId).not.equal(0)
                })
            })


        });




        describe("checkConnection", () => {
            it("success", async () => {
                expect(await adapter.checkConnection()).to.be.true;
            });
            it("failure", async () => {
                const adapter = new EthereumChainAdapter({
                    provider: new BaseProvider({
                        channel: new BrowserProviderChannel({ path: path, chainId: 0 })
                    })
                });

                expect(await adapter.checkConnection()).to.be.false;

                try {
                    expect(adapter.isConnected()).to.be.false;
                    await adapter.checkConnection(true);
                    fail("Must raise error")
                } catch (e) {
                    expect(e).to.be.instanceOf(ChannelConnectionEstablishmentFailed)
                }
            })
        })


        describe("getSession", () => {
            it("success", () => {
                const session = adapter.getSession() as BrowserSessionStruct;
                expect(session.path).to.eq(path);
                expect(session.chainId).not.to.eq(0);
                expect(session.chainId).to.eq(CHAIN_ID)
            })
        })


        describe("onConnect", () => {

            it("onConnect test", async () => {
                const adapter = new EthereumChainAdapter({
                    provider: new BaseProvider({
                        channel: new BrowserProviderChannel({ path: path, chainId: 0 }),
                    }),
                    onConnect: (options?: any): void => {
                        expect(adapter.isConnected()).to.be.true;
                        expect(options).to.have.property("accounts");
                        expect(true).to.be.false;

                    }
                });
            })
        })




    })


})