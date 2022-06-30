import { closeGanahceServer, startGanache } from "../src/mocks";
import { expect } from "chai";
import { Server } from "ganache";



describe("startGanache", () => {
    let server: Server<"ethereum">;

    before(async () => {
        server = await startGanache({});
    });


    it("fetching accounts will be success", async () => {
        const provider = server.provider;
        const accounts = await provider.request({
            method: "eth_accounts",
            params:[]
        });

        expect(accounts.length).to.greaterThan(0);
    });

    after(async () => {
        if (server !== undefined) {
            closeGanahceServer(server);
        }
    })
})