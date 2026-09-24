import { useEffect, useMemo, useState } from "react"
import axios from "axios"
import Sidebar from "../components/Sidebar"
import { API_URL } from "../config"
import "./AdminModules.css"

function ListaAlumnos() {
  const [alumnos, setAlumnos] = useState([])
  const [resumen, setResumen] = useState({
    total_alumnos: 0,
    matriculados: 0,
    promedio_general: null,
    tareas_pendientes: 0,
    necesitan_refuerzo: 0
  })
  const [filtros, setFiltros] = useState({
    grados: [],
    secciones: [],
    periodos: []
  })

  const [periodoId, setPeriodoId] = useState("")
  const [gradoId, setGradoId] = useState("")
  const [seccionId, setSeccionId] = useState("")
  const [buscar, setBuscar] = useState("")
  const [cargando, setCargando] = useState(true)
  const [mensajeError, setMensajeError] = useState("")
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null)

  useEffect(() => {
    cargarDashboard()
  }, [periodoId, gradoId, seccionId])

  const cargarDashboard = () => {
    setCargando(true)
    setMensajeError("")

    const params = {}

    if (periodoId) params.periodo_id = periodoId
    if (gradoId) params.grado_id = gradoId
    if (seccionId) params.seccion_id = seccionId

    axios
      .get(`${API_URL}/alumnos-academico/dashboard`, { params })
      .then((res) => {
        const data = res.data

        setAlumnos(Array.isArray(data.alumnos) ? data.alumnos : [])
        setResumen(
          data.resumen || {
            total_alumnos: 0,
            matriculados: 0,
            promedio_general: null,
            tareas_pendientes: 0,
            necesitan_refuerzo: 0
          }
        )
        setFiltros(
          data.filtros || {
            grados: [],
            secciones: [],
            periodos: []
          }
        )

        if (!periodoId && data.periodo_seleccionado) {
          setPeriodoId(String(data.periodo_seleccionado))
        }
      })
      .catch((error) => {
        console.error(error)
        setMensajeError(
          error.response?.data?.mensaje ||
            "No se pudo cargar el dashboard académico de alumnos"
        )
      })
      .finally(() => {
        setCargando(false)
      })
  }

  const alumnosFiltrados = useMemo(() => {
    const texto = buscar.trim().toLowerCase()

    if (!texto) return alumnos

    return alumnos.filter((alumno) => {
      const nombre = alumno.nombre?.toLowerCase() || ""
      const usuario = alumno.usuario?.toLowerCase() || ""
      const grado = alumno.grado?.toLowerCase() || ""
      const seccion = alumno.seccion?.toLowerCase() || ""

      return (
        nombre.includes(texto) ||
        usuario.includes(texto) ||
        grado.includes(texto) ||
        seccion.includes(texto)
      )
    })
  }, [alumnos, buscar])

  const porcentaje = (valor) => {
    const numero = Number(valor)

    if (!Number.isFinite(numero)) return "—"
    return `${Math.round(numero * 100) / 100}%`
  }

  const obtenerEstadoAcademico = (alumno) => {
    if (!alumno.matricula_id) {
      return {
        texto: "Sin matrícula",
        clase: "alumno-estado-sin-matricula"
      }
    }

    if (alumno.promedio_evaluaciones === null) {
      return {
        texto: "Sin evaluaciones",
        clase: "alumno-estado-sin-datos"
      }
    }

    if (Number(alumno.promedio_evaluaciones) < 60) {
      return {
        texto: "Requiere refuerzo",
        clase: "alumno-estado-refuerzo"
      }
    }

    if (Number(alumno.promedio_evaluaciones) < 80) {
      return {
        texto: "En seguimiento",
        clase: "alumno-estado-seguimiento"
      }
    }

    return {
      texto: "Buen progreso",
      clase: "alumno-estado-bien"
    }
  }

  const limpiarFiltros = () => {
    setGradoId("")
    setSeccionId("")
    setBuscar("")
  }

  return (
    <>
      <Sidebar />

      <div className="admin-page alumnos-dashboard-page">
        <div className="admin-deco admin-deco-1">📚</div>
        <div className="admin-deco admin-deco-2">✏️</div>
        <div className="admin-deco admin-deco-3">🎒</div>

        <main className="admin-container">
          <section className="admin-header alumnos-dashboard-header">
            <div className="admin-header-info">
              <div className="admin-header-icon">👦</div>

              <div className="admin-header-text">
                <small>Gestión y seguimiento académico</small>
                <h1>Alumnos</h1>
                <p>
                  Consulta matrícula, rendimiento, progreso y tareas pendientes
                  de los estudiantes activos.
                </p>
              </div>
            </div>

            <div className="admin-counter">
              <strong>{resumen.total_alumnos}</strong>
              <span>ALUMNOS ACTIVOS</span>
            </div>
          </section>

          <section className="alumnos-metricas-grid">
            <article className="alumnos-metrica-card">
              <div className="alumnos-metrica-icon">🎓</div>
              <div>
                <span>Matriculados</span>
                <strong>{resumen.matriculados}</strong>
                <small>en el periodo seleccionado</small>
              </div>
            </article>

            <article className="alumnos-metrica-card">
              <div className="alumnos-metrica-icon">📈</div>
              <div>
                <span>Promedio evaluaciones</span>
                <strong>{porcentaje(resumen.promedio_general)}</strong>
                <small>sobre contenidos activos</small>
              </div>
            </article>

            <article className="alumnos-metrica-card">
              <div className="alumnos-metrica-icon">📝</div>
              <div>
                <span>Tareas pendientes</span>
                <strong>{resumen.tareas_pendientes}</strong>
                <small>del periodo seleccionado</small>
              </div>
            </article>

            <article className="alumnos-metrica-card">
              <div className="alumnos-metrica-icon">🧩</div>
              <div>
                <span>Requieren refuerzo</span>
                <strong>{resumen.necesitan_refuerzo}</strong>
                <small>promedio menor a 60%</small>
              </div>
            </article>
          </section>

          <section className="admin-card alumnos-filtros-card">
            <div className="admin-card-header alumnos-card-header-inline">
              <div>
                <small>🔎 FILTROS</small>
                <h2>Buscar estudiantes</h2>
                <p>
                  Filtra por ciclo, grado o sección sin modificar el historial.
                </p>
              </div>

              <button
                type="button"
                className="alumnos-btn-limpiar"
                onClick={limpiarFiltros}
              >
                Limpiar filtros
              </button>
            </div>

            <div className="alumnos-filtros-grid">
              <div className="admin-field alumnos-filtro-busqueda">
                <label>Buscar</label>
                <input
                  type="text"
                  placeholder="Nombre, usuario, grado o sección..."
                  value={buscar}
                  onChange={(e) => setBuscar(e.target.value)}
                />
              </div>

              <div className="admin-field">
                <label>Periodo</label>
                <select
                  value={periodoId}
                  onChange={(e) => {
                    setPeriodoId(e.target.value)
                    setGradoId("")
                    setSeccionId("")
                  }}
                >
                  {filtros.periodos.length === 0 && (
                    <option value="">Sin periodos</option>
                  )}

                  {filtros.periodos.map((periodo) => (
                    <option key={periodo.id} value={periodo.id}>
                      {periodo.nombre} · {periodo.anio}
                      {periodo.estado === "activo" ? " · activo" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-field">
                <label>Grado</label>
                <select
                  value={gradoId}
                  onChange={(e) => setGradoId(e.target.value)}
                >
                  <option value="">Todos los grados</option>
                  {filtros.grados.map((grado) => (
                    <option key={grado.id} value={grado.id}>
                      {grado.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-field">
                <label>Sección</label>
                <select
                  value={seccionId}
                  onChange={(e) => setSeccionId(e.target.value)}
                >
                  <option value="">Todas las secciones</option>
                  {filtros.secciones.map((seccion) => (
                    <option key={seccion.id} value={seccion.id}>
                      {seccion.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="admin-card alumnos-listado-card">
            <div className="admin-card-header alumnos-card-header-inline">
              <div>
                <small>👨‍🎓 ESTUDIANTES</small>
                <h2>Seguimiento académico</h2>
                <p>
                  {alumnosFiltrados.length} estudiante
                  {alumnosFiltrados.length === 1 ? "" : "s"} visible
                  {alumnosFiltrados.length === 1 ? "" : "s"}.
                </p>
              </div>

              <div className="alumnos-leyenda">
                <span>El promedio corresponde a evaluaciones de contenidos activos.</span>
              </div>
            </div>

            {mensajeError && (
              <div className="alumnos-alerta-error">{mensajeError}</div>
            )}

            {cargando ? (
              <div className="admin-empty alumnos-cargando">
                <div className="admin-empty-icon">⏳</div>
                Cargando información académica...
              </div>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-table alumnos-tabla">
                  <thead>
                    <tr>
                      <th>Alumno</th>
                      <th>Matrícula</th>
                      <th>Promedio</th>
                      <th>Progreso</th>
                      <th>Pendientes</th>
                      <th>Estado</th>
                      <th>Acción</th>
                    </tr>
                  </thead>

                  <tbody>
                    {alumnosFiltrados.length > 0 ? (
                      alumnosFiltrados.map((alumno) => {
                        const estado = obtenerEstadoAcademico(alumno)

                        return (
                          <tr key={alumno.id}>
                            <td>
                              <div className="persona-info">
                                <div className="persona-avatar">🧒</div>
                                <div>
                                  <span className="persona-nombre">
                                    {alumno.nombre}
                                  </span>
                                  <small className="alumno-usuario">
                                    @{alumno.usuario}
                                  </small>
                                </div>
                              </div>
                            </td>

                            <td>
                              {alumno.matricula_id ? (
                                <div className="alumno-matricula-resumen">
                                  <strong>
                                    {alumno.grado || "Sin grado"} · {alumno.seccion || "Sin sección"}
                                  </strong>
                                  <span>
                                    {alumno.periodo || "Periodo"}
                                    {alumno.anio ? ` · ${alumno.anio}` : ""}
                                  </span>
                                </div>
                              ) : (
                                <span className="alumno-sin-matricula">
                                  Sin matrícula activa
                                </span>
                              )}
                            </td>

                            <td>
                              <strong className="alumno-promedio">
                                {porcentaje(alumno.promedio_evaluaciones)}
                              </strong>
                            </td>

                            <td>
                              <div className="alumno-progreso-cell">
                                <div className="alumno-progreso-track">
                                  <div
                                    className="alumno-progreso-fill"
                                    style={{
                                      width: `${Math.min(
                                        100,
                                        Math.max(0, Number(alumno.progreso) || 0)
                                      )}%`
                                    }}
                                  />
                                </div>
                                <span>{porcentaje(alumno.progreso)}</span>
                              </div>
                            </td>

                            <td>
                              <span
                                className={`alumno-pendientes ${
                                  Number(alumno.tareas_pendientes) > 0
                                    ? "con-pendientes"
                                    : "sin-pendientes"
                                }`}
                              >
                                {alumno.tareas_pendientes}
                              </span>
                            </td>

                            <td>
                              <span className={`alumno-estado ${estado.clase}`}>
                                {estado.texto}
                              </span>
                            </td>

                            <td>
                              <button
                                type="button"
                                className="alumno-btn-resumen"
                                onClick={() => setAlumnoSeleccionado(alumno)}
                              >
                                👁 Ver resumen
                              </button>
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan="7">
                          <div className="admin-empty">
                            <div className="admin-empty-icon">📭</div>
                            No hay estudiantes que coincidan con los filtros
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>

      {alumnoSeleccionado && (
        <div
          className="usuario-modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setAlumnoSeleccionado(null)
            }
          }}
        >
          <section className="usuario-modal alumno-resumen-modal">
            <div className="admin-form-title">
              <div className="admin-form-icon">👦</div>
              <div>
                <small>RESUMEN DEL ESTUDIANTE</small>
                <h2>{alumnoSeleccionado.nombre}</h2>
                <p>@{alumnoSeleccionado.usuario}</p>
              </div>
            </div>

            <div className="alumno-resumen-grid">
              <article>
                <span>Matrícula</span>
                <strong>
                  {alumnoSeleccionado.matricula_id
                    ? `${alumnoSeleccionado.grado} · ${alumnoSeleccionado.seccion}`
                    : "Sin matrícula"}
                </strong>
              </article>

              <article>
                <span>Promedio</span>
                <strong>
                  {porcentaje(alumnoSeleccionado.promedio_evaluaciones)}
                </strong>
              </article>

              <article>
                <span>Progreso</span>
                <strong>{porcentaje(alumnoSeleccionado.progreso)}</strong>
              </article>

              <article>
                <span>Actividades completadas</span>
                <strong>{alumnoSeleccionado.actividades_completadas}</strong>
              </article>

              <article>
                <span>Tareas asignadas</span>
                <strong>{alumnoSeleccionado.tareas_asignadas}</strong>
              </article>

              <article>
                <span>Tareas pendientes</span>
                <strong>{alumnoSeleccionado.tareas_pendientes}</strong>
              </article>
            </div>

            <div className="alumno-resumen-nota">
              La ficha completa con evaluaciones, tareas e historial académico se
              agregará en la Fase 3.
            </div>

            <div className="admin-actions">
              <button
                type="button"
                className="admin-primary"
                onClick={() => setAlumnoSeleccionado(null)}
              >
                Cerrar
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}

export default ListaAlumnos
