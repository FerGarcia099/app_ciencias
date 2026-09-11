import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"

import Sidebar from "../components/Sidebar"
import { API_URL } from "../config"
import "./Tareas.css"

function fechaLocalInput() {
  const ahora = new Date()
  const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

function aInputFecha(valor) {
  if (!valor) return ""
  return valor.toString().replace(" ", "T").slice(0, 16)
}

const formVacio = () => ({
  asignacion_docente_id: "",
  contenido_id: "",
  titulo: "",
  descripcion: "",
  instrucciones: "",
  fecha_publicacion: fechaLocalInput(),
  fecha_limite: "",
  puntaje_maximo: 10,
  estado: "borrador"
})

export default function Tareas() {
  const navigate = useNavigate()
  const [opciones, setOpciones] = useState({ asignaciones: [], contenidos: [] })
  const [tareas, setTareas] = useState([])
  const [form, setForm] = useState(formVacio())
  const [editandoId, setEditandoId] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)

  const asignacionSeleccionada = useMemo(
    () => opciones.asignaciones.find((x) => Number(x.id) === Number(form.asignacion_docente_id)),
    [opciones.asignaciones, form.asignacion_docente_id]
  )

  useEffect(() => {
    cargarTodo()
  }, [])

  const cargarTodo = async () => {
    try {
      setCargando(true)
      const [opcionesRes, tareasRes] = await Promise.all([
        axios.get(`${API_URL}/tareas/opciones`),
        axios.get(`${API_URL}/tareas`)
      ])

      setOpciones(opcionesRes.data || { asignaciones: [], contenidos: [] })
      setTareas(Array.isArray(tareasRes.data) ? tareasRes.data : [])
    } catch (error) {
      console.error("Error al cargar tareas:", error)
      alert(error.response?.data?.mensaje || "Error al cargar el módulo de tareas")
    } finally {
      setCargando(false)
    }
  }

  const cambiar = (campo, valor) => {
    setForm((anterior) => ({ ...anterior, [campo]: valor }))
  }

  const limpiar = () => {
    setForm(formVacio())
    setEditandoId(null)
  }

  const guardar = async (e) => {
    e.preventDefault()

    if (!form.asignacion_docente_id || !form.titulo.trim() || !form.descripcion.trim()) {
      alert("Completa la asignación, título y descripción")
      return
    }

    try {
      setGuardando(true)
      const payload = {
        ...form,
        asignacion_docente_id: Number(form.asignacion_docente_id),
        contenido_id: form.contenido_id ? Number(form.contenido_id) : null,
        puntaje_maximo: Number(form.puntaje_maximo)
      }

      const res = editandoId
        ? await axios.put(`${API_URL}/tareas/${editandoId}`, payload)
        : await axios.post(`${API_URL}/tareas`, payload)

      alert(res.data.mensaje || "Tarea guardada correctamente")
      limpiar()
      await cargarTodo()
    } catch (error) {
      console.error("Error al guardar tarea:", error)
      alert(error.response?.data?.mensaje || "No se pudo guardar la tarea")
    } finally {
      setGuardando(false)
    }
  }

  const editar = (tarea) => {
    setEditandoId(tarea.id)
    setForm({
      asignacion_docente_id: String(tarea.asignacion_docente_id),
      contenido_id: tarea.contenido_id ? String(tarea.contenido_id) : "",
      titulo: tarea.titulo || "",
      descripcion: tarea.descripcion || "",
      instrucciones: tarea.instrucciones || "",
      fecha_publicacion: aInputFecha(tarea.fecha_publicacion),
      fecha_limite: aInputFecha(tarea.fecha_limite),
      puntaje_maximo: Number(tarea.puntaje_maximo) || 10,
      estado: tarea.estado || "borrador"
    })

    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const cambiarEstado = async (tarea, estado) => {
    try {
      await axios.put(`${API_URL}/tareas/${tarea.id}/estado`, { estado })
      await cargarTodo()
    } catch (error) {
      alert(error.response?.data?.mensaje || "No se pudo actualizar el estado")
    }
  }

  const archivar = async (tarea) => {
    if (!window.confirm(`¿Archivar la tarea "${tarea.titulo}"?`)) return

    try {
      await axios.delete(`${API_URL}/tareas/${tarea.id}`)
      await cargarTodo()
    } catch (error) {
      alert(error.response?.data?.mensaje || "No se pudo archivar la tarea")
    }
  }

  return (
    <>
      <Sidebar />

      <div className="tareas-page">
        <main className="tareas-container">
          <header className="tareas-hero">
            <div>
              <span>📝 PROCESO ACADÉMICO</span>
              <h1>Gestión de tareas</h1>
              <p>
                Crea actividades por curso, grado y sección. Después podrás revisar y calificar
                las entregas de tus estudiantes.
              </p>
            </div>
            <button onClick={() => navigate("/entregas-tareas")}>📥 Ver entregas</button>
          </header>

          <section className="tareas-form-card">
            <div className="tareas-card-title">
              <div>
                <span>{editandoId ? "✏️ EDITAR" : "➕ NUEVA"}</span>
                <h2>{editandoId ? "Modificar tarea" : "Crear tarea"}</h2>
              </div>
              {editandoId && <button className="btn-secundario" onClick={limpiar}>Cancelar edición</button>}
            </div>

            <form onSubmit={guardar} className="tareas-form-grid">
              <label className="campo campo-completo">
                <span>Asignación docente *</span>
                <select
                  value={form.asignacion_docente_id}
                  onChange={(e) => cambiar("asignacion_docente_id", e.target.value)}
                  required
                >
                  <option value="">Selecciona curso, grado y sección</option>
                  {opciones.asignaciones.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.curso} · {a.grado} · Sección {a.seccion} · {a.periodo} {a.anio}
                    </option>
                  ))}
                </select>
              </label>

              {opciones.asignaciones.length === 0 && !cargando && (
                <div className="aviso-form campo-completo">
                  ⚠️ Primero crea una asignación docente en el módulo de Asignaciones.
                </div>
              )}

              <label className="campo campo-completo">
                <span>Contenido relacionado</span>
                <select value={form.contenido_id} onChange={(e) => cambiar("contenido_id", e.target.value)}>
                  <option value="">Sin contenido específico</option>
                  {opciones.contenidos.map((c) => (
                    <option key={c.id} value={c.id}>{c.titulo} · {c.grado}</option>
                  ))}
                </select>
              </label>

              <label className="campo campo-completo">
                <span>Título *</span>
                <input
                  value={form.titulo}
                  onChange={(e) => cambiar("titulo", e.target.value)}
                  placeholder="Ej. Identificar los órganos principales"
                  required
                />
              </label>

              <label className="campo campo-completo">
                <span>Descripción *</span>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => cambiar("descripcion", e.target.value)}
                  placeholder="Describe el objetivo de la tarea"
                  required
                />
              </label>

              <label className="campo campo-completo">
                <span>Instrucciones</span>
                <textarea
                  value={form.instrucciones}
                  onChange={(e) => cambiar("instrucciones", e.target.value)}
                  placeholder="Indica paso a paso qué debe realizar el alumno"
                />
              </label>

              <label className="campo">
                <span>Publicación</span>
                <input
                  type="datetime-local"
                  value={form.fecha_publicacion}
                  onChange={(e) => cambiar("fecha_publicacion", e.target.value)}
                  required
                />
              </label>

              <label className="campo">
                <span>Fecha límite</span>
                <input
                  type="datetime-local"
                  value={form.fecha_limite}
                  onChange={(e) => cambiar("fecha_limite", e.target.value)}
                />
              </label>

              <label className="campo">
                <span>Puntaje máximo</span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={form.puntaje_maximo}
                  onChange={(e) => cambiar("puntaje_maximo", e.target.value)}
                  required
                />
              </label>

              <label className="campo">
                <span>Estado</span>
                <select value={form.estado} onChange={(e) => cambiar("estado", e.target.value)}>
                  <option value="borrador">Borrador</option>
                  <option value="publicada">Publicada</option>
                  <option value="cerrada">Cerrada</option>
                </select>
              </label>

              {asignacionSeleccionada && (
                <div className="resumen-asignacion campo-completo">
                  🎓 {asignacionSeleccionada.grado} · Sección {asignacionSeleccionada.seccion} · 📚 {asignacionSeleccionada.curso}
                </div>
              )}

              <button className="btn-guardar-tarea campo-completo" disabled={guardando || opciones.asignaciones.length === 0}>
                {guardando ? "Guardando..." : editandoId ? "💾 Guardar cambios" : "✅ Crear tarea"}
              </button>
            </form>
          </section>

          <section className="tareas-list-card">
            <div className="tareas-card-title">
              <div>
                <span>📚 REGISTROS</span>
                <h2>Tareas creadas</h2>
              </div>
              <b>{tareas.length} tareas</b>
            </div>

            {cargando ? (
              <div className="estado-vacio">Cargando tareas...</div>
            ) : tareas.length === 0 ? (
              <div className="estado-vacio">📝 Todavía no has creado tareas.</div>
            ) : (
              <div className="tareas-lista">
                {tareas.map((tarea) => (
                  <article className="tarea-item" key={tarea.id}>
                    <div className="tarea-item-top">
                      <div>
                        <span className={`badge-estado estado-${tarea.estado}`}>{tarea.estado}</span>
                        <h3>{tarea.titulo}</h3>
                        <p>{tarea.descripcion}</p>
                      </div>
                      <div className="puntaje-tarea">⭐ {tarea.puntaje_maximo} pts</div>
                    </div>

                    <div className="tarea-meta">
                      <span>📚 {tarea.curso}</span>
                      <span>🎓 {tarea.grado} · {tarea.seccion}</span>
                      <span>📅 {tarea.fecha_limite ? new Date(tarea.fecha_limite).toLocaleString() : "Sin fecha límite"}</span>
                      <span>📥 {tarea.entregas} entregas</span>
                      <span>✅ {tarea.calificadas} calificadas</span>
                    </div>

                    <div className="tarea-acciones">
                      <button onClick={() => editar(tarea)}>✏️ Editar</button>
                      <button onClick={() => navigate(`/entregas-tareas?tarea=${tarea.id}`)}>📥 Entregas</button>
                      {tarea.estado !== "publicada" && (
                        <button onClick={() => cambiarEstado(tarea, "publicada")}>📢 Publicar</button>
                      )}
                      {tarea.estado === "publicada" && (
                        <button onClick={() => cambiarEstado(tarea, "cerrada")}>🔒 Cerrar</button>
                      )}
                      <button className="btn-peligro" onClick={() => archivar(tarea)}>🗃️ Archivar</button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </>
  )
}
