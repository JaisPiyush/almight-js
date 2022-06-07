import {  CurrentSessionStruct, UserData } from '@almight-sdk/auth';
import { createSlice, PayloadAction } from '@reduxjs/toolkit'


export interface GlobalState {
    showWalletModal: boolean;
    userData?: UserData,
    currentSession?: CurrentSessionStruct;
    account?: string;
    chainId?: number;
    showLoading: boolean;
    showAccountsModal: boolean;
}

const initialState: GlobalState = {
    showWalletModal: false,
    showLoading: false,
    showAccountsModal: false
};


export const globalSlice = createSlice({
    name: "global",
    initialState,
    reducers: {
        setWalletModalView(state: GlobalState, action: PayloadAction<boolean>){
            state.showWalletModal = action.payload;
        },
        setUserData(state: GlobalState, action: PayloadAction<UserData>){
            state.userData = action.payload;
            state.currentSession = action.payload.user.current_session;
        },
        setAccount(state: GlobalState, action: PayloadAction<string>) {
            state.account = action.payload;
        },
        setChainId(state: GlobalState, action: PayloadAction<number>){
            state.chainId = action.payload;
        },
        setShowLoading(state: GlobalState, action: PayloadAction<boolean>){
            state.showLoading = action.payload;
        },
        setAccountsModal(state: GlobalState, action: PayloadAction<boolean>){
            state.showAccountsModal = action.payload;
        },
        setCurrentSession(state: GlobalState, action: PayloadAction<CurrentSessionStruct>){
            state.currentSession = action.payload;
        }
    }
});


const globalActions = globalSlice.actions;
export {globalActions};

const globalReducer = globalSlice.reducer;

export default globalReducer;