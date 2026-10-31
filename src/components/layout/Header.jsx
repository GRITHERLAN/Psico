import React, { useEffect, useState } from 'react';

/* limita un número entre 0 y 1 (se usa para convertir el scroll en un porcentaje de avance) */
const clamp = (value) => Math.min(1, Math.max(0, value));

export const Header = () => {
  /* expanded indica si el botón "Agendar cita" del menú ya se desplegó */
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    /*
      el botón aparece cuando la frase central va por el 40% de su revelado.
      q es cuántas pantallas se han bajado; la fórmula es la misma de la maquetación para que coincidan los tiempos.
    */
    /* último valor aplicado: solo se avisa a React cuando cambia, no en cada evento de scroll */
    let last = null;
    const onScroll = () => {
      const q = window.scrollY / window.innerHeight;
      const next = clamp((q - 0.56) / 2.03) > 0.4;
      if (next === last) return;
      last = next;
      setExpanded(next);
    };
    onScroll();
    /* passive: true avisa al navegador de que no se va a cancelar el scroll, así va más fluido */
    window.addEventListener('scroll', onScroll, { passive: true });
    /* se quita el listener al desmontar el componente para no dejar funciones colgadas */
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={expanded ? 'nav on' : 'nav'}>
      {/* los enlaces llevan "/" delante para que funcionen también desde la página 404 */}
      <a href="/#hero" className="brand">
        <svg viewBox="0 0 22 22" aria-hidden="true">
          <circle cx="11" cy="11" r="11" fill="#5b7cf0"></circle>
          <path d="M5 10.2c2.3-1.6 4.7-1.6 7 0s4.7 1.6 7 0" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" transform="translate(-1 -1.5)"></path>
          <path d="M5 10.2c2.3-1.6 4.7-1.6 7 0s4.7 1.6 7 0" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" transform="translate(-1 2.5)"></path>
        </svg>
        PsicoLP
      </a>

      <nav className="nlinks" aria-label="Principal">
        <a href="/#servicios">Terapia</a>
        <a href="/#enfoque">Enfoque</a>
        <a href="/#enfoque">Sobre mí</a>
        <a href="/#servicios">Preguntas</a>
        <a href="/#agendar">Contacto</a>
      </nav>

      <div className="nright">
        <a href="/#agendar" className="login">
          Escríbeme
        </a>
        <div className="navcta">
          <a href="/#agendar" className="btn">
            <span className="lbl">Agendar cita</span>
            <span className="dot">
              <svg viewBox="0 0 12 12" fill="none" stroke="#0b1d3a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4.5 2.5 8 6l-3.5 3.5"></path>
              </svg>
            </span>
          </a>
        </div>
      </div>
    </header>
  );
};
