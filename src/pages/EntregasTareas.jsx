import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import axios from "axios"

import Sidebar from "../components/Sidebar"
import { API_URL } from "../config"
import "./Tareas.css"

export default function EntregasTareas() {
  const [searchParams] = useSearchParams()
  const tareaInicial = searchParams.get("tarea") || ""

  const [tareas, setTareas] = useState([])
  const [tareaId, setTareaId] = useState(tareaInicial)
  const [detalle, setDetalle] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [borradores, setBorradores] = useState({})

  useEffect(() => {
    cargarTareas()
  }, [])

  useEffect(() => {
    if (tareaId) cargarEntregas(tareaId)
    else setDetalle(null)
  }, [tareaId])

  const cargarTareas = async () => {
    try {
      setCargando(true)
      const res = await axios.get(`${API_URL}/tareas`)
      const lista = Array.isArray(res.data) ? res.data : []
      setTareas(lista)

      if (!tareaId && lista.length) setTareaId(String(lista[0].id))
    } catch (error) {
      console.error(error)
      alert(error.response?.data?.mensaje || "Error al cargar las tareas")
    } finally {
      setCargando(false)
    }
  }

  const cargarEntregas = async (id) => {
    try {
      setCargando(true)
      const res = await axios.get(`${API_URL}/tareas/${id}/entregas`)
      setDetalle(res.data)

      const nuevos = {}
      ;(res.data.entregas || []).forEach((e) => {
        if (e.entrega_id) {
          nuevos[e.entrega_id] = {
            calificacion: e.calificacion ?? "",
            observaciones_maestro: e.observaciones_maestro || ""
          }
        }
      })
      setBorradores(nuevos)
    } catch (error) {
      console.error(error)
      alert(error.response?.data?.mensaje || "No se pudieron cargar las entregas")
      setDetalle(null)
    } finally {
      setCargando(false)
    }
  }

  const cambiarBorrador = (entregaId, campo, valor) => {
    setBorradores((prev) => ({
      ...prev,
      [entregaId]: {
        ...(prev[entregaId] || {}),
        [campo]: valor
      }
    }))
  }

  const calificar = async (entrega) => {
    const datos = borradores[entrega.entrega_id] || {}

    if (datos.calificacion === "" || datos.calificacion === undefined) {
      alert("Ingresa una calificación")
      return
    }

    try {
      const res = await axios.put(
        `${API_URL}/tareas/entregas/${entrega.entrega_id}/calificar`,
        {
          calificacion: Number(datos.calificacion),
          observaciones_maestro: datos.observaciones_maestro || ""
        }
      )

      alert(res.data.mensaje || "Entrega calificada")
      await cargarEntregas(tareaId)
    } catch (error) {
      alert(error.response?.data?.mensaje || "No se pudo guardar la calificación")
    }
  }

  return (
    <>
      <Sidebar />
      <div className="tareas-page">
        <main className="tareas-container">
          <header className="tareas-hero entregas-hero">
            <div>
              <span>📥 MOVIMIENTO ACADÉMICO</span>
              <h1>Entregas y calificaciones</h1>
              <p>Revisa quién entregó, identifica entregas tardías y registra la calificación del maestro.</p>
            </div>
          </header>

          <section className="tareas-form-card selector-tarea-card">
            <label className="campo">
              <span>Selecciona una tarea</span>
              <select value={tareaId} onChange={(e) => setTareaId(e.target.value)}>
                <option value="">Selecciona...</option>
                {tareas.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.titulo} · {t.grado} {t.seccion}
                  </option>
                ))}
              </select>
            </label>
          </section>

          {cargando ? (
            <div className="estado-vacio">Cargando entregas...</div>
          ) : !detalle ? (
            <div className="estado-vacio">Selecciona una tarea para consultar sus entregas.</div>
          ) : (
            <section className="tareas-list-card">
              <div className="tareas-card-title">
                <div>
                  <span>📋 {detalle.tarea.curso}</span>
                  <h2>{detalle.tarea.titulo}</h2>
                  <p>{detalle.tarea.grado} · Sección {detalle.tarea.seccion} · Máximo {detalle.tarea.puntaje_maximo} puntos</p>
                </div>
              </div>

              {detalle.entregas.length === 0 ? (
                <div className="estado-vacio">
                  No hay alumnos matriculados en el grado, sección y período de esta tarea.
                </div>
              ) : (
                <div className="entregas-lista">
                  {detalle.entregas.map((entrega) => (
                    <article className="entrega-card" key={entrega.alumno_id}>
                      <div className="entrega-cabecera">
                        <div>
                          <h3>👦 {entrega.alumno}</h3>
                          <span>@{entrega.usuario}</span>
                        </div>
                        <span className={`badge-estado entrega-${entrega.estado}`}>
                          {entrega.estado === "pendiente" ? "Pendiente" : entrega.estado}
                        </span>
                      </div>

                      {!entrega.entrega_id ? (
                        <div className="entrega-pendiente">⏳ El alumno todavía no ha realizado la entrega.</div>
                      ) : (
                        <>
                          <div className="entrega-datos">
                            <div>
                              <strong>Fecha de entrega</strong>
                              <span>{new Date(entrega.fecha_entrega).toLocaleString()}</span>
                            </div>
                            <div>
                              <strong>Entrega tardía</strong>
                              <span>{entrega.es_tardia ? "⚠️ Sí" : "✅ No"}</span>
                            </div>
                          </div>

                          {entrega.respuesta_texto && (
                            <div className="respuesta-entrega">
                              <strong>Respuesta</strong>
                              <p>{entrega.respuesta_texto}</p>
                            </div>
                          )}

                          {entrega.url_entrega && (
                            <a
                              className="enlace-entrega"
                              href={entrega.url_entrega}
                              target="_blank"
                              rel="noreferrer"
                            >
                              🔗 Abrir enlace entregado
                            </a>
                          )}

                          <div className="calificacion-grid">
                            <label className="campo">
                              <span>Calificación / {detalle.tarea.puntaje_maximo}</span>
                              <input
                                type="number"
                                min="0"
                                max={detalle.tarea.puntaje_maximo}
                                step="0.01"
                                value={borradores[entrega.entrega_id]?.calificacion ?? ""}
                                onChange={(e) => cambiarBorrador(entrega.entrega_id, "calificacion", e.target.value)}
                              />
                            </label>

                            <label className="campo campo-completo">
                              <span>Observaciones del maestro</span>
                              <textarea
                                value={borradores[entrega.entrega_id]?.observaciones_maestro ?? ""}
                                onChange={(e) => cambiarBorrador(entrega.entrega_id, "observaciones_maestro", e.target.value)}
                                placeholder="Escribe retroalimentación para el estudiante"
                              />
                            </label>

                            <button className="btn-guardar-tarea campo-completo" onClick={() => calificar(entrega)}>
                              💾 Guardar calificación
                            </button>
                          </div>
                        </>
                      )}
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
