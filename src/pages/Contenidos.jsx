import { useEffect, useState } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import Sidebar from "../components/Sidebar"
import { API_URL } from "../config"
import "./AdminModules.css"

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
  const [respuestaCorrecta, setRespuestaCorrecta] =
    useState("A")

  const [puntaje, setPuntaje] = useState(1)

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

  const guardarContenido = () => {
    if (
      titulo.trim() === "" ||
      descripcion.trim() === "" ||
      grado.trim() === ""
    ) {
      alert(
        "Todos los campos del contenido son obligatorios"
      )
      return
    }

    axios
      .post(`${API_URL}/contenidos`, {
        titulo,
        descripcion,
        grado
      })
      .then((res) => {
        if (res.data.status === "ok") {

          alert("Contenido creado correctamente")

          setTitulo("")
          setDescripcion("")
          setGrado("")

          obtenerContenidos()

        } else {

          alert(
            res.data.mensaje ||
              "Error al crear contenido"
          )

        }
      })
      .catch((error) => {
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
      alert(
        "Todos los campos de la pregunta son obligatorios"
      )
      return
    }

    axios
      .post(`${API_URL}/preguntas`, {
        contenido_id: contenidoId,
        pregunta,
        opcion_a: opcionA,
        opcion_b: opcionB,
        opcion_c: opcionC,
        opcion_d: opcionD,
        respuesta_correcta: respuestaCorrecta,
        puntaje
      })
      .then((res) => {
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

          alert(
            res.data.mensaje ||
              "Error al crear pregunta"
          )

        }
      })
      .catch((error) => {
        console.error(error)
        alert("Error al conectar con el servidor")
      })
  }

  return (
    <>
      <Sidebar />

      <div className="admin-page">

        <div className="admin-deco admin-deco-1">
          📚
        </div>

        <div className="admin-deco admin-deco-2">
          🧪
        </div>

        <div className="admin-deco admin-deco-3">
          🌿
        </div>

        <div className="admin-deco admin-deco-4">
          🌎
        </div>

        <main className="admin-container">

          <section className="admin-header">

            <div className="admin-header-info">

              <div className="admin-header-icon">
                📚
              </div>

              <div className="admin-header-text">

                <small>
                  Material educativo
                </small>

                <h1>
                  Contenidos y preguntas
                </h1>

                <p>
                  Crea temas de Ciencias Naturales
                  y evaluaciones para tus alumnos.
                </p>

              </div>

            </div>

            <div className="admin-counter">

              <strong>
                {contenidos.length}
              </strong>

              <span>
                CONTENIDOS
              </span>

            </div>

          </section>

          <button
            className="admin-back"
            onClick={() =>
              navigate("/panel")
            }
          >
            ← Regresar al panel
          </button>

          <br />
          <br />

          <div className="admin-grid-two">

            {/* CREAR CONTENIDO */}

            <section className="admin-form-card">

              <div className="admin-form-title">

                <div className="admin-form-icon">
                  📖
                </div>

                <div>
                  <h2>
                    Nuevo contenido
                  </h2>

                  <p>
                    Agrega un nuevo tema educativo.
                  </p>
                </div>

              </div>

              <div className="admin-field">
                <label>
                  Título del tema
                </label>

                <input
                  type="text"
                  placeholder="Ej. Los ecosistemas"
                  value={titulo}
                  onChange={(e) =>
                    setTitulo(e.target.value)
                  }
                />
              </div>

              <div className="admin-field">
                <label>
                  Grado
                </label>

                <input
                  type="text"
                  placeholder="Ej. 4to Primaria"
                  value={grado}
                  onChange={(e) =>
                    setGrado(e.target.value)
                  }
                />
              </div>

              <div className="admin-field">
                <label>
                  Descripción / contenido
                </label>

                <textarea
                  placeholder="Escribe aquí el contenido del tema..."
                  value={descripcion}
                  onChange={(e) =>
                    setDescripcion(
                      e.target.value
                    )
                  }
                />
              </div>

              <button
                className="admin-primary admin-orange"
                onClick={guardarContenido}
              >
                💾 Guardar contenido
              </button>

            </section>

            {/* CREAR PREGUNTA */}

            <section className="admin-form-card">

              <div className="admin-form-title">

                <div className="admin-form-icon">
                  ❓
                </div>

                <div>
                  <h2>
                    Crear pregunta
                  </h2>

                  <p>
                    Agrega una pregunta a un contenido.
                  </p>
                </div>

              </div>

              <div className="admin-field">
                <label>
                  Contenido
                </label>

                <select
                  value={contenidoId}
                  onChange={(e) =>
                    setContenidoId(
                      e.target.value
                    )
                  }
                >
                  <option value="">
                    Seleccione un contenido
                  </option>

                  {contenidos.map((item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.titulo} - {item.grado}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-field">
                <label>
                  Pregunta
                </label>

                <textarea
                  placeholder="Escribe la pregunta..."
                  value={pregunta}
                  onChange={(e) =>
                    setPregunta(e.target.value)
                  }
                />
              </div>

              <div className="admin-field">
                <label>Opción A</label>

                <input
                  value={opcionA}
                  onChange={(e) =>
                    setOpcionA(e.target.value)
                  }
                />
              </div>

              <div className="admin-field">
                <label>Opción B</label>

                <input
                  value={opcionB}
                  onChange={(e) =>
                    setOpcionB(e.target.value)
                  }
                />
              </div>

              <div className="admin-field">
                <label>Opción C</label>

                <input
                  value={opcionC}
                  onChange={(e) =>
                    setOpcionC(e.target.value)
                  }
                />
              </div>

              <div className="admin-field">
                <label>Opción D</label>

                <input
                  value={opcionD}
                  onChange={(e) =>
                    setOpcionD(e.target.value)
                  }
                />
              </div>

              <div className="admin-field">
                <label>
                  Respuesta correcta
                </label>

                <select
                  value={respuestaCorrecta}
                  onChange={(e) =>
                    setRespuestaCorrecta(
                      e.target.value
                    )
                  }
                >
                  <option value="A">
                    ✅ Opción A
                  </option>

                  <option value="B">
                    ✅ Opción B
                  </option>

                  <option value="C">
                    ✅ Opción C
                  </option>

                  <option value="D">
                    ✅ Opción D
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
                  value={puntaje}
                  onChange={(e) =>
                    setPuntaje(
                      Number(e.target.value)
                    )
                  }
                />
              </div>

              <button
                className="admin-primary"
                onClick={guardarPregunta}
              >
                ❓ Guardar pregunta
              </button>

            </section>

          </div>

          <br />

          {/* CONTENIDOS REGISTRADOS */}

          <section className="admin-card">

            <div className="admin-card-header">

              <small>
                🌱 TEMAS DISPONIBLES
              </small>

              <h2>
                Contenidos registrados
              </h2>

              <p>
                Temas disponibles para los estudiantes.
              </p>

            </div>

            {contenidos.length > 0 ? (

              <div className="admin-content-list">

                {contenidos.map((item) => (

                  <div
                    className="admin-content-row"
                    key={item.id}
                  >

                    <div className="admin-content-icon">
                      📗
                    </div>

                    <div className="admin-content-info">

                      <strong>
                        {item.titulo}
                      </strong>

                      <span>
                        🎓 Grado: {item.grado}
                      </span>

                    </div>

                  </div>

                ))}

              </div>

            ) : (

              <div className="admin-empty">

                <div className="admin-empty-icon">
                  📭
                </div>

                No hay contenidos registrados

              </div>

            )}

          </section>

        </main>

      </div>
    </>
  )
}

export default Contenidos