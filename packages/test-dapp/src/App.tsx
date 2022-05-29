import React, { useState } from 'react';
import './App.css';
import { AlmightClient } from "@almight-sdk/core"
import { AuthenticationApp, ErrorResponseMessageCallbackArgument, ResponseMessageCallbackArgument, WebWindowAuthenticationFrame } from "@almight-sdk/auth"
import { WebLocalStorage } from '@almight-sdk/utils';
import { SessionsModal } from './components/SessionsModal';

declare global {
  interface Window {
    auth: AuthenticationApp
  }
}



const App: React.FC<{}> = () => {

  const almight = new AlmightClient({
    apiKey: (process.env.REACT_APP_ALMIGHT_API_KEY) as string,
    storage: new WebLocalStorage()
  });

  const auth = new AuthenticationApp({
    almightClient: almight,
    frame: new WebWindowAuthenticationFrame(),
    onSuccessCallback: (data: ResponseMessageCallbackArgument): void => { },
    onFailureCallback: (data: ErrorResponseMessageCallbackArgument): void => { }
  });

  window.auth = auth;



  const [showModal, setShowModel] = useState<boolean>(true)





  return (
    <div className="App w-screen h-screen bg-blue-400">
      <SessionsModal show={showModal} onClose={() => {setShowModel(false)}} />
    </div>
  );
}

export default App;
