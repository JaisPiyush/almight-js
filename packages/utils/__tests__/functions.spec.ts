import { Chains, Chainset, CHAINSET_RECORD, getChainSetRecord, getMetaDataSet, IMetaDataSet, isWebPlatform, META_DATA_SET, WebVersion } from "../src"
import { expect } from "chai"


describe("Util Functions", () => {
    describe("isWebPlatform function", () => {
        it("Expecting fail because document is not defined in globalThis", () => {
            expect(globalThis.document).to.undefined;
            expect(isWebPlatform()).not.to.be.true;
        });

        it("Expecting to pass", () => {
            Object.defineProperty(globalThis, "document", { value: {} })
            // console.log(globalThis.document)
            expect(globalThis.document).not.to.undefined;
            expect(isWebPlatform()).to.be.true;
        });
    });

    describe("getMetaDataSet", () => {
        it("Expecting constant META DATA SET", () => {
            expect(getMetaDataSet()).to.deep.equal(META_DATA_SET);
        });
        it("Expecting META DATA SET to equal the injected value", () => {
            const INJECTED_META_DATA_SET: Record<string, IMetaDataSet> = {
                "polygon": {
                    name: "Polygon",
                    identifier: "polygon", 
                    icon: "",
                    url: "",
                    webVersion: WebVersion.Decentralized,
                    supportDeepLink: false,
                    chainsets: []
                }
            }

            Object.defineProperty(globalThis, "META_DATA_SET", {
                value: INJECTED_META_DATA_SET,
                writable: true
            });

            expect(getMetaDataSet()).to.deep.equal(INJECTED_META_DATA_SET);
            expect(getMetaDataSet()).not.to.deep.equal(META_DATA_SET);
        })
    });

    describe('getChainSetRecord', () => { 

        it("Expecting constant Chainset Record", () => {
            expect(getChainSetRecord()).to.deep.equal(CHAINSET_RECORD);
        });

        it("Expecting CHAINSET_RECORD to equal the injected value", () => {
            const Chainset_Record: Record<string, Chainset> = {
                [Chains.Ethereum]: new Chainset({
                    name: "Ethereum",
                    identifier: Chains.Ethereum,
                    mainnetId: 1,
                    chainNets: [],
                    icon: "https://app.1inch.io/assets/images/network-logos/ethereum.svg",
                    currency: "ETH"
                }),
            }
            Object.defineProperty(globalThis, "CHAINSET_RECORD", {
                value: Chainset_Record,
                writable: true
            });

            expect(getChainSetRecord()).to.deep.equal(Chainset_Record)
            expect(getChainSetRecord()).not.to.deep.equal(CHAINSET_RECORD)
        })
     });


});



