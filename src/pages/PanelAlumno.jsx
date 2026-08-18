import { useEffect, useState } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import "./PanelAlumno.css"
import { API_URL } from "../config"

export default function PanelAlumno() {
  const navigate = useNavigate()
  const [contenidos, setContenidos] = useState([])
  const [cargando, setCargando] = useState(true)

  const usuarioGuardado = JSON.parse(localStorage.getItem("usuario") || "null")
  const nombreAlumno = usuarioGuardado?.nombre || "Estudiante"
  const usuarioId = usuarioGuardado?.id || localStorage.getItem("usuarioId")

  useEffect(() => {
    if (!usuarioId) {
      navigate("/")
      return
    }

    obtenerContenidos()
  }, [])

  const obtenerContenidos = async () => {
    try {
      setCargando(true)
      const response = await axios.get(`${API_URL}/alumnos/${usuarioId}/progreso`)
      setContenidos(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error("Error al obtener contenidos:", error)
      alert("Error al obtener contenidos")
    } finally {
      setCargando(false)
    }
  }

  const cerrarSesion = () => {
    localStorage.clear()
    navigate("/")
  }

  const abrirActividad = (contenido) => {
    const bloqueado =
      contenido.estado === "completado" && !contenido.puede_reintentar

    if (bloqueado) {
      alert("Ya completaste esta actividad. Tu maestro debe habilitar un nuevo intento. 🔒")
      return
    }

    navigate(`/contenido-alumno/${contenido.id}`)
  }

  const obtenerProgreso = (contenido) => {
    if (contenido.estado === "completado") return 100

    const total = Number(contenido.preguntas_totales) || Number(contenido.total_preguntas) || 0
    const respondidas = Number(contenido.preguntas_respondidas) || 0

    return total > 0 ? Math.round((respondidas / total) * 100) : 0
  }

  const textoBoton = (contenido) => {
    if (contenido.estado === "sin_iniciar") return "🚀 Comenzar actividad"
    if (contenido.estado === "en_progreso") return "▶️ Continuar actividad"
    if (contenido.puede_reintentar) return "🔓 Nuevo intento habilitado"
    return "🔒 Actividad completada"
  }

  return (
    <div className="panel-alumno-page">
      <div className="floating-shape shape-1">📚</div>
      <div className="floating-shape shape-2">✏️</div>
      <div className="floating-shape shape-3">🎒</div>
      <div className="floating-shape shape-4">⚽</div>
      <div className="floating-shape shape-5">🧸</div>
      <div className="floating-shape shape-6">🖍️</div>
      <div className="floating-shape shape-7">📒</div>
      <div className="floating-shape shape-8">👧</div>
      <div className="floating-shape shape-9">🧒</div>

      <div className="panel-alumno-container">
        <div className="panel-header-card">
          <h1>🌟 Inicio del Alumno 🌟</h1>
          <p>
            ¡Bienvenido <strong>{nombreAlumno}</strong>!
          </p>
          <span className="subtexto">
            Aprende, responde y revisa tu progreso en cada tema.
          </span>

          <div className="panel-botones">
            <button
              className="btn-principal"
              onClick={() =>
                document
                  .getElementById("contenidos-section")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              📘 Ver contenidos y actividades
            </button>

            <button className="btn-salir" onClick={cerrarSesion}>
              🚪 Cerrar sesión
            </button>
          </div>
        </div>

        <section id="contenidos-section" className="contenidos-section">
          <h2>📚 Contenidos disponibles 🌱</h2>

          {cargando ? (
            <div className="mensaje-panel">Cargando contenidos...</div>
          ) : contenidos.length === 0 ? (
            <div className="mensaje-panel">
              No hay contenidos disponibles por el momento.
            </div>
          ) : (
            <div className="contenidos-grid">
              {contenidos.map((contenido) => {
                const progreso = obtenerProgreso(contenido)
                const bloqueado =
                  contenido.estado === "completado" && !contenido.puede_reintentar

                return (
                  <div className="contenido-card" key={contenido.id}>
                    <div className="contenido-icono">📝</div>

                    <h3>{contenido.titulo || "Sin título"}</h3>

                    <div className="grado-badge">
                      Grado: {contenido.grado || "No definido"}
                    </div>

                    <p>
                      {contenido.descripcion ||
                        "Contenido disponible para aprender y responder preguntas."}
                    </p>

                    <div className="estado-actividad-row">
                      <span className={`estado-actividad estado-${contenido.estado}`}>
                        {contenido.estado === "sin_iniciar" && "⚪ Sin iniciar"}
                        {contenido.estado === "en_progreso" && "🟡 En progreso"}
                        {contenido.estado === "completado" && "✅ Completado"}
                      </span>

                      {contenido.estado === "completado" && (
                        <strong className="resultado-mini">
                          {Number(contenido.puntaje_obtenido) || 0}/
                          {Number(contenido.puntaje_total) || 0} · {Math.round(Number(contenido.porcentaje) || 0)}%
                        </strong>
                      )}
                    </div>

                    <div className="progreso-alumno-card">
                      <div className="progreso-alumno-info">
                        <span>Avance</span>
                        <strong>{progreso}%</strong>
                      </div>

                      <div className="progreso-alumno-barra">
                        <div
                          className="progreso-alumno-relleno"
                          style={{ width: `${progreso}%` }}
                        />
                      </div>
                    </div>

                    {contenido.estado === "completado" && contenido.puede_reintentar && (
                      <div className="reintento-habilitado-aviso">
                        🎉 Tu maestro habilitó un nuevo intento.
                      </div>
                    )}

                    <button
                      className={`btn-ver ${bloqueado ? "btn-ver-bloqueado" : ""}`}
                      onClick={() => abrirActividad(contenido)}
                      disabled={bloqueado}
                    >
                      {textoBoton(contenido)}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
