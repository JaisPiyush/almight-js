import {ProviderRequestMethodArguments } from "./types";

export interface IMetaMaskBrowserProvider  {

    isMetaMask: boolean;

    isConnected(): boolean;

    request(args: ProviderRequestMethodArguments): Promise<unknown>;

    on(name: string, callback: (payload: unknown) => void): void;

    removeListener(name: string, callback: (payload: unknown) => void): void;
}


