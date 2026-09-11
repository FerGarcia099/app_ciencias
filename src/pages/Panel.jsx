import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"

import Sidebar from "../components/Sidebar"
import "./panel.css"

import { API_URL } from "../config"

function Panel() {
  const navigate = useNavigate()

  const nombre =
    localStorage.getItem("nombre") ||
    "Administrador"

  const [contenidos, setContenidos] = useState([])
  const [resumenDashboard, setResumenDashboard] = useState({
  total_alumnos: 0,
  total_contenidos: 0,
  completadas: 0,
  en_progreso: 0,
  sin_iniciar: 0,
  promedio_general: 0
})

  const [rendimientoTemas, setRendimientoTemas] = useState([])
  const [alumnosRefuerzo, setAlumnosRefuerzo] = useState([])
  const [cargandoDashboard, setCargandoDashboard] = useState(true)

  const [contenidoSeleccionado, setContenidoSeleccionado] =
    useState(null)

  // =========================================
  // EDICIÓN DE PREGUNTAS
  // =========================================

  const [contenidoPreguntas, setContenidoPreguntas] =
    useState(null)

  const [preguntasContenido, setPreguntasContenido] =
    useState([])

  const [preguntaEditando, setPreguntaEditando] =
    useState(null)

  const [cargandoPreguntas, setCargandoPreguntas] =
    useState(false)

  // =========================================
  // CARGAR CONTENIDOS
  // =========================================

  useEffect(() => {
    obtenerContenidos()
    obtenerDashboard()
  }, [])

  const obtenerContenidos = () => {
    axios
      .get(`${API_URL}/contenidos`)
      .then((res) => {
        if (Array.isArray(res.data)) {
          setContenidos(res.data)
        } else {
          setContenidos([])
        }
      })
      .catch((error) => {
        console.error(
          "Error al obtener contenidos:",
          error
        )

        alert("Error al obtener contenidos")
      })
  }

  const obtenerDashboard = async () => {
  try {
    setCargandoDashboard(true)

    const [
      resumenRes,
      rendimientoRes,
      refuerzoRes
    ] = await Promise.all([
      axios.get(
        `${API_URL}/dashboard/resumen`
      ),

      axios.get(
        `${API_URL}/dashboard/rendimiento`
      ),

      axios.get(
        `${API_URL}/dashboard/alumnos-refuerzo`
      )
    ])

    setResumenDashboard(
      resumenRes.data || {
        total_alumnos: 0,
        total_contenidos: 0,
        completadas: 0,
        en_progreso: 0,
        sin_iniciar: 0,
        promedio_general: 0
      }
    )

    setRendimientoTemas(
      Array.isArray(rendimientoRes.data)
        ? rendimientoRes.data
        : []
    )

    setAlumnosRefuerzo(
      Array.isArray(refuerzoRes.data)
        ? refuerzoRes.data
        : []
    )
  } catch (error) {
    console.error(
      "Error al cargar dashboard:",
      error
    )

    setRendimientoTemas([])
    setAlumnosRefuerzo([])
  } finally {
    setCargandoDashboard(false)
  }
}

  // =========================================
  // VER CONTENIDO
  // =========================================

  const verContenido = (contenido) => {
    setContenidoSeleccionado(contenido)
  }

  // =========================================
  // ABRIR EDITOR DE PREGUNTAS
  // =========================================

  const abrirEditorPreguntas = async (
    contenido
  ) => {
    try {
      setCargandoPreguntas(true)

      setContenidoPreguntas(contenido)

      setContenidoSeleccionado(null)

      setPreguntaEditando(null)

      const res = await axios.get(
        `${API_URL}/contenidos/${contenido.id}/preguntas`
      )

      if (Array.isArray(res.data)) {
        setPreguntasContenido(res.data)
      } else {
        setPreguntasContenido([])
      }
    } catch (error) {
      console.error(
        "Error al obtener preguntas:",
        error
      )

      alert("Error al obtener las preguntas")
    } finally {
      setCargandoPreguntas(false)
    }
  }

  // =========================================
  // SELECCIONAR PREGUNTA PARA EDITAR
  // =========================================

  const editarPregunta = (pregunta) => {
    setPreguntaEditando({
      ...pregunta,

      respuesta_correcta:
        pregunta.respuesta_correcta
          ?.toString()
          .trim()
          .toUpperCase() || "A",

      puntaje:
        Number(pregunta.puntaje) || 1
    })
  }

  // =========================================
  // CAMBIAR CAMPOS
  // =========================================

  const cambiarPregunta = (
    campo,
    valor
  ) => {
    setPreguntaEditando(
      (anterior) => ({
        ...anterior,
        [campo]: valor
      })
    )
  }

  // =========================================
  // GUARDAR PREGUNTA EDITADA
  // =========================================

  const guardarPreguntaEditada = async () => {
    if (!preguntaEditando) {
      return
    }

    const {
      pregunta,
      opcion_a,
      opcion_b,
      opcion_c,
      opcion_d,
      respuesta_correcta,
      puntaje
    } = preguntaEditando

    if (
      !pregunta?.trim() ||
      !opcion_a?.trim() ||
      !opcion_b?.trim() ||
      !opcion_c?.trim() ||
      !opcion_d?.trim()
    ) {
      alert(
        "Todos los campos son obligatorios"
      )

      return
    }

    if (
      !["A", "B", "C", "D"].includes(
        respuesta_correcta
      )
    ) {
      alert(
        "Selecciona una respuesta correcta"
      )

      return
    }

    if (Number(puntaje) <= 0) {
      alert(
        "El puntaje debe ser mayor a cero"
      )

      return
    }

    try {
      const res = await axios.put(
        `${API_URL}/preguntas/${preguntaEditando.id}`,
        {
          pregunta,
          opcion_a,
          opcion_b,
          opcion_c,
          opcion_d,
          respuesta_correcta,
          puntaje: Number(puntaje)
        }
      )

      if (res.data.status === "ok") {
        alert(
          "Pregunta actualizada correctamente ✅"
        )

        setPreguntasContenido(
          (anteriores) =>
            anteriores.map((item) =>
              item.id ===
              preguntaEditando.id
                ? {
                    ...preguntaEditando,
                    puntaje:
                      Number(
                        preguntaEditando.puntaje
                      )
                  }
                : item
            )
        )

        setPreguntaEditando(null)
      } else {
        alert(
          res.data.mensaje ||
            "No se pudo actualizar la pregunta"
        )
      }
    } catch (error) {
      console.error(
        "Error al actualizar pregunta:",
        error
      )

      alert(
        error.response?.data?.mensaje ||
          "Error al actualizar la pregunta"
      )
    }
  }

  // =========================================
  // RENDER
  // =========================================

  return (
    <>
      <Sidebar />

      <div className="admin-inicio-page">

        {/* DECORACIONES */}

        <span className="inicio-deco inicio-deco-1">
          📚
        </span>

        <span className="inicio-deco inicio-deco-2">
          ✏️
        </span>

        <span className="inicio-deco inicio-deco-3">
          🌱
        </span>

        <span className="inicio-deco inicio-deco-4">
          🔬
        </span>

        <main className="admin-inicio-container">

          {/* =================================
              BIENVENIDA
          ================================= */}

          <section className="admin-hero">

  <div className="admin-hero-personaje">
    👨‍🏫
  </div>

  <div className="admin-hero-texto">

    <span className="admin-hero-etiqueta">
      ✨ PANEL EDUCATIVO
    </span>

    <h1>
      ¡Bienvenido, {nombre}!
    </h1>

    <p>
      Gestiona los contenidos de
      Ciencias Naturales, crea
      actividades y revisa el
      aprendizaje de tus estudiantes
      desde un solo lugar.
    </p>

  </div>

  <div className="admin-hero-ilustracion">

    <span>📖</span>
    <span>🌿</span>
    <span>🧪</span>

  </div>

</section>


{/* =================================
    NUEVO DASHBOARD
================================= */}


{/* 1. RESUMEN GENERAL */}

<section className="dashboard-resumen">

  <div className="dashboard-stat stat-alumnos">

    <div className="dashboard-stat-icono">
      👦
    </div>

    <div>
      <strong>
        {resumenDashboard.total_alumnos}
      </strong>

      <span>
        Alumnos
      </span>
    </div>

  </div>


  <div className="dashboard-stat stat-contenidos">

    <div className="dashboard-stat-icono">
      📚
    </div>

    <div>
      <strong>
        {resumenDashboard.total_contenidos}
      </strong>

      <span>
        Contenidos
      </span>
    </div>

  </div>


  <div className="dashboard-stat stat-promedio">

    <div className="dashboard-stat-icono">
      ⭐
    </div>

    <div>
      <strong>
        {Number(
          resumenDashboard.promedio_general
        ).toFixed(1)}%
      </strong>

      <span>
        Promedio general
      </span>
    </div>

  </div>


  <div className="dashboard-stat stat-refuerzo">

    <div className="dashboard-stat-icono">
      ⚠️
    </div>

    <div>
      <strong>
        {alumnosRefuerzo.length}
      </strong>

      <span>
        Necesitan apoyo
      </span>
    </div>

  </div>

</section>


{/* 2. ESTADO DE ACTIVIDADES */}

<section className="dashboard-estados">

  <div className="dashboard-seccion-titulo">

    <div>

      <span>
        📊 ACTIVIDADES
      </span>

      <h2>
        Estado del aprendizaje
      </h2>

      <p>
        Situación actual de las actividades
        asignadas a tus estudiantes.
      </p>

    </div>

    <button
      onClick={() =>
        navigate("/seguimiento")
      }
      className="dashboard-btn-link"
    >
      Ver seguimiento →
    </button>

  </div>


  <div className="dashboard-estados-grid">

    <div className="estado-card estado-completadas">

      <div className="estado-card-icono">
        ✅
      </div>

      <div>
        <strong>
          {resumenDashboard.completadas}
        </strong>

        <span>
          Completadas
        </span>
      </div>

    </div>


    <div className="estado-card estado-progreso">

      <div className="estado-card-icono">
        🟡
      </div>

      <div>
        <strong>
          {resumenDashboard.en_progreso}
        </strong>

        <span>
          En progreso
        </span>
      </div>

    </div>


    <div className="estado-card estado-sin-iniciar">

      <div className="estado-card-icono">
        ⚪
      </div>

      <div>
        <strong>
          {resumenDashboard.sin_iniciar}
        </strong>

        <span>
          Sin iniciar
        </span>
      </div>

    </div>

  </div>

</section>


{/* 3. RENDIMIENTO Y REFUERZO */}

<section className="dashboard-dos-columnas">


  {/* RENDIMIENTO POR TEMA */}

  <div className="dashboard-card">

    <div className="dashboard-card-header">

      <div>

        <span>
          📈 RENDIMIENTO
        </span>

        <h2>
          Rendimiento por tema
        </h2>

      </div>

    </div>


    {cargandoDashboard ? (

      <div className="dashboard-cargando">
        📚 Cargando estadísticas...
      </div>

    ) : rendimientoTemas.length === 0 ? (

      <div className="dashboard-vacio">
        No hay resultados todavía.
      </div>

    ) : (

      <div className="dashboard-rendimiento-lista">

        {rendimientoTemas.map((tema) => {

          const promedio =
            tema.promedio === null
              ? 0
              : Number(tema.promedio)

          return (

            <div
              className="rendimiento-item"
              key={tema.contenido_id}
            >

              <div className="rendimiento-superior">

                <div>

                  <strong>
                    {tema.titulo}
                  </strong>

                  <small>
                    {tema.grado}
                    {" • "}
                    {tema.completadas}
                    {" "}
                    completadas
                  </small>

                </div>

                <b>
                  {promedio.toFixed(0)}%
                </b>

              </div>


              <div className="rendimiento-barra">

                <div
                  className="rendimiento-relleno"
                  style={{
                    width: `${Math.min(
                      100,
                      promedio
                    )}%`
                  }}
                />

              </div>

            </div>

          )
        })}

      </div>

    )}

  </div>


  {/* ALUMNOS QUE NECESITAN APOYO */}

  <div className="dashboard-card">

    <div className="dashboard-card-header">

      <div>

        <span>
          🎯 ATENCIÓN
        </span>

        <h2>
          Alumnos que necesitan apoyo
        </h2>

      </div>

    </div>


    {cargandoDashboard ? (

      <div className="dashboard-cargando">
        Analizando resultados...
      </div>

    ) : alumnosRefuerzo.length === 0 ? (

      <div className="dashboard-todo-bien">

        <div>
          🎉
        </div>

        <h3>
          ¡Excelente trabajo!
        </h3>

        <p>
          Actualmente ningún alumno con
          actividades completadas tiene un
          promedio inferior al 60%.
        </p>

      </div>

    ) : (

      <div className="refuerzo-lista">

        {alumnosRefuerzo.map((alumno) => (

          <div
            className="refuerzo-item"
            key={alumno.usuario_id}
          >

            <div className="refuerzo-avatar">
              👦
            </div>

            <div className="refuerzo-info">

              <strong>
                {alumno.nombre}
              </strong>

              <span>
                @{alumno.usuario}
              </span>

            </div>

            <div className="refuerzo-promedio">
              {Number(
                alumno.promedio
              ).toFixed(0)}%
            </div>

          </div>

        ))}

      </div>

    )}

  </div>

</section>

          {/* =================================
              CONTENIDOS
          ================================= */}

          <section className="admin-contenidos-box">

            <div className="admin-contenidos-titulo">

              <div>

                <span>
                  🌿 MATERIAL EDUCATIVO
                </span>

                <h2>
                  Contenidos agregados
                </h2>

                <p>
                  Administra los temas
                  disponibles para tus
                  estudiantes.
                </p>

              </div>

              <button
                className="admin-btn-nuevo"
                onClick={() =>
                  navigate("/contenidos")
                }
              >
                ＋ Nuevo contenido
              </button>

            </div>

            {contenidos.length > 0 ? (

              <div className="admin-contenidos-lista">

                {contenidos.map(
                  (item, index) => (

                    <article
                      className="admin-contenido-fila"
                      key={item.id}
                    >

                      <div className="admin-contenido-icono">

                        {index % 3 === 0
                          ? "📗"
                          : index % 3 === 1
                          ? "🌎"
                          : "🔬"}

                      </div>

                      <div className="admin-contenido-datos">

                        <h3>
                          {item.titulo}
                        </h3>

                        <span>
                          🎓 {item.grado}
                        </span>

                        {item.descripcion && (
                          <p>

                            {item.descripcion
                              .length > 120
                              ? `${item.descripcion.substring(
                                  0,
                                  120
                                )}...`
                              : item.descripcion}

                          </p>
                        )}

                      </div>

                      <button
                        className="admin-btn-ver"
                        onClick={() =>
                          verContenido(item)
                        }
                      >
                        Ver contenido
                        <span>→</span>
                      </button>

                    </article>

                  )
                )}

              </div>

            ) : (

              <div className="admin-sin-contenidos">

                <span>📭</span>

                <h3>
                  Todavía no hay contenidos
                </h3>

                <p>
                  Crea tu primer tema para
                  comenzar.
                </p>

                <button
                  className="admin-btn-nuevo"
                  onClick={() =>
                    navigate("/contenidos")
                  }
                >
                  ＋ Crear contenido
                </button>

              </div>

            )}

          </section>

          {/* =================================
              MODAL VER CONTENIDO
          ================================= */}

          {contenidoSeleccionado && (

            <div className="maestro-modal-fondo">

              <div className="maestro-detalle-modal">

                <button
                  className="maestro-cerrar-modal"
                  onClick={() =>
                    setContenidoSeleccionado(
                      null
                    )
                  }
                >
                  ×
                </button>

                <div className="detalle-modal-icono">
                  📖
                </div>

                <span className="detalle-modal-etiqueta">
                  Contenido educativo
                </span>

                <h2>
                  {
                    contenidoSeleccionado.titulo
                  }
                </h2>

                <div className="detalle-modal-grado">
                  🎓 Grado:{" "}
                  {
                    contenidoSeleccionado.grado
                  }
                </div>

                <div className="detalle-modal-descripcion">

                  <h4>
                    📝 Descripción
                  </h4>

                  <p>
                    {
                      contenidoSeleccionado.descripcion ||
                      "Este contenido no tiene descripción."
                    }
                  </p>

                </div>

                <div className="detalle-modal-acciones">

                  <button
                    className="btn-cerrar-detalle"
                    onClick={() =>
                      setContenidoSeleccionado(
                        null
                      )
                    }
                  >
                    Cerrar
                  </button>

                  <button
                    className="btn-agregar-preguntas-maestro"
                    onClick={() =>
                      navigate("/contenidos")
                    }
                  >
                    ❓ Agregar preguntas
                  </button>

                  <button
                    className="btn-editar-preguntas"
                    onClick={() =>
                      abrirEditorPreguntas(
                        contenidoSeleccionado
                      )
                    }
                  >
                    ✏️ Editar preguntas
                  </button>

                </div>

              </div>

            </div>
          )}

          {/* =================================
              MODAL EDITAR PREGUNTAS
          ================================= */}

          {contenidoPreguntas && (

            <div className="maestro-modal-fondo">

              <div className="modal-preguntas-maestro">

                <button
                  className="maestro-cerrar-modal"
                  onClick={() => {
                    setContenidoPreguntas(null)
                    setPreguntaEditando(null)
                  }}
                >
                  ×
                </button>

                <div className="editor-preguntas-header">

                  <span>
                    📝 Gestión de evaluación
                  </span>

                  <h2>
                    Preguntas de{" "}
                    {
                      contenidoPreguntas.titulo
                    }
                  </h2>

                  <p>
                    Edita el texto,
                    las opciones, la respuesta
                    correcta y el puntaje.
                  </p>

                </div>

                {cargandoPreguntas ? (

                  <div className="preguntas-cargando">
                    📚 Cargando preguntas...
                  </div>

                ) : preguntasContenido.length === 0 ? (

                  <div className="maestro-vacio">

                    <div className="maestro-vacio-icono">
                      📝
                    </div>

                    <h3>
                      No hay preguntas todavía
                    </h3>

                    <p>
                      Puedes agregarlas desde
                      el módulo de contenidos.
                    </p>

                    <button
                      onClick={() =>
                        navigate(
                          "/contenidos"
                        )
                      }
                    >
                      ＋ Agregar preguntas
                    </button>

                  </div>

                ) : (

                  <div className="lista-editor-preguntas">

                    {preguntasContenido.map(
                      (item, index) => (

                        <div
                          className="editor-pregunta-item"
                          key={item.id}
                        >

                          <div className="editor-numero-pregunta">
                            {index + 1}
                          </div>

                          <div className="editor-pregunta-info">

                            <strong>
                              {item.pregunta}
                            </strong>

                            <span>
                              ✅ Correcta:{" "}
                              {
                                item.respuesta_correcta
                              }
                              {" • "}
                              ⭐{" "}
                              {item.puntaje ||
                                1}{" "}
                              pts
                            </span>

                          </div>

                          <button
                            className="btn-editar-pregunta-item"
                            onClick={() =>
                              editarPregunta(
                                item
                              )
                            }
                          >
                            ✏️ Editar
                          </button>

                        </div>

                      )
                    )}

                  </div>

                )}

                {/* ===========================
                    FORM EDITAR
                =========================== */}

                {preguntaEditando && (

                  <div className="form-editar-pregunta">

                    <div className="form-editar-header">

                      <div>

                        <span>
                          ✏️ EDITANDO PREGUNTA
                        </span>

                        <h3>
                          Modificar pregunta
                        </h3>

                      </div>

                      <button
                        onClick={() =>
                          setPreguntaEditando(
                            null
                          )
                        }
                      >
                        Cancelar
                      </button>

                    </div>

                    <div className="admin-field">

                      <label>
                        Pregunta
                      </label>

                      <textarea
                        value={
                          preguntaEditando.pregunta
                        }
                        onChange={(e) =>
                          cambiarPregunta(
                            "pregunta",
                            e.target.value
                          )
                        }
                      />

                    </div>

                    <div className="opciones-editor-grid">

                      <div className="admin-field">

                        <label>
                          Opción A
                        </label>

                        <input
                          value={
                            preguntaEditando.opcion_a
                          }
                          onChange={(e) =>
                            cambiarPregunta(
                              "opcion_a",
                              e.target.value
                            )
                          }
                        />

                      </div>

                      <div className="admin-field">

                        <label>
                          Opción B
                        </label>

                        <input
                          value={
                            preguntaEditando.opcion_b
                          }
                          onChange={(e) =>
                            cambiarPregunta(
                              "opcion_b",
                              e.target.value
                            )
                          }
                        />

                      </div>

                      <div className="admin-field">

                        <label>
                          Opción C
                        </label>

                        <input
                          value={
                            preguntaEditando.opcion_c
                          }
                          onChange={(e) =>
                            cambiarPregunta(
                              "opcion_c",
                              e.target.value
                            )
                          }
                        />

                      </div>

                      <div className="admin-field">

                        <label>
                          Opción D
                        </label>

                        <input
                          value={
                            preguntaEditando.opcion_d
                          }
                          onChange={(e) =>
                            cambiarPregunta(
                              "opcion_d",
                              e.target.value
                            )
                          }
                        />

                      </div>

                    </div>

                    <div className="opciones-editor-grid">

                      <div className="admin-field">

                        <label>
                          ✅ Respuesta correcta
                        </label>

                        <select
                          value={
                            preguntaEditando.respuesta_correcta
                          }
                          onChange={(e) =>
                            cambiarPregunta(
                              "respuesta_correcta",
                              e.target.value
                            )
                          }
                        >

                          <option value="A">
                            Opción A
                          </option>

                          <option value="B">
                            Opción B
                          </option>

                          <option value="C">
                            Opción C
                          </option>

                          <option value="D">
                            Opción D
                          </option>

                        </select>

                      </div>

                      <div className="admin-field">

                        <label>
                          ⭐ Puntaje
                        </label>

                        <input
                          type="number"
                          min="1"
                          value={
                            preguntaEditando.puntaje
                          }
                          onChange={(e) =>
                            cambiarPregunta(
                              "puntaje",
                              e.target.value
                            )
                          }
                        />

                      </div>

                    </div>

                    <button
                      className="btn-guardar-pregunta-editada"
                      onClick={
                        guardarPreguntaEditada
                      }
                    >
                      💾 Guardar cambios
                    </button>

                  </div>

                )}

              </div>

            </div>

          )}

        </main>

      </div>
    </>
  )
}

export default Panel