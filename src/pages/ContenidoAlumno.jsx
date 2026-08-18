import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import axios from "axios"
import { API_URL } from "../config"
import "./ContenidoAlumno.css"

function ContenidoAlumno() {
  const navigate = useNavigate()
  const { id } = useParams()

  const usuarioSesion = JSON.parse(localStorage.getItem("usuario") || "null")
  const usuarioId = usuarioSesion?.id || localStorage.getItem("usuarioId")

  const [contenido, setContenido] = useState(null)
  const [preguntas, setPreguntas] = useState([])
  const [respuestas, setRespuestas] = useState({})
  const [intento, setIntento] = useState(null)
  const [resultado, setResultado] = useState(null)
  const [bloqueado, setBloqueado] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!usuarioId) {
      navigate("/")
      return
    }

    cargarContenido()
  }, [id])

  const cargarContenido = async () => {
    try {
      setCargando(true)
      setError("")
      setBloqueado(false)

      const [contenidoResponse, preguntasResponse] = await Promise.all([
        axios.get(`${API_URL}/contenidos/${id}`),
        axios.get(`${API_URL}/contenidos/${id}/preguntas`)
      ])

      setContenido(contenidoResponse.data)

      const listaPreguntas = Array.isArray(preguntasResponse.data)
        ? preguntasResponse.data
        : []

      setPreguntas(listaPreguntas)

      if (listaPreguntas.length === 0) {
        return
      }

      try {
        const intentoResponse = await axios.post(`${API_URL}/intentos/iniciar`, {
          usuario_id: Number(usuarioId),
          contenido_id: Number(id)
        })

        setIntento(intentoResponse.data.intento)

        const respuestasGuardadas = {}
        ;(intentoResponse.data.respuestas || []).forEach((item) => {
          respuestasGuardadas[item.pregunta_id] = item.respuesta_seleccionada
        })
        setRespuestas(respuestasGuardadas)
      } catch (errorIntento) {
        if (errorIntento.response?.status === 403 && errorIntento.response?.data?.status === "bloqueado") {
          const intentoCompletado = errorIntento.response.data.intento
          setIntento(intentoCompletado)
          setBloqueado(true)
          setResultado({
            preguntas_totales: Number(intentoCompletado.preguntas_totales) || 0,
            preguntas_respondidas: Number(intentoCompletado.preguntas_respondidas) || 0,
            puntaje_obtenido: Number(intentoCompletado.puntaje_obtenido) || 0,
            puntaje_total: Number(intentoCompletado.puntaje_total) || 0,
            porcentaje: Number(intentoCompletado.porcentaje) || 0,
            numero_intento: Number(intentoCompletado.numero_intento) || 1
          })
          return
        }

        throw errorIntento
      }
    } catch (errorCarga) {
      console.error("Error al cargar contenido:", errorCarga)
      setError(errorCarga.response?.data?.mensaje || "No pudimos cargar este contenido. Intenta nuevamente.")
    } finally {
      setCargando(false)
    }
  }

  const seleccionarRespuesta = async (preguntaId, opcion) => {
    if (!intento || resultado || bloqueado) return

    const anterior = respuestas[preguntaId]

    setRespuestas((prev) => ({
      ...prev,
      [preguntaId]: opcion
    }))

    try {
      await axios.put(`${API_URL}/intentos/${intento.id}/respuesta`, {
        pregunta_id: preguntaId,
        respuesta_seleccionada: opcion
      })
    } catch (error) {
      console.error("Error al guardar respuesta:", error)

      setRespuestas((prev) => {
        const copia = { ...prev }
        if (anterior) copia[preguntaId] = anterior
        else delete copia[preguntaId]
        return copia
      })

      alert(error.response?.data?.mensaje || "No se pudo guardar la respuesta")
    }
  }

  const obtenerOpciones = (pregunta) => [
    { letra: "A", texto: pregunta.opcion_a },
    { letra: "B", texto: pregunta.opcion_b },
    { letra: "C", texto: pregunta.opcion_c },
    { letra: "D", texto: pregunta.opcion_d }
  ]

  const calificar = async () => {
    if (!intento || preguntas.length === 0 || resultado) return

    const sinResponder = preguntas.filter((pregunta) => !respuestas[pregunta.id])

    if (sinResponder.length > 0) {
      alert(`Te faltan ${sinResponder.length} pregunta(s) por responder. 📚`)
      return
    }

    try {
      const res = await axios.post(`${API_URL}/intentos/${intento.id}/finalizar`)
      setResultado(res.data.resultado)
      setBloqueado(true)

      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth"
      })
    } catch (error) {
      console.error(error)
      alert(error.response?.data?.mensaje || "No se pudo finalizar la actividad")
    }
  }

  const preguntasRespondidas = Object.keys(respuestas).length
  const progreso = preguntas.length > 0
    ? Math.round((preguntasRespondidas / preguntas.length) * 100)
    : 0

  const obtenerMensajeResultado = () => {
    if (!resultado) return ""

    const porcentaje = Number(resultado.porcentaje) || 0

    if (porcentaje === 100) return "¡Excelente! ¡Lo hiciste perfecto! 🌟"
    if (porcentaje >= 80) return "¡Muy bien! Sigue así. 🎉"
    if (porcentaje >= 60) return "¡Buen trabajo! Puedes mejorar aún más. 💪"
    return "¡Sigue aprendiendo! Tu maestro puede habilitar otro intento si lo considera necesario. 📚"
  }

  const obtenerClaseOpcion = (pregunta, opcion) => {
    const seleccionada = respuestas[pregunta.id] === opcion

    if (!resultado) {
      return seleccionada ? "opcion-respuesta seleccionada" : "opcion-respuesta"
    }

    const correcta = pregunta.respuesta_correcta?.toString().trim().toUpperCase()

    if (opcion === correcta) return "opcion-respuesta respuesta-correcta"
    if (seleccionada && opcion !== correcta) return "opcion-respuesta respuesta-incorrecta"
    return "opcion-respuesta opcion-deshabilitada"
  }

  if (cargando) {
    return (
      <div className="contenido-alumno-pagina">
        <div className="cargando-contenido">
          <div className="cargando-icono">📚</div>
          <h2>Cargando tu actividad...</h2>
          <p>Preparamos las preguntas para ti 😊</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="contenido-alumno-pagina">
        <div className="mensaje-error">
          <div className="error-icono">😕</div>
          <h2>Algo salió mal</h2>
          <p>{error}</p>
          <button className="btn-volver-panel" onClick={() => navigate("/panelAlumno")}>
            ⬅️ Regresar
          </button>
        </div>
      </div>
    )
  }

  if (!contenido) return null

  return (
    <div className="contenido-alumno-pagina">
      <div className="decoracion decoracion-1">✏️</div>
      <div className="decoracion decoracion-2">📘</div>
      <div className="decoracion decoracion-3">🌎</div>
      <div className="decoracion decoracion-4">🔬</div>
      <div className="decoracion decoracion-5">🌱</div>
      <div className="decoracion decoracion-6">🎒</div>

      <main className="contenido-alumno-container">
        <button className="btn-volver-panel" onClick={() => navigate("/panelAlumno")}>
          ← Regresar a contenidos
        </button>

        <section className="tema-principal">
          <div className="tema-icono">🌿</div>

          <div className="tema-info">
            <span className="tema-etiqueta">📚 Tema de Ciencias Naturales</span>
            <h1>{contenido.titulo}</h1>
            <div className="tema-grado">🎓 Grado: {contenido.grado}</div>
            <p>{contenido.descripcion}</p>
          </div>
        </section>

        {bloqueado && resultado && (
          <section className="actividad-bloqueada-card">
            <div className="candado-grande">🔒</div>
            <div>
              <span>ACTIVIDAD FINALIZADA</span>
              <h2>Ya realizaste este tema</h2>
              <p>
                No puedes responder nuevamente hasta que tu maestro habilite un nuevo intento.
              </p>
            </div>
          </section>
        )}

        <section className="zona-preguntas">
          <div className="preguntas-titulo">
            <div>
              <span className="mini-etiqueta">🧠 Pon a prueba lo aprendido</span>
              <h2>¡Hora de responder! ❓</h2>
            </div>

            {preguntas.length > 0 && (
              <div className="resumen-preguntas">
                {preguntas.length} pregunta{preguntas.length !== 1 ? "s" : ""}
              </div>
            )}
          </div>

          {!bloqueado && preguntas.length > 0 && (
            <div className="progreso-container">
              <div className="progreso-info">
                <span>Progreso</span>
                <span>{preguntasRespondidas} de {preguntas.length} respondidas</span>
              </div>

              <div className="barra-progreso">
                <div className="barra-progreso-relleno" style={{ width: `${progreso}%` }} />
              </div>
            </div>
          )}

          {preguntas.length === 0 ? (
            <div className="sin-preguntas">
              <div className="sin-preguntas-icono">📝</div>
              <h3>Este contenido todavía no tiene preguntas</h3>
            </div>
          ) : !bloqueado || (resultado && respuestas && Object.keys(respuestas).length > 0) ? (
            <div className="lista-preguntas">
              {preguntas.map((pregunta, index) => (
                <article className="pregunta-nueva-card" key={pregunta.id}>
                  <div className="pregunta-superior">
                    <div className="numero-pregunta">{index + 1}</div>

                    <div className="pregunta-texto">
                      <span>Pregunta {index + 1}</span>
                      <h3>{pregunta.pregunta}</h3>
                    </div>

                    <div className="pregunta-puntos">
                      ⭐ {Number(pregunta.puntaje) || 1} pt{(Number(pregunta.puntaje) || 1) !== 1 ? "s" : ""}
                    </div>
                  </div>

                  <div className="opciones-grid">
                    {obtenerOpciones(pregunta).map((opcion) => (
                      <button
                        type="button"
                        key={opcion.letra}
                        className={obtenerClaseOpcion(pregunta, opcion.letra)}
                        onClick={() => seleccionarRespuesta(pregunta.id, opcion.letra)}
                        disabled={Boolean(resultado) || bloqueado}
                      >
                        <span className="letra-opcion">{opcion.letra}</span>
                        <span className="texto-opcion">{opcion.texto}</span>

                        {respuestas[pregunta.id] === opcion.letra && !resultado && (
                          <span className="check-opcion">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          ) : null}

          {preguntas.length > 0 && !resultado && !bloqueado && (
            <div className="zona-calificar">
              <button className="btn-calificar" onClick={calificar}>
                ⭐ Finalizar y calificar actividad
              </button>
              <p>Al finalizar, no podrás repetirla hasta que tu maestro lo habilite.</p>
            </div>
          )}

          {resultado && (
            <section className="resultado-final">
              <div className="trofeo-resultado">🏆</div>
              <h2>Tu resultado</h2>
              <p className="mensaje-resultado">{obtenerMensajeResultado()}</p>

              <div className="resultado-datos">
                <div className="resultado-item">
                  <span className="resultado-icono">⭐</span>
                  <strong>{Number(resultado.puntaje_obtenido) || 0}/{Number(resultado.puntaje_total) || 0}</strong>
                  <small>Puntos</small>
                </div>

                <div className="resultado-item">
                  <span className="resultado-icono">📝</span>
                  <strong>{Number(resultado.preguntas_respondidas) || Number(resultado.preguntas_totales) || 0}</strong>
                  <small>Respondidas</small>
                </div>

                <div className="resultado-item resultado-porcentaje">
                  <span className="resultado-icono">🎯</span>
                  <strong>{Math.round(Number(resultado.porcentaje) || 0)}%</strong>
                  <small>Resultado</small>
                </div>

                <div className="resultado-item">
                  <span className="resultado-icono">🔢</span>
                  <strong>#{Number(resultado.numero_intento) || Number(intento?.numero_intento) || 1}</strong>
                  <small>Intento</small>
                </div>
              </div>

              <div className="resultado-botones">
                <button className="btn-terminar" onClick={() => navigate("/panelAlumno")}>
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
