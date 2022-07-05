import { expect } from "chai"

import { AlmightClient } from "@almight-sdk/core"
import { AllowedQueryParams, AuthenticationApp } from "@almight-sdk/auth"
import { useEffect, useRef } from "react";
import { Providers, WebLocalStorage } from "@almight-sdk/utils";
import { MetamaskIdentityProvider, KardiachainIdentityProvider } from "@almight-sdk/ethereum-chain-adapter"

const Web: React.FC<{}> = () => {

    let almight = useRef<AlmightClient>();
    let auth = useRef<AuthenticationApp>();


    useEffect(() => {
        almight.current = new AlmightClient({
            storage: new WebLocalStorage(),
            apiKey: process.env['NEXT_PUBLIC_ALMIGHT_API_KEY'] as string
        });
        auth.current = new AuthenticationApp({
            almightClient: almight.current,
            identityProviders: [
                MetamaskIdentityProvider,
                KardiachainIdentityProvider
            ],
            onFailureCallback: (data) => {
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
        if(auth.current !== undefined){

            auth.current.startAuthentication(Providers.MetaMask);
            (window as any).auth = auth;
        }
    }
    return (
        <div className="w-screen h-screen flex flex-col justify-center items-center">
            <button onClick={onButtonClick} className="px-6 rounded-md shadow-md py-4 bg-blue-500 text-white">Login</button>
        </div>
    )
}

export default Web