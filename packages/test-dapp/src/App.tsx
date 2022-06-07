import React, { useEffect, useState } from 'react';
import './App.css';
import { AuthenticationApp, ErrorResponseMessageCallbackArgument, ResponseMessageCallbackArgument } from "@almight-sdk/auth"
import WalletModal from './components/WalletsModal';
import almight from './almight';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from './store';
import { globalActions } from './store/globalSlice';






const App: React.FC<{}> = () => {

  const dispatch = useDispatch<AppDispatch>();
  const showWalletModel = useSelector<RootState>((state) => state.global.showWalletModal)


  const handleLoginClick = () => {
    dispatch(globalActions.setWalletModalView(true));
  }



  return (
    <div className="App w-screen h-screen">
      <div className='w-full h-full flex flex-col justify-center'>
        <div className='flex flex-row w-full justify-center'>
          {/* <ActionsBox /> */}
          <button onClick={() => {handleLoginClick()}} className='bg-blue-600 w-auto px-4 py-2 rounded-md shadow-md text-white'>Login</button>
        </div>
      </div>
      {showWalletModel ? <WalletModal />: <></>}
    </div>
  );
}

export default App;
