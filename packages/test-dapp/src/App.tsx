import React, { useEffect } from 'react';
import './App.css';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from './store';
import Dashboard from './components/Dashboard';
import WalletModal from './components/WalletsModal';
import AccountModal from './components/AccountModal';
import Loading from './components/LoadingModal';
import { auth } from './almight';
import { globalActions } from './store/globalSlice';
import { CurrentSessionStruct } from '@almight-sdk/auth';






const App: React.FC<{}> = () => {

  const dispatch = useDispatch<AppDispatch>()
  const currentSession = useSelector<RootState, CurrentSessionStruct | undefined>(state => state.global.currentSession)
  const showWalletModel = useSelector<RootState>((state) => state.global.showWalletModal);
  const showAccountsModal = useSelector<RootState>((state) => state.global.showAccountsModal);


  useEffect(() => {

    auth.isAuthenticated().then((isAuthenticated) => {
      if(!isAuthenticated){
        dispatch(globalActions.setWalletModalView(true));
      }else if(currentSession === undefined){
        auth.getUserData().then((userData) => {
          dispatch(globalActions.setUserData(userData))
        })
      }
    })

  }, [currentSession])

  




  return (
    <div className="App w-screen h-screen overflow-hidden">
      <div className='w-full h-full flex flex-col justify-center'>
        <Dashboard />
      </div>
      {showWalletModel ? <WalletModal />: <></>}
      {showAccountsModal? <AccountModal />: <></>}
      <Loading />
    </div>
  
  );
}

export default App;
