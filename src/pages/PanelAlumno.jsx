import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import "../App.css"

function PanelAlumno() {
  const navigate = useNavigate()
  const nombre = localStorage.getItem("nombre")

  const [contenidos, setContenidos] = useState([])

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
        alert("Error al obtener los contenidos")
      })
  }

  const salir = () => {
    localStorage.clear()
    navigate("/")
  }

  return (
    <div className="contenido" style={{ marginLeft: "0" }}>
      <h1>Inicio del Alumno 👨‍🎓</h1>

      <p className="bienvenida-alumno">
        Bienvenido {nombre || "al sistema escolar"}
      </p>

      <div className="botones">
        <button className="btn" onClick={() => navigate("/contenidoAlumno")}>
          📚 Ver Contenidos y Preguntas
        </button>

        <button className="btn" onClick={salir}>
          🚪 Cerrar sesión
        </button>
      </div>

      <div className="contenidos-inicio">
        <h2>Contenidos disponibles 🌱</h2>

        {contenidos.length > 0 ? (
          <div className="contenidos-grid">
            {contenidos.map((item) => (
              <div className="contenido-card" key={item.id}>
                <h3>{item.titulo}</h3>

                <span className="grado-badge">
                  Grado: {item.grado}
                </span>

                <p>{item.descripcion}</p>

                <button onClick={() => navigate("/contenidoAlumno")}>
                  Ver preguntas
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p>No hay contenidos disponibles todavía.</p>
        )}
      </div>
    </div>
  )
}

export default PanelAlumno