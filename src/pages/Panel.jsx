import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import Sidebar from "../components/Sidebar"
import "../App.css"
import "./Panel.css"
import { API_URL } from "../config"



function Panel() {
  const navigate = useNavigate()
  const nombre = localStorage.getItem("nombre")

  const [contenidos, setContenidos] = useState([])
  const [contenidoSeleccionado, setContenidoSeleccionado] = useState(null)

  const [contenidoPreguntas, setContenidoPreguntas] = useState(null)
const [preguntasContenido, setPreguntasContenido] = useState([])
const [preguntaEditando, setPreguntaEditando] = useState(null)
const [cargandoPreguntas, setCargandoPreguntas] = useState(false)

  useEffect(() => {
    obtenerContenidos()
  }, [])

  const obtenerContenidos = () => {
    axios
      .get(`${API_URL}/contenidos`)
      .then((res) => {
        setContenidos(res.data)
      })
      .catch((error) => {
        console.error(error)
        alert("Error al obtener contenidos")
      })
  }

  const verContenido = (contenido) => {
    setContenidoSeleccionado(contenido)
  }
  const abrirEditorPreguntas = async (contenido) => {
  try {
    setCargandoPreguntas(true)
    setContenidoPreguntas(contenido)
    setContenidoSeleccionado(null)

    const res = await axios.get(
      `${API_URL}/contenidos/${contenido.id}/preguntas`
    )

    if (Array.isArray(res.data)) {
      setPreguntasContenido(res.data)
    } else {
      setPreguntasContenido([])
    }
  } catch (error) {
    console.error(error)
    alert("Error al obtener las preguntas")
  } finally {
    setCargandoPreguntas(false)
  }
}

const editarPregunta = (pregunta) => {
  setPreguntaEditando({
    ...pregunta,
    respuesta_correcta:
      pregunta.respuesta_correcta?.toUpperCase() || "A",
    puntaje: Number(pregunta.puntaje) || 1
  })
}

const cambiarPregunta = (campo, valor) => {
  setPreguntaEditando((anterior) => ({
    ...anterior,
    [campo]: valor
  }))
}

const guardarPreguntaEditada = async () => {
  if (!preguntaEditando) return

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
    alert("Todos los campos son obligatorios")
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
      alert("Pregunta actualizada correctamente ✅")

      setPreguntasContenido((anteriores) =>
        anteriores.map((item) =>
          item.id === preguntaEditando.id
            ? { ...preguntaEditando }
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
    console.error(error)

    alert(
      error.response?.data?.mensaje ||
        "Error al actualizar la pregunta"
    )
  }
}

  

  return (
    <>
      <Sidebar />

      <div className="panel-maestro-page">

        {/* Figuras decorativas */}
        <div className="maestro-deco maestro-deco-1">📚</div>
        <div className="maestro-deco maestro-deco-2">✏️</div>
        <div className="maestro-deco maestro-deco-3">🌎</div>
        <div className="maestro-deco maestro-deco-4">🧪</div>
        <div className="maestro-deco maestro-deco-5">📐</div>
        <div className="maestro-deco maestro-deco-6">🎓</div>

        <main className="panel-maestro-container">

          {/* Encabezado */}
          <section className="maestro-bienvenida">
            <div className="maestro-avatar">
              👨‍🏫
            </div>

            <div className="maestro-bienvenida-texto">
              <span className="maestro-mini-titulo">
                📘 Plataforma educativa
              </span>

              <h1>
                ¡Bienvenido, {nombre || "Administrador"}!
              </h1>

              <p>
                Administra tus contenidos y prepara nuevas
                actividades para los estudiantes.
              </p>
            </div>

            <div className="maestro-total-contenidos">
              <span>📚</span>

              <div>
                <strong>{contenidos.length}</strong>
                <small>
                  {contenidos.length === 1
                    ? "Contenido"
                    : "Contenidos"}
                </small>
              </div>
            </div>
          </section>

          {/* Contenidos */}
          <section className="maestro-contenidos-card">

            <div className="maestro-contenidos-header">
              <div>
                <span className="maestro-seccion-label">
                  🌱 Material educativo
                </span>

                <h2>Contenidos agregados</h2>

                <p>
                  Consulta los temas disponibles o agrega
                  nuevo contenido.
                </p>
              </div>

              <button
                className="btn-nuevo-contenido"
                onClick={() => navigate("/contenidos")}
              >
                <span>＋</span>
                Nuevo contenido
              </button>
            </div>

            {contenidos.length > 0 ? (
              <div className="maestro-lista-contenidos">

                {contenidos.map((item, index) => (
                  <article
                    className="maestro-contenido-item"
                    key={item.id}
                  >
                    <div className="maestro-contenido-icono">
                      {index % 3 === 0
                        ? "📗"
                        : index % 3 === 1
                        ? "🌿"
                        : "🔬"}
                    </div>

                    <div className="maestro-contenido-info">
                      <h3>{item.titulo}</h3>

                      <span>
                        🎓 Grado: {item.grado}
                      </span>

                      {item.descripcion && (
                        <p>
                          {item.descripcion.length > 105
                            ? `${item.descripcion.substring(
                                0,
                                105
                              )}...`
                            : item.descripcion}
                        </p>
                      )}
                    </div>

                    <button
                      className="btn-ver-contenido-maestro"
                      onClick={() => verContenido(item)}
                    >
                      Ver contenido
                      <span>→</span>
                    </button>
                  </article>
                ))}

              </div>
            ) : (
              <div className="maestro-vacio">
                <div className="maestro-vacio-icono">
                  📭
                </div>

                <h3>
                  Aún no tienes contenidos
                </h3>

                <p>
                  Empieza creando un nuevo tema para tus
                  estudiantes.
                </p>

                <button
                  onClick={() => navigate("/contenidos")}
                >
                  ＋ Crear contenido
                </button>
              </div>
            )}

          </section>

          {/* Detalle seleccionado */}
          {contenidoSeleccionado && (
  <div className="maestro-modal-fondo">

    <div className="maestro-detalle-modal">

      <button
        className="maestro-cerrar-modal"
        onClick={() => setContenidoSeleccionado(null)}
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
        {contenidoSeleccionado.titulo}
      </h2>

      <div className="detalle-modal-grado">
        🎓 Grado: {contenidoSeleccionado.grado}
      </div>

      <div className="detalle-modal-descripcion">
        <h4>📝 Descripción</h4>

        <p>
          {contenidoSeleccionado.descripcion ||
            "Este contenido no tiene descripción."}
        </p>
      </div>

      <div className="detalle-modal-acciones">

        <button
          className="btn-cerrar-detalle"
          onClick={() => setContenidoSeleccionado(null)}
        >
          Cerrar
        </button>

        <button
          className="btn-agregar-preguntas-maestro"
          onClick={() => navigate("/contenidos")}
        >
          ❓ Agregar preguntas
        </button>

        <button
          className="btn-editar-preguntas"
          onClick={() =>
            abrirEditorPreguntas(contenidoSeleccionado)
          }
        >
          ✏️ Editar preguntas
        </button>

      </div>

    </div>

  </div>
)}

{/* ========================================= */}
{/* PUNTO 4 VA EXACTAMENTE AQUÍ */}
{/* ========================================= */}

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
          Preguntas de {contenidoPreguntas.titulo}
        </h2>

        <p>
          Edita las preguntas, opciones, respuesta correcta
          y puntaje.
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
            Puedes agregarlas desde el módulo de contenidos.
          </p>

        </div>
      ) : (
        <div className="lista-editor-preguntas">

          {preguntasContenido.map((item, index) => (

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
                  ✅ Correcta: {item.respuesta_correcta}
                  {" • "}
                  ⭐ {item.puntaje || 1} pts
                </span>

              </div>

              <button
                className="btn-editar-pregunta-item"
                onClick={() => editarPregunta(item)}
              >
                ✏️ Editar
              </button>

            </div>

          ))}

        </div>
      )}

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
                setPreguntaEditando(null)
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
              value={preguntaEditando.pregunta}
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
              <label>Opción A</label>

              <input
                value={preguntaEditando.opcion_a}
                onChange={(e) =>
                  cambiarPregunta(
                    "opcion_a",
                    e.target.value
                  )
                }
              />
            </div>

            <div className="admin-field">
              <label>Opción B</label>

              <input
                value={preguntaEditando.opcion_b}
                onChange={(e) =>
                  cambiarPregunta(
                    "opcion_b",
                    e.target.value
                  )
                }
              />
            </div>

            <div className="admin-field">
              <label>Opción C</label>

              <input
                value={preguntaEditando.opcion_c}
                onChange={(e) =>
                  cambiarPregunta(
                    "opcion_c",
                    e.target.value
                  )
                }
              />
            </div>

            <div className="admin-field">
              <label>Opción D</label>

              <input
                value={preguntaEditando.opcion_d}
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
                <option value="A">Opción A</option>
                <option value="B">Opción B</option>
                <option value="C">Opción C</option>
                <option value="D">Opción D</option>
              </select>

            </div>

            <div className="admin-field">

              <label>
                ⭐ Puntaje
              </label>

              <input
                type="number"
                min="1"
                value={preguntaEditando.puntaje}
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
            onClick={guardarPreguntaEditada}
          >
            💾 Guardar cambios
          </button>

        </div>
      )}

    </div>

  </div>
)}

{/* DESPUÉS DE ESTO YA CIERRAS MAIN */}

</main>

</div>
</>
  )
}

export default Panel