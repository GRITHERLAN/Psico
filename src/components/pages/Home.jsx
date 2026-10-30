import React, { useEffect, useState } from 'react';
import { Background } from '../sections/Background';
import { Hero } from '../sections/Hero';
import { Statement } from '../sections/Statement';
import { Approach } from '../sections/Approach';
import { Services } from '../sections/Services';
import { Booking } from '../sections/Booking';

export const Home = () => {
  /*
    servicio elegido desde las tarjetas de Servicios ("Saber más").
    vive aquí, en el padre, porque lo usan dos hermanos: Services lo cambia y Booking lo lee.
  */
  const [preselected, setPreselected] = useState(null);

  useEffect(() => {
    /*
      animación de aparición: los elementos .reveal y los títulos .split-w reciben la clase "in" al entrar en pantalla.
      rootMargin -15% hace que se activen un poco antes de llegar al centro, no justo en el borde inferior.
      este efecto va en Home porque afecta a varias secciones y se ejecuta después de que todas se hayan montado.
    */
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            /* una vez visible ya no hace falta vigilarlo: la animación solo ocurre una vez */
            observer.unobserve(entry.target);
          }
        }),
      { rootMargin: '0px 0px -15% 0px' },
    );
    document.querySelectorAll('.reveal, .split-w').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Background></Background>
      <Hero></Hero>
      <Statement></Statement>
      <Approach></Approach>
      <Services onSelectService={setPreselected}></Services>
      <Booking preselected={preselected}></Booking>
    </>
  );
};
