import { useEffect, useState } from "react"
import axios from "axios"

import Sidebar from "../components/Sidebar"
import { API_URL } from "../config"
import "./Academico.css"

const hoy = () => new Date().toISOString().slice(0, 10)

const inicial = {
  maestro_id: "",
  curso_id: "",
  grado_id: "",
  seccion_id: "",
  periodo_id: "",
  fecha_asignacion: hoy(),
  observaciones: ""
}

function AsignacionesDocente() {
  const [opciones, setOpciones] = useState({ maestros: [], cursos: [], grados: [], secciones: [], periodos: [] })
  const [asignaciones, setAsignaciones] = useState([])
  const [form, setForm] = useState(inicial)
  const [editandoId, setEditandoId] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [mensaje, setMensaje] = useState("")

  useEffect(() => {
    cargarTodo()
  }, [])

  const cargarTodo = async () => {
    try {
      setCargando(true)
      const [opcionesRes, asignacionesRes] = await Promise.all([
        axios.get(`${API_URL}/academico/opciones`),
        axios.get(`${API_URL}/academico/asignaciones-docente`)
      ])

      setOpciones(opcionesRes.data || {})
      setAsignaciones(Array.isArray(asignacionesRes.data) ? asignacionesRes.data : [])
    } catch (error) {
      console.error(error)
      setMensaje(error.response?.data?.mensaje || "No se pudo cargar el módulo")
    } finally {
      setCargando(false)
    }
  }

  const cambiar = (campo, valor) => setForm((prev) => ({ ...prev, [campo]: valor }))

  const limpiar = () => {
    setForm({ ...inicial, fecha_asignacion: hoy() })
    setEditandoId(null)
  }

  const guardar = async (e) => {
    e.preventDefault()

    try {
      if (editandoId) {
        await axios.put(`${API_URL}/academico/asignaciones-docente/${editandoId}`, {
          ...form,
          activo: true
        })
        setMensaje("Asignación actualizada correctamente ✅")
      } else {
        await axios.post(`${API_URL}/academico/asignaciones-docente`, form)
        setMensaje("Asignación docente creada correctamente ✅")
      }

      limpiar()
      await cargarTodo()
    } catch (error) {
      console.error(error)
      setMensaje(error.response?.data?.mensaje || "No se pudo guardar la asignación")
    }
  }

  const editar = (item) => {
    setEditandoId(item.id)
    setForm({
      maestro_id: String(item.maestro_id),
      curso_id: String(item.curso_id),
      grado_id: String(item.grado_id),
      seccion_id: String(item.seccion_id),
      periodo_id: String(item.periodo_id),
      fecha_asignacion: item.fecha_asignacion?.slice(0, 10) || hoy(),
      observaciones: item.observaciones || ""
    })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const desactivar = async (id) => {
    if (!window.confirm("¿Deseas desactivar esta asignación?")) return

    try {
      await axios.delete(`${API_URL}/academico/asignaciones-docente/${id}`)
      setMensaje("Asignación desactivada correctamente")
      await cargarTodo()
    } catch (error) {
      console.error(error)
      setMensaje(error.response?.data?.mensaje || "No se pudo desactivar la asignación")
    }
  }

  return (
    <>
      <Sidebar />
      <div className="academico-page">
        <main className="academico-container">
          <section className="academico-hero">
            <div className="academico-hero-icon">👨‍🏫</div>
            <div>
              <small>GESTIÓN ACADÉMICA</small>
              <h1>Asignaciones docentes</h1>
              <p>Relaciona maestros con curso, grado, sección y período.</p>
            </div>
            <div className="academico-contador">
              <strong>{asignaciones.filter((a) => Number(a.activo)).length}</strong>
              <span>ACTIVAS</span>
            </div>
          </section>

          {mensaje && <div className="academico-mensaje">{mensaje}</div>}

          <div className="academico-grid asignaciones-grid">
            <section className="academico-card">
              <div className="academico-card-title">
                <span>{editandoId ? "✏️" : "➕"}</span>
                <div>
                  <small>PROCESO PRINCIPAL</small>
                  <h2>{editandoId ? "Editar asignación" : "Nueva asignación"}</h2>
                </div>
              </div>

              <form className="academico-form" onSubmit={guardar}>
                <Campo label="Maestro *">
                  <select value={form.maestro_id} onChange={(e) => cambiar("maestro_id", e.target.value)} required>
                    <option value="">Selecciona un maestro</option>
                    {(opciones.maestros || []).map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                  </select>
                </Campo>

                <Campo label="Curso *">
                  <select value={form.curso_id} onChange={(e) => cambiar("curso_id", e.target.value)} required>
                    <option value="">Selecciona un curso</option>
                    {(opciones.cursos || []).map((item) => <option key={item.id} value={item.id}>{item.codigo} - {item.nombre}</option>)}
                  </select>
                </Campo>

                <div className="academico-form-row">
                  <Campo label="Grado *">
                    <select value={form.grado_id} onChange={(e) => cambiar("grado_id", e.target.value)} required>
                      <option value="">Selecciona</option>
                      {(opciones.grados || []).map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                    </select>
                  </Campo>

                  <Campo label="Sección *">
                    <select value={form.seccion_id} onChange={(e) => cambiar("seccion_id", e.target.value)} required>
                      <option value="">Selecciona</option>
                      {(opciones.secciones || []).map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                    </select>
                  </Campo>
                </div>

                <Campo label="Período *">
                  <select value={form.periodo_id} onChange={(e) => cambiar("periodo_id", e.target.value)} required>
                    <option value="">Selecciona</option>
                    {(opciones.periodos || []).map((item) => <option key={item.id} value={item.id}>{item.nombre} {item.anio}</option>)}
                  </select>
                </Campo>

                <Campo label="Fecha de asignación *">
                  <input type="date" value={form.fecha_asignacion} onChange={(e) => cambiar("fecha_asignacion", e.target.value)} required />
                </Campo>

                <Campo label="Observaciones">
                  <textarea value={form.observaciones} onChange={(e) => cambiar("observaciones", e.target.value)} placeholder="Opcional" />
                </Campo>

                <div className="academico-actions">
                  <button className="academico-primary">💾 {editandoId ? "Guardar cambios" : "Crear asignación"}</button>
                  {editandoId && <button type="button" className="academico-secondary" onClick={limpiar}>Cancelar</button>}
                </div>
              </form>
            </section>

            <section className="academico-card tabla-card">
              <div className="academico-card-title">
                <span>📋</span>
                <div>
                  <small>DOCENTES</small>
                  <h2>Asignaciones registradas</h2>
                </div>
              </div>

              {cargando ? (
                <div className="academico-vacio">Cargando...</div>
              ) : (
                <div className="academico-table-wrap">
                  <table className="academico-table">
                    <thead>
                      <tr>
                        <th>Maestro</th>
                        <th>Curso</th>
                        <th>Grupo</th>
                        <th>Período</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {asignaciones.map((item) => (
                        <tr key={item.id}>
                          <td><strong>{item.maestro}</strong></td>
                          <td><strong>{item.curso_codigo}</strong><small>{item.curso}</small></td>
                          <td>{item.grado} · {item.seccion}</td>
                          <td>{item.periodo} {item.anio}</td>
                          <td><span className={`estado-badge ${Number(item.activo) ? "activo" : "inactivo"}`}>{Number(item.activo) ? "Activo" : "Inactivo"}</span></td>
                          <td className="tabla-actions">
                            <button onClick={() => editar(item)}>✏️</button>
                            {Number(item.activo) === 1 && <button onClick={() => desactivar(item.id)}>🗃️</button>}
                          </td>
                        </tr>
                      ))}
                      {asignaciones.length === 0 && (
                        <tr><td colSpan="6" className="academico-vacio">No hay asignaciones registradas.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </>
  )
}

function Campo({ label, children }) {
  return <label className="academico-field"><span>{label}</span>{children}</label>
}

export default AsignacionesDocente
