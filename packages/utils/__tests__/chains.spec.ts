import { expect } from "chai";
import {Chains, getChainManager, getChainSetRecord, getMetaDataSet, Providers} from "../src"


describe("ChainManager", () => {

    const chainManager = getChainManager();
    const chainRecord = getChainSetRecord();
    const metaData = getMetaDataSet();
    
    describe("getChainsetFromIdentifier", () => {
        it("succeed", () => {
            const chainset = chainManager.getChainsetFromIdentifier(Chains.Ethereum);
            const eth = chainRecord[Chains.Ethereum];
            expect(chainset.identifier).to.equal(eth.identifier);
            expect(chainset.mainnet).to.deep.equal(eth.mainnet)
        });

        it("failure", () => {
            const chainset = chainManager.getChainsetFromIdentifier("namr");
            expect(chainset).to.be.undefined
        });
    });

    describe("getProvidersFromChainId", () => {
        it("succeed", () => {
            // const eth = metaData[Providers.MetaMask];
            const providers = chainManager.getProvidersFromChainId(1);
            expect(providers.length).to.be.greaterThan(0);
            expect(providers).to.include(Providers.MetaMask);

            const provs = chainManager.getProvidersFromChainId(1337);
            expect(provs.length).to.be.greaterThan(0);
            expect(provs).to.include(Providers.MetaMask);
        });
        it("failure", () => {
            const providers = chainManager.getProvidersFromChainId(67);
            expect(providers.length).not.to.be.greaterThan(0);
            expect(providers).not.to.include(Providers.MetaMask);
        });
    });

    
})