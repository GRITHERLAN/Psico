import React, { useEffect, useRef } from 'react';
import { SplitLetters, paintLetters } from '../ui/SplitLetters';

/* colores del revelado del titular: termina azul oscuro, pasa por azul brillante y arranca en blanco (invisible sobre el fondo) */
const paintTitle = (title, progress) => paintLetters(title, progress, 0.35, '#0b1d3a', '#3f7cff', '#ffffff');

export const Hero = () => {
  const titleRef = useRef(null);

  useEffect(() => {
    /* la clase "ready" en el body arranca las animaciones .fade-up del CSS (subtítulo, botón y temas) */
    document.body.classList.add('ready');

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      paintTitle(titleRef.current, 1);
      return;
    }

    /* el titular se revela letra a letra en 1,25 segundos usando requestAnimationFrame (un paso por frame de pantalla) */
    const start = performance.now();
    let frame = null;
    const loop = (now) => {
      const progress = Math.min(1, (now - start) / 1250);
      paintTitle(titleRef.current, progress);
      if (progress < 1) frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <section className="hero" id="hero" aria-labelledby="h1">
      <h1 id="h1" ref={titleRef}>
        <SplitLetters text={'Un espacio seguro para volver\n a sentirte bien, a tu ritmo'} highlight="volver"></SplitLetters>
      </h1>

      {/* --d es el retraso de cada animación: así los elementos aparecen escalonados */}
      <p className="trust fade-up" style={{ '--d': '1.15s' }}>
        Lo que trabajamos juntos
      </p>

      <a href="#agendar" className="btn lg hcta fade-up" style={{ '--d': '1.3s' }}>
        Agendar primera cita
        <span className="dot">
          <svg viewBox="0 0 12 12" fill="none" stroke="#0b1d3a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4.5 2.5 8 6l-3.5 3.5"></path>
          </svg>
        </span>
      </a>

      {/* rejilla de 4x2 con los temas; cada uno tiene un estilo tipográfico distinto (t-serif, t-wide...) para dar variedad */}
      <div className="topics" aria-label="Temas que trabajamos">
        <div className="fade-up" style={{ '--d': '1.25s' }}>
          <svg viewBox="0 0 26 20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M2 7c3.5-3 7.5-3 11 0s7.5 3 11 0"></path>
            <path d="M2 14c3.5-3 7.5-3 11 0s7.5 3 11 0"></path>
          </svg>
          <span>ANSIEDAD</span>
        </div>
        <div className="fade-up t-serif" style={{ '--d': '1.32s' }}>
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 3C9 3 4 8 4 15l-1 2"></path>
            <path d="M16 3c0 7-4 11-11 11"></path>
          </svg>
          <span>Duelo</span>
        </div>
        <div className="fade-up" style={{ '--d': '1.39s' }}>
          <svg viewBox="0 0 18 20" fill="currentColor">
            <rect x="1" y="10" width="4" height="10" rx="1"></rect>
            <rect x="7" y="5" width="4" height="15" rx="1"></rect>
            <rect x="13" y="8" width="4" height="12" rx="1"></rect>
          </svg>
          <span>AUTOESTIMA</span>
        </div>
        <div className="fade-up t-wide" style={{ '--d': '1.46s' }}>
          <svg viewBox="0 0 30 20" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="10" r="7.5"></circle>
            <circle cx="19" cy="10" r="7.5"></circle>
          </svg>
          <span>PAREJA</span>
        </div>
        <div className="fade-up t-box" style={{ '--d': '1.42s' }}>
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="10" cy="11" r="7"></circle>
            <path d="M10 7v4l2.5 2M8 2h4"></path>
          </svg>
          <span>ESTRÉS</span>
        </div>
        <div className="fade-up" style={{ '--d': '1.49s' }}>
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 18V9l7-6 7 6v9"></path>
          </svg>
          <span>FAMILIA</span>
        </div>
        <div className="fade-up t-low" style={{ '--d': '1.56s' }}>
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="10" cy="10" r="8"></circle>
            <circle cx="10" cy="10" r="2.5" fill="currentColor"></circle>
          </svg>
          <span>sueño</span>
        </div>
        <div className="fade-up t-mid" style={{ '--d': '1.63s' }}>
          <svg viewBox="0 0 26 20" fill="currentColor">
            <path d="M0 20 8 7l4 6 5-9 9 16Z"></path>
          </svg>
          <span>CAMBIOS</span>
        </div>
      </div>
    </section>
  );
};
