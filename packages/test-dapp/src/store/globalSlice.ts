import {  CurrentSessionStruct, UserData } from '@almight-sdk/auth';
import { createSlice, PayloadAction } from '@reduxjs/toolkit'


export interface GlobalState {
    showWalletModal: boolean;
    userData?: UserData,
    currentSession?: CurrentSessionStruct;
}

const initialState: GlobalState = {
    showWalletModal: false
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
        }
    }
});


const globalActions = globalSlice.actions;
export {globalActions};

const globalReducer = globalSlice.reducer;

export default globalReducer;