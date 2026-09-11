import { useEffect, useMemo, useState } from "react"
import axios from "axios"

import Sidebar from "../components/Sidebar"
import { API_URL } from "../config"
import "./Academico.css"

const TIPOS = [
  { id: "grados", titulo: "Grados", icono: "🎓" },
  { id: "secciones", titulo: "Secciones", icono: "🏫" },
  { id: "cursos", titulo: "Cursos", icono: "📚" },
  { id: "periodos", titulo: "Períodos", icono: "📅" },
  { id: "tipos-logro", titulo: "Tipos de logro", icono: "🏆" }
]

const FORM_INICIAL = {
  grados: { nombre: "", nivel: "Primaria", orden: 1 },
  secciones: { nombre: "", descripcion: "" },
  cursos: { codigo: "", nombre: "", descripcion: "" },
  periodos: {
    nombre: "Ciclo Escolar",
    anio: new Date().getFullYear(),
    fecha_inicio: "",
    fecha_fin: "",
    estado: "planificado"
  },
  "tipos-logro": { nombre: "", descripcion: "", icono: "🏆" }
}

function Parametrizaciones() {
  const [tipo, setTipo] = useState("grados")
  const [registros, setRegistros] = useState([])
  const [form, setForm] = useState(FORM_INICIAL.grados)
  const [editandoId, setEditandoId] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState("")

  const actual = useMemo(
    () => TIPOS.find((item) => item.id === tipo),
    [tipo]
  )

  useEffect(() => {
    setForm({ ...FORM_INICIAL[tipo] })
    setEditandoId(null)
    cargarRegistros(tipo)
  }, [tipo])

  const cargarRegistros = async (tipoActual = tipo) => {
    try {
      setCargando(true)
      const res = await axios.get(
        `${API_URL}/academico/parametros/${tipoActual}?incluir_inactivos=1`
      )
      setRegistros(Array.isArray(res.data) ? res.data : [])
    } catch (error) {
      console.error(error)
      setMensaje(error.response?.data?.mensaje || "No se pudieron cargar los registros")
    } finally {
      setCargando(false)
    }
  }

  const cambiar = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  const limpiar = () => {
    setForm({ ...FORM_INICIAL[tipo] })
    setEditandoId(null)
  }

  const guardar = async (e) => {
    e.preventDefault()

    try {
      setGuardando(true)
      setMensaje("")

      if (editandoId) {
        await axios.put(
          `${API_URL}/academico/parametros/${tipo}/${editandoId}`,
          form
        )
        setMensaje("Registro actualizado correctamente ✅")
      } else {
        await axios.post(
          `${API_URL}/academico/parametros/${tipo}`,
          form
        )
        setMensaje("Registro creado correctamente ✅")
      }

      limpiar()
      await cargarRegistros()
    } catch (error) {
      console.error(error)
      setMensaje(error.response?.data?.mensaje || "No se pudo guardar el registro")
    } finally {
      setGuardando(false)
    }
  }

  const editar = (item) => {
    const base = { ...FORM_INICIAL[tipo] }

    Object.keys(base).forEach((campo) => {
      if (item[campo] !== undefined && item[campo] !== null) {
        base[campo] = item[campo]
      }
    })

    if (tipo === "periodos") {
      base.fecha_inicio = item.fecha_inicio?.slice(0, 10) || ""
      base.fecha_fin = item.fecha_fin?.slice(0, 10) || ""
    }

    setForm(base)
    setEditandoId(item.id)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const cambiarEstado = async (item) => {
    try {
      if (Number(item.activo)) {
        await axios.delete(`${API_URL}/academico/parametros/${tipo}/${item.id}`)
      } else {
        await axios.put(`${API_URL}/academico/parametros/${tipo}/${item.id}/restaurar`)
      }

      await cargarRegistros()
    } catch (error) {
      console.error(error)
      setMensaje(error.response?.data?.mensaje || "No se pudo cambiar el estado")
    }
  }

  const camposFormulario = () => {
    if (tipo === "grados") {
      return (
        <>
          <Campo label="Nombre del grado *">
            <input value={form.nombre} onChange={(e) => cambiar("nombre", e.target.value)} placeholder="Ej. 5to Primaria" />
          </Campo>
          <Campo label="Nivel educativo">
            <input value={form.nivel} onChange={(e) => cambiar("nivel", e.target.value)} placeholder="Primaria" />
          </Campo>
          <Campo label="Orden">
            <input type="number" min="1" value={form.orden} onChange={(e) => cambiar("orden", e.target.value)} />
          </Campo>
        </>
      )
    }

    if (tipo === "secciones") {
      return (
        <>
          <Campo label="Nombre de la sección *">
            <input value={form.nombre} onChange={(e) => cambiar("nombre", e.target.value)} placeholder="Ej. C" />
          </Campo>
          <Campo label="Descripción">
            <input value={form.descripcion} onChange={(e) => cambiar("descripcion", e.target.value)} placeholder="Ej. Sección C" />
          </Campo>
        </>
      )
    }

    if (tipo === "cursos") {
      return (
        <>
          <Campo label="Código *">
            <input value={form.codigo} onChange={(e) => cambiar("codigo", e.target.value)} placeholder="Ej. CN" />
          </Campo>
          <Campo label="Nombre del curso *">
            <input value={form.nombre} onChange={(e) => cambiar("nombre", e.target.value)} placeholder="Ej. Ciencias Naturales" />
          </Campo>
          <Campo label="Descripción">
            <textarea value={form.descripcion} onChange={(e) => cambiar("descripcion", e.target.value)} placeholder="Descripción del curso" />
          </Campo>
        </>
      )
    }

    if (tipo === "periodos") {
      return (
        <>
          <Campo label="Nombre *">
            <input value={form.nombre} onChange={(e) => cambiar("nombre", e.target.value)} placeholder="Ciclo Escolar" />
          </Campo>
          <Campo label="Año *">
            <input type="number" min="2000" max="2100" value={form.anio} onChange={(e) => cambiar("anio", e.target.value)} />
          </Campo>
          <Campo label="Fecha de inicio *">
            <input type="date" value={form.fecha_inicio} onChange={(e) => cambiar("fecha_inicio", e.target.value)} />
          </Campo>
          <Campo label="Fecha de fin *">
            <input type="date" value={form.fecha_fin} onChange={(e) => cambiar("fecha_fin", e.target.value)} />
          </Campo>
          <Campo label="Estado">
            <select value={form.estado} onChange={(e) => cambiar("estado", e.target.value)}>
              <option value="planificado">Planificado</option>
              <option value="activo">Activo</option>
              <option value="cerrado">Cerrado</option>
            </select>
          </Campo>
        </>
      )
    }

    return (
      <>
        <Campo label="Nombre del tipo de logro *">
          <input value={form.nombre} onChange={(e) => cambiar("nombre", e.target.value)} placeholder="Ej. Evaluación perfecta" />
        </Campo>
        <Campo label="Ícono">
          <input value={form.icono} onChange={(e) => cambiar("icono", e.target.value)} placeholder="🏆" />
        </Campo>
        <Campo label="Descripción">
          <textarea value={form.descripcion} onChange={(e) => cambiar("descripcion", e.target.value)} placeholder="Explica cuándo se obtiene" />
        </Campo>
      </>
    )
  }

  const resumenItem = (item) => {
    if (tipo === "grados") return `${item.nivel} · orden ${item.orden}`
    if (tipo === "secciones") return item.descripcion || "Sin descripción"
    if (tipo === "cursos") return `${item.codigo} · ${item.descripcion || "Sin descripción"}`
    if (tipo === "periodos") return `${item.anio} · ${item.estado}`
    return `${item.icono || "🏆"} ${item.descripcion || "Sin descripción"}`
  }

  return (
    <>
      <Sidebar />

      <div className="academico-page">
        <main className="academico-container">
          <section className="academico-hero">
            <div className="academico-hero-icon">⚙️</div>
            <div>
              <small>CONFIGURACIÓN ACADÉMICA</small>
              <h1>Parametrizaciones</h1>
              <p>Administra los catálogos base que utiliza Eco Holistic.</p>
            </div>
            <div className="academico-contador">
              <strong>5</strong>
              <span>PARAMETRIZACIONES</span>
            </div>
          </section>

          <div className="academico-tabs">
            {TIPOS.map((item) => (
              <button
                key={item.id}
                className={tipo === item.id ? "academico-tab activo" : "academico-tab"}
                onClick={() => setTipo(item.id)}
              >
                <span>{item.icono}</span>
                {item.titulo}
              </button>
            ))}
          </div>

          {mensaje && <div className="academico-mensaje">{mensaje}</div>}

          <div className="academico-grid">
            <section className="academico-card">
              <div className="academico-card-title">
                <span>{editandoId ? "✏️" : "➕"}</span>
                <div>
                  <small>{actual?.titulo?.toUpperCase()}</small>
                  <h2>{editandoId ? "Editar registro" : "Nuevo registro"}</h2>
                </div>
              </div>

              <form onSubmit={guardar} className="academico-form">
                {camposFormulario()}

                <div className="academico-actions">
                  <button className="academico-primary" disabled={guardando}>
                    {guardando ? "Guardando..." : editandoId ? "💾 Guardar cambios" : "➕ Crear registro"}
                  </button>

                  {editandoId && (
                    <button type="button" className="academico-secondary" onClick={limpiar}>
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </section>

            <section className="academico-card">
              <div className="academico-card-title">
                <span>{actual?.icono}</span>
                <div>
                  <small>REGISTROS</small>
                  <h2>{actual?.titulo}</h2>
                </div>
              </div>

              {cargando ? (
                <div className="academico-vacio">Cargando registros...</div>
              ) : registros.length === 0 ? (
                <div className="academico-vacio">No hay registros todavía.</div>
              ) : (
                <div className="academico-lista">
                  {registros.map((item) => (
                    <article key={item.id} className={Number(item.activo) ? "academico-item" : "academico-item inactivo"}>
                      <div className="academico-item-icon">{actual?.icono}</div>
                      <div className="academico-item-info">
                        <strong>{item.nombre}</strong>
                        <span>{resumenItem(item)}</span>
                      </div>
                      <div className="academico-item-actions">
                        <span className={Number(item.activo) ? "estado-badge activo" : "estado-badge inactivo"}>
                          {Number(item.activo) ? "Activo" : "Inactivo"}
                        </span>
                        <button onClick={() => editar(item)}>✏️</button>
                        <button onClick={() => cambiarEstado(item)} title={Number(item.activo) ? "Desactivar" : "Restaurar"}>
                          {Number(item.activo) ? "🗃️" : "♻️"}
                        </button>
                      </div>
                    </article>
                  ))}
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
  return (
    <label className="academico-field">
      <span>{label}</span>
      {children}
    </label>
  )
}

export default Parametrizaciones
