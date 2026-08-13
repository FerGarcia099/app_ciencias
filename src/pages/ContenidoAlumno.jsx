import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import axios from "axios"
import { API_URL } from "../config"
import "./ContenidoAlumno.css"

function ContenidoAlumno() {
  const navigate = useNavigate()
  const { id } = useParams()

  const [contenido, setContenido] = useState(null)
  const [preguntas, setPreguntas] = useState([])
  const [respuestas, setRespuestas] = useState({})
  const [resultado, setResultado] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    cargarContenido()
  }, [id])

  const cargarContenido = async () => {
    try {
      setCargando(true)
      setError("")

      const contenidoResponse = await axios.get(
        `${API_URL}/contenidos/${id}`
      )

      const preguntasResponse = await axios.get(
        `${API_URL}/contenidos/${id}/preguntas`
      )

      setContenido(contenidoResponse.data)

      if (Array.isArray(preguntasResponse.data)) {
        setPreguntas(preguntasResponse.data)
      } else {
        setPreguntas([])
      }
    } catch (error) {
      console.error("Error al cargar contenido:", error)

      setError(
        "No pudimos cargar este contenido. Intenta nuevamente."
      )
    } finally {
      setCargando(false)
    }
  }

  const seleccionarRespuesta = (preguntaId, opcion) => {
    // Después de calificar ya no permitimos modificar respuestas
    if (resultado) return

    setRespuestas((anteriores) => ({
      ...anteriores,
      [preguntaId]: opcion
    }))
  }

  const obtenerOpciones = (pregunta) => {
    return [
      {
        letra: "A",
        texto: pregunta.opcion_a
      },
      {
        letra: "B",
        texto: pregunta.opcion_b
      },
      {
        letra: "C",
        texto: pregunta.opcion_c
      },
      {
        letra: "D",
        texto: pregunta.opcion_d
      }
    ]
  }

  const calificar = () => {
    if (preguntas.length === 0) {
      return
    }

    const sinResponder = preguntas.filter(
      (pregunta) => !respuestas[pregunta.id]
    )

    if (sinResponder.length > 0) {
      alert(
        `Te faltan ${sinResponder.length} pregunta(s) por responder. 📚`
      )
      return
    }

    let correctas = 0
    let puntosObtenidos = 0
    let puntosTotales = 0

    preguntas.forEach((pregunta) => {
      const puntajePregunta =
        Number(pregunta.puntaje) || 1

      puntosTotales += puntajePregunta

      const respuestaAlumno =
        respuestas[pregunta.id]
          ?.toString()
          .trim()
          .toUpperCase()

      const respuestaCorrecta =
        pregunta.respuesta_correcta
          ?.toString()
          .trim()
          .toUpperCase()

      if (respuestaAlumno === respuestaCorrecta) {
        correctas++
        puntosObtenidos += puntajePregunta
      }
    })

    const porcentaje =
      puntosTotales > 0
        ? Math.round(
            (puntosObtenidos / puntosTotales) * 100
          )
        : 0

    setResultado({
      correctas,
      incorrectas: preguntas.length - correctas,
      totalPreguntas: preguntas.length,
      puntosObtenidos,
      puntosTotales,
      porcentaje
    })

    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth"
    })
  }

  const intentarNuevamente = () => {
    setRespuestas({})
    setResultado(null)

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    })
  }

  const preguntasRespondidas =
    Object.keys(respuestas).length

  const progreso =
    preguntas.length > 0
      ? Math.round(
          (preguntasRespondidas / preguntas.length) *
            100
        )
      : 0

  const obtenerMensajeResultado = () => {
    if (!resultado) return ""

    if (resultado.porcentaje === 100) {
      return "¡Excelente! ¡Lo hiciste perfecto! 🌟"
    }

    if (resultado.porcentaje >= 80) {
      return "¡Muy bien! Sigue así. 🎉"
    }

    if (resultado.porcentaje >= 60) {
      return "¡Buen trabajo! Puedes mejorar aún más. 💪"
    }

    return "¡Sigue practicando! Cada intento te ayuda a aprender. 📚"
  }

  const obtenerClaseOpcion = (
    pregunta,
    opcion
  ) => {
    const seleccionada =
      respuestas[pregunta.id] === opcion

    if (!resultado) {
      return seleccionada
        ? "opcion-respuesta seleccionada"
        : "opcion-respuesta"
    }

    const correcta =
      pregunta.respuesta_correcta
        ?.toString()
        .trim()
        .toUpperCase()

    if (opcion === correcta) {
      return "opcion-respuesta respuesta-correcta"
    }

    if (
      seleccionada &&
      opcion !== correcta
    ) {
      return "opcion-respuesta respuesta-incorrecta"
    }

    return "opcion-respuesta opcion-deshabilitada"
  }

  if (cargando) {
    return (
      <div className="contenido-alumno-pagina">
        <div className="cargando-contenido">
          <div className="cargando-icono">
            📚
          </div>

          <h2>Cargando tu actividad...</h2>

          <p>
            Preparamos las preguntas para ti 😊
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="contenido-alumno-pagina">
        <div className="mensaje-error">
          <div className="error-icono">
            😕
          </div>

          <h2>Algo salió mal</h2>

          <p>{error}</p>

          <button
            className="btn-volver-panel"
            onClick={() =>
              navigate("/panelAlumno")
            }
          >
            ⬅️ Regresar
          </button>
        </div>
      </div>
    )
  }

  if (!contenido) {
    return (
      <div className="contenido-alumno-pagina">
        <div className="mensaje-error">
          <h2>Contenido no encontrado</h2>

          <button
            className="btn-volver-panel"
            onClick={() =>
              navigate("/panelAlumno")
            }
          >
            ⬅️ Regresar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="contenido-alumno-pagina">

      {/* FIGURAS DECORATIVAS */}

      <div className="decoracion decoracion-1">
        ✏️
      </div>

      <div className="decoracion decoracion-2">
        📘
      </div>

      <div className="decoracion decoracion-3">
        🌎
      </div>

      <div className="decoracion decoracion-4">
        🔬
      </div>

      <div className="decoracion decoracion-5">
        🌱
      </div>

      <div className="decoracion decoracion-6">
        🎒
      </div>

      <main className="contenido-alumno-container">

        {/* BOTÓN REGRESAR */}

        <button
          className="btn-volver-panel"
          onClick={() =>
            navigate("/panelAlumno")
          }
        >
          ← Regresar a contenidos
        </button>

        {/* INFORMACIÓN DEL TEMA */}

        <section className="tema-principal">

          <div className="tema-icono">
            🌿
          </div>

          <div className="tema-info">
            <span className="tema-etiqueta">
              📚 Tema de Ciencias Naturales
            </span>

            <h1>
              {contenido.titulo}
            </h1>

            <div className="tema-grado">
              🎓 Grado: {contenido.grado}
            </div>

            <p>
              {contenido.descripcion}
            </p>
          </div>

        </section>

        {/* ENCABEZADO PREGUNTAS */}

        <section className="zona-preguntas">

          <div className="preguntas-titulo">

            <div>
              <span className="mini-etiqueta">
                🧠 Pon a prueba lo aprendido
              </span>

              <h2>
                ¡Hora de responder! ❓
              </h2>
            </div>

            {preguntas.length > 0 && (
              <div className="resumen-preguntas">
                {preguntas.length} pregunta
                {preguntas.length !== 1
                  ? "s"
                  : ""}
              </div>
            )}

          </div>

          {preguntas.length > 0 && (
            <div className="progreso-container">

              <div className="progreso-info">
                <span>
                  Progreso
                </span>

                <span>
                  {preguntasRespondidas} de{" "}
                  {preguntas.length} respondidas
                </span>
              </div>

              <div className="barra-progreso">
                <div
                  className="barra-progreso-relleno"
                  style={{
                    width: `${progreso}%`
                  }}
                />
              </div>

            </div>
          )}

          {/* SIN PREGUNTAS */}

          {preguntas.length === 0 ? (
            <div className="sin-preguntas">
              <div className="sin-preguntas-icono">
                📝
              </div>

              <h3>
                Este contenido todavía no tiene
                preguntas
              </h3>

              <p>
                Vuelve más tarde para continuar
                aprendiendo.
              </p>
            </div>
          ) : (

            <div className="lista-preguntas">

              {preguntas.map(
                (pregunta, index) => (

                  <article
                    className="pregunta-nueva-card"
                    key={pregunta.id}
                  >

                    <div className="pregunta-superior">

                      <div className="numero-pregunta">
                        {index + 1}
                      </div>

                      <div className="pregunta-texto">
                        <span>
                          Pregunta {index + 1}
                        </span>

                        <h3>
                          {pregunta.pregunta}
                        </h3>
                      </div>

                      <div className="pregunta-puntos">
                        ⭐{" "}
                        {Number(
                          pregunta.puntaje
                        ) || 1}{" "}
                        pt
                        {(Number(
                          pregunta.puntaje
                        ) || 1) !== 1
                          ? "s"
                          : ""}
                      </div>

                    </div>

                    <div className="opciones-grid">

                      {obtenerOpciones(
                        pregunta
                      ).map((opcion) => (

                        <button
                          type="button"
                          key={opcion.letra}
                          className={obtenerClaseOpcion(
                            pregunta,
                            opcion.letra
                          )}
                          onClick={() =>
                            seleccionarRespuesta(
                              pregunta.id,
                              opcion.letra
                            )
                          }
                        >

                          <span className="letra-opcion">
                            {opcion.letra}
                          </span>

                          <span className="texto-opcion">
                            {opcion.texto}
                          </span>

                          {respuestas[
                            pregunta.id
                          ] === opcion.letra &&
                            !resultado && (
                              <span className="check-opcion">
                                ✓
                              </span>
                            )}

                          {resultado &&
                            pregunta.respuesta_correcta
                              ?.toString()
                              .toUpperCase() ===
                              opcion.letra && (
                              <span className="check-opcion">
                                ✓
                              </span>
                            )}

                          {resultado &&
                            respuestas[
                              pregunta.id
                            ] ===
                              opcion.letra &&
                            pregunta.respuesta_correcta
                              ?.toString()
                              .toUpperCase() !==
                              opcion.letra && (
                              <span className="error-opcion">
                                ✕
                              </span>
                            )}

                        </button>

                      ))}

                    </div>

                  </article>

                )
              )}

            </div>
          )}

          {/* BOTÓN CALIFICAR */}

          {preguntas.length > 0 &&
            !resultado && (

              <div className="zona-calificar">

                <button
                  className="btn-calificar"
                  onClick={calificar}
                >
                  ⭐ Calificar mi actividad
                </button>

                <p>
                  Responde todas las preguntas
                  antes de calificar.
                </p>

              </div>
            )}

          {/* RESULTADO */}

          {resultado && (

            <section className="resultado-final">

              <div className="trofeo-resultado">
                🏆
              </div>

              <h2>
                Tu resultado
              </h2>

              <p className="mensaje-resultado">
                {obtenerMensajeResultado()}
              </p>

              <div className="resultado-datos">

                <div className="resultado-item">
                  <span className="resultado-icono">
                    ⭐
                  </span>

                  <strong>
                    {resultado.puntosObtenidos}
                    /
                    {resultado.puntosTotales}
                  </strong>

                  <small>
                    Puntos
                  </small>
                </div>

                <div className="resultado-item">
                  <span className="resultado-icono">
                    ✅
                  </span>

                  <strong>
                    {resultado.correctas}
                  </strong>

                  <small>
                    Correctas
                  </small>
                </div>

                <div className="resultado-item">
                  <span className="resultado-icono">
                    ❌
                  </span>

                  <strong>
                    {resultado.incorrectas}
                  </strong>

                  <small>
                    Incorrectas
                  </small>
                </div>

                <div className="resultado-item resultado-porcentaje">
                  <span className="resultado-icono">
                    🎯
                  </span>

                  <strong>
                    {resultado.porcentaje}%
                  </strong>

                  <small>
                    Resultado
                  </small>
                </div>

              </div>

              <div className="resultado-botones">

                <button
                  className="btn-reintentar"
                  onClick={intentarNuevamente}
                >
                  🔄 Intentar nuevamente
                </button>

                <button
                  className="btn-terminar"
                  onClick={() =>
                    navigate("/panelAlumno")
                  }
                >
                  🏠 Volver a contenidos
                </button>

              </div>

            </section>

          )}

        </section>

      </main>

    </div>
  )
}

export default ContenidoAlumno