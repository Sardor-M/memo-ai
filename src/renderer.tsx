import React from 'react';
import ReactDOM from 'react-dom/client';
import Widget from './renderer/components/widget/Widget';
import './index.css';

console.log('👋 This message is being logged by "renderer.tsx", included via Vite');

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <Widget />
    </React.StrictMode>
  );
}

