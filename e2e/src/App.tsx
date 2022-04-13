import React, { useEffect } from 'react';
import logo from './logo.svg';
import './App.css';
import {BaseProvider, BrowserSessionStruct, BasicExternalProvider} from "@almight-sdk/connector/src"

class MetaMaskDerivedProvider extends BaseProvider {



  static async checkBrowserProviderSession(session: BrowserSessionStruct): Promise<[boolean, BasicExternalProvider | null]> {
      const [_connected, provider] = await super.checkBrowserProviderSession(session);
      return [_connected && (provider as any).isMetaMask !== undefined && (provider as any).isMetaMask, provider]
  }
}

function App() {

  const provider = new MetaMaskDerivedProvider({path: "ethereum"})

  useEffect(() => {
    (window as any).provider = provider;
})
  

  return (
    <div className="App">
      <header className="App-header">
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
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
