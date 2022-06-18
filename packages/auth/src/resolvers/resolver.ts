import { IdentityProvider } from "@almight-sdk/connector";
import { WebLocalStorage } from "@almight-sdk/utils";
import { AuthenticationDelegate } from "../delegate";
import {  IdentityResolverInterface, UserRegistrationArgument } from "../types";


export class IdentityResolver implements IdentityResolverInterface {
    public provider: IdentityProvider;

    public get identifier(): string | number { return this.provider.identifier }

    public delegate: AuthenticationDelegate;


    async getItemFromStorage<T = any>(key: string): Promise<T | null> {
        if (this.delegate === undefined) return null;
        return this.delegate.storage.getItem<T>(key);
    }


    isWebVersion(version: number): boolean {
        return this.provider.webVersion === version;
    }

    getStates(data?: Record<string, string>): Record<string, string> {
        throw new Error("Method not implemented.");
    }

    // async initAuth(): Promise<void> {
    //     throw new Error("Method not implemented.");
    // }

    /**
     * This function will verify all required parameters and call
     * authentication functions accordingly
     * 
     * In case of native web3 authentication this will store webVersion of the data
     * 
     * @param data 
     */
    async captureUri(data: Record<string, string>): Promise<void> {
        throw new Error("Method not implemented.");
    }

    generateRedirectUrl(data?: Record<string, string>): string | Promise<string> {
        throw new Error("Method not implemented.");
    }

    async cleanup(storage: WebLocalStorage): Promise<void> {
        throw new Error("Method not implemented")
    }

    /**
     * This function will handle user registration on almight server
     * and then respond back the status
     * 
     * @param data 
     */
    async authenticateAndRespond(data: any): Promise<void> {
        throw new Error("Method not implemented")
    }

    /** Method is called after authentication is completed
     * The method will carry the required data to respond back to client
     * 
     */
    onAuthenticationRedirect(options?: any): void { }

    async getUserRegistrationArguments(): Promise<UserRegistrationArgument> {
        throw new Error("Method not implemented")
    }

}

