import { useEffect, useMemo, useState } from "react"
import axios from "axios"

import Sidebar from "../components/Sidebar"
import { API_URL } from "../config"
import "./InteligenciaArtificial.css"

function AsistenteIA() {
  const [tab, setTab] = useState("generar")
  const [estadoIA, setEstadoIA] = useState({ configurada: false, modelo: "" })
  const [grados, setGrados] = useState([])
  const [contenidos, setContenidos] = useState([])
  const [alumnos, setAlumnos] = useState([])
  const [historial, setHistorial] = useState([])

  const [modoGeneracion, setModoGeneracion] = useState("contenido")
  const [grado, setGrado] = useState("")
  const [tema, setTema] = useState("")
  const [contenidoId, setContenidoId] = useState("")
  const [dificultad, setDificultad] = useState("media")
  const [cantidadPreguntas, setCantidadPreguntas] = useState(5)
  const [cargandoGeneracion, setCargandoGeneracion] = useState(false)
  const [generacionActual, setGeneracionActual] = useState(null)

  const [alumnoId, setAlumnoId] = useState("")
  const [cargandoAnalisis, setCargandoAnalisis] = useState(false)
  const [analisisActual, setAnalisisActual] = useState(null)
  const [refuerzoActual, setRefuerzoActual] = useState(null)
  const [cargandoRefuerzo, setCargandoRefuerzo] = useState(false)

  const alumnoSeleccionado = useMemo(
    () => alumnos.find((item) => String(item.id) === String(alumnoId)),
    [alumnos, alumnoId]
  )

  useEffect(() => {
    cargarBase()
  }, [])

  useEffect(() => {
    if (tab === "historial") {
      cargarHistorial()
    }
  }, [tab])

  const cargarBase = async () => {
    try {
      const [estadoRes, opcionesRes] = await Promise.all([
        axios.get(`${API_URL}/ia/estado`),
        axios.get(`${API_URL}/ia/opciones`)
      ])

      setEstadoIA(estadoRes.data || { configurada: false, modelo: "" })

      const data = opcionesRes.data || {}
      setGrados(Array.isArray(data.grados) ? data.grados : [])
      setContenidos(Array.isArray(data.contenidos) ? data.contenidos : [])
      setAlumnos(Array.isArray(data.alumnos) ? data.alumnos : [])

      if (!grado && data.grados?.[0]?.nombre) {
        setGrado(data.grados[0].nombre)
      }
    } catch (error) {
      console.error("Error al cargar Asistente IA:", error)
      alert(error.response?.data?.mensaje || "No se pudo cargar el módulo de IA")
    }
  }

  const cargarHistorial = async () => {
    try {
      const res = await axios.get(`${API_URL}/ia/historial`)
      setHistorial(Array.isArray(res.data) ? res.data : [])
    } catch (error) {
      console.error("Error al obtener historial IA:", error)
    }
  }

  const generar = async (event) => {
    event.preventDefault()

    if (!estadoIA.configurada) {
      alert("La IA todavía no está configurada en el backend.")
      return
    }

    try {
      setCargandoGeneracion(true)
      setGeneracionActual(null)

      let res

      if (modoGeneracion === "contenido") {
        if (!grado || !tema.trim()) {
          alert("Selecciona un grado y escribe el tema.")
          return
        }

        res = await axios.post(`${API_URL}/ia/generar-contenido`, {
          grado,
          tema: tema.trim(),
          dificultad,
          cantidad_preguntas: Number(cantidadPreguntas)
        })
      } else {
        if (!contenidoId) {
          alert("Selecciona un contenido existente.")
          return
        }

        res = await axios.post(`${API_URL}/ia/generar-preguntas`, {
          contenido_id: Number(contenidoId),
          dificultad,
          cantidad_preguntas: Number(cantidadPreguntas)
        })
      }

      setGeneracionActual({
        id: res.data.generacion_id,
        modelo: res.data.modelo,
        propuesta: res.data.propuesta,
        modo: modoGeneracion
      })
    } catch (error) {
      console.error("Error al generar con IA:", error)
      alert(error.response?.data?.mensaje || "No fue posible generar la propuesta")
    } finally {
      setCargandoGeneracion(false)
    }
  }

  const aprobarGeneracion = async () => {
    if (!generacionActual?.id) return

    const confirmado = window.confirm(
      generacionActual.modo === "contenido"
        ? "¿Aprobar y guardar este contenido con sus preguntas?"
        : "¿Agregar estas preguntas al contenido seleccionado?"
    )

    if (!confirmado) return

    try {
      const res = await axios.post(
        `${API_URL}/ia/generaciones/${generacionActual.id}/aprobar`
      )

      alert(res.data.mensaje || "Propuesta aprobada correctamente")
      setGeneracionActual(null)
      setTema("")
      setContenidoId("")
      await cargarBase()
    } catch (error) {
      console.error("Error al aprobar generación:", error)
      alert(error.response?.data?.mensaje || "No se pudo aprobar la propuesta")
    }
  }

  const descartarGeneracion = async () => {
    if (!generacionActual?.id) return

    try {
      await axios.put(`${API_URL}/ia/generaciones/${generacionActual.id}/descartar`)
      setGeneracionActual(null)
    } catch (error) {
      console.error("Error al descartar generación:", error)
      alert(error.response?.data?.mensaje || "No se pudo descartar la propuesta")
    }
  }

  const analizarAlumno = async (event) => {
    event.preventDefault()

    if (!alumnoId) {
      alert("Selecciona un alumno.")
      return
    }

    if (!estadoIA.configurada) {
      alert("La IA todavía no está configurada en el backend.")
      return
    }

    try {
      setCargandoAnalisis(true)
      setAnalisisActual(null)
      setRefuerzoActual(null)

      const res = await axios.post(`${API_URL}/ia/analizar-alumno`, {
        alumno_id: Number(alumnoId)
      })

      setAnalisisActual({
        id: res.data.analisis_id,
        modelo: res.data.modelo,
        datos: res.data.datos,
        analisis: res.data.analisis
      })
    } catch (error) {
      console.error("Error al analizar alumno:", error)
      alert(error.response?.data?.mensaje || "No fue posible analizar al alumno")
    } finally {
      setCargandoAnalisis(false)
    }
  }

  const generarRefuerzo = async () => {
    if (!analisisActual?.id) return

    try {
      setCargandoRefuerzo(true)
      setRefuerzoActual(null)

      const res = await axios.post(`${API_URL}/ia/generar-refuerzo`, {
        analisis_id: analisisActual.id,
        tipo: "actividad"
      })

      setRefuerzoActual(res.data.refuerzo)
    } catch (error) {
      console.error("Error al generar refuerzo:", error)
      alert(error.response?.data?.mensaje || "No fue posible generar el refuerzo")
    } finally {
      setCargandoRefuerzo(false)
    }
  }

  const renderPreguntas = (preguntas = []) => (
    <div className="ia-preguntas-lista">
      {preguntas.map((item, index) => (
        <article className="ia-pregunta" key={`${index}-${item.pregunta}`}>
          <div className="ia-pregunta-numero">{index + 1}</div>
          <div className="ia-pregunta-contenido">
            <h4>{item.pregunta}</h4>
            <div className="ia-opciones-grid">
              <span>A. {item.opcion_a}</span>
              <span>B. {item.opcion_b}</span>
              <span>C. {item.opcion_c}</span>
              <span>D. {item.opcion_d}</span>
            </div>
            <div className="ia-respuesta-correcta">
              ✅ Correcta: {item.respuesta_correcta}
              {item.puntaje ? ` · ⭐ ${item.puntaje} pts` : ""}
            </div>
            {item.explicacion && (
              <p className="ia-explicacion">{item.explicacion}</p>
            )}
          </div>
        </article>
      ))}
    </div>
  )

  return (
    <>
      <Sidebar />

      <div className="ia-page">
        <main className="ia-container">
          <section className="ia-hero">
            <div className="ia-hero-icon">🤖</div>
            <div>
              <span>INTELIGENCIA ARTIFICIAL EDUCATIVA</span>
              <h1>Asistente IA del maestro</h1>
              <p>
                Genera propuestas educativas, analiza resultados académicos y crea
                actividades de refuerzo. Toda propuesta debe ser revisada por el maestro.
              </p>
            </div>

            <div className={`ia-estado ${estadoIA.configurada ? "ok" : "pendiente"}`}>
              <strong>{estadoIA.configurada ? "● IA disponible" : "● IA sin configurar"}</strong>
              <small>{estadoIA.modelo || "Sin modelo"}</small>
            </div>
          </section>

          {!estadoIA.configurada && (
            <section className="ia-alerta-config">
              <strong>⚙️ Falta configurar la IA</strong>
              <p>
                Agrega <code>OPENAI_API_KEY</code> y <code>OPENAI_MODEL</code> en las
                variables privadas del backend de Railway. La clave nunca debe ir en React.
              </p>
            </section>
          )}

          <nav className="ia-tabs">
            <button
              className={tab === "generar" ? "activo" : ""}
              onClick={() => setTab("generar")}
            >
              ✨ Generar contenido
            </button>
            <button
              className={tab === "analizar" ? "activo" : ""}
              onClick={() => setTab("analizar")}
            >
              📊 Analizar estudiante
            </button>
            <button
              className={tab === "historial" ? "activo" : ""}
              onClick={() => setTab("historial")}
            >
              🕘 Historial IA
            </button>
          </nav>

          {tab === "generar" && (
            <section className="ia-layout-generador">
              <form className="ia-card ia-form" onSubmit={generar}>
                <div className="ia-card-titulo">
                  <span>✨ GENERADOR</span>
                  <h2>Crea una propuesta con IA</h2>
                  <p>La IA genera un borrador. Nada se publica sin tu aprobación.</p>
                </div>

                <label>
                  ¿Qué deseas generar?
                  <select
                    value={modoGeneracion}
                    onChange={(e) => {
                      setModoGeneracion(e.target.value)
                      setGeneracionActual(null)
                    }}
                  >
                    <option value="contenido">Contenido nuevo + preguntas</option>
                    <option value="preguntas">Preguntas para contenido existente</option>
                  </select>
                </label>

                {modoGeneracion === "contenido" ? (
                  <>
                    <label>
                      Grado
                      <select value={grado} onChange={(e) => setGrado(e.target.value)}>
                        <option value="">Selecciona...</option>
                        {grados.map((item) => (
                          <option value={item.nombre} key={item.id}>
                            {item.nombre}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Tema
                      <input
                        value={tema}
                        onChange={(e) => setTema(e.target.value)}
                        placeholder="Ej. El sistema solar"
                        maxLength={180}
                      />
                    </label>
                  </>
                ) : (
                  <label>
                    Contenido existente
                    <select
                      value={contenidoId}
                      onChange={(e) => setContenidoId(e.target.value)}
                    >
                      <option value="">Selecciona...</option>
                      {contenidos.map((item) => (
                        <option value={item.id} key={item.id}>
                          {item.titulo} · {item.grado}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <div className="ia-form-dos-columnas">
                  <label>
                    Dificultad
                    <select value={dificultad} onChange={(e) => setDificultad(e.target.value)}>
                      <option value="facil">Fácil</option>
                      <option value="media">Media</option>
                      <option value="dificil">Difícil</option>
                    </select>
                  </label>

                  <label>
                    Preguntas
                    <input
                      type="number"
                      min="3"
                      max="10"
                      value={cantidadPreguntas}
                      onChange={(e) => setCantidadPreguntas(e.target.value)}
                    />
                  </label>
                </div>

                <button className="ia-btn-principal" disabled={cargandoGeneracion}>
                  {cargandoGeneracion ? "🤖 Generando propuesta..." : "✨ Generar con IA"}
                </button>
              </form>

              <section className="ia-card ia-preview">
                {!generacionActual ? (
                  <div className="ia-vacio">
                    <div>🧠</div>
                    <h3>La propuesta aparecerá aquí</h3>
                    <p>
                      Selecciona los parámetros y presiona “Generar con IA”. Luego podrás
                      revisar todo antes de guardarlo.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="ia-preview-header">
                      <div>
                        <span>BORRADOR GENERADO</span>
                        <h2>
                          {generacionActual.propuesta.titulo ||
                            (modoGeneracion === "preguntas" ? "Preguntas propuestas" : "Propuesta")}
                        </h2>
                      </div>
                      <small>{generacionActual.modelo}</small>
                    </div>

                    {generacionActual.propuesta.descripcion && (
                      <p className="ia-descripcion">{generacionActual.propuesta.descripcion}</p>
                    )}

                    {generacionActual.propuesta.resumen && (
                      <div className="ia-bloque-info">
                        <strong>📖 Resumen</strong>
                        <p>{generacionActual.propuesta.resumen}</p>
                      </div>
                    )}

                    {Array.isArray(generacionActual.propuesta.objetivos) &&
                      generacionActual.propuesta.objetivos.length > 0 && (
                        <div className="ia-bloque-info">
                          <strong>🎯 Objetivos</strong>
                          <ul>
                            {generacionActual.propuesta.objetivos.map((objetivo, index) => (
                              <li key={index}>{objetivo}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                    <h3 className="ia-subtitulo-preguntas">❓ Preguntas propuestas</h3>
                    {renderPreguntas(generacionActual.propuesta.preguntas || [])}

                    <div className="ia-acciones">
                      <button className="ia-btn-descartar" onClick={descartarGeneracion}>
                        🗑️ Descartar
                      </button>
                      <button className="ia-btn-aprobar" onClick={aprobarGeneracion}>
                        ✅ Aprobar y guardar
                      </button>
                    </div>
                  </>
                )}
              </section>
            </section>
          )}

          {tab === "analizar" && (
            <section className="ia-layout-analisis">
              <form className="ia-card ia-form" onSubmit={analizarAlumno}>
                <div className="ia-card-titulo">
                  <span>📊 ANÁLISIS PEDAGÓGICO</span>
                  <h2>Analiza el rendimiento</h2>
                  <p>
                    Se utilizan evaluaciones y tareas. El nombre del alumno no se envía al
                    proveedor de IA.
                  </p>
                </div>

                <label>
                  Alumno
                  <select value={alumnoId} onChange={(e) => setAlumnoId(e.target.value)}>
                    <option value="">Selecciona...</option>
                    {alumnos.map((item) => (
                      <option value={item.id} key={item.id}>
                        {item.nombre} · @{item.usuario}
                      </option>
                    ))}
                  </select>
                </label>

                <button className="ia-btn-principal" disabled={cargandoAnalisis}>
                  {cargandoAnalisis ? "🧠 Analizando resultados..." : "🤖 Analizar con IA"}
                </button>
              </form>

              <section className="ia-card ia-analisis-resultado">
                {!analisisActual ? (
                  <div className="ia-vacio">
                    <div>📈</div>
                    <h3>Selecciona un estudiante</h3>
                    <p>
                      La IA revisará sus resultados académicos y propondrá acciones de apoyo.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="ia-preview-header">
                      <div>
                        <span>ANÁLISIS GENERADO</span>
                        <h2>{alumnoSeleccionado?.nombre || "Estudiante"}</h2>
                      </div>
                      <small>{analisisActual.modelo}</small>
                    </div>

                    <div className="ia-metricas">
                      <div>
                        <strong>
                          {analisisActual.datos.promedio_evaluaciones === null
                            ? "—"
                            : `${Number(analisisActual.datos.promedio_evaluaciones).toFixed(1)}%`}
                        </strong>
                        <span>Evaluaciones</span>
                      </div>
                      <div>
                        <strong>
                          {analisisActual.datos.promedio_tareas === null
                            ? "—"
                            : `${Number(analisisActual.datos.promedio_tareas).toFixed(1)}%`}
                        </strong>
                        <span>Tareas</span>
                      </div>
                      <div>
                        <strong>{analisisActual.analisis.nivel_general}</strong>
                        <span>Nivel observado</span>
                      </div>
                    </div>

                    <div className="ia-bloque-info">
                      <strong>🧠 Resumen</strong>
                      <p>{analisisActual.analisis.resumen}</p>
                    </div>

                    <div className="ia-analisis-grid">
                      <div className="ia-lista fortaleza">
                        <h3>✅ Fortalezas</h3>
                        <ul>
                          {analisisActual.analisis.fortalezas.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="ia-lista dificultad">
                        <h3>🎯 Áreas a reforzar</h3>
                        <ul>
                          {analisisActual.analisis.dificultades.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="ia-bloque-info">
                      <strong>💡 Recomendaciones</strong>
                      <div className="ia-recomendaciones-lista">
                        {analisisActual.analisis.recomendaciones.map((item, index) => (
                          <article key={index}>
                            <span className={`prioridad ${item.prioridad}`}>{item.prioridad}</span>
                            <h4>{item.titulo}</h4>
                            <p>{item.detalle}</p>
                          </article>
                        ))}
                      </div>
                    </div>

                    <button
                      className="ia-btn-refuerzo"
                      onClick={generarRefuerzo}
                      disabled={cargandoRefuerzo}
                    >
                      {cargandoRefuerzo
                        ? "✨ Creando actividad..."
                        : "✨ Generar actividad de refuerzo"}
                    </button>

                    {refuerzoActual && (
                      <div className="ia-refuerzo">
                        <span>ACTIVIDAD DE REFUERZO</span>
                        <h3>{refuerzoActual.titulo}</h3>
                        <p><strong>Objetivo:</strong> {refuerzoActual.objetivo}</p>
                        <p><strong>Duración:</strong> {refuerzoActual.duracion_minutos} minutos</p>
                        <p><strong>Instrucciones:</strong> {refuerzoActual.instrucciones}</p>
                        <p><strong>Actividad:</strong> {refuerzoActual.actividad}</p>

                        {refuerzoActual.preguntas?.length > 0 && (
                          <>
                            <h4>Preguntas de comprobación</h4>
                            {renderPreguntas(refuerzoActual.preguntas)}
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}
              </section>
            </section>
          )}

          {tab === "historial" && (
            <section className="ia-card ia-historial">
              <div className="ia-card-titulo">
                <span>🕘 HISTORIAL</span>
                <h2>Generaciones realizadas</h2>
                <p>Registro de propuestas creadas con IA y su estado de aprobación.</p>
              </div>

              {historial.length === 0 ? (
                <div className="ia-vacio compacto">
                  <div>📭</div>
                  <h3>Todavía no hay generaciones</h3>
                </div>
              ) : (
                <div className="ia-historial-lista">
                  {historial.map((item) => (
                    <article key={item.id}>
                      <div className="ia-historial-icono">
                        {item.tipo === "contenido" ? "📚" : "❓"}
                      </div>
                      <div className="ia-historial-info">
                        <strong>{item.tema || "Generación IA"}</strong>
                        <span>
                          {item.tipo} · {item.grado || "Sin grado"} · {item.modelo}
                        </span>
                      </div>
                      <span className={`ia-badge-estado ${item.estado}`}>{item.estado}</span>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    </>
  )
}

export default AsistenteIA
