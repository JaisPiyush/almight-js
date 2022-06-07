import { CurrentSessionStruct } from "@almight-sdk/auth";
import { Address } from "@almight-sdk/connector";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { auth } from "../almight";
import { AppDispatch, RootState } from "../store";
import { globalActions } from "../store/globalSlice";


const CurrentAccountBar: React.FC<{}> = () => {
    const currentSession = useSelector<RootState, CurrentSessionStruct | undefined>(state => state.global.currentSession)
    
    const dispatch = useDispatch<AppDispatch>();
    
    let providerData;
    if(currentSession !== undefined){
        providerData = auth.getIconAndNameForProvider(currentSession.provider, currentSession.connector_type);
    }

    function trimAddress(address: Address): string {
        if(address.length < 6) return "";
        return `${address.slice(0,5)}....${address.slice(address.length - 6)}`
    }

    function onClick() {
        dispatch(globalActions.setAccountsModal(true));
        
    }
    


    const comp = <div onClick={onClick} className="w-auto h-auto flex p-2 border rounded-md">
        <img src={providerData?.icon} className="w-12 lg:w-16 overflow-hidden rounded-full self-center" alt={`${providerData?.name}'s icon`} />
        <p className="self-center ml-4 lg:ml-8 font-semibold lg:text-2xl">{trimAddress(currentSession === undefined ? "": currentSession.uid)}</p>
    </div>
    
    return (<>
        {currentSession === undefined || providerData === undefined ? <></> : comp}
    </>)
}

export default CurrentAccountBar;