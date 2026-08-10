import { useEffect, useState } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"

function Contenidos() {
  const navigate = useNavigate()

  const [titulo, setTitulo] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [grado, setGrado] = useState("")

  const [contenidos, setContenidos] = useState([])
  const [contenidoId, setContenidoId] = useState("")

  const [pregunta, setPregunta] = useState("")
  const [opcionA, setOpcionA] = useState("")
  const [opcionB, setOpcionB] = useState("")
  const [opcionC, setOpcionC] = useState("")
  const [opcionD, setOpcionD] = useState("")
  const [respuestaCorrecta, setRespuestaCorrecta] = useState("A")
  const [puntaje, setPuntaje] = useState(1)

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

  const guardarContenido = () => {
    if (titulo.trim() === "" || descripcion.trim() === "" || grado.trim() === "") {
      alert("Todos los campos del contenido son obligatorios")
      return
    }

    axios.post("http://localhost:3001/contenidos", {
      titulo,
      descripcion,
      grado
    })
    .then(res => {
      if (res.data.status === "ok") {
        alert("Contenido creado correctamente")

        setTitulo("")
        setDescripcion("")
        setGrado("")

        obtenerContenidos()
      } else {
        alert(res.data.mensaje || "Error al crear contenido")
      }
    })
    .catch(error => {
      console.error(error)
      alert("Error al conectar con el servidor")
    })
  }

  const guardarPregunta = () => {
    if (
      contenidoId === "" ||
      pregunta.trim() === "" ||
      opcionA.trim() === "" ||
      opcionB.trim() === "" ||
      opcionC.trim() === "" ||
      opcionD.trim() === "" ||
      respuestaCorrecta.trim() === "" ||
      puntaje <= 0
    ) {
      alert("Todos los campos de la pregunta son obligatorios")
      return
    }

    axios.post("http://localhost:3001/preguntas", {
      contenido_id: contenidoId,
      pregunta,
      opcion_a: opcionA,
      opcion_b: opcionB,
      opcion_c: opcionC,
      opcion_d: opcionD,
      respuesta_correcta: respuestaCorrecta,
      puntaje
    })
    .then(res => {
      if (res.data.status === "ok") {
        alert("Pregunta creada correctamente")

        setPregunta("")
        setOpcionA("")
        setOpcionB("")
        setOpcionC("")
        setOpcionD("")
        setRespuestaCorrecta("A")
        setPuntaje(1)
      } else {
        alert(res.data.mensaje || "Error al crear pregunta")
      }
    })
    .catch(error => {
      console.error(error)
      alert("Error al conectar con el servidor")
    })
  }

  return (
    <div className="contenido">
      <div className="contenidos-doble-panel">

        <div className="form-card contenido-form">
          <h2>Subir Contenido 📚</h2>

          <input
            type="text"
            placeholder="Título del tema"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
          />

          <input
            type="text"
            placeholder="Grado"
            value={grado}
            onChange={(e) => setGrado(e.target.value)}
          />

          <textarea
            className="textarea-contenido"
            placeholder="Escribe aquí el contenido del tema"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />

          <div className="acciones-form">
            <button onClick={guardarContenido}>
              Guardar Contenido
            </button>

            <button className="btn-regresar" onClick={() => navigate("/panel")}>
              ⬅️ Regresar
            </button>
          </div>
        </div>

        <div className="form-card contenido-form">
          <h2>Crear Preguntas ❓</h2>

          <select
            className="select-rol"
            value={contenidoId}
            onChange={(e) => setContenidoId(e.target.value)}
          >
            <option value="">Seleccione un contenido</option>
            {contenidos.map((item) => (
              <option key={item.id} value={item.id}>
                {item.titulo} - {item.grado}
              </option>
            ))}
          </select>

          <textarea
            className="textarea-contenido"
            placeholder="Escribe la pregunta"
            value={pregunta}
            onChange={(e) => setPregunta(e.target.value)}
          />

          <input
            type="text"
            placeholder="Opción A"
            value={opcionA}
            onChange={(e) => setOpcionA(e.target.value)}
          />

          <input
            type="text"
            placeholder="Opción B"
            value={opcionB}
            onChange={(e) => setOpcionB(e.target.value)}
          />

          <input
            type="text"
            placeholder="Opción C"
            value={opcionC}
            onChange={(e) => setOpcionC(e.target.value)}
          />

          <input
            type="text"
            placeholder="Opción D"
            value={opcionD}
            onChange={(e) => setOpcionD(e.target.value)}
          />

        <select
  className="select-rol"
  value={respuestaCorrecta}
  onChange={(e) => setRespuestaCorrecta(e.target.value)}
>
  <option value="A">Respuesta correcta: A</option>
  <option value="B">Respuesta correcta: B</option>
  <option value="C">Respuesta correcta: C</option>
  <option value="D">Respuesta correcta: D</option>
</select>

<input
  type="number"
  min="1"
  placeholder="Puntaje de la pregunta"
  value={puntaje}
  onChange={(e) => setPuntaje(Number(e.target.value))}
/>  

          <button onClick={guardarPregunta}>
            Guardar Pregunta
          </button>
        </div>

      </div>

      <div className="tabla-card">
        <h2>Contenidos Registrados 🌱</h2>

        <table className="tabla-alumnos">
          <thead>
            <tr>
              <th>Título</th>
              <th>Grado</th>
            </tr>
          </thead>

          <tbody>
            {contenidos.length > 0 ? (
              contenidos.map((item) => (
                <tr key={item.id}>
                  <td>{item.titulo}</td>
                  <td>{item.grado}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="2">No hay contenidos registrados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Contenidos