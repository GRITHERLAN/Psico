import React from 'react';

/*
  SplitLetters parte un texto en palabras y cada palabra en letras (<span className="ch">),
  para poder colorear letra por letra. se usa en el titular del hero, la frase central y el título del enfoque.
  - text: el texto; cada "\n" se convierte en un salto de línea <br>
  - highlight: palabra que al final queda en azul en lugar del color normal
*/
export const SplitLetters = ({ text, highlight }) => {
  const lines = text.split('\n');

  return (
    <>
      {lines.map((line, lineIndex) => (
        <React.Fragment key={lineIndex}>
          {/* el <br> va antes de cada línea menos la primera */}
          {lineIndex > 0 && <br></br>}
          {/* split(/(\s+)/) separa por espacios pero conserva los espacios en el array, así se respetan */}
          {line.split(/(\s+)/).map((part, partIndex) => {
            if (!part) return null;
            if (/^\s+$/.test(part)) return ' ';
            return (
              /* la palabra va en un span sin salto interno, así una palabra nunca se corta entre dos líneas */
              <span className="wd" key={partIndex}>
                {[...part].map((char, charIndex) => (
                  <span className="ch" data-hl={part === highlight ? 'true' : undefined} key={charIndex}>
                    {char}
                  </span>
                ))}
              </span>
            );
          })}
        </React.Fragment>
      ))}
    </>
  );
};

/* convierte "#rrggbb" en [r, g, b] para poder mezclar colores con números */
const hexToRgb = (hex) => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];

/* mezcla dos colores: k = 0 devuelve a, k = 1 devuelve b, y en medio el degradado */
const mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

const HIGHLIGHT = hexToRgb('#5b7cf0');

/*
  en pantallas táctiles (móviles y tablets) el texto aparece ya terminado, sin revelado:
  el blur por letra de la animación son cientos de filtros a la vez y la GPU del móvil no da abasto.
*/
const INSTANT = window.matchMedia('(pointer: coarse)').matches;

/*
  paintLetters colorea las letras de un contenedor según el avance (progress, de 0 a 1).
  cada letra pasa por 3 fases: aparece desde el blur (0-35%), toma el color de acento (35-70%) y termina en su color final.
  spread controla cuántas letras se animan a la vez: más grande = ola más ancha.
  se modifica el style directamente (sin estado de React) porque se llama en cada frame del scroll
  y re-renderizar cientos de letras en cada frame sería muy lento.
*/
export const paintLetters = (container, progress, spread, final, accent, ghost) => {
  if (!container) return;
  if (INSTANT) {
    /* basta con pintarlo una vez en su estado final; las llamadas siguientes (scroll, frames) no hacen nada */
    if (container.paintedFinal) return;
    container.paintedFinal = true;
    progress = 1;
  }
  const chars = container.querySelectorAll('.ch');
  const finalColor = hexToRgb(final);
  const accentColor = hexToRgb(accent);
  const ghostColor = hexToRgb(ghost);
  const total = chars.length;

  chars.forEach((char, i) => {
    /* t es el avance propio de esta letra: las primeras letras arrancan antes que las últimas */
    const t = Math.min(1, Math.max(0, (progress * (1 + spread) - i / total) / spread));
    /* si la letra ya estaba en ese punto no se toca, así se ahorra trabajo al navegador */
    if (char.paintedAt === t) return;
    char.paintedAt = t;

    let opacity = 1;
    let color = ghostColor;
    let blur = 0;
    if (t <= 0.35) {
      const k = t / 0.35;
      opacity = k;
      blur = 8 - 6.5 * k;
    } else if (t <= 0.7) {
      const k = (t - 0.35) / 0.35;
      color = mix(ghostColor, accentColor, k);
      blur = 1.5 * (1 - k);
    } else {
      const k = (t - 0.7) / 0.3;
      color = mix(accentColor, char.dataset.hl ? HIGHLIGHT : finalColor, k);
    }
    /* el "| 0" quita los decimales del color, que en rgba deben ser enteros */
    char.style.color = `rgba(${color[0] | 0},${color[1] | 0},${color[2] | 0},${opacity.toFixed(3)})`;
    char.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : 'none';
  });
};
