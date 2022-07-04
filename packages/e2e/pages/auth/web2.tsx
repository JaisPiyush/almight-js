import { AlmightClient } from "@almight-sdk/core"
import { Providers, WebLocalStorage } from "@almight-sdk/utils"
import { AllowedQueryParams, AuthenticationApp, ErrorResponseMessageCallbackArgument } from "@almight-sdk/auth";
import { expect } from "chai";
import { NextPage } from "next";
import { useEffect, useRef } from "react";
import {OAuthProviders} from "@almight-sdk/oauth-adapters"

const Web2: NextPage = () => {
    let almight = useRef<AlmightClient>();
    let auth = useRef<AuthenticationApp>();


    useEffect(() => {
        almight.current = new AlmightClient({
            storage: new WebLocalStorage(),
            apiKey: process.env['NEXT_PUBLIC_ALMIGHT_API_KEY'] as string
        });
        auth.current = new AuthenticationApp({
            almightClient: almight.current,
            identityProviders: OAuthProviders ,
            onFailureCallback: (data: ErrorResponseMessageCallbackArgument) => {
                console.log("Failure", data);
                expect(data).to.have.property(AllowedQueryParams.Error);
                expect(data).to.have.property(AllowedQueryParams.ErrorCode);
                expect(data).not.to.have.property("access");
            },
            onSuccessCallback: (data) => {
                console.log("Success", data);
                
                expect(data).not.to.have.property(AllowedQueryParams.Error);
                expect(data).to.have.property('user');
            }
        });
    }, [])



    function onButtonClick(): void {
        // console.log("API Key", process.env['NEXT_PUBLIC_ALMIGHT_API_KEY']);
        if(auth.current !== undefined){
            console.log(auth.current.baseAuthenticationURL);
            
            auth.current.startAuthentication(Providers.Discord).then()
        }

        // auth.startAuthentication(Providers.Discord).then()

    }


    return (
        <div className="w-screen h-screen flex flex-col justify-center items-center">
            <button onClick={onButtonClick} className="px-6 rounded-md shadow-md py-4 bg-blue-500 text-white">Login</button>
        </div>
    )
}

export default Web2;
