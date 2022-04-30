import { BrowserProviderChannel } from "../src/channel";
import { IncompatiblePlatform } from "../src/exceptions";
import {expect, assert} from "chai"
import { IChannelBehaviourPlugin } from "../src/types";


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
    Object.defineProperty(globalThis, "document", {value: {}})
    Object.defineProperty(globalThis, path, {value: chainName()})

    
    
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
    
    const channel = new BrowserProviderChannel({path: path});

    it("without calling connect provider must be undefined", async function(){
        expect(channel.provider).to.be.undefined;
    });

    it("testing #connect method", async function(){
        await channel.connect(undefined);
        expect(channel.provider).to.be.undefined;

        await channel.connect({name: "testing"});
        expect(channel.provider).to.deep.equal({name:"testing"});
        
    });

    it("testing checkConnection and #onConnect on insertion", async function(){

        let obj = {
            onConnect: function(options: any){
                expect(options.isServiceProvider).not.to.be.undefined
                assert(options.isServiceProvider())
            }
        }
        await channel.checkConnection(obj);
        expect(channel.isConnected).to.be.true;
        expect(channel.provider).not.to.be.undefined;
        expect(channel.provider).to.have.property("isServiceProvider");
    });

    it("testing rawRequest and  request", async function(){
        await channel.checkConnection()
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

    class FunckyBehaviourPlugin implements IChannelBehaviourPlugin {

       async connect<T, R = any>(options?: R):Promise<T>{
           return ({name: "funcky"} as any) as T;
       }
    }


    const funckyChannel = new BrowserProviderChannel(undefined, new FunckyBehaviourPlugin());

    it("testing the correct binding of plugin", async function(){
        expect(funckyChannel.getBehaviourMethod("connect")).not.to.undefined;
        expect(await funckyChannel.getBehaviourMethod("connect")()).to.deep.equal({name: "funcky"})
    })

    it("testing change in behaviour due to plugin", async function(){
        expect(await funckyChannel.connect<{name:string}, string>("some_option")).to.deep.eq({name: "funcky"});      
    });

});