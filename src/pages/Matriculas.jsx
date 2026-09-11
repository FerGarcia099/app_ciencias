import { useEffect, useState } from "react"
import axios from "axios"

import Sidebar from "../components/Sidebar"
import { API_URL } from "../config"
import "./Academico.css"

const hoy = () => new Date().toISOString().slice(0, 10)

const inicial = {
  usuario_id: "",
  grado_id: "",
  seccion_id: "",
  periodo_id: "",
  fecha_matricula: hoy(),
  observaciones: ""
}

function Matriculas() {
  const [opciones, setOpciones] = useState({ alumnos: [], grados: [], secciones: [], periodos: [] })
  const [matriculas, setMatriculas] = useState([])
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
      const [opcionesRes, matriculasRes] = await Promise.all([
        axios.get(`${API_URL}/academico/opciones`),
        axios.get(`${API_URL}/academico/matriculas`)
      ])

      setOpciones(opcionesRes.data || {})
      setMatriculas(Array.isArray(matriculasRes.data) ? matriculasRes.data : [])
    } catch (error) {
      console.error(error)
      setMensaje(error.response?.data?.mensaje || "No se pudo cargar el módulo de matrículas")
    } finally {
      setCargando(false)
    }
  }

  const cambiar = (campo, valor) => setForm((prev) => ({ ...prev, [campo]: valor }))

  const limpiar = () => {
    setForm({ ...inicial, fecha_matricula: hoy() })
    setEditandoId(null)
  }

  const guardar = async (e) => {
    e.preventDefault()

    try {
      if (editandoId) {
        await axios.put(`${API_URL}/academico/matriculas/${editandoId}`, {
          ...form,
          estado: "activo"
        })
        setMensaje("Matrícula actualizada correctamente ✅")
      } else {
        await axios.post(`${API_URL}/academico/matriculas`, form)
        setMensaje("Alumno matriculado correctamente ✅")
      }

      limpiar()
      await cargarTodo()
    } catch (error) {
      console.error(error)
      setMensaje(error.response?.data?.mensaje || "No se pudo guardar la matrícula")
    }
  }

  const editar = (item) => {
    setEditandoId(item.id)
    setForm({
      usuario_id: String(item.usuario_id),
      grado_id: String(item.grado_id),
      seccion_id: String(item.seccion_id),
      periodo_id: String(item.periodo_id),
      fecha_matricula: item.fecha_matricula?.slice(0, 10) || hoy(),
      observaciones: item.observaciones || ""
    })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const retirar = async (id) => {
    if (!window.confirm("¿Deseas retirar esta matrícula?")) return

    try {
      await axios.delete(`${API_URL}/academico/matriculas/${id}`)
      setMensaje("Matrícula retirada correctamente")
      await cargarTodo()
    } catch (error) {
      console.error(error)
      setMensaje(error.response?.data?.mensaje || "No se pudo retirar la matrícula")
    }
  }

  return (
    <>
      <Sidebar />
      <div className="academico-page">
        <main className="academico-container">
          <section className="academico-hero">
            <div className="academico-hero-icon">📝</div>
            <div>
              <small>GESTIÓN ACADÉMICA</small>
              <h1>Matrículas</h1>
              <p>Asigna cada alumno a un grado, sección y período académico.</p>
            </div>
            <div className="academico-contador">
              <strong>{matriculas.filter((m) => m.estado === "activo").length}</strong>
              <span>ACTIVAS</span>
            </div>
          </section>

          {mensaje && <div className="academico-mensaje">{mensaje}</div>}

          <div className="academico-grid matriculas-grid">
            <section className="academico-card">
              <div className="academico-card-title">
                <span>{editandoId ? "✏️" : "➕"}</span>
                <div>
                  <small>PROCESO PRINCIPAL</small>
                  <h2>{editandoId ? "Editar matrícula" : "Nueva matrícula"}</h2>
                </div>
              </div>

              <form className="academico-form" onSubmit={guardar}>
                <Campo label="Alumno *">
                  <select value={form.usuario_id} onChange={(e) => cambiar("usuario_id", e.target.value)} required>
                    <option value="">Selecciona un alumno</option>
                    {(opciones.alumnos || []).map((item) => (
                      <option key={item.id} value={item.id}>{item.nombre} (@{item.usuario})</option>
                    ))}
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

                <Campo label="Período académico *">
                  <select value={form.periodo_id} onChange={(e) => cambiar("periodo_id", e.target.value)} required>
                    <option value="">Selecciona un período</option>
                    {(opciones.periodos || []).map((item) => (
                      <option key={item.id} value={item.id}>{item.nombre} {item.anio}</option>
                    ))}
                  </select>
                </Campo>

                <Campo label="Fecha de matrícula *">
                  <input type="date" value={form.fecha_matricula} onChange={(e) => cambiar("fecha_matricula", e.target.value)} required />
                </Campo>

                <Campo label="Observaciones">
                  <textarea value={form.observaciones} onChange={(e) => cambiar("observaciones", e.target.value)} placeholder="Opcional" />
                </Campo>

                <div className="academico-actions">
                  <button className="academico-primary">💾 {editandoId ? "Guardar cambios" : "Matricular alumno"}</button>
                  {editandoId && <button type="button" className="academico-secondary" onClick={limpiar}>Cancelar</button>}
                </div>
              </form>
            </section>

            <section className="academico-card tabla-card">
              <div className="academico-card-title">
                <span>📋</span>
                <div>
                  <small>REGISTRO ACADÉMICO</small>
                  <h2>Alumnos matriculados</h2>
                </div>
              </div>

              {cargando ? (
                <div className="academico-vacio">Cargando...</div>
              ) : (
                <div className="academico-table-wrap">
                  <table className="academico-table">
                    <thead>
                      <tr>
                        <th>Alumno</th>
                        <th>Grado</th>
                        <th>Sección</th>
                        <th>Período</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matriculas.map((item) => (
                        <tr key={item.id}>
                          <td><strong>{item.alumno}</strong><small>@{item.usuario}</small></td>
                          <td>{item.grado}</td>
                          <td>{item.seccion}</td>
                          <td>{item.periodo} {item.anio}</td>
                          <td><span className={`estado-badge ${item.estado === "activo" ? "activo" : "inactivo"}`}>{item.estado}</span></td>
                          <td className="tabla-actions">
                            <button onClick={() => editar(item)}>✏️</button>
                            {item.estado === "activo" && <button onClick={() => retirar(item.id)}>🚫</button>}
                          </td>
                        </tr>
                      ))}
                      {matriculas.length === 0 && (
                        <tr><td colSpan="6" className="academico-vacio">No hay matrículas registradas.</td></tr>
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

export default Matriculas
