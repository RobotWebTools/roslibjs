import logo from './logo.svg'
import './App.css'
import SendMessage from './component_examples/example_functions'
import React from 'react';

function App() {
  return (
     <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
      </header>

      <SendMessage/>
    </div>
  )
}

export default App
