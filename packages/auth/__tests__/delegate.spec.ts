import { expect } from "chai";
import {LocalStorageMock} from "@almight-sdk/utils/src/mocks"
import { beforeEach } from "mocha";
import {AlmightClient} from "@almight-sdk/core"
import { WebLocalStorage } from "@almight-sdk/utils";


describe("AuthenticationDelegate", () => {

    let almightClient;

    beforeEach(() => {
        Object.defineProperty(globalThis, "localStorage", {
            value: new LocalStorageMock(),
            writable: true
        });
        almightClient = new AlmightClient({
            storage: new WebLocalStorage(),
            apiKey: process.env["ALMIGHT_API_KEY"] as string
        });
    });

    it("getOAuthUrl", async () => {
        expect(process.env["ALMIGHT_API_KEY"]).not.to.be.undefined;
        expect(process.env["NODE_ENV"]).to.equal("dev");
    });






})