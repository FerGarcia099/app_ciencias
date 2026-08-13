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
                  onClick={() =>
                    setContenidoSeleccionado(null)
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
                  {contenidoSeleccionado.titulo}
                </h2>

                <div className="detalle-modal-grado">
                  🎓 Grado:{" "}
                  {contenidoSeleccionado.grado}
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
                    onClick={() =>
                      setContenidoSeleccionado(null)
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

                </div>

              </div>

            </div>
          )}

        </main>
      </div>
    </>
  )
}

export default Panel