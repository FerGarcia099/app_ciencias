import { useEffect, useMemo, useState } from "react"
import axios from "axios"
import { useNavigate, useParams } from "react-router-dom"
import Sidebar from "../components/Sidebar"
import { API_URL } from "../config"
import "./AdminModules.css"

function AlumnoDetalle() {
  const navigate = useNavigate()
  const { id } = useParams()

  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [mensajeError, setMensajeError] = useState("")
  const [periodoId, setPeriodoId] = useState("")
  const [pestana, setPestana] = useState("resumen")

  useEffect(() => {
    cargarFicha()
  }, [id, periodoId])

  const cargarFicha = () => {
    setCargando(true)
    setMensajeError("")

    const params = {}
    if (periodoId) params.periodo_id = periodoId

    axios
      .get(`${API_URL}/alumnos-academico/${id}/ficha`, { params })
      .then((res) => {
        setDatos(res.data)

        if (!periodoId && res.data.periodo_seleccionado) {
          setPeriodoId(String(res.data.periodo_seleccionado))
        }
      })
      .catch((error) => {
        console.error(error)
        setMensajeError(
          error.response?.data?.mensaje ||
            "No se pudo cargar la ficha académica del estudiante"
        )
      })
      .finally(() => {
        setCargando(false)
      })
  }

  const porcentaje = (valor) => {
    const numero = Number(valor)
    if (!Number.isFinite(numero)) return "—"
    return `${Math.round(numero * 100) / 100}%`
  }

  const fecha = (valor) => {
    if (!valor) return "—"

    const d = new Date(valor)
    if (Number.isNaN(d.getTime())) return "—"

    return new Intl.DateTimeFormat("es-GT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }).format(d)
  }

  const periodosDisponibles = useMemo(() => {
    if (!datos?.historial_matriculas) return []

    const vistos = new Set()

    return datos.historial_matriculas.filter((item) => {
      if (vistos.has(item.periodo_id)) return false
      vistos.add(item.periodo_id)
      return true
    })
  }, [datos])

  const estadoRendimiento = (promedio) => {
    if (promedio === null || promedio === undefined) {
      return { texto: "Sin evaluaciones", clase: "alumno-estado-sin-datos" }
    }

    if (Number(promedio) < 60) {
      return { texto: "Requiere refuerzo", clase: "alumno-estado-refuerzo" }
    }

    if (Number(promedio) < 80) {
      return { texto: "En seguimiento", clase: "alumno-estado-seguimiento" }
    }

    return { texto: "Buen progreso", clase: "alumno-estado-bien" }
  }

  if (cargando && !datos) {
    return (
      <>
        <Sidebar />
        <div className="admin-page alumnos-dashboard-page">
          <main className="admin-container">
            <section className="admin-card alumno-ficha-cargando">
              <div className="admin-empty-icon">⏳</div>
              Cargando ficha académica...
            </section>
          </main>
        </div>
      </>
    )
  }

  if (mensajeError && !datos) {
    return (
      <>
        <Sidebar />
        <div className="admin-page alumnos-dashboard-page">
          <main className="admin-container">
            <section className="admin-card alumno-ficha-error">
              <div className="admin-empty-icon">⚠️</div>
              <h2>No se pudo abrir la ficha</h2>
              <p>{mensajeError}</p>
              <button
                type="button"
                className="admin-primary"
                onClick={() => navigate("/alumnos")}
              >
                ← Volver a alumnos
              </button>
            </section>
          </main>
        </div>
      </>
    )
  }

  if (!datos) return null

  const { alumno, resumen, matricula_actual, progreso, evaluaciones, tareas } = datos
  const rendimiento = estadoRendimiento(resumen.promedio_evaluaciones)

  return (
    <>
      <Sidebar />

      <div className="admin-page alumnos-dashboard-page">
        <div className="admin-deco admin-deco-1">📚</div>
        <div className="admin-deco admin-deco-2">✏️</div>
        <div className="admin-deco admin-deco-3">🎓</div>

        <main className="admin-container">
          <section className="admin-header alumno-ficha-header">
            <div className="admin-header-info">
              <div className="admin-header-icon">🧒</div>

              <div className="admin-header-text">
                <small>Ficha académica del estudiante</small>
                <h1>{alumno.nombre}</h1>
                <p>
                  @{alumno.usuario}
                  {matricula_actual
                    ? ` · ${matricula_actual.grado} · ${matricula_actual.seccion}`
                    : " · Sin matrícula"}
                </p>
              </div>
            </div>

            <div className="alumno-ficha-header-actions">
              <span className={`alumno-estado ${rendimiento.clase}`}>
                {rendimiento.texto}
              </span>

              <button
                type="button"
                className="alumno-btn-volver"
                onClick={() => navigate("/alumnos")}
              >
                ← Volver a alumnos
              </button>
            </div>
          </section>

          <section className="admin-card alumno-ficha-contexto">
            <div>
              <small>PERIODO ACADÉMICO</small>
              <h2>
                {matricula_actual
                  ? `${matricula_actual.periodo} · ${matricula_actual.anio}`
                  : "Sin matrícula registrada"}
              </h2>
              <p>
                Las tareas se filtran por la matrícula del periodo seleccionado.
              </p>
            </div>

            <div className="admin-field alumno-periodo-selector">
              <label>Ver periodo</label>
              <select
                value={periodoId}
                onChange={(e) => setPeriodoId(e.target.value)}
                disabled={periodosDisponibles.length === 0}
              >
                {periodosDisponibles.length === 0 && (
                  <option value="">Sin periodos</option>
                )}

                {periodosDisponibles.map((item) => (
                  <option key={item.periodo_id} value={item.periodo_id}>
                    {item.periodo} · {item.anio} · {item.grado} {item.seccion}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="alumnos-metricas-grid alumno-ficha-metricas">
            <article className="alumnos-metrica-card">
              <div className="alumnos-metrica-icon">📈</div>
              <div>
                <span>Promedio</span>
                <strong>{porcentaje(resumen.promedio_evaluaciones)}</strong>
                <small>último resultado por contenido</small>
              </div>
            </article>

            <article className="alumnos-metrica-card">
              <div className="alumnos-metrica-icon">✅</div>
              <div>
                <span>Actividades</span>
                <strong>
                  {resumen.actividades_completadas}/{resumen.total_contenidos}
                </strong>
                <small>contenidos completados</small>
              </div>
            </article>

            <article className="alumnos-metrica-card">
              <div className="alumnos-metrica-icon">🎯</div>
              <div>
                <span>Progreso</span>
                <strong>{porcentaje(resumen.progreso_general)}</strong>
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
          </section>

          {mensajeError && (
            <div className="alumnos-alerta-error">{mensajeError}</div>
          )}

          <nav className="alumno-ficha-tabs" aria-label="Secciones de la ficha">
            <button
              type="button"
              className={pestana === "resumen" ? "activo" : ""}
              onClick={() => setPestana("resumen")}
            >
              📊 Resumen
            </button>

            <button
              type="button"
              className={pestana === "evaluaciones" ? "activo" : ""}
              onClick={() => setPestana("evaluaciones")}
            >
              🧠 Evaluaciones
            </button>

            <button
              type="button"
              className={pestana === "tareas" ? "activo" : ""}
              onClick={() => setPestana("tareas")}
            >
              📝 Tareas
            </button>

            <button
              type="button"
              className={pestana === "historial" ? "activo" : ""}
              onClick={() => setPestana("historial")}
            >
              🎓 Historial académico
            </button>
          </nav>

          {pestana === "resumen" && (
            <div className="alumno-ficha-grid">
              <section className="admin-card alumno-ficha-panel alumno-rendimiento-panel">
                <div className="admin-card-header">
                  <small>📚 CONTENIDOS</small>
                  <h2>Progreso por contenido</h2>
                  <p>Último intento registrado en cada contenido activo.</p>
                </div>

                <div className="alumno-contenidos-lista">
                  {progreso.length > 0 ? (
                    progreso.map((item) => {
                      const valor = item.porcentaje === null ? 0 : item.porcentaje
                      const etiqueta = !item.intento_id
                        ? "Sin iniciar"
                        : item.estado === "completado"
                          ? porcentaje(item.porcentaje)
                          : "En progreso"

                      return (
                        <article key={item.contenido_id} className="alumno-contenido-item">
                          <div className="alumno-contenido-cabecera">
                            <div>
                              <strong>{item.contenido}</strong>
                              <span>
                                {!item.intento_id
                                  ? "Todavía no registra intento"
                                  : `Intento #${item.numero_intento}`}
                              </span>
                            </div>
                            <b>{etiqueta}</b>
                          </div>

                          <div className="alumno-progreso-track alumno-progreso-track-ancho">
                            <div
                              className="alumno-progreso-fill"
                              style={{
                                width: `${Math.min(100, Math.max(0, Number(valor) || 0))}%`
                              }}
                            />
                          </div>
                        </article>
                      )
                    })
                  ) : (
                    <div className="admin-empty">No hay contenidos activos.</div>
                  )}
                </div>
              </section>

              <section className="admin-card alumno-ficha-panel alumno-matricula-panel">
                <div className="admin-card-header">
                  <small>🎓 MATRÍCULA</small>
                  <h2>Información académica</h2>
                  <p>Datos correspondientes al periodo seleccionado.</p>
                </div>

                {matricula_actual ? (
                  <div className="alumno-datos-lista">
                    <div>
                      <span>Grado</span>
                      <strong>{matricula_actual.grado}</strong>
                    </div>
                    <div>
                      <span>Sección</span>
                      <strong>{matricula_actual.seccion}</strong>
                    </div>
                    <div>
                      <span>Periodo</span>
                      <strong>
                        {matricula_actual.periodo} · {matricula_actual.anio}
                      </strong>
                    </div>
                    <div>
                      <span>Estado de matrícula</span>
                      <strong className="alumno-capitalize">
                        {matricula_actual.estado}
                      </strong>
                    </div>
                    <div>
                      <span>Fecha de matrícula</span>
                      <strong>{fecha(matricula_actual.fecha_matricula)}</strong>
                    </div>
                    <div>
                      <span>Observaciones</span>
                      <strong>{matricula_actual.observaciones || "Sin observaciones"}</strong>
                    </div>
                  </div>
                ) : (
                  <div className="admin-empty">
                    Este estudiante no tiene matrícula registrada.
                  </div>
                )}
              </section>
            </div>
          )}

          {pestana === "evaluaciones" && (
            <section className="admin-card alumno-ficha-panel">
              <div className="admin-card-header alumnos-card-header-inline">
                <div>
                  <small>🧠 EVALUACIONES</small>
                  <h2>Historial de intentos completados</h2>
                  <p>Resultados registrados por contenido y número de intento.</p>
                </div>

                <div className="alumnos-leyenda">
                  Las evaluaciones actuales son un historial general; todavía no
                  guardan periodo académico.
                </div>
              </div>

              <div className="admin-table-wrapper">
                <table className="admin-table alumno-ficha-tabla">
                  <thead>
                    <tr>
                      <th>Contenido</th>
                      <th>Intento</th>
                      <th>Resultado</th>
                      <th>Puntaje</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evaluaciones.length > 0 ? (
                      evaluaciones.map((item) => (
                        <tr key={item.intento_id}>
                          <td>{item.contenido}</td>
                          <td>#{item.numero_intento}</td>
                          <td>
                            <span
                              className={`alumno-resultado ${
                                item.porcentaje < 60
                                  ? "bajo"
                                  : item.porcentaje < 80
                                    ? "medio"
                                    : "alto"
                              }`}
                            >
                              {porcentaje(item.porcentaje)}
                            </span>
                          </td>
                          <td>
                            {item.puntaje_obtenido}/{item.puntaje_total}
                          </td>
                          <td>{fecha(item.fecha_fin)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5">
                          <div className="admin-empty">
                            No hay evaluaciones completadas.
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {pestana === "tareas" && (
            <section className="admin-card alumno-ficha-panel">
              <div className="admin-card-header alumnos-card-header-inline">
                <div>
                  <small>📝 TAREAS</small>
                  <h2>Tareas del periodo</h2>
                  <p>
                    Asignadas al grado y sección de la matrícula seleccionada.
                  </p>
                </div>

                <div className="alumno-tareas-resumen">
                  <span>{resumen.tareas_asignadas} asignadas</span>
                  <span>{resumen.tareas_calificadas} calificadas</span>
                  <span>{resumen.tareas_pendientes} pendientes</span>
                </div>
              </div>

              <div className="admin-table-wrapper">
                <table className="admin-table alumno-ficha-tabla">
                  <thead>
                    <tr>
                      <th>Tarea</th>
                      <th>Curso</th>
                      <th>Entrega</th>
                      <th>Calificación</th>
                      <th>Fecha límite</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tareas.length > 0 ? (
                      tareas.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <strong>{item.titulo}</strong>
                            {item.contenido && (
                              <small className="alumno-tabla-subtexto">
                                {item.contenido}
                              </small>
                            )}
                          </td>
                          <td>{item.curso}</td>
                          <td>
                            <span
                              className={`alumno-entrega-estado alumno-entrega-${item.estado_entrega}`}
                            >
                              {item.estado_entrega === "pendiente"
                                ? "Pendiente"
                                : item.estado_entrega === "calificada"
                                  ? "Calificada"
                                  : "Entregada"}
                            </span>
                          </td>
                          <td>
                            {item.calificacion === null
                              ? "—"
                              : `${item.calificacion}/${item.puntaje_maximo}`}
                          </td>
                          <td>{fecha(item.fecha_limite)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5">
                          <div className="admin-empty">
                            No hay tareas para esta matrícula y periodo.
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {pestana === "historial" && (
            <section className="admin-card alumno-ficha-panel">
              <div className="admin-card-header">
                <small>🎓 HISTORIAL ACADÉMICO</small>
                <h2>Matrículas del estudiante</h2>
                <p>
                  Este historial conserva el grado y sección de cada ciclo escolar.
                </p>
              </div>

              <div className="alumno-historial-lista">
                {datos.historial_matriculas.length > 0 ? (
                  datos.historial_matriculas.map((item) => (
                    <article
                      key={item.id}
                      className={`alumno-historial-item ${
                        Number(item.periodo_id) === Number(periodoId)
                          ? "seleccionado"
                          : ""
                      }`}
                    >
                      <div className="alumno-historial-anio">{item.anio}</div>

                      <div className="alumno-historial-contenido">
                        <strong>
                          {item.grado} · Sección {item.seccion}
                        </strong>
                        <span>{item.periodo}</span>
                        <small>
                          Matrícula: {fecha(item.fecha_matricula)}
                          {item.observaciones ? ` · ${item.observaciones}` : ""}
                        </small>
                      </div>

                      <span className={`alumno-matricula-estado estado-${item.estado}`}>
                        {item.estado}
                      </span>
                    </article>
                  ))
                ) : (
                  <div className="admin-empty">
                    No existe historial de matrículas para este estudiante.
                  </div>
                )}
              </div>
            </section>
          )}
        </main>
      </div>
    </>
  )
}

export default AlumnoDetalle
