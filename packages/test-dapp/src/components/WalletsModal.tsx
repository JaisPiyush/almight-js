import React from "react";
import { IDENTITY_PROVIDERS } from "@almight-sdk/connector"
import { X } from "react-feather";

import WalletAvatar from "./WalletAvatar";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../store";
import { globalActions } from "../store/globalSlice";
import { auth } from "../almight";
import { ErrorResponseMessageCallbackArgument, ResponseMessageCallbackArgument, UserData } from "@almight-sdk/auth";


interface WalletModalInterface {
}


declare global {
    interface Window {
        auth: any
    }
}




const WalletModal: React.FC<WalletModalInterface> = (props: WalletModalInterface) => {

    const dispatch = useDispatch<AppDispatch>();


    auth.onSuccess = (data: ResponseMessageCallbackArgument) => {
        dispatch(globalActions.setUserData(data.user as UserData));
        
    }

    auth.onFailure = (data: ErrorResponseMessageCallbackArgument) => {
    }

    window.auth = auth;

    function onWalletClick(provider: string): void {
        dispatch(globalActions.setShowLoading(true));
        dispatch(globalActions.setWalletModalView(false));
        auth.startAuthentication(provider as any).then(() => {
            dispatch(globalActions.setShowLoading(false));
            
        });
    }

    const avatars = []
    for (const [key, value] of Object.entries(IDENTITY_PROVIDERS)) {
        const data = {
            src: value.metaData.icon,
            name: value.identityProviderName,
            onClick: onWalletClick,
            provider: key,
            key: key
        };
        avatars.push(
            <WalletAvatar {...data} />
        )

    }

    function onCloseClick(){
        dispatch(globalActions.setWalletModalView(false))
        
    }

    return (
            <div className="fixed inset-0 flex items-center justify-center bg-slate-200 backdrop-blur-md">
                <div className="relative z-10 bg-white h-auto py-10 px-4 lg:px-8 w-full mx-4 lg:w-2/5 rounded-2xl shadow-2xl">
                    <div className="w-full flex justify-between">
                        <p className="font-heebo font-medium text-2xl">Connect Wallet</p>
                        <X onClick={onCloseClick}/>
                    </div>
                    <div className="w-full h-auto flex flex-wrap">
                        {avatars}
                    </div>
                </div>
            </div>
    )
}

export default WalletModal