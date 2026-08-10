import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import Sidebar from "../components/Sidebar"
import "../App.css"

function Panel() {
  const navigate = useNavigate()
  const nombre = localStorage.getItem("nombre")

  const [contenidos, setContenidos] = useState([])
  const [contenidoSeleccionado, setContenidoSeleccionado] = useState(null)

  useEffect(() => {
    obtenerContenidos()
  }, [])

  const obtenerContenidos = () => {
    axios.get("http://localhost:3001/contenidos")
      .then(res => {
        setContenidos(res.data)
      })
      .catch(error => {
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

      <div className="contenido">
        <h1>
        <p className="bienvenida-maestro">
          Bienvenido {nombre || "al sistema escolar"}
        </p>
        </h1>

        <div className="dashboard-contenidos">
          <div className="dashboard-header">
            <h2>Contenidos agregados 🌱</h2>

            <button onClick={() => navigate("/contenidos")}>
              + Nuevo contenido
            </button>
          </div>

          {contenidos.length > 0 ? (
            <div className="lista-dashboard">
              {contenidos.map((item) => (
                <div className="fila-contenido" key={item.id}>
                  <div className="info-contenido">
                    <strong>{item.titulo}</strong>
                    <span>Grado: {item.grado}</span>
                  </div>

                  <button onClick={() => verContenido(item)}>
                    Ver contenido
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="mensaje-vacio">
              No hay contenidos agregados todavía.
            </p>
          )}
        </div>

        {contenidoSeleccionado && (
          <div className="detalle-contenido-dashboard">
            <div className="detalle-header">
              <h3>{contenidoSeleccionado.titulo}</h3>

              <button onClick={() => setContenidoSeleccionado(null)}>
                X
              </button>
            </div>

            <span className="grado-badge">
              Grado: {contenidoSeleccionado.grado}
            </span>

            <p>
              {contenidoSeleccionado.descripcion}
            </p>

            <button
              className="btn-agregar-preguntas"
              onClick={() => navigate("/contenidos")}
            >
              Agregar preguntas
            </button>
          </div>
        )}
      </div>
    </>
  )
}

export default Panel