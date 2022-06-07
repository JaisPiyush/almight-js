import React from 'react';
import './App.css';
import { useSelector } from 'react-redux';
import { RootState } from './store';
import Dashboard from './components/Dashboard';
import WalletModal from './components/WalletsModal';
import AccountModal from './components/AccountModal';
import Loading from './components/LoadingModal';






const App: React.FC<{}> = () => {


  const showWalletModel = useSelector<RootState>((state) => state.global.showWalletModal);
  const showAccountsModal = useSelector<RootState>((state) => state.global.showAccountsModal)




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
