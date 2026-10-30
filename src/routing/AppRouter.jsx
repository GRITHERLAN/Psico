import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { Home } from '../components/pages/Home';
import { NotFound } from '../components/pages/NotFound';

export const AppRouter = () => {
  return (
    <BrowserRouter>
      {/* lo que está fuera de <Routes> se carga siempre, como una web estática: el header y el footer no cambian de una página a otra */}
      <Header></Header>

      {/* solo lo que está dentro de <Routes> cambia según la URL */}
      <main id="content" className="content">
        <Routes>
          {/* la raíz y /home muestran la misma landing */}
          <Route path="/" element={<Home></Home>}></Route>
          <Route path="/home" element={<Home></Home>}></Route>
          {/* el * va al final: atrapa cualquier ruta que no exista y muestra la página 404 */}
          <Route path="*" element={<NotFound></NotFound>}></Route>
        </Routes>
      </main>

      <Footer></Footer>
    </BrowserRouter>
  );
};
