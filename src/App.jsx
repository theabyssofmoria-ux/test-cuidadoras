import { useState, useEffect } from "react";

const PREGUNTAS = [
  {
    categoria: "Experiencia",
    items: [
      "¿Cuántos años lleva trabajando como cuidadora o enfermera?",
      "¿Ha cuidado antes a adultos mayores? ¿Con qué condiciones (demencia, movilidad reducida, etc.)?",
      "¿Tiene experiencia en turnos de 24 horas? ¿Cómo los maneja?",
      "¿Sabe manejar silla de ruedas, caminador o cama ortopédica?",
    ],
  },
  {
    categoria: "Formación",
    items: [
      "¿Tiene algún título o certificación en enfermería, auxiliar de salud u otro?",
      "¿Sabe administrar medicamentos? ¿Tiene experiencia con inyecciones o sueros?",
      "¿Sabe hacer curaciones o manejo de heridas?",
      "¿Tiene conocimiento en primeros auxilios o RCP?",
    ],
  },
  {
    categoria: "Habilidades del hogar",
    items: [
      "¿Sabe cocinar? ¿Puede preparar dietas especiales (baja en sal, blanda, diabética)?",
      "¿Está dispuesta a encargarse del aseo del paciente (baño, cambio de pañal)?",
      "¿Tiene experiencia en movilización de pacientes en cama?",
    ],
  },
  {
    categoria: "Personalidad y valores",
    items: [
      "¿Por qué eligió esta profesión? ¿Qué le gusta de cuidar personas mayores?",
      "¿Cómo reacciona ante situaciones de emergencia o estrés?",
      "¿Cómo maneja a un paciente que se pone difícil o agresivo?",
      "¿Tiene paciencia para rutinas repetitivas?",
    ],
  },
  {
    categoria: "Disponibilidad y logística",
    items: [
      "¿Tiene inconveniente con el turno de 24 horas día de por medio?",
      "¿Vive cerca o tiene fácil acceso al domicilio?",
      "¿Tiene hijos u otras responsabilidades que puedan interferir con el turno?",
      "¿Cuándo podría empezar?",
    ],
  },
  {
    categoria: "Referencias",
    items: [
      "¿Puede darnos referencias de empleos anteriores?",
      "¿Por qué terminó su último trabajo de cuidado?",
    ],
  },
];

const CAMPOS_INFO = [
  { key: "nombre", label: "Nombre completo" },
  { key: "edad", label: "Edad" },
  { key: "telefono", label: "Teléfono" },
  { key: "ciudad", label: "Ciudad / Barrio" },
  { key: "experiencia_anos", label: "Años de exp." },
  { key: "formacion", label: "Formación" },
];

const CRITERIOS = [
  { key: "experiencia", label: "Experiencia" },
  { key: "formacion", label: "Formación" },
  { key: "habilidades", label: "Habilidades hogar" },
  { key: "personalidad", label: "Actitud / Personalidad" },
  { key: "disponibilidad", label: "Disponibilidad" },
  { key: "confianza", label: "Genera confianza" },
];

const SUELDO_BASE = 2000000;

function formatCOP(n) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}

function StarRating({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 18,
            color: s <= value ? "#e8a045" : "#3a3a3a",
            padding: "0 1px",
            lineHeight: 1,
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function Timer({ running, elapsed, onStart, onPause, onReset }) {
  const m = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const s = String(elapsed % 60).padStart(2, "0");
  const pct = Math.min((elapsed / 1800) * 100, 100);
  const color = elapsed > 1500 ? "#e05c5c" : elapsed > 1200 ? "#e8a045" : "#5cb87a";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ position: "relative", width: 56, height: 56 }}>
        <svg width="56" height="56" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="28" cy="28" r="24" fill="none" stroke="#2a2a2a" strokeWidth="4" />
          <circle
            cx="28" cy="28" r="24" fill="none"
            stroke={color} strokeWidth="4"
            strokeDasharray={`${2 * Math.PI * 24}`}
            strokeDashoffset={`${2 * Math.PI * 24 * (1 - pct / 100)}`}
            style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
          />
        </svg>
        <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace", fontSize: 13, color: "#e8e8e8" }}>
          {m}:{s}
        </span>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={running ? onPause : onStart} style={btnStyle(running ? "#e05c5c" : "#5cb87a")}>
          {running ? "⏸" : "▶"}
        </button>
        <button onClick={onReset} style={btnStyle("#555")}>↺</button>
      </div>
      <span style={{ fontSize: 12, color: "#888" }}>/ 30 min</span>
    </div>
  );
}

