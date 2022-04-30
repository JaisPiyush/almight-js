import { BrowserProviderChannel } from "../src/channel";
import { IncompatiblePlatform } from "../src/exceptions";
import {expect} from "chai"


let chainName = () => {
    return {
        isServiceProvider: () => true,
        request: async (data: { method: string, params: any[] }) => {
            return `${data.method}__${data.params.join("..")}`;
        }
    }
}

describe("Testing BrowserProviderChannel class with injected prop", () => {

    it("Throws IncompatiblePlatform when called on non browser platform", () => {
        try {
            new BrowserProviderChannel();
        }catch(e){
            expect(e).to.be.instanceOf(IncompatiblePlatform);
        }
    })
    const path = "darwin"
    // const emptyChannel = new BrowserProviderChannel();
    // emptyChannel.providerPath = path;
    // const channel = new BrowserProviderChannel({path: path});

    


});