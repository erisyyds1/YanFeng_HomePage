import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { useIsMobileViewport } from './hooks/useIsMobileViewport';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

const RootFrame: React.FC = () => {
  const isMobileViewport = useIsMobileViewport();

  if (isMobileViewport) {
    return <App />;
  }

  return (
    <div className="site-zoom-frame">
      <App />
    </div>
  );
};

root.render(
  <React.StrictMode>
    <RootFrame />
  </React.StrictMode>
);
