import { WebLocalStorage } from "../src";
import { StorageType } from "../src/types";
import {expect} from 'chai';


const storageMock = (() => {

    let store = {};

    return {
        getItem(key: string): any {
            return store[key];
        },
        setItem(key: string, value: any): void {
            return store[key] = value;
        },
        removeItem(key: string): void {
            delete store[key];
        },
        clear(): void {
            store = {}
        },
        getStore(): typeof store {
            return store;
        }
    }
});


Object.defineProperty(globalThis, 'localStorage', {
    value: storageMock()
});



describe("Testing WebLocalStorage class", () => {



    const storage = new WebLocalStorage()


    describe("Testing WebLocalStorage#isType", function () {
        it(`for ${StorageType.Session} expecting to fail`, () => {
            expect(storage.isType(StorageType.Session)).to.be.eq(false);
        });
    });

    it("Testing WebLocalStorage#isStorageDefined and expecting to throw false", () => {
        expect(storage.isStorageDefined()).to.be.eq(false);
    })

    it("Testing WebLocalStorage#isConnected, expecting it to return false", async function () {
        expect(await storage.isConnected()).to.be.eq(false);
    });

    it("Testing WebLocalStorage#connect method expect to pass ", async function () {
        await storage.connect();
        expect(await storage.isConnected()).to.be.eq(true);
    });

    describe("Testing WebLocalStorage's #setItem, #getItem, #hasKey, #removeItem, #clear methods", function () {


        const key = "arg"
        type randomType = { name: string, age: number, good: boolean }
        const value: randomType = { name: "JDVE", age: 20, good: true };

        it("Testing WebLocalStorage#getItem method after seting data", async function () {
            await storage.connect()
            expect(await storage.isConnected()).to.be.eq(true)
            await storage.setItem(key, value);
            expect(await storage.getItem<randomType>(key)).to.be.deep.eq(value);
        });

        it("Testing WebLocalStorage#hasKey method", async () => {
            expect(await storage.hasKey(key)).to.be.eq(true);
        });

        it("Tesitng WebLocalStorage#removeItem method", async() => {
            await storage.removeItem(key);
            expect(await storage.hasKey(key)).to.be.eq(false);
        });

        it("Testing WebLocalStorage#clear method", async() => {
            await storage.setItem(key, value);
            expect(await storage.hasKey(key)).to.be.equal(true);
            await storage.clear()
            expect(await storage.hasKey(key)).to.eq(false);
            expect(globalThis.localStorage.getStore()).to.deep.eq({})
        })
    });




});