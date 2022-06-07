import { CurrentSessionStruct } from "@almight-sdk/auth";
import React, { useEffect, useState } from "react";
import { X } from "react-feather";
import { useDispatch } from "react-redux";
import { auth } from "../almight";
import { AppDispatch } from "../store";
import { globalActions } from "../store/globalSlice";
import AccountBar from "./AccountBar";





const AccountModal: React.FC<{}> = () => {

    const dispatch = useDispatch<AppDispatch>();
    const [sessions, setSessions] = useState<CurrentSessionStruct[]>([]);

    useEffect(() => {
        transformIdpsToCurrentSessionStructs()
    },[])


    function transformIdpsToCurrentSessionStructs(): void {
        auth.getAccountIdpsAsCurrentSessionStructs().then((sessions) => {
            setSessions(sessions);
        });
    }

    const accountBars = sessions.map((session, index) => <AccountBar onClick={(session) =>{onAccountBarClick(session)}} session={session} key={index} />)

    function onCloseClick() {
        dispatch(globalActions.setAccountsModal(false));
    }

    function onAccountBarClick(session: CurrentSessionStruct){
        dispatch(globalActions.setShowLoading(true));
        auth.updateCurrentSession(session).then((userData) => {      
            dispatch(globalActions.setUserData(userData));
            dispatch(globalActions.setAccountsModal(false));
            dispatch(globalActions.setShowLoading(false));
            
            
        })
    }

    return (<div className="fixed inset-0 flex items-center justify-center bg-slate-200 backdrop-blur-md">
        <div style={{maxHeight: "80%"}} className="relative overflow-clip z-10 bg-white h-auto py-10 px-4 lg:px-8 w-full lg:max-w-2xl mx-4 lg:w-4/5 rounded-2xl shadow-2xl">
            <div className="w-full flex justify-between">
                <p className="font-heebo font-medium text-2xl">Accounts</p>
                <X onClick={onCloseClick} />
            </div>

            <div  className="w-full max-h-96 flex flex-col overflow-y-auto lg:overflow-y-scroll px-2 pb-8 lg:px-4  my-6">
                {accountBars}
            </div>
        </div>
    </div>)
}

export default AccountModal;