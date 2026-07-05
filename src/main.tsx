import React from 'react';
import { createRoot } from 'react-dom/client';
import { setupIonicReact } from '@ionic/react';
import App from '@ui/App';

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

const container = document.getElementById('root');
createRoot(container!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
