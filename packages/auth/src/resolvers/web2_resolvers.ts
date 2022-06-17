import { IdentityProvider } from "@almight-sdk/connector";
import {  Web2AuthenticationDelegate } from "../delegate";
import { AllowedQueryParams, UserRegistrationArgument } from "../types";
import { IdentityResolver } from "./resolver";

export interface Web2UserRegistrationArgument extends UserRegistrationArgument {
    [AllowedQueryParams.Code]: string;
    [AllowedQueryParams.Challenge]?: string;
}


export type onWeb2AuthenticationSuccessData = Omit<Web2UserRegistrationArgument, AllowedQueryParams.Provider>;
export interface onWeb2AuthenticationFailureData {
    [AllowedQueryParams.Error]: string,
    [AllowedQueryParams.ErrorCode]?: number | string
}


export type onWeb2AuthenticationData = onWeb2AuthenticationSuccessData | onWeb2AuthenticationFailureData;
export class Web2IdentityResolver extends IdentityResolver {

    public delegate: Web2AuthenticationDelegate;

    constructor(provider: IdentityProvider){
        super();
        this.provider = provider;
    }

    /**
     * Get redirect url from server for the provider
     * 
     * @param data 
     */
    override async generateRedirectUrl(data: { projectIdentifier: string }): Promise<string> {
        const { url, verifiers } = await this.delegate.getOAuthUrl(this.provider.identifier as string, data.projectIdentifier)
        await this.delegate.setStates({
            [AllowedQueryParams.Verifiers]: verifiers
        })
        return url;
    }

    /**
     * [AllowedQueryParams.Verifiers] must be present in the storage
     * for each property in Verifiers data must contain all the properties with
     * exact same values in order to pass, otherwise verifyWillFail
     * @param data 
     */
    async verifySuccessParametes(data: Record<string, string>): Promise<boolean> {
        if (!await this.delegate.storage.hasKey(AllowedQueryParams.Verifiers)) return false;
        const verifiers = await this.delegate.storage.getItem<Record<string, string>>(AllowedQueryParams.Verifiers);
        return Object.entries(verifiers).every(([prop, value]) => {
            return data[prop] === value;
        });
    }

    /**
     * If provided data contains AllowedQueryParams.Code or AllowedQueryParams.Error
     * that means authentication is done, and thus we only required to send back the data
     * Otherwise, retrieve projectIdentifier and redirect to oauth url for authentication
     * 
     * If projectidentifier is missing, then throw @error and respond failure 
     * 
     * @param data 
     * 
     */
    override async captureUri(data: Record<string, string>): Promise<void> {

        try {
            if (data[AllowedQueryParams.Code] !== undefined || data[AllowedQueryParams.Error] !== undefined) {
                await this.authenticateAndRespond(data as onWeb2AuthenticationData);

            } else {
                if(! await this.delegate.storage.hasKey(AllowedQueryParams.ProjectId)) throw new Error("Project not found")
                const url = await this.generateRedirectUrl({
                    projectIdentifier: await this.delegate.storage.getItem<string>(AllowedQueryParams.ProjectId)
                });
                this.delegate.redirectTo(url);
            }
        }catch(e){

            await this.authenticateAndRespond({[AllowedQueryParams.Error]: (e as Error).message,
                 [AllowedQueryParams.ErrorCode]: "10000"});
        }
        
    }

    override async getUserRegistrationArguments(): Promise<Web2UserRegistrationArgument> {
        const data: Web2UserRegistrationArgument = {
            [AllowedQueryParams.Code]: await this.delegate.storage.getItem<string>(AllowedQueryParams.Code),
            [AllowedQueryParams.Provider]: await this.delegate.storage.getItem<string>(AllowedQueryParams.Provider),
            [AllowedQueryParams.Challenge]: await this.delegate.storage.getItem<string>(AllowedQueryParams.Challenge)
        }
        return data;
    }


    override async authenticateAndRespond(data:onWeb2AuthenticationData): Promise<void> {
        if(data[AllowedQueryParams.Error] !== undefined) {
            await this.delegate.respondFrame.respondFailure(data as Record<string, string>);
            return;
        }
        if(data[AllowedQueryParams.Code] !== undefined && await this.verifySuccessParametes(data as Record<string, string>)){
            const userData = await this.getUserRegistrationArguments();
            await this.delegate.respondFrame.respondSuccess((userData as unknown) as Record<string, string>)
        }
        await this.delegate.respondFrame.respondFailure({
            [AllowedQueryParams.Error]: "Authenticity of credentials failed",
            [AllowedQueryParams.ErrorCode]: "9999"
        });
    }

   



}