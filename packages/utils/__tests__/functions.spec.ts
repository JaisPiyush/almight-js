import { isWebPlatform } from "../src"



describe("Testing isWebPlatform function", () => {

    test("Expecting to pass", () => {
        console.log(window.document)
        expect(window.document).toBeDefined()
        expect(isWebPlatform()).toBe(true)
    })

    test("Expecting fail because document is not defined in window", () => {
        const doc = window.document;
        Object.defineProperty(window, "document", { value: undefined })
        expect(window.document).toBeUndefined()
        expect(isWebPlatform()).toBe(false)
    });




})