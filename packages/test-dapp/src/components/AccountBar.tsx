import { CurrentSessionStruct } from "@almight-sdk/auth";
import { Address, BrowserSessionStruct, ConnectorType, WalletConnectSessionStruct } from "@almight-sdk/connector";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { auth } from "../almight";
import { AppDispatch, RootState } from "../store";
import { globalActions } from "../store/globalSlice";


export interface AccountBarInterface {
    session: CurrentSessionStruct,
    onClick: (data: CurrentSessionStruct) => void
}

const AccountBar: React.FC<AccountBarInterface> = (props: AccountBarInterface) => {
    const providerData = auth.getIconAndNameForProvider(props.session.provider, props.session.connector_type);
    const dispatch = useDispatch<AppDispatch>();

    const currentSession = useSelector<RootState, CurrentSessionStruct | undefined>((state) => state.global.currentSession);

    const [isSelected, setIsSelected] = useState<boolean>(false);

    function compareCurrentSession(): boolean {
        if(currentSession === undefined) return false;
        if(currentSession.connector_type === ConnectorType.BrowserExtension){
            const session = currentSession.session as BrowserSessionStruct;
            const propSession = props.session.session as BrowserSessionStruct;
            return (propSession.path !== undefined && propSession.path === session.path) && (propSession.chainId !== undefined && propSession.chainId === session.chainId);
        }else if(currentSession.connector_type === ConnectorType.WalletConnector){
            const session = currentSession.session as WalletConnectSessionStruct;
            const propSession = props.session.session as WalletConnectSessionStruct;  
            return (propSession.clientId === session.clientId && propSession.handshakeId === session.handshakeId && propSession.peerId === session.peerId)
        }
        return false;
    }

    useEffect(() => {
        if(currentSession === undefined){
            auth.getCurrentSession().then(session => {
                dispatch(globalActions.setCurrentSession(session))
            });
        }
        setIsSelected(compareCurrentSession());
    })
    

    function trimAddress(address: Address): string {
        return `${address.slice(0,5)}....${address.slice(address.length - 6)}`
    }


    function onClick(): void{
        if(isSelected){
            dispatch(globalActions.setAccountsModal(false));
            return;
        }
        props.onClick(props.session)
        
    }
    
    return (
        <div onClick={onClick} className={`w-full h-auto flex my-2 border p-2 rounded-md ${isSelected ? 'bg-blue-500 text-white ': "bg-white text-black"}`}>
            <img src={providerData?.icon} className="w-12 lg:w-12 overflow-hidden rounded-full self-center" alt={`${providerData?.name}'s icon`} />
            <p className="self-center ml-8 font-semibold lg:text-2xl">{trimAddress(props.session.uid)}</p>
        </div>
    )
}

export default AccountBar;