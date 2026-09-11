import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"

import { API_URL } from "../config"
import "./Tareas.css"

export default function MisTareas() {
  const navigate = useNavigate()
  const [tareas, setTareas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [editando, setEditando] = useState(null)
  const [respuesta, setRespuesta] = useState("")
  const [urlEntrega, setUrlEntrega] = useState("")
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    cargarTareas()
  }, [])

  const cargarTareas = async () => {
    try {
      setCargando(true)
      const res = await axios.get(`${API_URL}/tareas/mias`)
      setTareas(Array.isArray(res.data) ? res.data : [])
    } catch (error) {
      console.error(error)
      alert(error.response?.data?.mensaje || "No se pudieron cargar tus tareas")
    } finally {
      setCargando(false)
    }
  }

  const abrirEntrega = (tarea) => {
    setEditando(tarea)
    setRespuesta(tarea.respuesta_texto || "")
    setUrlEntrega(tarea.url_entrega || "")
  }

  const entregar = async () => {
    if (!editando) return

    if (!respuesta.trim() && !urlEntrega.trim()) {
      alert("Escribe una respuesta o agrega un enlace")
      return
    }

    try {
      setGuardando(true)
      const res = await axios.put(`${API_URL}/tareas/${editando.id}/entrega`, {
        respuesta_texto: respuesta,
        url_entrega: urlEntrega
      })
      alert(res.data.mensaje || "Tarea entregada correctamente")
      setEditando(null)
      setRespuesta("")
      setUrlEntrega("")
      await cargarTareas()
    } catch (error) {
      alert(error.response?.data?.mensaje || "No se pudo realizar la entrega")
    } finally {
      setGuardando(false)
    }
  }

  const etiquetaEstado = (tarea) => {
    if (tarea.estado_entrega === "calificada") return `✅ Calificada: ${tarea.calificacion}/${tarea.puntaje_maximo}`
    if (tarea.estado_entrega === "entregada") return tarea.es_tardia ? "⚠️ Entregada tarde" : "📥 Entregada"
    if (tarea.estado_entrega === "devuelta") return "↩️ Devuelta"
    return tarea.estado_tarea === "cerrada" ? "🔒 Cerrada" : "⏳ Pendiente"
  }

  return (
    <div className="mis-tareas-page">
      <div className="mis-tareas-container">
        <header className="mis-tareas-hero">
          <div>
            <span>📝 MIS ACTIVIDADES</span>
            <h1>Mis tareas</h1>
            <p>Revisa tus tareas, envía tus respuestas y consulta la retroalimentación de tu maestro.</p>
          </div>
          <button onClick={() => navigate("/panelAlumno")}>← Volver al inicio</button>
        </header>

        {cargando ? (
          <div className="estado-vacio">Cargando tus tareas...</div>
        ) : tareas.length === 0 ? (
          <div className="estado-vacio alumno-vacio">
            <div>🎉</div>
            <h2>No tienes tareas asignadas por el momento</h2>
            <p>Cuando tu maestro publique una actividad aparecerá aquí.</p>
          </div>
        ) : (
          <div className="mis-tareas-grid">
            {tareas.map((tarea) => (
              <article className="mis-tarea-card" key={tarea.id}>
                <div className="mis-tarea-top">
                  <span className={`badge-alumno entrega-${tarea.estado_entrega}`}>{etiquetaEstado(tarea)}</span>
                  <strong>⭐ {tarea.puntaje_maximo} pts</strong>
                </div>

                <h2>{tarea.titulo}</h2>
                <p>{tarea.descripcion}</p>

                {tarea.instrucciones && (
                  <div className="instrucciones-alumno">
                    <strong>📌 Instrucciones</strong>
                    <p>{tarea.instrucciones}</p>
                  </div>
                )}

                <div className="mis-tarea-meta">
                  <span>📚 {tarea.curso}</span>
                  <span>🎓 {tarea.grado} · {tarea.seccion}</span>
                  <span>📅 {tarea.fecha_limite ? new Date(tarea.fecha_limite).toLocaleString() : "Sin fecha límite"}</span>
                </div>

                {tarea.estado_entrega === "calificada" && (
                  <div className="retroalimentacion-alumno">
                    <strong>💬 Retroalimentación del maestro</strong>
                    <p>{tarea.observaciones_maestro || "Sin observaciones adicionales."}</p>
                  </div>
                )}

                {tarea.puede_entregar ? (
                  <button className="btn-entregar-alumno" onClick={() => abrirEntrega(tarea)}>
                    {tarea.entrega_id ? "✏️ Actualizar entrega" : "📤 Realizar entrega"}
                  </button>
                ) : (
                  <button className="btn-entregar-alumno cerrado" disabled>🔒 Tarea cerrada</button>
                )}
              </article>
            ))}
          </div>
        )}

        {editando && (
          <div className="modal-entrega-fondo">
            <div className="modal-entrega">
              <button className="cerrar-modal-entrega" onClick={() => setEditando(null)}>×</button>
              <span>📤 ENTREGA DE TAREA</span>
              <h2>{editando.titulo}</h2>

              <label className="campo">
                <span>Tu respuesta</span>
                <textarea
                  value={respuesta}
                  onChange={(e) => setRespuesta(e.target.value)}
                  placeholder="Escribe aquí tu respuesta o explicación..."
                />
              </label>

              <label className="campo">
                <span>Enlace de apoyo o archivo compartido</span>
                <input
                  type="url"
                  value={urlEntrega}
                  onChange={(e) => setUrlEntrega(e.target.value)}
                  placeholder="https://drive.google.com/..."
                />
              </label>

              <button className="btn-guardar-tarea" onClick={entregar} disabled={guardando}>
                {guardando ? "Enviando..." : "✅ Enviar tarea"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
