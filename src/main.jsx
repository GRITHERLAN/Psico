import React from 'react';
import { createRoot } from 'react-dom/client';
/* los estilos se importan aquí una sola vez; responsive.css va después para que sus reglas ganen */
import './assets/css/styles.css';
import './assets/css/responsive.css';
import App from './App';

/* se busca el div#root del index.html y React pinta dentro toda la aplicación */
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App></App>
  </React.StrictMode>,
);
