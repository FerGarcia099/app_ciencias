const GROQ_RESPONSES_URL =
  "https://api.groq.com/openai/v1/responses"


function obtenerModelo() {
  return (
    process.env.IA_MODEL ||
    "openai/gpt-oss-20b"
  )
}


function iaConfigurada() {
  return Boolean(
    process.env.GROQ_API_KEY?.trim()
  )
}


function extraerTextoRespuesta(data) {
  if (
    typeof data?.output_text === "string" &&
    data.output_text.trim()
  ) {
    return data.output_text.trim()
  }

  const bloques =
    Array.isArray(data?.output)
      ? data.output
      : []

  for (const bloque of bloques) {
    const contenido =
      Array.isArray(bloque?.content)
        ? bloque.content
        : []

    for (const item of contenido) {
      if (
        item?.type === "output_text" &&
        typeof item?.text === "string"
      ) {
        return item.text.trim()
      }
    }
  }

  return ""
}


async function generarEstructurado({
  instrucciones,
  entrada,
  nombreEsquema,
  esquema,
  maxOutputTokens = 5000,
  reasoningEffort = "low"
}) {

  if (!iaConfigurada()) {
    const error = new Error(
      "GROQ_API_KEY no está configurada en el backend"
    )

    error.code = "IA_NO_CONFIGURADA"

    throw error
  }


  if (typeof fetch !== "function") {
    const error = new Error(
      "La versión de Node.js no incluye fetch. Usa Node.js 20 o superior."
    )

    error.code = "NODE_NO_FETCH"

    throw error
  }


  const model = obtenerModelo()


  const response = await fetch(
    GROQ_RESPONSES_URL,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",

        Authorization:
          `Bearer ${process.env.GROQ_API_KEY}`
      },

      body: JSON.stringify({

        model,

        instructions:
          instrucciones,

        input:
          entrada,

        reasoning: {
          effort:
            reasoningEffort
        },

        max_output_tokens:
          maxOutputTokens,

        text: {
          format: {
            type:
              "json_schema",

            name:
              nombreEsquema,

            strict:
              true,

            schema:
              esquema
          }
        }
      })
    }
  )


  const data =
    await response
      .json()
      .catch(() => ({}))


  if (!response.ok) {

    const mensaje =
      data?.error?.message ||
      `Groq respondió con HTTP ${response.status}`

    const error =
      new Error(mensaje)

    error.code =
      "GROQ_API_ERROR"

    error.status =
      response.status

    throw error
  }


  const texto =
    extraerTextoRespuesta(data)


  if (!texto) {
    const error =
      new Error(
        "La IA no devolvió contenido de texto"
      )

    error.code =
      "IA_RESPUESTA_VACIA"

    throw error
  }


  let resultado

  try {

    resultado =
      JSON.parse(texto)

  } catch {

    const error =
      new Error(
        "La respuesta de IA no pudo convertirse a JSON"
      )

    error.code =
      "IA_JSON_INVALIDO"

    throw error
  }


  return {

    resultado,

    model:
      data?.model || model,

    responseId:
      data?.id || null,

    usage:
      data?.usage || null
  }
}


module.exports = {
  generarEstructurado,
  iaConfigurada,
  obtenerModelo
}