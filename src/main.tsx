import React from 'react';
import { createRoot } from 'react-dom/client';
import { setupIonicReact } from '@ionic/react';
import App from '@ui/App';
import { container as appContainer } from '@infrastructure/container';

/* Estilos base de Ionic */
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/flex-utils.css';
/* Modo oscuro automático según el sistema */
import '@ionic/react/css/palettes/dark.system.css';
import '@ui/theme.css';

setupIonicReact();

const root = document.getElementById('root');
createRoot(root!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Expone el container en window para debugging/testing desde la consola del navegador.
declare global {
  interface Window {
    capmark: typeof appContainer;
  }
}
window.capmark = appContainer;
