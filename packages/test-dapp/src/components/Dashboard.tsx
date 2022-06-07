import { MetaMaskAdapter } from "@almight-sdk/connector";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { auth } from "../almight";
import { AppDispatch, RootState } from "../store";
import { globalActions } from "../store/globalSlice";
import CurrentAccountBar from "./CurrentAccountBar";


const Dashboard: React.FC<{}> = () => {
    const [balance, setBalance] = useState<number>(0);
    const [message, setMessage] = useState<string>("");
    const [messageHash, setMessageHash] = useState<string>("");

    const dispatch = useDispatch<AppDispatch>();
    const isCurrentSessionDefined = useSelector<RootState, boolean>(state => state.global.currentSession !== undefined)


    function onGetBalanceClick(): void {
        dispatch(globalActions.setShowLoading(true))
        auth.isAuthenticated().then((isAuthenticated) => {
            if (!isAuthenticated || auth.connector === undefined) return;
            (auth.connector.adapter as MetaMaskAdapter).getBalance().then((balance) => {
                setBalance(balance as number);
                dispatch(globalActions.setShowLoading(false))
            })
        })

    }


    function onGetMessageSignClick() {
        dispatch(globalActions.setShowLoading(true))
        auth.isAuthenticated().then((isAuthenticated) => {
            if (!isAuthenticated || auth.connector === undefined || message.length === 0) return;
            (auth.connector.adapter as MetaMaskAdapter).signPersonalMessage({ message: message }).then((hash) => {
                setMessageHash(hash);
                dispatch(globalActions.setShowLoading(false))
            })
        });
    }

    const handleLoginClick = () => {
        dispatch(globalActions.setWalletModalView(true));
    }


    function getDashboardInputs() {
        if (!isCurrentSessionDefined) return <></>;
        return (<>
            <div className="w-full flex justify-center">
                <CurrentAccountBar />
            </div>
            <input className="w-full mt-4 font-heebo text-xl lg:text-xl outline-none bg-slate-100 px-4 py-2 lg:py-6 rounded-md" readOnly={true} contentEditable={false} value={balance} />
            <button onClick={onGetBalanceClick} className="w-full self-center lg:w-56 mt-4 py-2 lg:py-4 hover:bg-blue-800 bg-blue-500 rounded-md text-white font-heebo text-xl">Get Balance</button>

            <input className="w-full mt-8 font-heebo text-xl lg:text-xl outline-none bg-slate-100 px-4 py-2 lg:py-6 rounded-md" value={message} onChange={(e) => { setMessage(e.target.value) }} />

            <button onClick={onGetMessageSignClick} className="w-full self-center lg:w-56 mt-4 py-2 lg:py-4 hover:bg-blue-800 bg-blue-500 rounded-md text-white font-heebo text-xl">Get Message Signed</button>
            {messageHash.length > 0 ? <div className="w-full mt-8 border p-4 rounded-md break-words bg-yellow-50 font-heebo"><span className="font-medium">Signed Message: </span>{messageHash}</div> : ""}
        </>)
    }



    return (<div className="w-full py-10 flex justify-center">
        <div className="w-9/12 h-auto py-8 lg:py-10 px-4 border rounded-lg flex flex-col align-middle">

            {getDashboardInputs()}
            <button onClick={() => { handleLoginClick() }} className='bg-pink-600 mt-8 self-center lg:w-56 px-4 py-2 rounded-md shadow-md text-white'>Login</button>
        </div>
    </div>)
}

export default Dashboard;