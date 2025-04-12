// This file is used to initialize React and bootstrap the application
import React from 'react';
import ReactDOM from 'react-dom';
import App from './src/components/App';
import './src/styles/index.css';

// Render the React app
ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
