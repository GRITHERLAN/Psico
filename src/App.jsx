import React from 'react';
import { AppRouter } from './routing/AppRouter';

/* App solo carga el componente de rutas: todo lo demás (layout y páginas) se decide dentro de AppRouter */
function App() {
  return <AppRouter></AppRouter>;
}

export default App;
