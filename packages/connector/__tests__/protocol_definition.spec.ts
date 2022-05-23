import {BaseProtocolDefination, BaseChainAdapter, ProviderRequestMethodArguments, BrowserProviderChannel} from "../src"
import {expect} from "chai"

class MockChainAdapter extends BaseChainAdapter {

    async request<T = any>(data: ProviderRequestMethodArguments, timeout?: number): Promise<T> {
        return (`${data.method}_rubbed` as any) as T
    }
}


describe('Testing BaseProtocolDefination', () => { 
    it("Testing adapter binding and connection",  async () => {
        
        // Add definition after class construction
        let adapter = new MockChainAdapter({
            channel: new BrowserProviderChannel()
        });

        expect(adapter.protocol).to.be.undefined;

        let protocol = new BaseProtocolDefination();

        expect(protocol.adapter).to.be.undefined;

        adapter.bindProtocol(protocol);

        expect(adapter.protocol).not.to.be.undefined;
        expect(adapter.protocol).to.instanceOf(BaseProtocolDefination);
        expect(adapter.protocol).to.equal(protocol);
        expect(protocol.adapter).not.to.be.undefined;
        expect(protocol.adapter).to.be.instanceOf(MockChainAdapter);
        expect(protocol.adapter).to.equal(adapter);

        const a1Req = await protocol.request<string>({method: "a1Req", params:[]});
        expect(a1Req).to.eq('a1Req_rubbed');


        // Add protocol defination during Adapter class instanciation
        let adapter2 = new MockChainAdapter({
            channel: new BrowserProviderChannel(),
            protocolDefination: new BaseProtocolDefination()
        });

        expect(adapter2.protocol).not.to.be.undefined;
        expect(adapter2.protocol).to.instanceOf(BaseProtocolDefination);
        expect(adapter2.protocol.adapter).to.eq(adapter2)

        // Add adapter in Protocol Defination durin class instanciation
        let adapter3 = new MockChainAdapter({
            channel: new BrowserProviderChannel()
        })

        let proto = new BaseProtocolDefination(adapter3);
        expect(proto.adapter).not.to.undefined;
        expect(adapter3.protocol).not.to.be.undefined;
        expect(adapter3.protocol).to.eq(proto);
        expect(proto.adapter).to.eq(adapter3);




    })
 })