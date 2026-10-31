import React, { useEffect, useRef, useState } from 'react';
import { SplitLetters, paintLetters } from '../ui/SplitLetters';

const clamp = (value) => Math.min(1, Math.max(0, value));

/* atributos comunes de las capas del paisaje: todas comparten encuadre para quedar alineadas */
const LAYER = { viewBox: '0 0 400 600', preserveAspectRatio: 'xMidYMid slice', 'aria-hidden': true };

export const Approach = () => {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const sceneRef = useRef(null);
  /* rowVisible decide cuándo aparece el bloque de texto bajo el título */
  const [rowVisible, setRowVisible] = useState(false);

  useEffect(() => {
    /* valores del último scroll: si no cambian (sección lejos o ya completada) no se vuelve a pintar nada */
    let lastProgress = -1;
    let lastScale = '';
    const onScroll = () => {
      const height = window.innerHeight;
      /* top es la distancia del borde superior de la sección al borde superior de la pantalla */
      const top = sectionRef.current.getBoundingClientRect().top;
      /* el título se colorea cuando la sección entra en pantalla: de gris azulado a blanco pasando por celeste */
      const progress = clamp((0.8 - top / height) / 0.65);
      if (progress !== lastProgress) {
        lastProgress = progress;
        paintLetters(titleRef.current, progress, 0.35, '#ffffff', '#8fe6f4', '#5c6f92');
        /* el texto aparece cuando el título está casi terminado; React no re-renderiza si el valor no cambia */
        setRowVisible(progress > 0.92);
      }
      /* el paisaje empieza un poco ampliado (1.08) y vuelve a su tamaño normal: da sensación de acercarse */
      const scale = (1.08 - 0.08 * clamp(1 - top / height)).toFixed(4);
      if (scale !== lastScale) {
        lastScale = scale;
        sceneRef.current.style.transform = `scale(${scale})`;
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    /* la clase "on" marca que la sección está en pantalla; el CSS pausa la neblina y las ondas cuando no la tiene */
    const section = sectionRef.current;
    const observer = new IntersectionObserver((entries) => section.classList.toggle('on', entries[0].isIntersecting));
    observer.observe(section);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      observer.disconnect();
    };
  }, []);

  return (
    <section className="split" id="enfoque" aria-labelledby="h2" ref={sectionRef}>
      <div className="l">
        <h2 id="h2" ref={titleRef}>
          <SplitLetters text={'Un acompañamiento hecho\n a tu medida'}></SplitLetters>
        </h2>
        <div id="row" className={rowVisible ? 'in' : ''}>
          <h3>Terapia individual y de pareja</h3>
          <p>
            <b>Entender. Regular. Avanzar.</b> Sesiones presenciales y online con enfoques basados en evidencia, para que recuperes la calma y construyas
            relaciones más sanas.
          </p>
        </div>
      </div>

      <div className="r">
        {/*
          paisaje dibujado en SVG: cielo, sol, montañas, su reflejo en el agua, neblina animada y un bote.
          va en capas apiladas con el mismo viewBox: las partes fijas se pintan una sola vez y cada niebla
          es una capa propia que se desplaza en la GPU, así sus desenfoques no se recalculan en cada frame.
        */}
        <div id="scene" ref={sceneRef} role="img" aria-label="Paisaje sereno: un bote pequeño navega en un lago entre montañas con neblina al amanecer">
          <svg {...LAYER}>
            <defs>
              <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#0e1f3d"></stop>
                <stop offset=".3" stopColor="#2b4a7d"></stop>
                <stop offset=".55" stopColor="#8fb4dc"></stop>
                <stop offset=".66" stopColor="#e6eef8"></stop>
              </linearGradient>
              <radialGradient id="sun" cx="200" cy="268" r="140" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#fff6e3" stopOpacity=".95"></stop>
                <stop offset=".15" stopColor="#ffe9c9" stopOpacity=".6"></stop>
                <stop offset="1" stopColor="#bcd6f0" stopOpacity="0"></stop>
              </radialGradient>
              <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#b9d3ec"></stop>
                <stop offset=".28" stopColor="#4f73a5"></stop>
                <stop offset=".7" stopColor="#1a325a"></stop>
                <stop offset="1" stopColor="#0c1b35"></stop>
              </linearGradient>
              <linearGradient id="glint" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#fff6e3" stopOpacity=".8"></stop>
                <stop offset="1" stopColor="#fff6e3" stopOpacity="0"></stop>
              </linearGradient>
              <filter id="blur12" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="12"></feGaussianBlur>
              </filter>
              <filter id="blur3">
                <feGaussianBlur stdDeviation="2.5"></feGaussianBlur>
              </filter>
              {/* las montañas se definen una vez y se reutilizan con <use>: arriba normales y abajo volteadas como reflejo */}
              <g id="ridges">
                <path d="M0 300 40 262l38 22 42-44 45 38 40-28 45 35 50-53 45 38 55-25v141H0Z" fill="#87a5cb" opacity=".8"></path>
                <path d="M0 332 30 302l40 22 40-36 40 32 40-22 40 34 40-30 50 26 40-34 40 20v68H0Z" fill="#4f71a2"></path>
                <path d="M0 236 28 258l26 32 26 44 30 34 24 18H0Z" fill="#1c3459"></path>
                <path d="M400 222 372 254l-30 40-26 42-26 34-22 16h132Z" fill="#152a4c"></path>
              </g>
            </defs>
            <rect width="400" height="386" fill="url(#sky)"></rect>
            <circle cx="200" cy="268" r="140" fill="url(#sun)"></circle>
            <circle cx="200" cy="270" r="15" fill="#fffaf0" opacity=".95"></circle>
          </svg>
          <svg {...LAYER} className="fog2">
            <ellipse cx="120" cy="250" rx="160" ry="16" fill="#fff" opacity=".22" filter="url(#blur12)"></ellipse>
          </svg>
          <svg {...LAYER}>
            <use href="#ridges"></use>
            <rect y="386" width="400" height="214" fill="url(#water)"></rect>
            {/* matrix(1 0 0 -1 0 772) voltea las montañas en vertical para formar el reflejo sobre el agua */}
            <g opacity=".22" filter="url(#blur3)" transform="matrix(1 0 0 -1 0 772)">
              <use href="#ridges"></use>
            </g>
            <rect x="194" y="388" width="12" height="150" fill="url(#glint)" opacity=".5" filter="url(#blur3)"></rect>
          </svg>
          <svg {...LAYER} className="fog">
            <ellipse cx="190" cy="378" rx="230" ry="20" fill="#fff" opacity=".5" filter="url(#blur12)"></ellipse>
          </svg>
          <svg {...LAYER} className="fog2">
            <ellipse cx="300" cy="395" rx="150" ry="12" fill="#fff" opacity=".35" filter="url(#blur12)"></ellipse>
          </svg>
          <svg {...LAYER}>
            <g stroke="#fff" strokeLinecap="round">
              <path className="ripple" d="M60 420h40M280 432h56M150 448h30M310 470h40M40 500h50M250 520h30M330 545h40" strokeWidth="1" opacity=".22"></path>
              <path d="M200 476 138 600M200 476l62 124" strokeWidth="1.6" opacity=".55"></path>
              <path d="M200 478 166 600M200 478l34 122" strokeWidth=".8" opacity=".3"></path>
            </g>
            <g fill="#0b1d3a">
              <path d="M184 471q16 9 32 0l-3-5h-26Z"></path>
              <circle cx="200" cy="455" r="2.6"></circle>
              <path d="M198 458h4l1 8h-6Z"></path>
              <path d="M190 465 181 474M210 465l9 9" stroke="#0b1d3a" strokeWidth="1.2" strokeLinecap="round"></path>
            </g>
          </svg>
        </div>
      </div>
    </section>
  );
};
