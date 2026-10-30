import React from 'react';

/*
  SplitWords envuelve cada palabra en dos spans: el de fuera (.w) recorta y el de dentro (.wi) sube desde abajo.
  cuando el título recibe la clase "in" (al entrar en pantalla) las palabras suben una tras otra.
  - text: texto inicial del título
  - highlight: parte resaltada dentro de un <em> (en azul)
  - after: texto opcional que va después de la parte resaltada
  se usa en los títulos de Servicios y de Agendar cita.
*/
export const SplitWords = ({ text, highlight, after = '' }) => {
  /* contador de palabras: cada una lleva --i para retrasar su animación un poco más que la anterior */
  let index = 0;

  const renderWords = (words) =>
    words.split(/(\s+)/).map((part, i) => {
      if (!part) return null;
      if (/^\s+$/.test(part)) return ' ';
      const order = index++;
      return (
        <span className="w" key={i}>
          <span className="wi" style={{ '--i': order }}>
            {part}
          </span>
        </span>
      );
    });

  return (
    <>
      {renderWords(text)}
      <em>{renderWords(highlight)}</em>
      {renderWords(after)}
    </>
  );
};
