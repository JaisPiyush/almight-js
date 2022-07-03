import { closeGanahceServer, startGanache, MockServer } from "../src/mocks";
import { expect } from "chai";
import { Server } from "ganache";
import axios from "axios"




describe("startGanache", () => {
    const PORT = 8545
    let server: Server<"ethereum">;
    const url = `http://localhost:${PORT}/`

    before(async () => {
        server = await startGanache({port: PORT});
    });


    it("fetching accounts will be success", async () => {
        const provider = server.provider;
        const accounts = await provider.request({
            method: "eth_accounts",
            params:[]
        });

        expect(accounts.length).to.greaterThan(0);
    });

    it("fetching using localhost", async () => {
       const res = await axios.post<{result: string[]}>(url, {
        method: "eth_accounts"
       });
       expect(res.status).to.eq(200);
       expect(res.data.result).not.to.be.undefined;
       expect(res.data.result.length).to.be.greaterThan(0)
    })

    after(async () => {
        if (server !== undefined) {
            closeGanahceServer(server);
        }
    })
});

describe("MockServer", () => {

    const mockServer = new MockServer()
    const port = 8000;

    const url = "http://localhost:8000"

    before(async () => {
        mockServer.start(port);
    });
    after(async () => {
        mockServer.stop();
    });

    it("testing forPath", () => {
        const handler = mockServer.forPath("/indest");
        expect(mockServer.pathMethodsMap["/indest"]).not.to.be.undefined;
        const data = {status: 200, data: 24}
        handler.forGet(data);
        expect(handler.methodResponseMap["get"]).to.deep.eq(data)
    })

    it("get request", async () => {
        mockServer.forPath('/hello').forGet({status: 200, data: "Hello World"});
        const res = await axios.get(`${url}/hello`);
        expect(res.status).to.equal(200);
        expect(res.data).to.eq("Hello World")
    })

    it("get request", async () => {
        const data = {
            name: "Piyush",
            age: 20
        }
        mockServer.forPath('/hello').forGet({status: 200, data: data});
        const res = await axios.get(`${url}/hello`);
        expect(res.status).to.equal(200);
        expect(res.data).to.deep.eq(data)
    });
    it("post request", async () => {
        const data = {
            name: "Piyush",
            age: 20
        }
        mockServer.forPath('/hello').forPost({status: 200, data: data});
        const res = await axios.get(`${url}/hello`);
        expect(res.status).to.equal(200);
        expect(res.data).to.deep.eq(data)
    });
    it("get request with header", async () => {
        const data = {
            name: "Piyush",
            age: 20
        }
        mockServer.forPath('/hello').forGet({status: 200, data: data});
        const res = await axios.get(`${url}/hello`, {
            headers: {
                "X-PROJECT-IDENT": "project-ident-123"
            }
        });
        expect(res.status).to.equal(200);
        expect(res.data).to.deep.eq(data)
    })


})