import React, { useEffect, useRef } from 'react';
import { SplitWords } from '../ui/SplitWords';

/* frases que se escriben solas en la burbuja del chat de la tarjeta de pareja */
const PHRASES = ['Aprender a escucharnos de verdad.', 'Discutir sin hacernos daño.', 'Volver a confiar el uno en el otro.'];

/* enfoques de la cinta que se desplaza; se pintan dos veces seguidas para que el bucle no tenga corte */
const APPROACHES = [
  'Terapia Cognitivo-Conductual',
  'Mindfulness',
  'Terapia de Aceptación y Compromiso',
  'Terapia sistémica',
  'Manejo del duelo',
  'Autoestima',
  'Regulación emocional',
  'Psicoeducación',
];

/*
  dibuja la onda de la tarjeta "Ansiedad y estrés": mezcla una onda tranquila con una nerviosa.
  chaos = 1 es todo nervio, chaos = 0 es todo calma. t es el tiempo en segundos para que se mueva.
*/
const buildWave = (t, chaos) => {
  let d = '';
  for (let x = 0; x <= 300; x += 3) {
    const calm = Math.sin(x * 0.035 + t * 1.4) * 14;
    const noisy = (Math.sin(x * 0.31 + t * 9) * 0.6 + Math.sin(x * 0.17 - t * 6) * 0.4) * 34;
    /* M mueve el lápiz al primer punto y L traza una línea hasta cada punto siguiente */
    d += (x ? 'L' : 'M') + x + ' ' + (55 + calm * (1 - chaos) + noisy * chaos).toFixed(1);
  }
  return d;
};

/* flecha del enlace "Saber más", igual en las 4 tarjetas */
const arrow = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"></path>
    <path d="m12 5 7 7-7 7"></path>
  </svg>
);

