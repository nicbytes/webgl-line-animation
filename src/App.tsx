import React from 'react';
import './App.css';
import LineAnimationCanvas from './LineAnimationCanvas'

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <div style={{width:200, height:200, backgroundColor: 'red' }} />
        <LineAnimationCanvas />
      </header>
    </div>
  );
}

export default App;
