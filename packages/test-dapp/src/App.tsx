import React from 'react';
import logo from './logo.svg';
import './App.css';
import { AlmightClient } from "@almight-sdk/core"
import { AuthenticationApp, ErrorResponseMessageCallbackArgument, ResponseMessageCallbackArgument, WebWindowAuthenticationFrame } from "@almight-sdk/auth"
import { Providers, WebLocalStorage } from '@almight-sdk/utils';


declare global {
  interface Window {
    auth: AuthenticationApp
  }
}

function Default() {
  return <header className="App-header">
    <img src={logo} className="App-logo" alt="logo" />
    <p>
      Edit <code>src/App.tsx</code> and save to reload.
    </p>
    <a
      className="App-link"
      href="https://reactjs.org"
      target="_blank"
      rel="noopener noreferrer"
    >

    </a>
  </header>
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

  const onClick = function(){
    auth.startAuthentication(Providers.MetaMask).then(() => {})
  }





  return (
    <div className="App">
      <header className="App-header">

        <button className='px-10 py-8 bg-white text-black rounded-md' onClick={onClick}>Click</button>
      </header>
    </div>
  );
}

export default App;