/* onSelectService avisa a Home del servicio elegido para que el formulario de cita lo marque solo */
export const Services = ({ onSelectService }) => {
  const sectionRef = useRef(null);
  const typedRef = useRef(null);
  const waveRef = useRef(null);
  const waveCardRef = useRef(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    /* sin animaciones: frase fija y onda en calma, y no se arranca nada más */
    if (reduceMotion) {
      typedRef.current.textContent = PHRASES[0];
      waveRef.current.setAttribute('d', buildWave(0, 0));
      return;
    }
    /* cancelled se activa al desmontar para que los bucles y temporizadores se detengan */
    let cancelled = false;
    const cleanups = [];

    /* la clase "on" marca que la sección está en pantalla; el CSS pausa sus animaciones cuando no la tiene */
    const section = sectionRef.current;
    const sectionObserver = new IntersectionObserver((entries) => section.classList.toggle('on', entries[0].isIntersecting));
    sectionObserver.observe(section);
    cleanups.push(() => sectionObserver.disconnect());

    // Ejemplo 1: tarjetas que se inclinan en 3D siguiendo el puntero
    const fine = window.matchMedia('(pointer: fine)').matches;
    sectionRef.current.querySelectorAll('.card').forEach((card) => {
      /* rx/ry = giro actual; targetX/targetY = giro deseado. el giro actual se acerca un 12% por frame para que sea suave */
      let rx = 0;
      let ry = 0;
      let targetX = 0;
      let targetY = 0;
      let frame = null;
      const loop = () => {
        rx += (targetX - rx) * 0.12;
        ry += (targetY - ry) * 0.12;
        card.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
        /* el bucle se detiene solo cuando ya casi llegó al objetivo, así no gasta batería en reposo */
        frame = Math.abs(targetX - rx) + Math.abs(targetY - ry) > 0.01 ? requestAnimationFrame(loop) : null;
        /* al volver a reposo se suelta la capa de GPU que se reservó solo para la inclinación */
        if (!frame && !targetX && !targetY) {
          card.style.transform = '';
          card.style.willChange = '';
        }
      };
      /* will-change solo mientras la tarjeta se inclina: así no quedan 4 capas grandes reservadas todo el tiempo */
      const startLoop = () => {
        if (frame) return;
        card.style.willChange = 'transform';
        frame = requestAnimationFrame(loop);
      };
      const onMove = (e) => {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;
        /* --x y --y mueven el brillo radial del CSS hasta donde está el puntero */
        card.style.setProperty('--x', px * 100 + '%');
        card.style.setProperty('--y', py * 100 + '%');
        /* la inclinación solo con ratón (pointer: fine); en pantallas táctiles no tiene sentido */
        if (fine) {
          targetX = (0.5 - py) * 8;
          targetY = (px - 0.5) * 8;
          startLoop();
        }
      };
      const onLeave = () => {
        targetX = 0;
        targetY = 0;
        /* en táctil nunca hubo inclinación, así que no hay nada que devolver a su sitio */
        if (fine) startLoop();
      };
      card.addEventListener('pointermove', onMove);
      card.addEventListener('pointerleave', onLeave);
      cleanups.push(() => {
        cancelAnimationFrame(frame);
        card.removeEventListener('pointermove', onMove);
        card.removeEventListener('pointerleave', onLeave);
      });
    });

    // Ejemplo 2: texto que se escribe y se borra solo
    const typed = typedRef.current;
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const typeLoop = async () => {
      for (let k = 0; !cancelled; k = (k + 1) % PHRASES.length) {
        const phrase = PHRASES[k];
        /* se escribe letra a letra con una pausa algo aleatoria, como una persona real */
        for (let i = 1; i <= phrase.length && !cancelled; i++) {
          typed.textContent = phrase.slice(0, i);
          await wait(45 + Math.random() * 40);
        }
        await wait(1800);
        for (let i = phrase.length; i >= 0 && !cancelled; i--) {
          typed.textContent = phrase.slice(0, i);
          await wait(18);
        }
        await wait(300);
      }
    };
    /* IntersectionObserver avisa cuando la burbuja entra en pantalla: solo entonces empieza a escribir */
    const typeObserver = new IntersectionObserver((entries, observer) => {
      if (!entries[0].isIntersecting) return;
      observer.disconnect();
      typeLoop();
    });
    typeObserver.observe(typed);
    cleanups.push(() => typeObserver.disconnect());

    // Ejemplo 3: onda que pasa de nerviosa a tranquila
    const wavePath = waveRef.current;
    const waveCard = waveCardRef.current;
    let chaos = 1;
    let target = 1;
    let visible = false;
    const timers = [];
    const waveStart = performance.now();
    wavePath.setAttribute('d', buildWave(0, 1));
    /* al ver la tarjeta la onda se calma; si el puntero entra, se agita un momento y vuelve a calmarse */
    let waveFrame = null;
    let waveTick = 0;
    const waveLoop = (now) => {
      chaos += (target - chaos) * 0.02;
      /* la onda se redibuja 1 de cada 2 frames (unos 30 fps): rehacer el trazado SVG en cada frame no se nota y cuesta el doble */
      if (waveTick++ % 2 === 0) wavePath.setAttribute('d', buildWave((now - waveStart) / 1000, chaos));
      /* el bucle sigue solo mientras se ve la tarjeta o aún queda agitación; si no, se detiene del todo */
      waveFrame = visible || chaos > 0.001 ? requestAnimationFrame(waveLoop) : null;
    };
    const waveObserver = new IntersectionObserver(
      (entries) => {
        visible = entries[0].isIntersecting;
        if (!visible) return;
        timers.push(setTimeout(() => (target = 0), 600));
        if (!waveFrame) waveFrame = requestAnimationFrame(waveLoop);
      },
      { threshold: 0.4 },
    );
    waveObserver.observe(waveCard);
    const onWaveEnter = () => {
      target = 0.9;
      timers.push(setTimeout(() => (target = 0), 900));
    };
    waveCard.addEventListener('pointerenter', onWaveEnter);
    cleanups.push(() => {
      cancelAnimationFrame(waveFrame);
      waveObserver.disconnect();
      waveCard.removeEventListener('pointerenter', onWaveEnter);
      timers.forEach(clearTimeout);
    });

    return () => {
      cancelled = true;
      cleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  /*
    "Saber más" lleva a #agendar y deja marcado el servicio en el formulario.
    aquí no se usa preventDefault a propósito: se quiere que el enlace haga su salto normal hasta la sección.
  */
  const moreLink = (service) => (
    <a href="#agendar" className="more" onClick={() => onSelectService(service)}>
      Saber más {arrow}
    </a>
  );

  return (
    <section className="services" id="servicios" aria-labelledby="s-title" ref={sectionRef}>
      <div className="container">
        <div className="s-head">
          <div className="eyebrow reveal">Servicios</div>
          <h2 id="s-title" className="split-w">
            <SplitWords text="Acompañamiento profesional para cada " highlight="etapa de tu vida"></SplitWords>
          </h2>
          <p className="reveal" style={{ '--d': '.2s' }}>
            Cada proceso es distinto. Trabajamos a tu ritmo, con enfoques basados en evidencia y un trato cercano y confidencial.
          </p>
        </div>

        {/* bento: rejilla de 4 columnas donde la primera tarjeta ocupa 2x2 y la segunda 2x1 */}
        <div className="bento">
          {/* 1. Terapia individual (2x2): círculo que respira para guiar inhalación y exhalación */}
          <div className="cell c1 reveal" style={{ '--d': '0s' }}>
            <article className="card">
              <div className="visual">
                <div className="breath" aria-hidden="true">
                  <div className="ring"></div>
                  <div className="ring"></div>
                  <div className="ring"></div>
                  <div className="orbit">
                    <i></i>
                  </div>
                  <div className="core"></div>
                  <div className="blabel">
                    <span className="in1">Inhala</span>
                    <span className="ex1">Exhala</span>
                  </div>
                </div>
              </div>
              <div className="ico">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="5"></circle>
                  <path d="M20 21a8 8 0 0 0-16 0"></path>
                </svg>
              </div>
              <h3>Terapia individual</h3>
              <p>
                Un espacio para ti. Trabajamos ansiedad, autoestima, duelos, cambios de vida y todo aquello que hoy te pesa, con objetivos claros sesión a
                sesión.
              </p>
              {moreLink({ name: 'Terapia individual', duration: '50 min' })}
            </article>
          </div>

          {/* 2. Terapia de pareja (2x1): chat con respuesta que se escribe sola */}
          <div className="cell c2 reveal" style={{ '--d': '.1s' }}>
            <article className="card">
              <div className="visual">
                <div className="chat" aria-hidden="true">
                  <div className="bubble">¿Qué te gustaría lograr juntos?</div>
                  <div className="bubble me">
                    <span ref={typedRef}></span>
                    <span className="caret"></span>
                  </div>
                </div>
              </div>
              <div className="ico">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                </svg>
              </div>
              <h3>Terapia de pareja</h3>
              <p>Mejoren la comunicación, resuelvan conflictos y reconstruyan la confianza con un acompañamiento neutral.</p>
              {moreLink({ name: 'Terapia de pareja', duration: '75 min' })}
            </article>
          </div>

          {/* 3. Ansiedad y estrés (1x1): onda que pasa de la tensión a la calma */}
          <div className="cell reveal" style={{ '--d': '.2s' }}>
            <article className="card" ref={waveCardRef}>
              <div className="visual">
                <svg className="wave" viewBox="0 0 300 110" preserveAspectRatio="none" aria-hidden="true">
                  <defs>
                    <linearGradient id="wg" x1="0" x2="1">
                      <stop offset="0" stopColor="#5b7cf0"></stop>
                      <stop offset="1" stopColor="#2fe0d0"></stop>
                    </linearGradient>
                  </defs>
                  <path ref={waveRef} fill="none" stroke="url(#wg)" strokeWidth="2.5" strokeLinecap="round"></path>
                </svg>
                <div className="wave-label">
                  De la tensión a la <b>calma</b>
                </div>
              </div>
              <div className="ico">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"></path>
                  <path d="M9.6 4.6A2 2 0 1 1 11 8H2"></path>
                  <path d="M12.6 19.4A2 2 0 1 0 14 16H2"></path>
                </svg>
              </div>
              <h3>Ansiedad y estrés</h3>
              <p>Herramientas prácticas para regular lo que sientes y recuperar el control.</p>
              {moreLink({ name: 'Terapia individual', duration: '50 min' })}
            </article>
          </div>

          {/* 4. Atención online (1x1): cámara con ondas y etiqueta "En línea" */}
          <div className="cell reveal" style={{ '--d': '.3s' }}>
            <article className="card">
              <div className="visual">
                <div className="cam" aria-hidden="true">
                  <span className="pulse"></span>
                  <span className="pulse"></span>
                  <span className="pulse"></span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"></path>
                    <rect x="2" y="6" width="14" height="12" rx="2"></rect>
                  </svg>
                </div>
                <div className="live">
                  <span className="ldot"></span>En línea
                </div>
              </div>
              <div className="ico">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 2v4"></path>
                  <path d="M16 2v4"></path>
                  <rect width="18" height="18" x="3" y="4" rx="2"></rect>
                  <path d="M3 10h18"></path>
                </svg>
              </div>
              <h3>Atención online</h3>
              <p>Sesiones por videollamada desde donde estés, con la misma calidad y confidencialidad.</p>
              {moreLink({ name: 'Sesión de valoración', duration: '30 min' })}
            </article>
          </div>
        </div>

        {/* la cinta se mueve un 50% a la izquierda; como la lista está duplicada, al reiniciar no se nota el salto */}
        <div className="marquee reveal" aria-label="Enfoques terapéuticos">
          <div className="track">
            {[...APPROACHES, ...APPROACHES].map((approach, i) => (
              <span className="chip" key={i}>
                {approach}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
