import { AuthenticationDelegate } from '@almight-sdk/auth';
import React from 'react';
import './App.css';

enum PageRoute {
  InitPage = "/auth/v1/init"
}


declare global {
  interface Window {
    delegate: AuthenticationDelegate
  }
}

function App() {

  function isCurrentPage(route: PageRoute): boolean {
    return window.location.pathname.includes(route);
  }

  

  return (
    <div className="App">
      
    </div>
  );
}

export default App;
