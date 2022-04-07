import {WebLocalStorage} from "../src";
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
        }
    }
});


Object.defineProperty(window, ' localStorage', {
    value: storageMock
});

describe("Testing WebLocalStorage class", () => {

    const storage = new WebLocalStorage()

    describe("Testing WebLocalStorage#isType", function(){
        test(`for ${StorageType.Session} expecting to fail`, () => {
            expect(storage.isType(StorageType.Session)).toBe(false);
        });
    });

    test("Testing WebLocalStorage#isConnected, expecting it to return false", async function(){});

    test("Testing WebLocalStorage#connect method", async function(){
        await storage.connect();
    });

});