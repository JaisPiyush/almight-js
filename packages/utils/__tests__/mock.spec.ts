import { closeGanahceServer, startGanache } from "../src/mocks";
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
})