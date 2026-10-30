import React from 'react';
import { Link } from 'react-router-dom';

/* se llama NotFound y no Error para no tapar el Error nativo de JavaScript */
export const NotFound = () => {
  return (
    <section className="not-found" aria-labelledby="nf-title">
      <div className="eyebrow">Error 404</div>
      <h1 id="nf-title">Esta página no existe</h1>
      <p>Puede que el enlace esté mal escrito o que la página se haya movido.</p>
      {/* Link cambia de ruta sin recargar la página, a diferencia de un <a href> */}
      <Link to="/" className="btn">
        Volver al inicio
        <span className="dot">
          <svg viewBox="0 0 12 12" fill="none" stroke="#0b1d3a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4.5 2.5 8 6l-3.5 3.5"></path>
          </svg>
        </span>
      </Link>
    </section>
  );
};
