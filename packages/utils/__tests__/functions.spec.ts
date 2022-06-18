import {  isWebPlatform } from "../src"
import { expect } from "chai"
import {findEnv, configEnv} from "../src/utility"


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


    describe("findEnv", () => {
        it("findEnv success in finding .env file", () => {
            const filePath = findEnv(__dirname);
            expect(filePath).not.to.equal(__dirname);
        });
        it("findEnv unable to find any env due to low stop_limit and thus returning dirname", () => {
            process.env["STOP_LIMIT"] = "1";
            const newFilePath = findEnv(__dirname);
            expect(newFilePath).to.equal(__dirname);
            process.env["STOP_LIMIT"] = "4";
        });
    });

    describe("configEnv", () => {
        
        it("configEnv able to find env variable in root of the project", () => {
            const out = configEnv();
            expect(process.env.NODE_ENV, findEnv(__dirname)).not.to.be.undefined;
        })
    })

});



