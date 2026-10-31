import React, { useEffect, useRef } from 'react';

/* tamaño interno del canvas: se dibuja muy pequeño (96x60) y el CSS lo estira a toda la pantalla; el estirado da el desenfoque suave */
const WIDTH = 96;
const HEIGHT = 60;

/* colores del brillo: el centro celeste, el borde lila claro y el resto blanco */
const CORE = [143, 213, 241];
const RIM = [210, 218, 255];
const WHITE = [255, 255, 255];

/*
  tablas de la forma del "cuenco" de luz según cuántas pantallas se han bajado (Q).
  TIP = altura de la punta, HALF = ancho, SOFT = suavidad del borde. entre dos valores se interpola.
*/
const Q = [0, 0.03, 0.08, 0.18, 0.4, 0.66, 0.87, 1.15, 1.43, 1.8];
const TIP = [0.3, 0.45, 0.65, 0.8, 0.95, 1.05, 1.05, 1.1, 1.3, 2.4];
const HALF = [0.34, 0.38, 0.38, 0.38, 0.38, 0.46, 0.66, 0.9, 1.6, 3.0];
const SOFT = [0.22, 0.26, 0.22, 0.22, 0.19, 0.16, 0.13, 0.1, 0.1, 0.1];

const clamp = (value) => Math.min(1, Math.max(0, value));
/* smoothstep: curva en S que hace que las transiciones arranquen y terminen suaves */
const smooth = (x) => {
  const v = clamp(x);
  return v * v * (3 - 2 * v);
};
/* mezcla dos colores y escribe el resultado en out; se reutiliza el mismo array para no crear miles de objetos por frame */
const mix = (out, a, b, k) => {
  out[0] = a[0] + (b[0] - a[0]) * k;
  out[1] = a[1] + (b[1] - a[1]) * k;
  out[2] = a[2] + (b[2] - a[2]) * k;
};

/* busca entre qué dos valores de Q cae q y devuelve el valor intermedio de la tabla */
const lerpTable = (table, q) => {
  if (q <= Q[0]) return table[0];
  for (let i = 1; i < Q.length; i++) {
    if (q <= Q[i]) {
      const k = (q - Q[i - 1]) / (Q[i] - Q[i - 1]);
      return table[i - 1] + (table[i] - table[i - 1]) * k;
    }
  }
  return table[table.length - 1];
};

