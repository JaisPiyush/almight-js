import React from "react";
import ReactLoading from 'react-loading';
import { useSelector } from "react-redux";
import { RootState } from "../store";


const Loading: React.FC<{}> = () => {

    const showLoading = useSelector<RootState, boolean>(state => state.global.showLoading)

    const loader =  (<div className="fixed inset-0 flex items-center justify-center bg-transparent backdrop-blur-md">
        <div className="relative z-10 bg-white h-auto py-10 px-4 lg:px-8 w-full mx-4 lg:w-2/5 rounded-2xl shadow-2xl">
            <div className="flex w-full justify-center">
            <ReactLoading type={"spin"} color={"black"} />
            </div>
        </div>
    </div>)

    return (showLoading)? loader: <></>;
}

export default Loading;