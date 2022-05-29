import { AsyncCallTimeOut } from "../src/exceptions";
import { asyncCallWithTimeBound } from "../src/functions";
import {expect} from "chai"

describe("Testing asyncCallWithTimeBound function", () => {

    async function getAsyncMethod() {
        setTimeout(() => {
            ////
        }, 2000);

        return 23;
    }

    it("Testing for async functions, successfull execution", async () => {


        expect(await asyncCallWithTimeBound(getAsyncMethod(), 3000)).to.eq(23);
    });

    it("Testing for async functions, failed due to timeout", async () => {
        try {
            await asyncCallWithTimeBound(getAsyncMethod(), 100);
        }catch(e){
            expect(e).to.be.instanceOf(AsyncCallTimeOut);
        }
    });
    it("Testing for regular error in async functions", async() => {
        async function errorProne() {
            await getAsyncMethod();
            throw new Error("random_error")
        }

        try {
            await asyncCallWithTimeBound(errorProne(), 3000);
            fail("Function is not throwing expected error")
        }catch(e){
            expect(e).not.to.be.instanceOf(AsyncCallTimeOut)
            expect(e.message).not.to.be.undefined;
            expect(e.message).to.be.eq("random_error")
        }
    });
})