import {  isWebPlatform } from "../src"
import { expect } from "chai"


describe("Testing isWebPlatform function", () => {
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



