import React from 'react';
import './App.css';
// import { AlmightClient } from "@almight-sdk/core"
// import { AuthenticationApp, ErrorResponseMessageCallbackArgument, ResponseMessageCallbackArgument } from "@almight-sdk/auth"
// import { WebLocalStorage } from '@almight-sdk/utils';
// import WalletModal from './components/WalletsModal';
// import { BaseConnector, BrowserProviderChannel, KardiaChainAdapter, MetaMaskAdapter, WalletConnectChannel } from '@almight-sdk/connector';



// declare global {
//   interface Window {
//     auth: AuthenticationApp
//   }
// }



const App: React.FC<{}> = () => {

  // const almight = new AlmightClient({
  //   apiKey: (process.env.REACT_APP_ALMIGHT_API_KEY) as string,
  //   storage: new WebLocalStorage()
  // });

  // const auth = new AuthenticationApp({
  //   almightClient: almight,
  //   onSuccessCallback: (data: ResponseMessageCallbackArgument): void => {
  //     console.log("success", data)
  //   },
  //   onFailureCallback: (data: ErrorResponseMessageCallbackArgument): void => {
  //     console.log("error", data)
  //   }
  // });

  // window.auth = auth;
  





  // (window as any).toolset = {
  //   connector: BaseConnector,
  //   adapters: [MetaMaskAdapter, KardiaChainAdapter],
  //   channels: [BrowserProviderChannel, WalletConnectChannel]
  // }

  // const [showModal, setShowModel] = useState<boolean>(true)


  const handleClick = () => {
    // setShowModel(true)

  }



  return (
    <div className="App w-screen h-screen">
      <div className='w-full h-full flex flex-col justify-center'>
        <div className='flex flex-row w-full justify-center'>
          {/* <ActionsBox /> */}
          <button onClick={() => {handleClick()}} className='bg-blue-600 w-auto px-4 py-2 rounded-md shadow-md text-white'>Login</button>
        </div>
      </div>
      {/* <WalletModal show={showModal} onClose={() => { setShowModel(false) }} /> */}

    </div>
  );
}

export default App;
