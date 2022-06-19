import { AuthenticationDelegate } from '@almight-sdk/auth';
import React, { useEffect } from 'react';
import './App.css';
import ReactLoading from 'react-loading';
import { Controller } from './controller';



declare global {
  interface Window {
    delegate: AuthenticationDelegate
  }
}

function App() {

  const controller = new Controller();

  useEffect(() => {
    console.log(process.env)
    controller.initControll().then()
  }, [])

  return (
    <div className="App">
      <div className='w-screen h-screen flex flex-col justify-center items-center'>
        <ReactLoading type="spin" color="black" />
      </div>
    </div>
  );
}

export default App;
