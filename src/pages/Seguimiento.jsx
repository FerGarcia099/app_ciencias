import { useEffect, useMemo, useState } from "react"
import axios from "axios"
import Sidebar from "../components/Sidebar"
import { API_URL } from "../config"
import "./Seguimiento.css"

function Seguimiento() {
  const [registros, setRegistros] = useState([])
  const [cargando, setCargando] = useState(true)
  const [contenidoFiltro, setContenidoFiltro] = useState("todos")
  const [busqueda, setBusqueda] = useState("")

  useEffect(() => {
    cargarSeguimiento()
  }, [])

  const cargarSeguimiento = async () => {
    try {
      setCargando(true)
      const res = await axios.get(`${API_URL}/seguimiento`)
      setRegistros(Array.isArray(res.data) ? res.data : [])
    } catch (error) {
      console.error(error)
      alert("No se pudo cargar el seguimiento")
    } finally {
      setCargando(false)
    }
  }

  const habilitarReintento = async (registro) => {
    if (!registro.intento_id) return

    const confirmar = window.confirm(
      `¿Habilitar un nuevo intento para ${registro.alumno} en "${registro.titulo}"?`
    )

    if (!confirmar) return

    try {
      const res = await axios.put(
        `${API_URL}/seguimiento/${registro.intento_id}/habilitar-reintento`
      )

      alert(res.data.mensaje || "Nuevo intento habilitado")
      cargarSeguimiento()
    } catch (error) {
      console.error(error)
      alert(error.response?.data?.mensaje || "No se pudo habilitar el reintento")
    }
  }

  const contenidos = useMemo(() => {
    const mapa = new Map()

    registros.forEach((item) => {
      mapa.set(item.contenido_id, item.titulo)
    })

    return Array.from(mapa.entries()).map(([id, titulo]) => ({ id, titulo }))
  }, [registros])

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()

    return registros.filter((item) => {
      const coincideContenido =
        contenidoFiltro === "todos" || String(item.contenido_id) === contenidoFiltro

      const coincideBusqueda =
        !texto ||
        item.alumno.toLowerCase().includes(texto) ||
        item.usuario.toLowerCase().includes(texto) ||
        item.titulo.toLowerCase().includes(texto)

      return coincideContenido && coincideBusqueda
    })
  }, [registros, contenidoFiltro, busqueda])

  const resumen = useMemo(() => {
    const total = filtrados.length
    const completados = filtrados.filter((x) => x.estado === "completado").length
    const progreso = filtrados.filter((x) => x.estado === "en_progreso").length
    const sinIniciar = filtrados.filter((x) => x.estado === "sin_iniciar").length

    return { total, completados, progreso, sinIniciar }
  }, [filtrados])

  const porcentajeAvance = (item) => {
    if (item.estado === "completado") return 100

    const total = Number(item.preguntas_totales) || 0
    const respondidas = Number(item.preguntas_respondidas) || 0

    return total > 0 ? Math.round((respondidas / total) * 100) : 0
  }

  return (
    <>
      <Sidebar />

      <div className="seguimiento-page">
        <main className="seguimiento-container">
          <section className="seguimiento-header">
            <div className="seguimiento-header-icon">📊</div>

            <div>
              <span>MONITOREO DEL APRENDIZAJE</span>
              <h1>Seguimiento de estudiantes</h1>
              <p>
                Consulta el avance, resultado e intentos de cada alumno por tema.
              </p>
            </div>
          </section>

          <section className="seguimiento-resumen">
            <div className="resumen-card">
              <span>👥</span>
              <strong>{resumen.total}</strong>
              <small>Registros visibles</small>
            </div>

            <div className="resumen-card resumen-verde">
              <span>✅</span>
              <strong>{resumen.completados}</strong>
              <small>Completados</small>
            </div>

            <div className="resumen-card resumen-amarillo">
              <span>🟡</span>
              <strong>{resumen.progreso}</strong>
              <small>En progreso</small>
            </div>

            <div className="resumen-card resumen-gris">
              <span>⚪</span>
              <strong>{resumen.sinIniciar}</strong>
              <small>Sin iniciar</small>
            </div>
          </section>

          <section className="seguimiento-card">
            <div className="seguimiento-filtros">
              <div>
                <label>Tema</label>
                <select
                  value={contenidoFiltro}
                  onChange={(e) => setContenidoFiltro(e.target.value)}
                >
                  <option value="todos">Todos los temas</option>
                  {contenidos.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.titulo}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filtro-busqueda">
                <label>Buscar alumno</label>
                <input
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Nombre o usuario..."
                />
              </div>

              <button className="btn-recargar-seguimiento" onClick={cargarSeguimiento}>
                🔄 Actualizar
              </button>
            </div>

            {cargando ? (
              <div className="seguimiento-vacio">📚 Cargando seguimiento...</div>
            ) : filtrados.length === 0 ? (
              <div className="seguimiento-vacio">No hay registros para mostrar.</div>
            ) : (
              <div className="seguimiento-table-wrap">
                <table className="seguimiento-table">
                  <thead>
                    <tr>
                      <th>Alumno</th>
                      <th>Tema</th>
                      <th>Avance</th>
                      <th>Resultado</th>
                      <th>Estado</th>
                      <th>Intento</th>
                      <th>Acción</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filtrados.map((item) => {
                      const avance = porcentajeAvance(item)

                      return (
                        <tr key={`${item.usuario_id}-${item.contenido_id}`}>
                          <td>
                            <div className="alumno-cell">
                              <div className="alumno-avatar">🧒</div>
                              <div>
                                <strong>{item.alumno}</strong>
                                <span>@{item.usuario}</span>
                              </div>
                            </div>
                          </td>

                          <td>
                            <strong>{item.titulo}</strong>
                            <span className="tema-grado-seguimiento">{item.grado}</span>
                          </td>

                          <td>
                            <div className="avance-cell">
                              <div className="avance-texto">
                                <span>
                                  {Number(item.preguntas_respondidas) || 0}/
                                  {Number(item.preguntas_totales) || 0}
                                </span>
                                <strong>{avance}%</strong>
                              </div>
                              <div className="avance-barra">
                                <div style={{ width: `${avance}%` }} />
                              </div>
                            </div>
                          </td>

                          <td>
                            {item.estado === "completado" ? (
                              <div className="resultado-seguimiento">
                                <strong>
                                  {item.puntaje_obtenido}/{item.puntaje_total}
                                </strong>
                                <span>{Math.round(item.porcentaje)}%</span>
                              </div>
                            ) : (
                              <span className="dato-pendiente">Pendiente</span>
                            )}
                          </td>

                          <td>
                            <span className={`estado-seguimiento estado-${item.estado}`}>
                              {item.estado === "sin_iniciar" && "Sin iniciar"}
                              {item.estado === "en_progreso" && "En progreso"}
                              {item.estado === "completado" && "Completado"}
                            </span>
                          </td>

                          <td>
                            {item.numero_intento > 0 ? `#${item.numero_intento}` : "—"}
                          </td>

                          <td>
                            {item.estado === "completado" ? (
                              item.reintento_habilitado ? (
                                <span className="reintento-listo">🔓 Habilitado</span>
                              ) : (
                                <button
                                  className="btn-habilitar-reintento"
                                  onClick={() => habilitarReintento(item)}
                                >
                                  🔓 Habilitar
                                </button>
                              )
                            ) : (
                              <span className="dato-pendiente">—</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>
    </>
  )
}

export default Seguimiento
