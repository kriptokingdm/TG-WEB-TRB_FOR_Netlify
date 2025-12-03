import React from 'react';
import ReactDOM from 'react-dom/client';

function TestApp() {
  return React.createElement('div', {
    style: {
      padding: '50px',
      fontSize: '32px',
      backgroundColor: 'red',
      color: 'white',
      textAlign: 'center'
    }
  }, 'WORKING!');
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(TestApp));
