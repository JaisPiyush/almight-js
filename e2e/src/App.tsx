import React, { useEffect } from 'react';
import logo from './logo.svg';
import './App.css';
import {BaseProvider, BrowserSessionStruct, BasicExternalProvider} from "@almight-sdk/connector"

class MetaMaskDerivedProvider extends BaseProvider {



  static async checkBrowserProviderSession(session: BrowserSessionStruct): Promise<[boolean, BasicExternalProvider | null]> {
      const [_connected, provider] = await super.checkBrowserProviderSession(session);
      return [_connected && (provider as any).isMetaMask !== undefined && (provider as any).isMetaMask, provider]
  }
}


const session = { "connected": true, "accounts": ["0x994752691a7650ca546839997b7f0a23ce333b36"], "chainId": 56, "bridge": "https://o.bridge.walletconnect.org", "key": "03a1a396eae8cf2cebd79ce92d5c0733f8cb6857c8fdcd803523752884353937", "clientId": "430f7fb0-c2c7-433d-86af-efad572708ef", "clientMeta": { "description": "Web site created using create-react-app", "url": "http://localhost:3000", "icons": ["http://localhost:3000/favicon.ico", "http://localhost:3000/logo192.png"], "name": "React App" }, "peerId": "2df14428-9cc0-495c-ab92-2fb8b10ee852", "peerMeta": { "description": "MetaMask Mobile app", "url": "https://metamask.io", "icons": ["https://raw.githubusercontent.com/MetaMask/brand-resources/master/SVG/metamask-fox.svg"], "name": "MetaMask", "ssl": true }, "handshakeId": 1649835824361935, "handshakeTopic": "f33cb1cb-a2b8-41aa-b9b6-535cb2f164b5" }


function App() {

  const provider = new BaseProvider(session)

  useEffect(() => {
    (window as any).provider = provider;
    (window as any).MProvider = MetaMaskDerivedProvider
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
