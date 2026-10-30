import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/* configuración mínima de Vite: solo se activa el plugin de React para que entienda JSX */
export default defineConfig({
  plugins: [react()],
});
