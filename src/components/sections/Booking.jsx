import React, { useEffect, useRef, useState } from 'react';
import { SplitWords } from '../ui/SplitWords';

/* nombre con el que se guardan las citas en el localStorage del navegador */
const STORAGE_KEY = 'psicolp-bookings';

const WEEK_DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const STEP_LABELS = ['1. Servicio', '2. Fecha', '3. Tus datos', '4. Listo'];

/* reglas de validación de cada campo: devuelven true si el valor es correcto */
const RULES = {
  /* nombre de al menos 3 letras */
  name: (value) => value.trim().length >= 3,
  /* celular colombiano: empieza por 3 y tiene 10 dígitos; se aceptan +57, espacios y guiones */
  phone: (value) => /^(\+?57)?3\d{9}$/.test(value.replace(/[\s-]/g, '')),
  email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim()),
};

const EMPTY_FIELDS = { name: '', phone: '', email: '', reason: '', consent: false };

/* convierte una fecha en "2026-10-30" (con la hora local) para guardarla y compararla como texto */
const toDateKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/*
  generador de números "aleatorios" que siempre da la misma secuencia para un mismo día.
  así los horarios ocupados de ejemplo no cambian cada vez que se vuelve a pintar el calendario.
*/
const seededRandom = (date) => {
  let h = date.getFullYear() * 400 + date.getMonth() * 31 + date.getDate();
  return () => (h = (h * 9301 + 49297) % 233280) / 233280;
};

/* lee las citas guardadas; si el dato está dañado o no existe se empieza con una lista vacía */
const loadBookings = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
};

/* flecha del botón principal */
const arrowDot = (
  <span className="dot">
    <svg viewBox="0 0 12 12" fill="none" stroke="#0b1d3a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 2.5 8 6l-3.5 3.5"></path>
    </svg>
  </span>
);

