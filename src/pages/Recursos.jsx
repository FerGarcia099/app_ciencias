import { useEffect, useState } from "react"
import axios from "axios"

import Sidebar from "../components/Sidebar"
import { API_URL } from "../config"
import "./Tareas.css"

const vacio = {
  contenido_id: "",
  tipo: "enlace",
  titulo: "",
  descripcion: "",
  url: "",
  orden: 1
}

const iconos = {
  video: "🎥",
  enlace: "🔗",
  documento: "📄",
  imagen: "🖼️",
  otro: "📎"
}

export default function Recursos() {
  const [contenidos, setContenidos] = useState([])
  const [recursos, setRecursos] = useState([])
  const [form, setForm] = useState(vacio)
  const [editandoId, setEditandoId] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargar()
  }, [])

  const cargar = async () => {
    try {
      setCargando(true)
      const [cRes, rRes] = await Promise.all([
        axios.get(`${API_URL}/contenidos`),
        axios.get(`${API_URL}/recursos`)
      ])
      setContenidos(Array.isArray(cRes.data) ? cRes.data : [])
      setRecursos(Array.isArray(rRes.data) ? rRes.data : [])
    } catch (error) {
      console.error(error)
      alert(error.response?.data?.mensaje || "Error al cargar los recursos")
    } finally {
      setCargando(false)
    }
  }

  const cambiar = (campo, valor) => setForm((prev) => ({ ...prev, [campo]: valor }))

  const limpiar = () => {
    setForm(vacio)
    setEditandoId(null)
  }

  const guardar = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...form,
        contenido_id: Number(form.contenido_id),
        orden: Number(form.orden) || 1
      }

      const res = editandoId
        ? await axios.put(`${API_URL}/recursos/${editandoId}`, payload)
        : await axios.post(`${API_URL}/recursos`, payload)

      alert(res.data.mensaje || "Recurso guardado")
      limpiar()
      await cargar()
    } catch (error) {
      alert(error.response?.data?.mensaje || "No se pudo guardar el recurso")
    }
  }

  const editar = (r) => {
    setEditandoId(r.id)
    setForm({
      contenido_id: String(r.contenido_id),
      tipo: r.tipo,
      titulo: r.titulo,
      descripcion: r.descripcion || "",
      url: r.url,
      orden: r.orden || 1
    })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const cambiarActivo = async (r) => {
    try {
      if (Number(r.activo)) await axios.delete(`${API_URL}/recursos/${r.id}`)
      else await axios.put(`${API_URL}/recursos/${r.id}/restaurar`)
      await cargar()
    } catch (error) {
      alert(error.response?.data?.mensaje || "No se pudo actualizar el recurso")
    }
  }

  return (
    <>
      <Sidebar />
      <div className="tareas-page">
        <main className="tareas-container">
          <header className="tareas-hero recursos-hero">
            <div>
              <span>📎 MATERIAL COMPLEMENTARIO</span>
              <h1>Recursos educativos</h1>
              <p>Agrega videos, documentos, imágenes y enlaces relacionados con cada contenido.</p>
            </div>
          </header>

          <section className="tareas-form-card">
            <div className="tareas-card-title">
              <div>
                <span>{editandoId ? "✏️ EDITAR" : "➕ NUEVO RECURSO"}</span>
                <h2>{editandoId ? "Modificar recurso" : "Agregar recurso"}</h2>
              </div>
              {editandoId && <button className="btn-secundario" onClick={limpiar}>Cancelar</button>}
            </div>

            <form onSubmit={guardar} className="tareas-form-grid">
              <label className="campo">
                <span>Contenido *</span>
                <select value={form.contenido_id} onChange={(e) => cambiar("contenido_id", e.target.value)} required>
                  <option value="">Selecciona...</option>
                  {contenidos.map((c) => <option key={c.id} value={c.id}>{c.titulo} · {c.grado}</option>)}
                </select>
              </label>

              <label className="campo">
                <span>Tipo *</span>
                <select value={form.tipo} onChange={(e) => cambiar("tipo", e.target.value)}>
                  <option value="enlace">🔗 Enlace</option>
                  <option value="video">🎥 Video</option>
                  <option value="documento">📄 Documento</option>
                  <option value="imagen">🖼️ Imagen</option>
                  <option value="otro">📎 Otro</option>
                </select>
              </label>

              <label className="campo campo-completo">
                <span>Título *</span>
                <input value={form.titulo} onChange={(e) => cambiar("titulo", e.target.value)} required />
              </label>

              <label className="campo campo-completo">
                <span>Descripción</span>
                <textarea value={form.descripcion} onChange={(e) => cambiar("descripcion", e.target.value)} />
              </label>

              <label className="campo campo-completo">
                <span>URL *</span>
                <input
                  type="url"
                  value={form.url}
                  onChange={(e) => cambiar("url", e.target.value)}
                  placeholder="https://..."
                  required
                />
              </label>

              <label className="campo">
                <span>Orden</span>
                <input type="number" min="1" value={form.orden} onChange={(e) => cambiar("orden", e.target.value)} />
              </label>

              <button className="btn-guardar-tarea campo-completo">
                {editandoId ? "💾 Guardar cambios" : "✅ Agregar recurso"}
              </button>
            </form>
          </section>

          <section className="tareas-list-card">
            <div className="tareas-card-title">
              <div>
                <span>📚 BIBLIOTECA</span>
                <h2>Recursos registrados</h2>
              </div>
              <b>{recursos.length} recursos</b>
            </div>

            {cargando ? (
              <div className="estado-vacio">Cargando...</div>
            ) : recursos.length === 0 ? (
              <div className="estado-vacio">📎 Todavía no hay recursos registrados.</div>
            ) : (
              <div className="recursos-grid">
                {recursos.map((r) => (
                  <article className={`recurso-card ${Number(r.activo) ? "" : "recurso-inactivo"}`} key={r.id}>
                    <div className="recurso-icono">{iconos[r.tipo] || "📎"}</div>
                    <span className="recurso-contenido">{r.contenido}</span>
                    <h3>{r.titulo}</h3>
                    <p>{r.descripcion || "Sin descripción"}</p>
                    <a href={r.url} target="_blank" rel="noreferrer">Abrir recurso ↗</a>
                    <div className="tarea-acciones">
                      <button onClick={() => editar(r)}>✏️ Editar</button>
                      <button onClick={() => cambiarActivo(r)}>{Number(r.activo) ? "🗃️ Desactivar" : "♻️ Restaurar"}</button>
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