export const Background = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = canvasRef.current.getContext('2d');
    const image = ctx.createImageData(WIDTH, HEIGHT);
    /* target = forma a la que se quiere llegar según el scroll; current = forma que se ve ahora (la persigue poco a poco) */
    const target = { tip: 0.3, half: 0.34, soft: 0.22 };
    const current = { tip: -0.3, half: 0.3, soft: 0.1 };
    const pointsX = new Float32Array(48);
    const pointsY = new Float32Array(48);
    const color = [0, 0, 0];

    /*
      dibuja el cuenco píxel a píxel: para cada píxel se calcula la distancia al borde de la curva
      y con esa distancia se decide si es blanco, borde lila o centro celeste.
    */
    const drawBowl = (tip, half, soft) => {
      const aspect = window.innerWidth / window.innerHeight;
      const data = image.data;
      const ROUND = 0.25;
      /* 48 puntos que forman el borde de la curva */
      for (let k = 0; k < 48; k++) {
        const y = -0.3 + ((tip + 0.3) * k) / 47;
        pointsY[k] = y;
        pointsX[k] = tip > 0 ? half * aspect * Math.pow(Math.max(0, 1 - y / tip), 0.72) : 0;
      }
      for (let j = 0; j < HEIGHT; j++) {
        const py = (j + 0.5) / HEIGHT;
        for (let i = 0; i < WIDTH; i++) {
          /* Math.abs hace la figura simétrica respecto al centro de la pantalla */
          const px = Math.abs((i + 0.5) / WIDTH - 0.5) * aspect;
          let best = 1e9;
          for (let k = 0; k < 47; k++) {
            const ax = pointsX[k];
            const ay = pointsY[k];
            const bx = pointsX[k + 1] - ax;
            const by = pointsY[k + 1] - ay;
            const length = bx * bx + by * by || 1e-9;
            const u = clamp(((px - ax) * bx + (py - ay) * by) / length);
            const dx = px - ax - bx * u;
            const dy = py - ay - by * u;
            const dist = dx * dx + dy * dy;
            if (dist < best) best = dist;
          }
          let distance = Math.sqrt(best);
          /* si el píxel está dentro de la curva la distancia es negativa */
          if (tip > 0 && py < tip && px < half * aspect * Math.pow(Math.max(0, 1 - py / tip), 0.72)) distance = -distance;
          distance -= ROUND;
          const glow = 1 - smooth((distance + soft) / (2 * soft));
          if (glow < 0.38) mix(color, WHITE, RIM, smooth(glow / 0.38));
          else mix(color, RIM, CORE, smooth((glow - 0.38) / 0.62));
          /* cada píxel ocupa 4 posiciones en el array: rojo, verde, azul y opacidad */
          const o = (j * WIDTH + i) * 4;
          data[o] = color[0];
          data[o + 1] = color[1];
          data[o + 2] = color[2];
          data[o + 3] = 255;
        }
      }
      ctx.putImageData(image, 0, 0);
    };

    let frame = null;
    let introDone = false;
    /*
      desde que la sección Enfoque llega arriba, todo lo que sigue (Servicios, Agendar, footer) tiene fondo opaco
      y tapa el canvas por completo: dibujarlo ahí sería trabajo que nadie ve.
    */
    let covered = false;
    const isCovered = () => {
      const cover = document.getElementById('enfoque');
      return !!cover && cover.getBoundingClientRect().top <= 0;
    };

    /* al hacer scroll solo se actualiza el objetivo; el dibujo se hace en el bucle de animación */
    const onScroll = () => {
      const q = window.scrollY / window.innerHeight;
      target.tip = lerpTable(TIP, q);
      target.half = lerpTable(HALF, q);
      target.soft = lerpTable(SOFT, q);
      /* sin animaciones se salta directo a la forma final y se dibuja una vez */
      if (reduceMotion) {
        drawBowl(target.tip, target.half, target.soft);
        return;
      }
      covered = isCovered();
      /* si el canvas vuelve a verse y el bucle estaba parado, se reanuda */
      if (!covered && !frame && introDone) frame = requestAnimationFrame(loop);
    };

    const start = performance.now();
    let tick = 0;
    const loop = (now) => {
      /* tapado y con la intro terminada: el bucle se detiene hasta que el scroll lo vuelva a destapar */
      if (covered && introDone) {
        frame = null;
        return;
      }
      frame = requestAnimationFrame(loop);
      const elapsed = now - start;
      if (!introDone) {
        /* intro: durante el primer segundo el cuenco crece desde abajo hasta su forma */
        const k = smooth((elapsed - 250) / 1050);
        current.tip = -0.3 + (target.tip + 0.3) * k;
        current.half = 0.3 + (target.half - 0.3) * k;
        current.soft = 0.1 + (target.soft - 0.1) * k;
        if (elapsed > 1300) introDone = true;
      } else {
        /* después persigue al objetivo un 12% por frame: así el cambio con el scroll es suave y no a saltos */
        current.tip += (target.tip - current.tip) * 0.12;
        current.half += (target.half - current.half) * 0.12;
        current.soft += (target.soft - current.soft) * 0.12;
      }
      /*
        en reposo (intro terminada y forma ya alcanzada) solo queda la respiración, que es muy lenta:
        basta con redibujar 1 de cada 6 frames. durante el scroll se dibuja en cada frame.
      */
      const settled =
        introDone && Math.abs(target.tip - current.tip) + Math.abs(target.half - current.half) + Math.abs(target.soft - current.soft) < 0.0005;
      if (settled && tick++ % 6) return;
      /* drift añade una pequeña respiración con senos para que la luz nunca esté del todo quieta */
      const drift = introDone ? 1 : clamp((elapsed - 250) / 1050);
      drawBowl(current.tip + Math.sin(now * 0.00033 + 1.3) * 0.02 * drift, current.half + Math.sin(now * 0.0005) * 0.015 * drift, current.soft);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    if (!reduceMotion) frame = requestAnimationFrame(loop);

    /* limpieza: se para el bucle y se quitan los listeners al salir de la página */
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <div className="atmo" aria-hidden="true">
      <canvas ref={canvasRef} width={WIDTH} height={HEIGHT}></canvas>
    </div>
  );
};
