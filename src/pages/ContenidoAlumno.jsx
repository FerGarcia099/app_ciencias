import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import axios from "axios"
import { API_URL } from "../config"

function ContenidoAlumno() {

  const navigate = useNavigate()
  const { id } = useParams()

  const [contenido, setContenido] = useState(null)
  const [preguntas, setPreguntas] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargarContenido()
  }, [id])

  const cargarContenido = async () => {
    try {

      const contenidoResponse = await axios.get(
        `${API_URL}/contenidos/${id}`
      )

      const preguntasResponse = await axios.get(
        `${API_URL}/contenidos/${id}/preguntas`
      )

      setContenido(contenidoResponse.data)
      setPreguntas(preguntasResponse.data)

    } catch (error) {

      console.error("Error:", error)
      alert("Error al cargar el contenido")

    } finally {
      setCargando(false)
    }
  }

  if (cargando) {
    return <h2>Cargando... 📚</h2>
  }

  if (!contenido) {
    return <h2>Contenido no encontrado</h2>
  }

  return (
    <div className="contenido-detalle-card">

      <button
        onClick={() => navigate("/panelAlumno")}
      >
        ⬅️ Regresar
      </button>

      <h1>
        {contenido.titulo} 🌱
      </h1>

      <h3>
        Grado: {contenido.grado}
      </h3>

      <p>
        {contenido.descripcion}
      </p>

      <h2>
        Preguntas ❓
      </h2>

      {preguntas.length === 0 ? (
        <p>Este contenido aún no tiene preguntas.</p>
      ) : (
        preguntas.map((pregunta, index) => (
          <div
            key={pregunta.id}
            className="pregunta-card"
          >
            <h3>
              {index + 1}. {pregunta.pregunta}
            </h3>

            <label>
              <input
                type="radio"
                name={`pregunta-${pregunta.id}`}
              />
              A. {pregunta.opcion_a}
            </label>

            <label>
              <input
                type="radio"
                name={`pregunta-${pregunta.id}`}
              />
              B. {pregunta.opcion_b}
            </label>

            <label>
              <input
                type="radio"
                name={`pregunta-${pregunta.id}`}
              />
              C. {pregunta.opcion_c}
            </label>

            <label>
              <input
                type="radio"
                name={`pregunta-${pregunta.id}`}
              />
              D. {pregunta.opcion_d}
            </label>

          </div>
        ))
      )}

    </div>
  )
}

export default ContenidoAlumno