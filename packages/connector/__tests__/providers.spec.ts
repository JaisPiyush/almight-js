import {BaseProvider} from "../src/providers";


let ethereum = () => {



    return {
        isMetaMask: true,
        isConnected: () => true,
        request: async (method: string, params?: unknown[] | object) => {
            return `request_is_called_for_${method}_from_phantom`
        }
    }
}

let solana = () => {
    return {
        isPhantom: true,
        isConnected: () =>  true,
        request: async (method: string, params?: unknown[] | object) => {
            return `request_is_called_for_${method}_from_phantom`
        }
    }
}


Object.defineProperty(window, "ethereum", {
    value: ethereum()
})

Object.defineProperty(window, "solana", {
    value: solana()
})

describe('Testing BaseProvider class with mocks', () => { })