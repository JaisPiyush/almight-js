import { WebLocalStorage } from "../src";
import { UnsuitablePlatformException } from "../src/exceptions";
import { StorageType } from "../src/types";


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


Object.defineProperty(window, 'localStorage', {
    value: storageMock()
});



describe("Testing WebLocalStorage class", () => {



    const storage = new WebLocalStorage()


    describe("Testing WebLocalStorage#isType", function () {
        test(`for ${StorageType.Session} expecting to fail`, () => {
            expect(storage.isType(StorageType.Session)).toBe(false);
        });
    });

    test("Testing WebLocalStorage#isStorageDefined and expecting to throw false", () => {
        expect(storage.isStorageDefined()).toBe(false);
    })

    test("Testing WebLocalStorage#isConnected, expecting it to return false", async function () {
        expect(await storage.isConnected()).toBe(false);
    });

    test("Testing WebLocalStorage#connect method expect to pass ", async function () {
        await storage.connect();
        expect(await storage.isConnected()).toBe(true);
    });

    describe("Testing WebLocalStorage's #setItem, #getItem, #hasKey, #removeItem, #clear methods", function () {


        const key = "arg"
        type randomType = { name: string, age: number, good: boolean }
        const value: randomType = { name: "JDVE", age: 20, good: true };

        test("Testing WebLocalStorage#getItem method after seting data", async function () {
            await storage.connect()
            expect(await storage.isConnected()).toBe(true)
            await storage.setItem(key, value);
            expect(await storage.getItem<randomType>(key)).toStrictEqual(value);
        });

        test("Testing WebLocalStorage#hasKey method", async () => {
            expect(await storage.hasKey(key)).toBe(true);
        });

        test("Tesitng WebLocalStorage#removeItem method", async() => {
            await storage.removeItem(key);
            expect(await storage.hasKey(key)).toBe(false);
        });

        test("Testing WebLocalStorage#clear method", async() => {
            await storage.setItem(key, value);
            expect(await storage.hasKey(key)).toBe(true);
            await storage.clear()
            expect(await storage.hasKey(key)).toBe(false);
            expect(window.localStorage.getStore()).toStrictEqual({})
        })
    });




});