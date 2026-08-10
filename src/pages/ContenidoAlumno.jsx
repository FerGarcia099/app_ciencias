import { useEffect, useState } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import Sidebar from "../components/Sidebar"

function ContenidoAlumno() {
  const navigate = useNavigate()

  const [contenidos, setContenidos] = useState([])
  const [contenidoSeleccionado, setContenidoSeleccionado] = useState(null)
  const [preguntas, setPreguntas] = useState([])
  const [respuestas, setRespuestas] = useState({})
  const [resultado, setResultado] = useState(null)
 

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
    setResultado(null)
    setRespuestas({})

    axios.get(`http://localhost:3001/contenidos/${contenido.id}/preguntas`)
      .then(res => {
        setPreguntas(res.data)
      })
      .catch(error => {
        console.error(error)
        alert("Error al obtener preguntas")
      })
  }

  const seleccionarRespuesta = (preguntaId, respuesta) => {
    setRespuestas({
      ...respuestas,
      [preguntaId]: respuesta
    })
  }

  const calificar = () => {
    if (preguntas.length === 0) {
      alert("Este contenido no tiene preguntas")
      return
    }

    const preguntasSinResponder = preguntas.filter(
      (pregunta) => !respuestas[pregunta.id]
    )

    if (preguntasSinResponder.length > 0) {
      alert("Debes responder todas las preguntas antes de calificar")
      return
    }

    let correctas = 0
    let puntosObtenidos = 0
    let puntosTotales = 0

    preguntas.forEach((pregunta) => {
      const valorPregunta = Number(pregunta.puntaje) || 1
      puntosTotales += valorPregunta

      if (respuestas[pregunta.id] === pregunta.respuesta_correcta) {
        correctas++
        puntosObtenidos += valorPregunta
      }
    })

    setResultado({
      correctas,
      total: preguntas.length,
      puntosObtenidos,
      puntosTotales
    })
  }

  const volverAContenidos = () => {
    setContenidoSeleccionado(null)
    setPreguntas([])
    setRespuestas({})
    setResultado(null)
  }

  return (
    <div className="contenido">
      {!contenidoSeleccionado ? (
        <div className="tabla-card">
          <h2>Contenidos de Ciencias Naturales 🌎</h2>

          <button
            className="btn-regresar-lista"
            onClick={() => navigate("/panelAlumno")}
          >
            ⬅️ Regresar
          </button>

          <table className="tabla-alumnos">
            <thead>
              <tr>
                <th>Tema</th>
                <th>Grado</th>
                <th>Acción</th>
              </tr>
            </thead>

            <tbody>
              {contenidos.length > 0 ? (
                contenidos.map((item) => (
                  <tr key={item.id}>
                    <td>{item.titulo}</td>
                    <td>{item.grado}</td>
                    <td>
                      <button onClick={() => verContenido(item)}>
                        Ver contenido
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3">No hay contenidos disponibles</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="contenido-detalle-card">
          <h2>{contenidoSeleccionado.titulo}</h2>

          <h3>Grado: {contenidoSeleccionado.grado}</h3>

          <p className="texto-contenido">
            {contenidoSeleccionado.descripcion}
          </p>

          <h2>Preguntas ❓</h2>

          {preguntas.length > 0 ? (
            preguntas.map((item, index) => (
              <div className="pregunta-card" key={item.id}>
                <h3>
                  {index + 1}. {item.pregunta}

                  <span className="puntaje-pregunta">
                    {Number(item.puntaje) || 1} pts
                  </span>
                </h3>

                <label>
                  <input
                    type="radio"
                    name={`pregunta-${item.id}`}
                    value="A"
                    checked={respuestas[item.id] === "A"}
                    onChange={() => seleccionarRespuesta(item.id, "A")}
                  />
                  A. {item.opcion_a}
                </label>

                <label>
                  <input
                    type="radio"
                    name={`pregunta-${item.id}`}
                    value="B"
                    checked={respuestas[item.id] === "B"}
                    onChange={() => seleccionarRespuesta(item.id, "B")}
                  />
                  B. {item.opcion_b}
                </label>

                <label>
                  <input
                    type="radio"
                    name={`pregunta-${item.id}`}
                    value="C"
                    checked={respuestas[item.id] === "C"}
                    onChange={() => seleccionarRespuesta(item.id, "C")}
                  />
                  C. {item.opcion_c}
                </label>

                <label>
                  <input
                    type="radio"
                    name={`pregunta-${item.id}`}
                    value="D"
                    checked={respuestas[item.id] === "D"}
                    onChange={() => seleccionarRespuesta(item.id, "D")}
                  />
                  D. {item.opcion_d}
                </label>
              </div>
            ))
          ) : (
            <p>Este contenido aún no tiene preguntas.</p>
          )}

          {resultado && (
            <div className="resultado-card">
              Resultado: {resultado.correctas} de {resultado.total} correctas
              <br />
              Puntaje: {resultado.puntosObtenidos} de {resultado.puntosTotales} puntos
            </div>
          )}

          <div className="acciones-form">
            <button onClick={calificar}>
              Calificar
            </button>

            <button className="btn-regresar" onClick={volverAContenidos}>
              ⬅️ Volver
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ContenidoAlumno