import React from 'react';
import ReactDOM from 'react-dom/client';

console.log('React app starting...');

function TestApp() {
  return React.createElement('div', {
    style: {
      padding: '50px',
      fontSize: '32px',
      backgroundColor: 'red',
      color: 'white',
      textAlign: 'center',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, '? SITE IS WORKING!');
}

const rootElement = document.getElementById('root');
console.log('Root found:', !!rootElement);

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(React.createElement(TestApp));
  console.log('React rendered successfully!');
} else {
  console.error('Root element not found!');
}
