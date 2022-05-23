
import {expect} from "chai";
import {WebLocalStorage} from "../src"

describe("Calculator Mocha", () => {
    var localStorage: WebLocalStorage
    beforeEach(() => {
        localStorage = new WebLocalStorage();
    });

    it("can connect", async () => {
        await localStorage.connect()
        expect(await localStorage.isConnected()).to.be.true;
    })

})