/* preselected llega desde Home cuando se pulsa "Saber más" en una tarjeta de servicios */
export const Booking = ({ preselected }) => {
  const cardRef = useRef(null);

  /* paso actual del asistente: 0 servicio, 1 fecha, 2 datos, 3 confirmación */
  const [step, setStep] = useState(0);
  /* servicio elegido: { name, duration } */
  const [service, setService] = useState(null);
  /* semana que se ve en el calendario: 0 es la actual y se puede avanzar hasta 3 */
  const [week, setWeek] = useState(0);
  const [day, setDay] = useState(null);
  const [time, setTime] = useState(null);
  const [fields, setFields] = useState(EMPTY_FIELDS);
  /* errors guarda qué campos tienen error, por ejemplo { email: true } */
  const [errors, setErrors] = useState({});
  /* el valor inicial se lee una sola vez del localStorage (por eso se pasa la función, no su resultado) */
  const [bookings, setBookings] = useState(loadBookings);
  /* última cita enviada, para mostrar el resumen del paso 4 */
  const [lastBooking, setLastBooking] = useState(null);

  /* cada vez que cambia la lista de citas se guarda en el localStorage; JSON.stringify la convierte en texto */
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  }, [bookings]);

  /* si desde Servicios se eligió un servicio, se marca aquí (solo si aún se está en el primer paso) */
  useEffect(() => {
    if (preselected && step === 0) setService(preselected);
    // step no va en las dependencias a propósito: solo debe reaccionar cuando llega una preselección nueva
  }, [preselected]);

  /* hoy a las 00:00, para comparar días sin que influya la hora */
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const now = new Date();

  /* ¿se puede pasar al siguiente paso? */
  const canContinue = step === 0 ? !!service : step === 1 ? !!(day && time) : true;

  /* cambia de paso y, si la tarjeta quedó por encima de la pantalla, sube hasta ella */
  const goToStep = (newStep) => {
    setStep(newStep);
    if (cardRef.current.getBoundingClientRect().top < 0) cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Paso 2: los 7 días de la semana visible
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() + week * 7);
  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    weekDays.push(date);
  }
  /* título del mes: si la semana cruza dos meses se muestran ambos ("Octubre / Noviembre 2026") */
  const monthNames = [...new Set(weekDays.map((date) => MONTHS[date.getMonth()]))];
  const monthLabel = monthNames.map((m) => m[0].toUpperCase() + m.slice(1)).join(' / ') + ' ' + weekStart.getFullYear();

  // Paso 2: horarios del día elegido
  let slots = [];
  if (day) {
    /* sábado solo en la mañana; de lunes a viernes mañana y tarde */
    const hours = day.getDay() === 6 ? [8, 9, 10, 11] : [8, 9, 10, 11, 14, 15, 16, 17];
    const random = seededRandom(day);
    const dayKey = toDateKey(day);
    slots = hours.map((hour) => {
      const label = `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'p. m.' : 'a. m.'}`;
      /* si es hoy, no se puede reservar una hora que ya pasó ni la siguiente */
      const past = day.getTime() === today.getTime() && hour <= now.getHours() + 1;
      /* ocupado de ejemplo (30%) para que el calendario se vea real; random() se llama siempre para no alterar la secuencia */
      const busy = random() < 0.3;
      /* ocupado de verdad: ya hay una cita guardada en ese día y hora */
      const booked = bookings.some((b) => b.date === dayKey && b.time === label);
      return { label, disabled: past || busy || booked };
    });
  }
  const anySlotFree = slots.some((slot) => !slot.disabled);

  const formatDate = (date) => `${WEEK_DAYS[date.getDay()].toLowerCase()} ${date.getDate()} de ${MONTHS[date.getMonth()]}`;

  // Paso 3: campos del formulario
  const onFieldChange = (e) => {
    const { name, value, type, checked } = e.target;
    /* para el checkbox interesa checked (true/false), para el resto el texto */
    const newValue = type === 'checkbox' ? checked : value;
    setFields({ ...fields, [name]: newValue });
    /* el error se quita en cuanto el valor pasa a ser válido, sin esperar a enviar */
    const nowValid = name === 'consent' ? newValue : RULES[name] ? RULES[name](newValue) : true;
    if (errors[name] && nowValid) setErrors({ ...errors, [name]: false });
  };

  /* revisa todos los campos, marca los que fallan y pone el foco en el primero con error */
  const validateFields = () => {
    const newErrors = {};
    Object.keys(RULES).forEach((key) => {
      if (!RULES[key](fields[key])) newErrors[key] = true;
    });
    if (!fields.consent) newErrors.consent = true;
    setErrors(newErrors);
    const firstError = ['name', 'phone', 'email'].find((key) => newErrors[key]);
    if (firstError) document.getElementById('field-' + firstError).focus();
    return Object.keys(newErrors).length === 0;
  };

  /* un solo submit para todo el asistente: según el paso, avanza o guarda la cita */
  const onSubmit = (e) => {
    /* evita que el formulario recargue la página, que es lo que hace por defecto */
    e.preventDefault();
    if (step === 0 && service) {
      goToStep(1);
    } else if (step === 1 && canContinue) {
      goToStep(2);
      /* preventScroll evita que el foco haga saltar la pantalla mientras se anima el cambio de paso */
      document.getElementById('field-name').focus({ preventScroll: true });
    } else if (step === 2 && validateFields()) {
      const booking = {
        service: service.name,
        duration: service.duration,
        date: toDateKey(day),
        time,
        name: fields.name.trim(),
        phone: fields.phone.trim(),
        email: fields.email.trim(),
        reason: fields.reason.trim(),
        createdAt: new Date().toISOString(),
      };
      /* se crea una lista nueva con la cita al final (sin modificar la anterior) y el useEffect la guarda */
      setBookings([...bookings, booking]);
      setLastBooking({ ...booking, dateText: formatDate(day) });
      goToStep(3);
    }
  };

  /* vuelve todo al estado inicial para pedir otra cita */
  const resetBooking = () => {
    setService(null);
    setWeek(0);
    setDay(null);
    setTime(null);
    setFields(EMPTY_FIELDS);
    setErrors({});
    goToStep(0);
  };

  /* mensaje prellenado para WhatsApp; encodeURIComponent convierte espacios y tildes a formato de URL */
  const whatsappLink = lastBooking
    ? 'https://wa.me/?text=' +
      encodeURIComponent(
        `Hola, soy ${lastBooking.name}. Quisiera agendar: ${lastBooking.service} (${lastBooking.duration}) el ${lastBooking.dateText} a las ${lastBooking.time}`,
      )
    : '#';

  /* clases de cada panel: "on" el visible, "left" los ya pasados (salen hacia la izquierda) */
  const paneClass = (index) => 'pane' + (index === step ? ' on' : '') + (index < step ? ' left' : '');

  return (
    <section className="booking" id="agendar" aria-labelledby="bk-title">
      <div className="container bk-grid">
        {/* columna izquierda: título y datos de confianza */}
        <div className="bk-info">
          <div className="eyebrow reveal">Agenda tu cita</div>
          <h2 id="bk-title" className="split-w">
            <SplitWords text="Da el primer paso, " highlight="yo te acompaño" after=" en el resto"></SplitWords>
          </h2>
          <p className="reveal" style={{ '--d': '.15s' }}>
            Elige el tipo de sesión, el día y la hora que mejor te funcionen. Te confirmo por correo o WhatsApp en menos de 24 horas.
          </p>
          <div className="facts">
            <div className="fact reveal" style={{ '--d': '.2s' }}>
              <span className="fi">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </span>
              <div>
                <b>100% confidencial</b>
                <span>Lo que compartes queda entre nosotros, bajo secreto profesional.</span>
              </div>
            </div>
            <div className="fact reveal" style={{ '--d': '.28s' }}>
              <span className="fi">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 6v6l4 2"></path>
                </svg>
              </span>
              <div>
                <b>Lunes a sábado</b>
                <span>L–V de 8:00 a 18:00 · Sábados de 8:00 a 12:00</span>
              </div>
            </div>
            <div className="fact reveal" style={{ '--d': '.36s' }}>
              <span className="fi">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 10c0 4.99-5.54 10.19-7.4 11.79a1 1 0 0 1-1.2 0C9.54 20.19 4 14.99 4 10a8 8 0 0 1 16 0"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </span>
              <div>
                <b>Presencial u online</b>
                <span>Consultorio en [Ciudad] o videollamada desde donde estés.</span>
              </div>
            </div>
          </div>
        </div>

        {/* columna derecha: el asistente de 4 pasos */}
        <div className="bk-card reveal" style={{ '--d': '.15s' }} ref={cardRef}>
          {/* barra de progreso: "done" los pasos terminados y "cur" el actual */}
          <ol className="steps" aria-label="Progreso">
            {STEP_LABELS.map((label, i) => (
              <li key={label} className={i < step ? 'done' : i === step ? 'cur' : ''}>
                <div className="bar">
                  <i></i>
                </div>
                <span className="sl">{label}</span>
              </li>
            ))}
          </ol>

          {/* noValidate desactiva los globos de error del navegador: los errores se muestran con el estilo de la web */}
          <form className="panes" noValidate onSubmit={onSubmit}>
            {/* Paso 1: tipo de sesión */}
            <div className={paneClass(0)}>
              <h3>¿Qué tipo de sesión buscas?</h3>
              <p className="hint">Si no estás seguro, elige la sesión de valoración.</p>
              <div className="svc" role="radiogroup" aria-label="Servicio">
                <button
                  type="button"
                  className="opt"
                  role="radio"
                  aria-checked={service?.name === 'Sesión de valoración'}
                  onClick={() => setService({ name: 'Sesión de valoración', duration: '30 min' })}
                >
                  <span className="oi">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"></path>
                    </svg>
                  </span>
                  <span>
                    <b>Sesión de valoración</b>
                    <small>Conversamos y definimos el plan</small>
                  </span>
                  <span className="meta">
                    <strong>30 min</strong>Online
                  </span>
                </button>
                <button
                  type="button"
                  className="opt"
                  role="radio"
                  aria-checked={service?.name === 'Terapia individual'}
                  onClick={() => setService({ name: 'Terapia individual', duration: '50 min' })}
                >
                  <span className="oi">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="5"></circle>
                      <path d="M20 21a8 8 0 0 0-16 0"></path>
                    </svg>
                  </span>
                  <span>
                    <b>Terapia individual</b>
                    <small>Ansiedad, autoestima, duelo y más</small>
                  </span>
                  <span className="meta">
                    <strong>50 min</strong>Presencial u online
                  </span>
                </button>
                <button
                  type="button"
                  className="opt"
                  role="radio"
                  aria-checked={service?.name === 'Terapia de pareja'}
                  onClick={() => setService({ name: 'Terapia de pareja', duration: '75 min' })}
                >
                  <span className="oi">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                    </svg>
                  </span>
                  <span>
                    <b>Terapia de pareja</b>
                    <small>Comunicación y confianza</small>
                  </span>
                  <span className="meta">
                    <strong>75 min</strong>Presencial u online
                  </span>
                </button>
              </div>
            </div>

            {/* Paso 2: día y hora */}
            <div className={paneClass(1)}>
              <h3>Elige día y hora</h3>
              <p className="hint">{service ? `${service.name} · ${service.duration}. ` : ''}Horarios en hora de Colombia.</p>
              <div className="cal-head">
                <button type="button" aria-label="Semana anterior" disabled={week === 0} onClick={() => setWeek(week - 1)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="m15 18-6-6 6-6"></path>
                  </svg>
                </button>
                <span>{monthLabel}</span>
                <button type="button" aria-label="Semana siguiente" disabled={week >= 3} onClick={() => setWeek(week + 1)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="m9 18 6-6-6-6"></path>
                  </svg>
                </button>
              </div>

              <div className="days">
                {weekDays.map((date, i) => (
                  <button
                    type="button"
                    className="day"
                    key={date.getTime()}
                    /* el domingo no se atiende, y hoy después de las 4 p. m. ya no quedan horas */
                    disabled={date.getDay() === 0 || (week === 0 && i === 0 && now.getHours() >= 16)}
                    aria-pressed={!!day && day.getTime() === date.getTime()}
                    aria-label={`${WEEK_DAYS[date.getDay()]} ${date.getDate()} de ${MONTHS[date.getMonth()]}`}
                    onClick={() => {
                      setDay(date);
                      /* al cambiar de día se borra la hora, porque la anterior puede no existir en el nuevo día */
                      setTime(null);
                    }}
                  >
                    <small>{WEEK_DAYS[date.getDay()]}</small>
                    <b>{date.getDate()}</b>
                  </button>
                ))}
              </div>

              <p className="slots-t">
                {day ? `Horarios para el ${formatDate(day)}:` : 'Selecciona un día para ver los horarios disponibles.'}
              </p>
              {/* aria-live hace que los lectores de pantalla anuncien los horarios nuevos al cambiar de día */}
              <div className="slots" aria-live="polite">
                {day && !anySlotFree && <p className="empty">No quedan horarios este día. Prueba con otro.</p>}
                {anySlotFree &&
                  slots.map((slot, i) => (
                    <button
                      type="button"
                      className="slot"
                      /* la key incluye el día para que los botones se creen de nuevo y repitan su animación de entrada */
                      key={toDateKey(day) + slot.label}
                      style={{ '--i': i }}
                      disabled={slot.disabled}
                      aria-pressed={time === slot.label}
                      onClick={() => setTime(slot.label)}
                    >
                      {slot.label}
                    </button>
                  ))}
              </div>
            </div>

            {/* Paso 3: datos de contacto */}
            <div className={paneClass(2)}>
              <h3>Tus datos</h3>
              <div className="mini">
                {service && <span>{service.name}</span>}
                {day && <span>{`${WEEK_DAYS[day.getDay()]} ${day.getDate()} de ${MONTHS[day.getMonth()]}`}</span>}
                {time && <span>{time}</span>}
              </div>
              <div className="fields">
                {/* la clase "err" pinta el borde rojo, sacude el campo y muestra el mensaje .em */}
                <div className={errors.name ? 'f err' : 'f'}>
                  <label htmlFor="field-name">Nombre completo</label>
                  <input id="field-name" name="name" autoComplete="name" placeholder="Tu nombre" value={fields.name} onChange={onFieldChange}></input>
                  <span className="em">Escribe tu nombre.</span>
                </div>
                <div className={errors.phone ? 'f err' : 'f'}>
                  <label htmlFor="field-phone">WhatsApp</label>
                  <input
                    id="field-phone"
                    name="phone"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="300 123 4567"
                    value={fields.phone}
                    onChange={onFieldChange}
                  ></input>
                  <span className="em">Escribe un número de 10 dígitos.</span>
                </div>
                <div className={errors.email ? 'f full err' : 'f full'}>
                  <label htmlFor="field-email">Correo electrónico</label>
                  <input
                    id="field-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="tu@correo.com"
                    value={fields.email}
                    onChange={onFieldChange}
                  ></input>
                  <span className="em">Escribe un correo válido.</span>
                </div>
                <div className="f full">
                  <label htmlFor="field-reason">
                    ¿Qué te gustaría trabajar? <span className="optional">(opcional)</span>
                  </label>
                  <textarea
                    id="field-reason"
                    name="reason"
                    placeholder="Cuéntame brevemente, solo lo que te sientas cómodo compartiendo."
                    value={fields.reason}
                    onChange={onFieldChange}
                  ></textarea>
                </div>
                <label className={errors.consent ? 'consent err' : 'consent'}>
                  <input type="checkbox" name="consent" checked={fields.consent} onChange={onFieldChange}></input>
                  Acepto el tratamiento de mis datos personales según la política de privacidad, para gestionar mi cita.
                </label>
              </div>
            </div>

            {/* Paso 4: confirmación con resumen */}
            <div className={paneClass(3)}>
              <div className="done-w">
                <div className="check">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12.5l4.5 4.5L19 7.5"></path>
                  </svg>
                </div>
                {/* split(/\s+/)[0] toma solo el primer nombre para un saludo más cercano */}
                <h3>{lastBooking ? `¡Gracias, ${lastBooking.name.split(/\s+/)[0]}!` : '¡Listo! Tu solicitud está lista'}</h3>
                <p className="hint">Te escribiré para confirmar la cita en menos de 24 horas.</p>
                {lastBooking && (
                  <dl className="summary">
                    <div>
                      <dt>Servicio</dt>
                      <dd>{lastBooking.service}</dd>
                    </div>
                    <div>
                      <dt>Duración</dt>
                      <dd>{lastBooking.duration}</dd>
                    </div>
                    <div>
                      <dt>Fecha</dt>
                      <dd>{lastBooking.dateText}</dd>
                    </div>
                    <div>
                      <dt>Hora</dt>
                      <dd>{lastBooking.time}</dd>
                    </div>
                    <div>
                      <dt>Contacto</dt>
                      <dd>{lastBooking.email}</dd>
                    </div>
                  </dl>
                )}
                <div className="done-actions">
                  {/* target _blank abre WhatsApp en otra pestaña; rel noopener evita que esa pestaña controle esta */}
                  <a className="btn" href={whatsappLink} target="_blank" rel="noopener noreferrer">
                    Confirmar por WhatsApp{arrowDot}
                  </a>
                  <button type="button" className="ghost" onClick={resetBooking}>
                    Agendar otra cita
                  </button>
                </div>
                <p className="demo-note">Tu solicitud quedó guardada en este navegador.</p>
              </div>
            </div>

            {/* botones Atrás / Continuar; en el paso final no se muestran */}
            {step < 3 && (
              <div className="nav-bk">
                {/* hidden oculta el botón en el primer paso pero el CSS conserva su hueco para que "Continuar" no se mueva */}
                <button type="button" className="back" hidden={step === 0} onClick={() => goToStep(step - 1)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="m15 18-6-6 6-6"></path>
                  </svg>
                  Atrás
                </button>
                <button type="submit" className="btn" disabled={!canContinue}>
                  <span>{step === 2 ? 'Solicitar cita' : 'Continuar'}</span>
                  {arrowDot}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </section>
  );
};
