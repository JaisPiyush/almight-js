import { BrowserProviderChannel } from "../src/channel";
import { IncompatiblePlatform } from "../src/exceptions";
import {expect, assert} from "chai"
import { BasicExternalProvider, IProviderAdapter } from "../src/types";
import {ChannelBehaviourPlugin} from "../src/channel_plugin"


let chainName = () => {
    return {
        isServiceProvider: () => true,
        request: async (data: { method: string, params: any[] }) => {
            if(data.method === "ping"){
                throw new Error("Invalid JSON-RPC error")
            }
            return `${data.method}__${data.params.join("..")}`;
        }
    }
}




describe("Mock Testing BrowserProviderChannel class with injected prop", () => {

    it("Throws IncompatiblePlatform when called on non browser platform", () => {
        try {
            new BrowserProviderChannel();
        }catch(e){
            expect(e).to.be.instanceOf(IncompatiblePlatform);
        }
    });

    const path = "darwin"

    // Mocking browser behaviour
    Object.defineProperty(globalThis, "document", {value: {}, writable: true})
    Object.defineProperty(globalThis, path, {value: chainName(), writable: true})

    
    
    it("without any provider path, checkSession must fail to find any provider", async function() {
        const emptyChannel = new BrowserProviderChannel();
        const [isConnected, provider] = await emptyChannel.checkSession();
        expect(isConnected).to.be.false;
        expect(provider).to.be.undefined;
    })

    it("checkSession must pass to find the provider", async function(){
        const emptyChannel = new BrowserProviderChannel();
        emptyChannel.providerPath = path;
        const [isConnected, provider] = await emptyChannel.checkSession();
        expect(isConnected).to.be.true;
        expect(provider).not.to.be.undefined;
    })
    
    const channel = new BrowserProviderChannel({path: path, chainId: 1});

    it("without calling connect provider must be undefined", async function(){
        expect(channel.provider).to.be.undefined;
    });

    it("testing #connect method", async function(){
        await channel.connect(undefined);
        expect(channel.provider).not.to.be.undefined;
        await channel.connect(({name: "testing"}  as unknown)as BasicExternalProvider);
        expect(channel.provider).to.deep.equal({name:"testing"});
        
    });

    it("testing checkConnection and #onConnect on insertion", async function(){

        let obj: unknown = {
            onConnect: function(options: any){
                expect(options.isServiceProvider).not.to.be.undefined
                assert(options.isServiceProvider())
            }
        }
        await channel.connect(undefined, obj as IProviderAdapter);
        expect(channel.isConnected).to.be.true;
        expect(channel.provider).not.to.be.undefined;
        expect(channel.provider).to.have.property("isServiceProvider");
    });

    it("testing rawRequest and  request", async function(){
        await channel.connect()
        expect(channel.isConnected).to.be.true;
        expect(channel.provider).not.to.be.undefined;
        
        // Testing _rawRequest
        const data = {method:"eth_test", params:["hello"]};
        const expected = `${data.method}__${data.params.join(',')}`
        const _res = await channel._rawRequest(data);
        expect(_res).to.eq(expected)

        expect(await channel.request(data)).to.eq(expected)
    })

});


describe("Mock Testing BrowserProviderChannel with behaviour plugin", function(){

    class FunckyBehaviourPlugin extends ChannelBehaviourPlugin {

       channelConnect = async <R = any>(options?: R, channel?: BrowserProviderChannel):Promise<void> => {
           channel.setProvider(options as any);
       }
    }


    const funckyChannel = new BrowserProviderChannel(undefined, new FunckyBehaviourPlugin());

    it("testing change in behaviour due to plugin", async function(){
        await funckyChannel.connect(("some_things" as unknown) as BasicExternalProvider)
        expect(funckyChannel.provider).to.eq("some_things")
    });

});