function btnStyle(bg) {
  return {
    background: bg,
    border: "none",
    borderRadius: 6,
    color: "#fff",
    padding: "6px 10px",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
  };
}

export default function App() {
  const [vista, setVista] = useState("menu"); // menu | entrevista | tabla
  const [candidatas, setCandidatas] = useState(() => {
    try {
      const saved = localStorage.getItem("entrevistas-cuidadoras");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [actual, setActual] = useState(null); // índice en edición
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [timerRef, setTimerRef] = useState(null);
  const [categoriaActiva, setCategoriaActiva] = useState(0);

  // Guardar en localStorage cada vez que cambien las candidatas
  useEffect(() => {
    localStorage.setItem("entrevistas-cuidadoras", JSON.stringify(candidatas));
  }, [candidatas]);

  function nuevaCandidata() {
    const c = {
      id: Date.now(),
      nombre: "", edad: "", telefono: "", ciudad: "", experiencia_anos: "", formacion: "",
      sueldo_acepta: true, sueldo_propuesto: SUELDO_BASE,
      notas: "",
      puntuaciones: { experiencia: 0, formacion: 0, habilidades: 0, personalidad: 0, disponibilidad: 0, confianza: 0 },
      recomendada: false,
    };
    const nuevas = [...candidatas, c];
    setCandidatas(nuevas);
    setActual(nuevas.length - 1);
    setElapsed(0);
    setTimerRunning(false);
    setCategoriaActiva(0);
    setVista("entrevista");
  }

  function editarCandidata(i) {
    setActual(i);
    setElapsed(0);
    setTimerRunning(false);
    setCategoriaActiva(0);
    setVista("entrevista");
  }

  function startTimer() {
    if (timerRef) clearInterval(timerRef);
    const ref = setInterval(() => setElapsed((e) => e + 1), 1000);
    setTimerRef(ref);
    setTimerRunning(true);
  }

  function pauseTimer() {
    clearInterval(timerRef);
    setTimerRunning(false);
  }

  function resetTimer() {
    clearInterval(timerRef);
    setTimerRunning(false);
    setElapsed(0);
  }

  function updateCandidataField(field, value) {
    setCandidatas((prev) => prev.map((c, i) => i === actual ? { ...c, [field]: value } : c));
  }

  function updatePuntuacion(key, val) {
    setCandidatas((prev) =>
      prev.map((c, i) => i === actual ? { ...c, puntuaciones: { ...c.puntuaciones, [key]: val } } : c)
    );
  }

  function promedioTotal(c) {
    const vals = Object.values(c.puntuaciones);
    const sum = vals.reduce((a, b) => a + b, 0);
    return vals.every((v) => v === 0) ? "-" : (sum / vals.length).toFixed(1);
  }

  function colorPromedio(p) {
    if (p === "-") return "#666";
    const n = parseFloat(p);
    if (n >= 4.5) return "#5cb87a";
    if (n >= 3.5) return "#e8a045";
    if (n >= 2.5) return "#e0a000";
    return "#e05c5c";
  }

  const c = actual !== null ? candidatas[actual] : null;

  // ─── MENU ───────────────────────────────────────────────────────
  if (vista === "menu") {
    return (
      <div style={{ minHeight: "100vh", background: "#111", color: "#e8e8e8", fontFamily: "'Georgia', serif" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "48px 24px" }}>
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 11, letterSpacing: 4, color: "#888", textTransform: "uppercase", marginBottom: 8 }}>
              Proceso de selección
            </div>
            <h1 style={{ fontSize: 36, fontWeight: 400, margin: 0, lineHeight: 1.2 }}>
              Cuidadoras para<br />
              <span style={{ color: "#e8a045" }}>Adulto Mayor</span>
            </h1>
            <p style={{ color: "#888", marginTop: 12, fontSize: 14 }}>
              Sueldo ofrecido: <strong style={{ color: "#e8e8e8" }}>{formatCOP(SUELDO_BASE)}</strong> · Turno 24h día de por medio
            </p>
          </div>

          <div style={{ display: "flex", gap: 12, marginBottom: 40 }}>
            <button onClick={nuevaCandidata} style={{ ...btnStyle("#e8a045"), padding: "12px 24px", fontSize: 15, borderRadius: 8 }}>
              + Nueva entrevista
            </button>
            {candidatas.length > 0 && (
              <button onClick={() => setVista("tabla")} style={{ ...btnStyle("#2a2a2a"), padding: "12px 24px", fontSize: 15, borderRadius: 8, border: "1px solid #3a3a3a" }}>
                Ver comparativa ({candidatas.length})
              </button>
            )}
          </div>

          {candidatas.length > 0 && (
            <div>
              <div style={{ fontSize: 11, letterSpacing: 3, color: "#666", textTransform: "uppercase", marginBottom: 16 }}>
                Candidatas registradas
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {candidatas.map((cd, i) => {
                  const p = promedioTotal(cd);
                  return (
                    <div
                      key={cd.id}
                      onClick={() => editarCandidata(i)}
                      style={{
                        background: "#1a1a1a",
                        border: "1px solid #2a2a2a",
                        borderLeft: `3px solid ${colorPromedio(p)}`,
                        borderRadius: 8,
                        padding: "14px 18px",
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        transition: "background 0.15s",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>{cd.nombre || <span style={{ color: "#666" }}>Sin nombre</span>}</div>
                        <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{cd.ciudad} {cd.experiencia_anos ? `· ${cd.experiencia_anos} años exp.` : ""}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 22, fontWeight: 700, color: colorPromedio(p) }}>{p}</div>
                        <div style={{ fontSize: 10, color: "#666" }}>promedio</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── ENTREVISTA ──────────────────────────────────────────────────
  if (vista === "entrevista" && c) {
    return (
      <div style={{ minHeight: "100vh", background: "#111", color: "#e8e8e8", fontFamily: "'Georgia', serif" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 20px" }}>

          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
            <button onClick={() => setVista("menu")} style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 13 }}>
              ← Volver
            </button>
            <Timer running={timerRunning} elapsed={elapsed} onStart={startTimer} onPause={pauseTimer} onReset={resetTimer} />
          </div>

          {/* Datos personales */}
          <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 10, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 10, letterSpacing: 3, color: "#888", textTransform: "uppercase", marginBottom: 14 }}>Datos personales</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {CAMPOS_INFO.map(({ key, label }) => (
                <div key={key}>
                  <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>{label}</label>
                  <input
                    value={c[key]}
                    onChange={(e) => updateCandidataField(key, e.target.value)}
                    style={inputStyle()}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Sueldo */}
          <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 10, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 10, letterSpacing: 3, color: "#888", textTransform: "uppercase", marginBottom: 14 }}>Sueldo ofrecido: {formatCOP(SUELDO_BASE)}</div>
            <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14 }}>
                <input
                  type="radio"
                  name={`sueldo_${c.id}`}
                  checked={c.sueldo_acepta}
                  onChange={() => { updateCandidataField("sueldo_acepta", true); updateCandidataField("sueldo_propuesto", SUELDO_BASE); }}
                  style={{ accentColor: "#5cb87a" }}
                />
                <span style={{ color: "#5cb87a" }}>✓ Acepta {formatCOP(SUELDO_BASE)}</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14 }}>
                <input
                  type="radio"
                  name={`sueldo_${c.id}`}
                  checked={!c.sueldo_acepta}
                  onChange={() => updateCandidataField("sueldo_acepta", false)}
                  style={{ accentColor: "#e05c5c" }}
                />
                <span style={{ color: "#e8a045" }}>Propone otro valor:</span>
              </label>
              {!c.sueldo_acepta && (
                <input
                  type="number"
                  value={c.sueldo_propuesto}
                  onChange={(e) => updateCandidataField("sueldo_propuesto", Number(e.target.value))}
                  style={{ ...inputStyle(), width: 140 }}
                  placeholder="Ej: 2200000"
                />
              )}
              {!c.sueldo_acepta && c.sueldo_propuesto > 0 && (
                <span style={{ fontSize: 13, color: "#e8a045" }}>= {formatCOP(c.sueldo_propuesto)}</span>
              )}
            </div>
          </div>

          {/* Preguntas con tabs */}
          <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 10, marginBottom: 20, overflow: "hidden" }}>
            <div style={{ display: "flex", overflowX: "auto", borderBottom: "1px solid #2a2a2a" }}>
              {PREGUNTAS.map((cat, i) => (
                <button
                  key={i}
                  onClick={() => setCategoriaActiva(i)}
                  style={{
                    background: "none",
                    border: "none",
                    borderBottom: i === categoriaActiva ? "2px solid #e8a045" : "2px solid transparent",
                    color: i === categoriaActiva ? "#e8a045" : "#888",
                    padding: "12px 16px",
                    cursor: "pointer",
                    fontSize: 12,
                    whiteSpace: "nowrap",
                    fontFamily: "inherit",
                  }}
                >
                  {cat.categoria}
                </button>
              ))}
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {PREGUNTAS[categoriaActiva].items.map((q, qi) => (
                  <div key={qi} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{
                      minWidth: 24, height: 24, borderRadius: "50%",
                      background: "#2a2a2a", display: "flex", alignItems: "center",
                      justifyContent: "center", fontSize: 11, color: "#e8a045", flexShrink: 0, marginTop: 2
                    }}>{qi + 1}</div>
                    <div style={{ fontSize: 14, lineHeight: 1.6, color: "#d0d0d0" }}>{q}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
                <button
                  onClick={() => setCategoriaActiva((p) => Math.max(0, p - 1))}
                  disabled={categoriaActiva === 0}
                  style={{ ...btnStyle("#2a2a2a"), border: "1px solid #3a3a3a", opacity: categoriaActiva === 0 ? 0.3 : 1 }}
                >
                  ← Anterior
                </button>
                <button
                  onClick={() => setCategoriaActiva((p) => Math.min(PREGUNTAS.length - 1, p + 1))}
                  disabled={categoriaActiva === PREGUNTAS.length - 1}
                  style={{ ...btnStyle("#2a2a2a"), border: "1px solid #3a3a3a", opacity: categoriaActiva === PREGUNTAS.length - 1 ? 0.3 : 1 }}
                >
                  Siguiente →
                </button>
              </div>
            </div>
          </div>

          {/* Evaluación */}
          <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 10, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 10, letterSpacing: 3, color: "#888", textTransform: "uppercase", marginBottom: 16 }}>Evaluación (1 a 5 estrellas)</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {CRITERIOS.map(({ key, label }) => (
                <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#111", borderRadius: 6, padding: "10px 14px" }}>
                  <span style={{ fontSize: 13 }}>{label}</span>
                  <StarRating value={c.puntuaciones[key]} onChange={(v) => updatePuntuacion(key, v)} />
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, padding: "12px 14px", background: "#111", borderRadius: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Promedio total</span>
              <span style={{ fontSize: 26, fontWeight: 700, color: colorPromedio(promedioTotal(c)) }}>{promedioTotal(c)}</span>
            </div>
          </div>

          {/* Notas */}
          <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 10, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 10, letterSpacing: 3, color: "#888", textTransform: "uppercase", marginBottom: 12 }}>Notas y observaciones</div>
            <textarea
              value={c.notas}
              onChange={(e) => updateCandidataField("notas", e.target.value)}
              placeholder="Impresión general, algo que te llamó la atención, detalles para recordar..."
              style={{ ...inputStyle(), height: 90, resize: "vertical", width: "100%", boxSizing: "border-box" }}
            />
          </div>

          {/* Recomendada */}
          <div style={{ background: "#1a1a1a", border: `1px solid ${c.recomendada ? "#5cb87a" : "#2a2a2a"}`, borderRadius: 10, padding: 16, marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14 }}>¿Candidata recomendada para segunda fase?</span>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={c.recomendada}
                onChange={(e) => updateCandidataField("recomendada", e.target.checked)}
                style={{ accentColor: "#5cb87a", width: 18, height: 18 }}
              />
              <span style={{ color: c.recomendada ? "#5cb87a" : "#888", fontSize: 13 }}>{c.recomendada ? "Sí ✓" : "No"}</span>
            </label>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => { pauseTimer(); setVista("menu"); }} style={{ ...btnStyle("#e8a045"), padding: "12px 24px", fontSize: 14, flex: 1 }}>
              Guardar y volver
            </button>
            <button onClick={() => setVista("tabla")} style={{ ...btnStyle("#2a2a2a"), padding: "12px 24px", fontSize: 14, border: "1px solid #3a3a3a" }}>
              Ver tabla
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── TABLA COMPARATIVA ───────────────────────────────────────────
  if (vista === "tabla") {
    const sorted = [...candidatas].sort((a, b) => {
      const pa = parseFloat(promedioTotal(a)) || 0;
      const pb = parseFloat(promedioTotal(b)) || 0;
      return pb - pa;
    });

    return (
      <div style={{ minHeight: "100vh", background: "#111", color: "#e8e8e8", fontFamily: "'Georgia', serif" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, flexWrap: "wrap", gap: 12 }}>
            <div>
              <button onClick={() => setVista("menu")} style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 13, marginBottom: 8, display: "block" }}>
                ← Volver al menú
              </button>
              <h2 style={{ margin: 0, fontWeight: 400, fontSize: 24 }}>Tabla Comparativa</h2>
              <p style={{ color: "#888", fontSize: 13, margin: "4px 0 0" }}>{candidatas.length} candidata{candidatas.length !== 1 ? "s" : ""} · Ordenadas por puntaje</p>
            </div>
            <button onClick={nuevaCandidata} style={{ ...btnStyle("#e8a045"), padding: "10px 20px", fontSize: 14 }}>
              + Nueva entrevista
            </button>
          </div>

          {candidatas.length === 0 ? (
            <div style={{ textAlign: "center", color: "#666", padding: "60px 0" }}>
              Aún no hay candidatas registradas.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {sorted.map((cd, rank) => {
                const p = promedioTotal(cd);
                return (
                  <div key={cd.id} style={{
                    background: "#1a1a1a",
                    border: `1px solid ${rank === 0 && p !== "-" ? "#e8a045" : "#2a2a2a"}`,
                    borderRadius: 10,
                    padding: 18,
                    position: "relative",
                    overflow: "hidden",
                  }}>
                    {rank === 0 && p !== "-" && (
                      <div style={{ position: "absolute", top: 0, right: 0, background: "#e8a045", color: "#111", fontSize: 10, fontWeight: 700, padding: "4px 10px", borderBottomLeftRadius: 8, letterSpacing: 1 }}>
                        #1 MEJOR PUNTAJE
                      </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 28, height: 28, borderRadius: "50%", background: colorPromedio(p), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#111" }}>
                            {rank + 1}
                          </div>
                          <span style={{ fontSize: 17, fontWeight: 600 }}>{cd.nombre || <span style={{ color: "#666" }}>Sin nombre</span>}</span>
                          {cd.recomendada && <span style={{ fontSize: 11, background: "#1e3d2a", color: "#5cb87a", border: "1px solid #5cb87a", borderRadius: 12, padding: "2px 8px" }}>Recomendada</span>}
                        </div>
                        <div style={{ fontSize: 12, color: "#888", marginTop: 4, marginLeft: 38 }}>
                          {[cd.edad && `${cd.edad} años`, cd.ciudad, cd.experiencia_anos && `${cd.experiencia_anos} años exp.`].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 32, fontWeight: 700, color: colorPromedio(p), lineHeight: 1 }}>{p}</div>
                        <div style={{ fontSize: 10, color: "#666" }}>/ 5.0</div>
                      </div>
                    </div>

                    {/* Criterios */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 14 }}>
                      {CRITERIOS.map(({ key, label }) => (
                        <div key={key} style={{ background: "#111", borderRadius: 6, padding: "8px 10px" }}>
                          <div style={{ fontSize: 10, color: "#888", marginBottom: 4 }}>{label}</div>
                          <div style={{ display: "flex", gap: 2 }}>
                            {[1,2,3,4,5].map((s) => (
                              <span key={s} style={{ fontSize: 13, color: s <= cd.puntuaciones[key] ? "#e8a045" : "#2a2a2a" }}>★</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Sueldo */}
                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: cd.notas ? 12 : 0 }}>
                      <div style={{ fontSize: 13 }}>
                        <span style={{ color: "#888" }}>Sueldo: </span>
                        {cd.sueldo_acepta
                          ? <span style={{ color: "#5cb87a" }}>Acepta {formatCOP(SUELDO_BASE)}</span>
                          : <span style={{ color: "#e8a045" }}>Propone {formatCOP(cd.sueldo_propuesto)}</span>
                        }
                      </div>
                      {cd.telefono && <div style={{ fontSize: 13 }}><span style={{ color: "#888" }}>Tel: </span>{cd.telefono}</div>}
                      {cd.formacion && <div style={{ fontSize: 13 }}><span style={{ color: "#888" }}>Formación: </span>{cd.formacion}</div>}
                    </div>

                    {cd.notas && (
                      <div style={{ fontSize: 12, color: "#aaa", fontStyle: "italic", borderTop: "1px solid #2a2a2a", paddingTop: 10, marginTop: 10 }}>
                        "{cd.notas}"
                      </div>
                    )}

                    <button
                      onClick={() => editarCandidata(candidatas.indexOf(cd))}
                      style={{ marginTop: 14, background: "none", border: "1px solid #3a3a3a", color: "#888", borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontSize: 12 }}
                    >
                      ✏️ Editar
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}

function inputStyle() {
  return {
    background: "#111",
    border: "1px solid #2a2a2a",
    borderRadius: 6,
    color: "#e8e8e8",
    padding: "8px 12px",
    fontSize: 14,
    width: "100%",
    fontFamily: "inherit",
    outline: "none",
  };
}
