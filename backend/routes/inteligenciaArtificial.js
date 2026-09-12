const express = require("express")
const {
  generarEstructurado,
  iaConfigurada,
  obtenerModelo
} = require("../services/openaiService")

function crearRutasInteligenciaArtificial({ conexion, autorizarRoles }) {
  const router = express.Router()

  const query = (sql, params = []) =>
    new Promise((resolve, reject) => {
      conexion.query(sql, params, (err, rows) => {
        if (err) return reject(err)
        resolve(rows)
      })
    })

  const beginTransaction = () =>
    new Promise((resolve, reject) => {
      conexion.beginTransaction((err) => (err ? reject(err) : resolve()))
    })

  const commit = () =>
    new Promise((resolve, reject) => {
      conexion.commit((err) => (err ? reject(err) : resolve()))
    })

  const rollback = () =>
    new Promise((resolve) => {
      conexion.rollback(() => resolve())
    })

  const jsonSeguro = (valor, fallback = null) => {
    if (valor === null || valor === undefined) return fallback
    if (typeof valor === "object") return valor

    try {
      return JSON.parse(valor)
    } catch {
      return fallback
    }
  }

  const errorIA = (res, error, mensajeBase) => {
    console.log(mensajeBase, error)

    if (error?.code === "IA_NO_CONFIGURADA") {
      return res.status(503).json({
        status: "error",
        codigo: "IA_NO_CONFIGURADA",
        mensaje:
          "La Inteligencia Artificial todavía no está configurada. Agrega OPENAI_API_KEY en las variables del backend."
      })
    }

    if (error?.code === "OPENAI_API_ERROR") {
      return res.status(502).json({
        status: "error",
        codigo: "PROVEEDOR_IA",
        mensaje: "No fue posible completar la solicitud con el proveedor de IA."
      })
    }

    return res.status(500).json({
      status: "error",
      mensaje: mensajeBase
    })
  }

  const dificultadValida = (valor) =>
    ["facil", "media", "dificil"].includes(valor) ? valor : "media"

  const esquemaContenido = {
    type: "object",
    additionalProperties: false,
    properties: {
      titulo: { type: "string" },
      descripcion: { type: "string" },
      resumen: { type: "string" },
      objetivos: {
        type: "array",
        items: { type: "string" }
      },
      preguntas: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            pregunta: { type: "string" },
            opcion_a: { type: "string" },
            opcion_b: { type: "string" },
            opcion_c: { type: "string" },
            opcion_d: { type: "string" },
            respuesta_correcta: {
              type: "string",
              enum: ["A", "B", "C", "D"]
            },
            explicacion: { type: "string" },
            puntaje: { type: "integer", minimum: 1, maximum: 20 }
          },
          required: [
            "pregunta",
            "opcion_a",
            "opcion_b",
            "opcion_c",
            "opcion_d",
            "respuesta_correcta",
            "explicacion",
            "puntaje"
          ]
        }
      }
    },
    required: ["titulo", "descripcion", "resumen", "objetivos", "preguntas"]
  }

  const esquemaPreguntas = {
    type: "object",
    additionalProperties: false,
    properties: {
      preguntas: esquemaContenido.properties.preguntas
    },
    required: ["preguntas"]
  }

  const esquemaAnalisis = {
    type: "object",
    additionalProperties: false,
    properties: {
      resumen: { type: "string" },
      nivel_general: {
        type: "string",
        enum: ["alto", "medio", "requiere_refuerzo", "sin_datos_suficientes"]
      },
      fortalezas: {
        type: "array",
        items: { type: "string" }
      },
      dificultades: {
        type: "array",
        items: { type: "string" }
      },
      patrones: {
        type: "array",
        items: { type: "string" }
      },
      recomendaciones: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            titulo: { type: "string" },
            detalle: { type: "string" },
            prioridad: {
              type: "string",
              enum: ["alta", "media", "baja"]
            }
          },
          required: ["titulo", "detalle", "prioridad"]
        }
      },
      mensaje_docente: { type: "string" }
    },
    required: [
      "resumen",
      "nivel_general",
      "fortalezas",
      "dificultades",
      "patrones",
      "recomendaciones",
      "mensaje_docente"
    ]
  }

  const esquemaRefuerzo = {
    type: "object",
    additionalProperties: false,
    properties: {
      titulo: { type: "string" },
      objetivo: { type: "string" },
      duracion_minutos: { type: "integer", minimum: 5, maximum: 120 },
      instrucciones: { type: "string" },
      actividad: { type: "string" },
      preguntas: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            pregunta: { type: "string" },
            opcion_a: { type: "string" },
            opcion_b: { type: "string" },
            opcion_c: { type: "string" },
            opcion_d: { type: "string" },
            respuesta_correcta: {
              type: "string",
              enum: ["A", "B", "C", "D"]
            }
          },
          required: [
            "pregunta",
            "opcion_a",
            "opcion_b",
            "opcion_c",
            "opcion_d",
            "respuesta_correcta"
          ]
        }
      },
      recomendaciones_docente: {
        type: "array",
        items: { type: "string" }
      }
    },
    required: [
      "titulo",
      "objetivo",
      "duracion_minutos",
      "instrucciones",
      "actividad",
      "preguntas",
      "recomendaciones_docente"
    ]
  }

  // ============================================================
  // ESTADO Y OPCIONES
  // ============================================================
  router.get("/estado", autorizarRoles("maestro"), (req, res) => {
    return res.json({
      configurada: iaConfigurada(),
      modelo: obtenerModelo()
    })
  })

  router.get("/opciones", autorizarRoles("maestro"), async (req, res) => {
    try {
      const [grados, contenidos, alumnos] = await Promise.all([
        query(`
          SELECT id, nombre
          FROM grados
          WHERE activo = 1
          ORDER BY orden ASC, nombre ASC
        `),
        query(`
          SELECT id, titulo, grado, descripcion
          FROM contenidos
          WHERE activo = 1
          ORDER BY titulo ASC
        `),
        query(`
          SELECT id, nombre, usuario
          FROM usuarios
          WHERE LOWER(TRIM(rol)) = 'alumno'
          ORDER BY nombre ASC
        `)
      ])

      return res.json({ grados, contenidos, alumnos })
    } catch (error) {
      return errorIA(res, error, "Error al cargar las opciones de IA")
    }
  })

  // ============================================================
  // GENERAR CONTENIDO NUEVO + PREGUNTAS
  // ============================================================
  router.post("/generar-contenido", autorizarRoles("maestro"), async (req, res) => {
    const grado = req.body.grado?.toString().trim()
    const tema = req.body.tema?.toString().trim()
    const dificultad = dificultadValida(req.body.dificultad)
    const cantidadPreguntas = Math.min(10, Math.max(3, Number(req.body.cantidad_preguntas) || 5))

    if (!grado || !tema) {
      return res.status(400).json({
        status: "error",
        mensaje: "Grado y tema son obligatorios"
      })
    }

    if (tema.length > 180 || grado.length > 80) {
      return res.status(400).json({
        status: "error",
        mensaje: "El grado o tema exceden la longitud permitida"
      })
    }

    const entrada = {
      grado,
      tema,
      dificultad,
      cantidad_preguntas: cantidadPreguntas
    }

    try {
      const ia = await generarEstructurado({
        nombreEsquema: "eco_holistic_contenido",
        esquema: esquemaContenido,
        maxOutputTokens: 6000,
        instrucciones: `
Eres un asistente pedagógico para docentes de educación primaria en Guatemala.
Crea material de Ciencias Naturales apropiado para la edad indicada y con orientación general al CNB de Guatemala.
La propuesta siempre será revisada y aprobada por un maestro antes de publicarse.
Usa lenguaje claro, científicamente correcto y seguro para niños.
No inventes fuentes, citas, leyes ni referencias bibliográficas.
Las preguntas deben poder responderse únicamente con el material propuesto.
Distribuye el puntaje de forma sencilla, normalmente 5 puntos por pregunta.
        `.trim(),
        entrada: `
Genera una propuesta educativa.
Grado: ${grado}
Tema: ${tema}
Dificultad: ${dificultad}
Cantidad exacta de preguntas: ${cantidadPreguntas}
        `.trim()
      })

      const result = await query(
        `
          INSERT INTO ia_generaciones
          (
            maestro_id,
            tipo,
            grado,
            tema,
            dificultad,
            modelo,
            entrada_json,
            salida_json,
            estado
          )
          VALUES (?, 'contenido', ?, ?, ?, ?, ?, ?, 'borrador')
        `,
        [
          req.usuario.id,
          grado,
          tema,
          dificultad,
          ia.model,
          JSON.stringify(entrada),
          JSON.stringify(ia.resultado)
        ]
      )

      return res.status(201).json({
        status: "ok",
        generacion_id: result.insertId,
        modelo: ia.model,
        propuesta: ia.resultado
      })
    } catch (error) {
      return errorIA(res, error, "Error al generar el contenido con IA")
    }
  })

  // ============================================================
  // GENERAR PREGUNTAS PARA CONTENIDO EXISTENTE
  // ============================================================
  router.post("/generar-preguntas", autorizarRoles("maestro"), async (req, res) => {
    const contenidoId = Number(req.body.contenido_id)
    const dificultad = dificultadValida(req.body.dificultad)
    const cantidadPreguntas = Math.min(10, Math.max(3, Number(req.body.cantidad_preguntas) || 5))

    if (!contenidoId) {
      return res.status(400).json({ status: "error", mensaje: "Selecciona un contenido" })
    }

    try {
      const contenidos = await query(
        `
          SELECT id, titulo, descripcion, grado
          FROM contenidos
          WHERE id = ? AND activo = 1
          LIMIT 1
        `,
        [contenidoId]
      )

      if (!contenidos.length) {
        return res.status(404).json({ status: "error", mensaje: "Contenido no encontrado" })
      }

      const contenido = contenidos[0]
      const entrada = {
        contenido_id: contenidoId,
        dificultad,
        cantidad_preguntas: cantidadPreguntas
      }

      const ia = await generarEstructurado({
        nombreEsquema: "eco_holistic_preguntas",
        esquema: esquemaPreguntas,
        maxOutputTokens: 4500,
        instrucciones: `
Eres un asistente pedagógico para Ciencias Naturales de primaria en Guatemala.
Genera preguntas de opción múltiple basadas únicamente en el contenido suministrado.
Las preguntas deben ser apropiadas para el grado, claras y sin ambigüedades.
Cada pregunta debe tener una única respuesta correcta.
La propuesta será revisada por un maestro antes de guardarse.
        `.trim(),
        entrada: `
Título: ${contenido.titulo}
Grado: ${contenido.grado || "Primaria"}
Descripción/material base:
${contenido.descripcion || "Sin descripción adicional"}

Dificultad: ${dificultad}
Cantidad exacta de preguntas: ${cantidadPreguntas}
        `.trim()
      })

      const result = await query(
        `
          INSERT INTO ia_generaciones
          (
            maestro_id,
            tipo,
            contenido_origen_id,
            grado,
            tema,
            dificultad,
            modelo,
            entrada_json,
            salida_json,
            estado
          )
          VALUES (?, 'preguntas', ?, ?, ?, ?, ?, ?, ?, 'borrador')
        `,
        [
          req.usuario.id,
          contenidoId,
          contenido.grado || null,
          contenido.titulo,
          dificultad,
          ia.model,
          JSON.stringify(entrada),
          JSON.stringify(ia.resultado)
        ]
      )

      return res.status(201).json({
        status: "ok",
        generacion_id: result.insertId,
        modelo: ia.model,
        propuesta: ia.resultado
      })
    } catch (error) {
      return errorIA(res, error, "Error al generar preguntas con IA")
    }
  })

  // ============================================================
  // APROBAR PROPUESTA
  // contenido -> crea contenido + preguntas
  // preguntas -> agrega preguntas al contenido origen
  // ============================================================
  router.post("/generaciones/:id/aprobar", autorizarRoles("maestro"), async (req, res) => {
    const generacionId = Number(req.params.id)

    try {
      const rows = await query(
        `
          SELECT *
          FROM ia_generaciones
          WHERE id = ? AND maestro_id = ?
          LIMIT 1
        `,
        [generacionId, req.usuario.id]
      )

      if (!rows.length) {
        return res.status(404).json({ status: "error", mensaje: "Generación no encontrada" })
      }

      const generacion = rows[0]

      if (generacion.estado !== "borrador") {
        return res.status(409).json({
          status: "error",
          mensaje: "Esta propuesta ya fue procesada"
        })
      }

      const salida = jsonSeguro(generacion.salida_json, {})
      const preguntas = Array.isArray(salida?.preguntas) ? salida.preguntas : []

      await beginTransaction()

      let contenidoId = generacion.contenido_origen_id

      if (generacion.tipo === "contenido") {
        const objetivos = Array.isArray(salida.objetivos) ? salida.objetivos : []
        const descripcionFinal = [
          salida.descripcion,
          salida.resumen ? `Resumen: ${salida.resumen}` : "",
          objetivos.length ? `Objetivos de aprendizaje:\n- ${objetivos.join("\n- ")}` : ""
        ]
          .filter(Boolean)
          .join("\n\n")

        const insertContenido = await query(
          `
            INSERT INTO contenidos (titulo, descripcion, grado, activo)
            VALUES (?, ?, ?, 1)
          `,
          [salida.titulo || generacion.tema, descripcionFinal, generacion.grado]
        )

        contenidoId = insertContenido.insertId
      }

      if (!contenidoId) {
        await rollback()
        return res.status(400).json({ status: "error", mensaje: "No existe un contenido destino" })
      }

      for (const item of preguntas) {
        const respuesta = item.respuesta_correcta?.toString().trim().toUpperCase()

        if (!["A", "B", "C", "D"].includes(respuesta)) continue

        await query(
          `
            INSERT INTO preguntas
            (
              contenido_id,
              pregunta,
              opcion_a,
              opcion_b,
              opcion_c,
              opcion_d,
              respuesta_correcta,
              puntaje
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            contenidoId,
            item.pregunta,
            item.opcion_a,
            item.opcion_b,
            item.opcion_c,
            item.opcion_d,
            respuesta,
            Math.max(1, Number(item.puntaje) || 5)
          ]
        )
      }

      await query(
        `
          UPDATE ia_generaciones
          SET estado = 'aprobada', contenido_creado_id = ?
          WHERE id = ?
        `,
        [contenidoId, generacionId]
      )

      await commit()

      return res.json({
        status: "ok",
        mensaje:
          generacion.tipo === "contenido"
            ? "Contenido y preguntas guardados correctamente"
            : "Preguntas agregadas correctamente",
        contenido_id: Number(contenidoId),
        preguntas_agregadas: preguntas.length
      })
    } catch (error) {
      await rollback().catch(() => {})
      return errorIA(res, error, "Error al aprobar la propuesta de IA")
    }
  })

  router.put("/generaciones/:id/descartar", autorizarRoles("maestro"), async (req, res) => {
    try {
      const result = await query(
        `
          UPDATE ia_generaciones
          SET estado = 'descartada'
          WHERE id = ? AND maestro_id = ? AND estado = 'borrador'
        `,
        [req.params.id, req.usuario.id]
      )

      if (!result.affectedRows) {
        return res.status(404).json({
          status: "error",
          mensaje: "No se encontró una propuesta pendiente"
        })
      }

      return res.json({ status: "ok", mensaje: "Propuesta descartada" })
    } catch (error) {
      return errorIA(res, error, "Error al descartar la propuesta")
    }
  })

  // ============================================================
  // ANALISIS DE RENDIMIENTO
  // Se envían resultados académicos, no el nombre del alumno.
  // ============================================================
  router.post("/analizar-alumno", autorizarRoles("maestro"), async (req, res) => {
    const alumnoId = Number(req.body.alumno_id)

    if (!alumnoId) {
      return res.status(400).json({ status: "error", mensaje: "Selecciona un alumno" })
    }

    try {
      const alumnos = await query(
        `
          SELECT id
          FROM usuarios
          WHERE id = ? AND LOWER(TRIM(rol)) = 'alumno'
          LIMIT 1
        `,
        [alumnoId]
      )

      if (!alumnos.length) {
        return res.status(404).json({ status: "error", mensaje: "Alumno no encontrado" })
      }

      const [evaluaciones, tareas, matriculas] = await Promise.all([
        query(
          `
            SELECT
              c.id AS contenido_id,
              c.titulo,
              c.grado,
              i.numero_intento,
              i.porcentaje,
              i.puntaje_obtenido,
              i.puntaje_total,
              i.fecha_fin
            FROM contenidos c
            INNER JOIN intentos_evaluacion i
              ON i.id = (
                SELECT i2.id
                FROM intentos_evaluacion i2
                WHERE i2.usuario_id = ?
                  AND i2.contenido_id = c.id
                  AND i2.estado = 'completado'
                ORDER BY i2.numero_intento DESC, i2.id DESC
                LIMIT 1
              )
            WHERE c.activo = 1
            ORDER BY c.titulo ASC
          `,
          [alumnoId]
        ),
        query(
          `
            SELECT
              t.id AS tarea_id,
              t.titulo,
              t.puntaje_maximo,
              e.calificacion,
              e.estado,
              e.es_tardia,
              e.fecha_entrega,
              CASE
                WHEN e.calificacion IS NOT NULL AND t.puntaje_maximo > 0
                THEN ROUND((e.calificacion / t.puntaje_maximo) * 100, 2)
                ELSE NULL
              END AS porcentaje
            FROM entregas_tarea e
            INNER JOIN tareas t ON t.id = e.tarea_id
            WHERE e.alumno_id = ?
            ORDER BY e.fecha_entrega DESC
          `,
          [alumnoId]
        ),
        query(
          `
            SELECT
              m.periodo_id,
              g.nombre AS grado,
              s.nombre AS seccion,
              p.nombre AS periodo,
              p.anio
            FROM matriculas m
            INNER JOIN grados g ON g.id = m.grado_id
            INNER JOIN secciones s ON s.id = m.seccion_id
            INNER JOIN periodos_academicos p ON p.id = m.periodo_id
            WHERE m.usuario_id = ?
            ORDER BY p.anio DESC, m.id DESC
            LIMIT 1
          `,
          [alumnoId]
        )
      ])

      const evaluacionesNormalizadas = evaluaciones.map((item) => ({
        contenido: item.titulo,
        grado: item.grado,
        intento: Number(item.numero_intento) || 0,
        porcentaje: Math.min(100, Math.max(0, Number(item.porcentaje) || 0))
      }))

      const tareasNormalizadas = tareas.map((item) => ({
        tarea: item.titulo,
        estado: item.estado,
        es_tardia: Boolean(Number(item.es_tardia)),
        porcentaje:
          item.porcentaje === null ? null : Math.min(100, Math.max(0, Number(item.porcentaje)))
      }))

      const porcentajesEvaluacion = evaluacionesNormalizadas.map((x) => x.porcentaje)
      const porcentajesTarea = tareasNormalizadas
        .map((x) => x.porcentaje)
        .filter((x) => x !== null)

      const promedio = (valores) =>
        valores.length
          ? Math.round((valores.reduce((a, b) => a + b, 0) / valores.length) * 100) / 100
          : null

      const promedioEvaluaciones = promedio(porcentajesEvaluacion)
      const promedioTareas = promedio(porcentajesTarea)
      const matricula = matriculas[0] || null

      const datosFuente = {
        perfil_academico: matricula
          ? {
              grado: matricula.grado,
              seccion: matricula.seccion,
              periodo: `${matricula.periodo} ${matricula.anio}`
            }
          : null,
        evaluaciones: evaluacionesNormalizadas,
        tareas: tareasNormalizadas,
        promedio_evaluaciones: promedioEvaluaciones,
        promedio_tareas: promedioTareas
      }

      if (!evaluacionesNormalizadas.length && !tareasNormalizadas.length) {
        return res.status(400).json({
          status: "sin_datos",
          mensaje: "El alumno todavía no tiene suficientes resultados para analizar"
        })
      }

      const ia = await generarEstructurado({
        nombreEsquema: "eco_holistic_analisis_estudiante",
        esquema: esquemaAnalisis,
        maxOutputTokens: 4500,
        instrucciones: `
Actúa como asistente de apoyo para un maestro de Ciencias Naturales de primaria.
Analiza únicamente los datos académicos proporcionados.
No realices diagnósticos médicos, psicológicos ni de discapacidad.
No infieras características sensibles del estudiante.
Identifica patrones académicos, fortalezas, dificultades observables y acciones pedagógicas concretas.
Si los datos son insuficientes, dilo claramente.
Usa un tono profesional y práctico para el docente.
        `.trim(),
        entrada: `
Analiza estos resultados de un estudiante anónimo:
${JSON.stringify(datosFuente, null, 2)}
        `.trim()
      })

      const insert = await query(
        `
          INSERT INTO ia_analisis_estudiante
          (
            alumno_id,
            generado_por,
            periodo_id,
            promedio_evaluaciones,
            promedio_tareas,
            modelo,
            datos_fuente,
            analisis_json
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          alumnoId,
          req.usuario.id,
          matricula?.periodo_id || null,
          promedioEvaluaciones,
          promedioTareas,
          ia.model,
          JSON.stringify(datosFuente),
          JSON.stringify(ia.resultado)
        ]
      )

      return res.status(201).json({
        status: "ok",
        analisis_id: insert.insertId,
        modelo: ia.model,
        datos: datosFuente,
        analisis: ia.resultado
      })
    } catch (error) {
      return errorIA(res, error, "Error al analizar el rendimiento del alumno")
    }
  })

  // ============================================================
  // GENERAR ACTIVIDAD DE REFUERZO A PARTIR DE UN ANALISIS
  // ============================================================
  router.post("/generar-refuerzo", autorizarRoles("maestro"), async (req, res) => {
    const analisisId = Number(req.body.analisis_id)
    const tipo = ["actividad", "cuestionario", "plan_refuerzo"].includes(req.body.tipo)
      ? req.body.tipo
      : "actividad"

    if (!analisisId) {
      return res.status(400).json({ status: "error", mensaje: "analisis_id es obligatorio" })
    }

    try {
      const rows = await query(
        `
          SELECT
            a.id,
            a.alumno_id,
            a.analisis_json,
            a.datos_fuente
          FROM ia_analisis_estudiante a
          WHERE a.id = ? AND a.generado_por = ?
          LIMIT 1
        `,
        [analisisId, req.usuario.id]
      )

      if (!rows.length) {
        return res.status(404).json({ status: "error", mensaje: "Análisis no encontrado" })
      }

      const registro = rows[0]
      const analisis = jsonSeguro(registro.analisis_json, {})
      const datosFuente = jsonSeguro(registro.datos_fuente, {})

      const ia = await generarEstructurado({
        nombreEsquema: "eco_holistic_refuerzo",
        esquema: esquemaRefuerzo,
        maxOutputTokens: 5000,
        instrucciones: `
Eres un asistente pedagógico para Ciencias Naturales de primaria en Guatemala.
Diseña una actividad de refuerzo corta, concreta, apropiada para la edad y basada únicamente en las dificultades académicas observadas.
No hagas diagnósticos ni inferencias sensibles.
Incluye preguntas solo si son útiles para comprobar comprensión.
La actividad será revisada por el maestro antes de aplicarse.
        `.trim(),
        entrada: `
Tipo solicitado: ${tipo}
Datos académicos anónimos:
${JSON.stringify(datosFuente, null, 2)}

Análisis pedagógico previo:
${JSON.stringify(analisis, null, 2)}
        `.trim()
      })

      const insert = await query(
        `
          INSERT INTO ia_recomendaciones
          (
            analisis_id,
            alumno_id,
            generado_por,
            tipo,
            titulo,
            modelo,
            recomendacion_json,
            estado
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, 'pendiente')
        `,
        [
          analisisId,
          registro.alumno_id,
          req.usuario.id,
          tipo,
          ia.resultado.titulo,
          ia.model,
          JSON.stringify(ia.resultado)
        ]
      )

      return res.status(201).json({
        status: "ok",
        recomendacion_id: insert.insertId,
        modelo: ia.model,
        refuerzo: ia.resultado
      })
    } catch (error) {
      return errorIA(res, error, "Error al generar la actividad de refuerzo")
    }
  })

  // ============================================================
  // HISTORIALES
  // ============================================================
  router.get("/historial", autorizarRoles("maestro"), async (req, res) => {
    try {
      const rows = await query(
        `
          SELECT
            g.id,
            g.tipo,
            g.contenido_origen_id,
            g.contenido_creado_id,
            g.grado,
            g.tema,
            g.dificultad,
            g.modelo,
            g.estado,
            g.salida_json,
            g.fecha_creacion
          FROM ia_generaciones g
          WHERE g.maestro_id = ?
          ORDER BY g.id DESC
          LIMIT 50
        `,
        [req.usuario.id]
      )

      return res.json(
        rows.map((row) => ({
          ...row,
          salida_json: jsonSeguro(row.salida_json, null)
        }))
      )
    } catch (error) {
      return errorIA(res, error, "Error al obtener el historial de IA")
    }
  })

  router.get("/analisis/:alumnoId", autorizarRoles("maestro"), async (req, res) => {
    try {
      const rows = await query(
        `
          SELECT
            a.id,
            a.alumno_id,
            u.nombre AS alumno,
            a.promedio_evaluaciones,
            a.promedio_tareas,
            a.modelo,
            a.datos_fuente,
            a.analisis_json,
            a.fecha_creacion
          FROM ia_analisis_estudiante a
          INNER JOIN usuarios u ON u.id = a.alumno_id
          WHERE a.alumno_id = ? AND a.generado_por = ?
          ORDER BY a.id DESC
          LIMIT 20
        `,
        [req.params.alumnoId, req.usuario.id]
      )

      return res.json(
        rows.map((row) => ({
          ...row,
          datos_fuente: jsonSeguro(row.datos_fuente, {}),
          analisis_json: jsonSeguro(row.analisis_json, {})
        }))
      )
    } catch (error) {
      return errorIA(res, error, "Error al obtener los análisis del alumno")
    }
  })

  router.get("/recomendaciones/:alumnoId", autorizarRoles("maestro"), async (req, res) => {
    try {
      const rows = await query(
        `
          SELECT
            id,
            analisis_id,
            tipo,
            titulo,
            modelo,
            recomendacion_json,
            estado,
            fecha_creacion
          FROM ia_recomendaciones
          WHERE alumno_id = ? AND generado_por = ?
          ORDER BY id DESC
          LIMIT 20
        `,
        [req.params.alumnoId, req.usuario.id]
      )

      return res.json(
        rows.map((row) => ({
          ...row,
          recomendacion_json: jsonSeguro(row.recomendacion_json, {})
        }))
      )
    } catch (error) {
      return errorIA(res, error, "Error al obtener las recomendaciones")
    }
  })

  return router
}

module.exports = crearRutasInteligenciaArtificial
