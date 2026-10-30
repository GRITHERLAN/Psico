import React, { useEffect, useRef } from 'react';
import { SplitLetters, paintLetters } from '../ui/SplitLetters';

const clamp = (value) => Math.min(1, Math.max(0, value));

export const Statement = () => {
  const textRef = useRef(null);

  useEffect(() => {
    /*
      la sección mide 3 pantallas y el texto está "pegado" (sticky) en el centro.
      mientras se baja, el texto sube un poco y se va coloreando letra a letra.
    */
    const onScroll = () => {
      const height = window.innerHeight;
      const q = window.scrollY / height;
      /* s va de 0 a 1: al principio el texto está desplazado hacia abajo y se acomoda con una curva cuadrática */
      const s = clamp((q - 0.69) / 0.74);
      textRef.current.style.transform = `translateY(${(0.205 * (1 - s) * (1 - s) * height).toFixed(1)}px)`;
      paintLetters(textRef.current, clamp((q - 0.56) / 2.03), 0.16, '#0b1d3a', '#3f7cff', '#ffffff');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <section className="statement" id="statement" aria-label="Declaración">
      <div className="pin">
        <p id="stmt" ref={textRef}>
          <SplitLetters
            text={
              'Tu bienestar no es un lujo, es un proceso\n que se construye paso a paso, con escucha,\n herramientas reales y un acompañamiento que respeta\n tu historia, tu ritmo y lo que hoy necesitas'
            }
          ></SplitLetters>
        </p>
      </div>
    </section>
  );
};
