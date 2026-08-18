const express = require("express")
const mysql = require("mysql2")
const cors = require("cors")
require("dotenv").config()

const app = express()

app.use(cors())
app.use(express.json())

// ========================================
// CONEXIÓN A MYSQL
// ========================================

const conexion = mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
})

conexion.connect((err) => {
  if (err) {
    console.log("Error de conexión a MySQL:", err)
  } else {
    console.log("MySQL conectado correctamente")
  }
})

// ========================================
// RUTA DE PRUEBA
// ========================================

app.get("/", (req, res) => {
  res.send("Servidor funcionando correctamente")
})

// ========================================
// LOGIN
// ========================================

app.post("/login", (req, res) => {
  const { usuario, password } = req.body

  if (!usuario || !password) {
    return res.json({
      status: "error",
      mensaje: "Usuario y contraseña son obligatorios"
    })
  }

  const sql = `
    SELECT id, nombre, usuario, rol
    FROM usuarios
    WHERE usuario = ?
      AND password = ?
    LIMIT 1
  `

  conexion.query(sql, [usuario, password], (err, result) => {
    if (err) {
      console.log("Error en login:", err)

      return res.status(500).json({
        status: "error",
        mensaje: "Error en el servidor"
      })
    }

    if (result.length > 0) {
      return res.json({
        status: "ok",
        id: result[0].id,
        nombre: result[0].nombre,
        usuario: result[0].usuario,
        rol: result[0].rol
      })
    }

    return res.json({
      status: "error",
      mensaje: "Usuario o contraseña incorrectos"
    })
  })
})

// ========================================
// USUARIOS
// ========================================

app.post("/usuarios", (req, res) => {
  const { nombre, usuario, password, rol } = req.body

  if (!nombre || !usuario || !password || !rol) {
    return res.json({
      status: "error",
      mensaje: "Todos los campos son obligatorios"
    })
  }

  if (rol !== "alumno" && rol !== "maestro") {
    return res.json({
      status: "error",
      mensaje: "Rol no válido"
    })
  }

  const verificar = "SELECT id FROM usuarios WHERE usuario = ?"

  conexion.query(verificar, [usuario], (err, result) => {
    if (err) {
      console.log("Error al verificar usuario:", err)
      return res.status(500).json({
        status: "error",
        mensaje: "Error en el servidor"
      })
    }

    if (result.length > 0) {
      return res.json({
        status: "error",
        mensaje: "El usuario ya existe"
      })
    }

    const sql = `
      INSERT INTO usuarios(nombre, usuario, password, rol)
      VALUES (?, ?, ?, ?)
    `

    conexion.query(sql, [nombre, usuario, password, rol], (err) => {
      if (err) {
        console.log("Error al crear usuario:", err)
        return res.status(500).json({
          status: "error",
          mensaje: "Error al crear usuario"
        })
      }

      return res.json({
        status: "ok",
        mensaje: "Usuario creado correctamente"
      })
    })
  })
})

app.get("/usuarios", (req, res) => {
  const sql = `
    SELECT id, nombre, usuario, rol
    FROM usuarios
    ORDER BY id DESC
  `

  conexion.query(sql, (err, result) => {
    if (err) {
      console.log("Error al obtener usuarios:", err)
      return res.status(500).json({
        status: "error",
        mensaje: "Error al obtener usuarios"
      })
    }

    return res.json(result)
  })
})

// ========================================
// ALUMNOS
// ========================================

app.post("/alumnos", (req, res) => {
  const { nombre, grado, seccion } = req.body

  if (!nombre || !grado || !seccion) {
    return res.json({
      status: "error",
      mensaje: "Todos los campos son obligatorios"
    })
  }

  const sql = `
    INSERT INTO alumnos(nombre, grado, seccion)
    VALUES (?, ?, ?)
  `

  conexion.query(sql, [nombre, grado, seccion], (err) => {
    if (err) {
      console.log("Error al registrar alumno:", err)
      return res.status(500).json({
        status: "error",
        mensaje: "Error al guardar alumno"
      })
    }

    return res.json({
      status: "ok",
      mensaje: "Alumno registrado correctamente"
    })
  })
})

app.get("/alumnos", (req, res) => {
  const sql = `
    SELECT id, nombre, usuario, rol
    FROM usuarios
    WHERE LOWER(TRIM(rol)) = 'alumno'
    ORDER BY id DESC
  `

  conexion.query(sql, (err, result) => {
    if (err) {
      console.log("Error al obtener alumnos:", err)
      return res.status(500).json({
        status: "error",
        mensaje: "Error al obtener alumnos"
      })
    }

    return res.json(result)
  })
})

// ========================================
// MAESTROS
// ========================================

app.get("/maestros", (req, res) => {
  const sql = `
    SELECT id, nombre, usuario, rol
    FROM usuarios
    WHERE LOWER(TRIM(rol)) = 'maestro'
    ORDER BY id DESC
  `

  conexion.query(sql, (err, result) => {
    if (err) {
      console.log("Error al obtener maestros:", err)
      return res.status(500).json({
        status: "error",
        mensaje: "Error al obtener maestros"
      })
    }

    return res.json(result)
  })
})

// ========================================
// REGISTRO
// ========================================

app.post("/registro", (req, res) => {
  const { nombre, usuario, password } = req.body

  if (!nombre || !usuario || !password) {
    return res.json({
      status: "error",
      mensaje: "Todos los campos son obligatorios"
    })
  }

  const sql = `
    INSERT INTO usuarios(nombre, usuario, password)
    VALUES (?, ?, ?)
  `

  conexion.query(sql, [nombre, usuario, password], (err) => {
    if (err) {
      console.log("Error al registrar usuario:", err)
      return res.status(500).json({
        status: "error",
        mensaje: "Error al registrar usuario"
      })
    }

    return res.json({
      status: "ok",
      mensaje: "Usuario registrado correctamente"
    })
  })
})

// ========================================
// CONTENIDOS
// ========================================

app.post("/contenidos", (req, res) => {
  const { titulo, descripcion, grado } = req.body

  if (!titulo || !descripcion || !grado) {
    return res.json({
      status: "error",
      mensaje: "Todos los campos son obligatorios"
    })
  }

  const sql = `
    INSERT INTO contenidos(titulo, descripcion, grado, activo)
    VALUES (?, ?, ?, 1)
  `

  conexion.query(sql, [titulo, descripcion, grado], (err) => {
    if (err) {
      console.log("Error al crear contenido:", err)
      return res.status(500).json({
        status: "error",
        mensaje: "Error al crear contenido"
      })
    }

    return res.json({
      status: "ok",
      mensaje: "Contenido creado correctamente"
    })
  })
})

// Solo contenidos activos. Esta ruta la usan maestro y alumno.
app.get("/contenidos", (req, res) => {
  const sql = `
    SELECT *
    FROM contenidos
    WHERE activo = 1
    ORDER BY id DESC
  `

  conexion.query(sql, (err, result) => {
    if (err) {
      console.log("Error al obtener contenidos:", err)
      return res.status(500).json({
        status: "error",
        mensaje: "Error al obtener contenidos"
      })
    }

    return res.json(result)
  })
})

app.get("/contenidos/archivados", (req, res) => {
  const sql = `
    SELECT *
    FROM contenidos
    WHERE activo = 0
    ORDER BY id DESC
  `

  conexion.query(sql, (err, result) => {
    if (err) {
      console.log("Error al obtener contenidos archivados:", err)
      return res.status(500).json({
        status: "error",
        mensaje: "Error al obtener contenidos archivados"
      })
    }

    return res.json(result)
  })
})

app.get("/contenidos/:id", (req, res) => {
  const { id } = req.params

  const sql = `
    SELECT *
    FROM contenidos
    WHERE id = ? AND activo = 1
  `

  conexion.query(sql, [id], (err, result) => {
    if (err) {
      console.log("Error al obtener contenido:", err)
      return res.status(500).json({
        status: "error",
        mensaje: "Error al obtener contenido"
      })
    }

    if (result.length === 0) {
      return res.status(404).json({
        status: "error",
        mensaje: "Contenido no encontrado o archivado"
      })
    }

    return res.json(result[0])
  })
})

// "Eliminar" conserva el historial: se archiva el contenido.
app.delete("/contenidos/:id", (req, res) => {
  const { id } = req.params

  const sql = `
    UPDATE contenidos
    SET activo = 0
    WHERE id = ? AND activo = 1
  `

  conexion.query(sql, [id], (err, result) => {
    if (err) {
      console.log("Error al archivar contenido:", err)
      return res.status(500).json({
        status: "error",
        mensaje: "Error al eliminar contenido"
      })
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: "error",
        mensaje: "Contenido no encontrado"
      })
    }

    return res.json({
      status: "ok",
      mensaje: "Contenido eliminado de los módulos activos. El historial se conservó."
    })
  })
})

app.put("/contenidos/:id/restaurar", (req, res) => {
  const { id } = req.params

  const sql = `
    UPDATE contenidos
    SET activo = 1
    WHERE id = ? AND activo = 0
  `

  conexion.query(sql, [id], (err, result) => {
    if (err) {
      console.log("Error al restaurar contenido:", err)
      return res.status(500).json({
        status: "error",
        mensaje: "Error al restaurar contenido"
      })
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: "error",
        mensaje: "Contenido archivado no encontrado"
      })
    }

    return res.json({
      status: "ok",
      mensaje: "Contenido restaurado correctamente"
    })
  })
})

// ========================================
// PREGUNTAS
// ========================================

app.post("/preguntas", (req, res) => {
  const {
    contenido_id,
    pregunta,
    opcion_a,
    opcion_b,
    opcion_c,
    opcion_d,
    respuesta_correcta,
    puntaje
  } = req.body

  if (
    !contenido_id ||
    !pregunta ||
    !opcion_a ||
    !opcion_b ||
    !opcion_c ||
    !opcion_d ||
    !respuesta_correcta ||
    puntaje === undefined ||
    puntaje === null
  ) {
    return res.json({
      status: "error",
      mensaje: "Todos los campos son obligatorios"
    })
  }

  const respuesta = respuesta_correcta.toString().trim().toUpperCase()

  if (!["A", "B", "C", "D"].includes(respuesta)) {
    return res.json({
      status: "error",
      mensaje: "La respuesta correcta debe ser A, B, C o D"
    })
  }

  const sql = `
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
  `

  conexion.query(
    sql,
    [
      contenido_id,
      pregunta,
      opcion_a,
      opcion_b,
      opcion_c,
      opcion_d,
      respuesta,
      puntaje
    ],
    (err) => {
      if (err) {
        console.log("Error al crear pregunta:", err)
        return res.status(500).json({
          status: "error",
          mensaje: "Error al crear pregunta"
        })
      }

      return res.json({
        status: "ok",
        mensaje: "Pregunta creada correctamente"
      })
    }
  )
})

app.get("/contenidos/:id/preguntas", (req, res) => {
  const { id } = req.params

  const sql = `
    SELECT
      id,
      contenido_id,
      pregunta,
      opcion_a,
      opcion_b,
      opcion_c,
      opcion_d,
      respuesta_correcta,
      puntaje
    FROM preguntas
    WHERE contenido_id = ?
    ORDER BY id ASC
  `

  conexion.query(sql, [id], (err, result) => {
    if (err) {
      console.log("Error al obtener preguntas del contenido:", err)
      return res.status(500).json({
        status: "error",
        mensaje: "Error al obtener preguntas"
      })
    }

    return res.json(result)
  })
})

app.put("/preguntas/:id", (req, res) => {
  const { id } = req.params
  const {
    pregunta,
    opcion_a,
    opcion_b,
    opcion_c,
    opcion_d,
    respuesta_correcta,
    puntaje
  } = req.body

  if (
    !pregunta ||
    !opcion_a ||
    !opcion_b ||
    !opcion_c ||
    !opcion_d ||
    !respuesta_correcta ||
    puntaje === undefined ||
    puntaje === null
  ) {
    return res.status(400).json({
      status: "error",
      mensaje: "Todos los campos son obligatorios"
    })
  }

  const respuesta = respuesta_correcta.toString().trim().toUpperCase()

  if (!["A", "B", "C", "D"].includes(respuesta)) {
    return res.status(400).json({
      status: "error",
      mensaje: "La respuesta correcta debe ser A, B, C o D"
    })
  }

  const sql = `
    UPDATE preguntas
    SET
      pregunta = ?,
      opcion_a = ?,
      opcion_b = ?,
      opcion_c = ?,
      opcion_d = ?,
      respuesta_correcta = ?,
      puntaje = ?
    WHERE id = ?
  `

  conexion.query(
    sql,
    [
      pregunta,
      opcion_a,
      opcion_b,
      opcion_c,
      opcion_d,
      respuesta,
      puntaje,
      id
    ],
    (err, result) => {
      if (err) {
        console.log("Error al actualizar pregunta:", err)
        return res.status(500).json({
          status: "error",
          mensaje: "Error al actualizar pregunta"
        })
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          status: "error",
          mensaje: "Pregunta no encontrada"
        })
      }

      return res.json({
        status: "ok",
        mensaje: "Pregunta actualizada correctamente"
      })
    }
  )
})

// ========================================
// INTENTOS Y PROGRESO DEL ESTUDIANTE
// ========================================

function obtenerRespuestasIntento(intentoId, callback) {
  const sql = `
    SELECT pregunta_id, respuesta_seleccionada
    FROM respuestas_estudiante
    WHERE intento_id = ?
    ORDER BY pregunta_id
  `

  conexion.query(sql, [intentoId], callback)
}

function crearIntento(usuarioId, contenidoId, numeroIntento, stats, callback) {
  const sql = `
    INSERT INTO intentos_evaluacion
    (
      usuario_id,
      contenido_id,
      numero_intento,
      estado,
      preguntas_totales,
      preguntas_respondidas,
      puntaje_obtenido,
      puntaje_total,
      porcentaje,
      reintento_habilitado
    )
    VALUES (?, ?, ?, 'en_progreso', ?, 0, 0, ?, 0, 0)
  `

  conexion.query(
    sql,
    [usuarioId, contenidoId, numeroIntento, stats.preguntas_totales, stats.puntaje_total],
    (err, result) => {
      if (err) return callback(err)

      callback(null, {
        id: result.insertId,
        usuario_id: Number(usuarioId),
        contenido_id: Number(contenidoId),
        numero_intento: numeroIntento,
        estado: "en_progreso",
        preguntas_totales: stats.preguntas_totales,
        preguntas_respondidas: 0,
        puntaje_obtenido: 0,
        puntaje_total: stats.puntaje_total,
        porcentaje: 0,
        reintento_habilitado: 0
      })
    }
  )
}

// Inicia, reanuda o bloquea un intento.
app.post("/intentos/iniciar", (req, res) => {
  const { usuario_id, contenido_id } = req.body

  if (!usuario_id || !contenido_id) {
    return res.status(400).json({
      status: "error",
      mensaje: "usuario_id y contenido_id son obligatorios"
    })
  }

  const sqlStats = `
    SELECT
      c.id,
      COUNT(p.id) AS preguntas_totales,
      COALESCE(SUM(p.puntaje), 0) AS puntaje_total
    FROM contenidos c
    LEFT JOIN preguntas p ON p.contenido_id = c.id
    WHERE c.id = ? AND c.activo = 1
    GROUP BY c.id
  `

  conexion.query(sqlStats, [contenido_id], (err, statsRows) => {
    if (err) {
      console.log("Error al preparar intento:", err)
      return res.status(500).json({ status: "error", mensaje: "Error al preparar actividad" })
    }

    if (statsRows.length === 0) {
      return res.status(404).json({ status: "error", mensaje: "Contenido no encontrado o archivado" })
    }

    const stats = {
      preguntas_totales: Number(statsRows[0].preguntas_totales) || 0,
      puntaje_total: Number(statsRows[0].puntaje_total) || 0
    }

    if (stats.preguntas_totales === 0) {
      return res.status(400).json({
        status: "sin_preguntas",
        mensaje: "Este contenido todavía no tiene preguntas"
      })
    }

    const sqlUltimo = `
      SELECT *
      FROM intentos_evaluacion
      WHERE usuario_id = ? AND contenido_id = ?
      ORDER BY numero_intento DESC
      LIMIT 1
    `

    conexion.query(sqlUltimo, [usuario_id, contenido_id], (err, intentos) => {
      if (err) {
        console.log("Error al consultar intento:", err)
        return res.status(500).json({ status: "error", mensaje: "Error al consultar el intento" })
      }

      const ultimo = intentos[0]

      if (!ultimo) {
        return crearIntento(usuario_id, contenido_id, 1, stats, (err, intento) => {
          if (err) {
            console.log("Error al crear intento:", err)
            return res.status(500).json({ status: "error", mensaje: "Error al iniciar la actividad" })
          }

          return res.json({ status: "ok", intento, respuestas: [] })
        })
      }

      if (ultimo.estado === "en_progreso") {
        return obtenerRespuestasIntento(ultimo.id, (err, respuestas) => {
          if (err) {
            console.log("Error al obtener respuestas guardadas:", err)
            return res.status(500).json({ status: "error", mensaje: "Error al recuperar el progreso" })
          }

          return res.json({
            status: "ok",
            intento: ultimo,
            respuestas
          })
        })
      }

      if (!Number(ultimo.reintento_habilitado)) {
        return res.status(403).json({
          status: "bloqueado",
          mensaje: "Ya completaste esta actividad. Tu maestro debe habilitar un nuevo intento.",
          intento: ultimo
        })
      }

      conexion.beginTransaction((transactionError) => {
        if (transactionError) {
          return res.status(500).json({ status: "error", mensaje: "No se pudo iniciar el nuevo intento" })
        }

        conexion.query(
          "UPDATE intentos_evaluacion SET reintento_habilitado = 0 WHERE id = ?",
          [ultimo.id],
          (err) => {
            if (err) {
              return conexion.rollback(() => {
                res.status(500).json({ status: "error", mensaje: "No se pudo habilitar el nuevo intento" })
              })
            }

            crearIntento(
              usuario_id,
              contenido_id,
              Number(ultimo.numero_intento) + 1,
              stats,
              (err, intento) => {
                if (err) {
                  return conexion.rollback(() => {
                    res.status(500).json({ status: "error", mensaje: "No se pudo crear el nuevo intento" })
                  })
                }

                conexion.commit((commitError) => {
                  if (commitError) {
                    return conexion.rollback(() => {
                      res.status(500).json({ status: "error", mensaje: "No se pudo confirmar el nuevo intento" })
                    })
                  }

                  return res.json({ status: "ok", intento, respuestas: [] })
                })
              }
            )
          }
        )
      })
    })
  })
})

// Guarda/actualiza una respuesta mientras el intento está en progreso.
app.put("/intentos/:id/respuesta", (req, res) => {
  const { id } = req.params
  const { pregunta_id, respuesta_seleccionada } = req.body

  const respuesta = respuesta_seleccionada?.toString().trim().toUpperCase()

  if (!pregunta_id || !["A", "B", "C", "D"].includes(respuesta)) {
    return res.status(400).json({
      status: "error",
      mensaje: "Pregunta y respuesta válida son obligatorias"
    })
  }

  const sqlIntento = `
    SELECT *
    FROM intentos_evaluacion
    WHERE id = ? AND estado = 'en_progreso'
    LIMIT 1
  `

  conexion.query(sqlIntento, [id], (err, intentos) => {
    if (err) {
      return res.status(500).json({ status: "error", mensaje: "Error al consultar el intento" })
    }

    if (intentos.length === 0) {
      return res.status(409).json({ status: "error", mensaje: "El intento ya no está disponible para responder" })
    }

    const intento = intentos[0]

    const sqlPregunta = `
      SELECT id, respuesta_correcta, puntaje
      FROM preguntas
      WHERE id = ? AND contenido_id = ?
      LIMIT 1
    `

    conexion.query(sqlPregunta, [pregunta_id, intento.contenido_id], (err, preguntas) => {
      if (err) {
        return res.status(500).json({ status: "error", mensaje: "Error al consultar la pregunta" })
      }

      if (preguntas.length === 0) {
        return res.status(404).json({ status: "error", mensaje: "Pregunta no encontrada" })
      }

      const pregunta = preguntas[0]
      const correcta = pregunta.respuesta_correcta.toString().trim().toUpperCase() === respuesta
      const puntos = correcta ? Number(pregunta.puntaje) || 1 : 0

      const sqlRespuesta = `
        INSERT INTO respuestas_estudiante
        (
          intento_id,
          pregunta_id,
          respuesta_seleccionada,
          es_correcta,
          puntaje_obtenido
        )
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          respuesta_seleccionada = VALUES(respuesta_seleccionada),
          es_correcta = VALUES(es_correcta),
          puntaje_obtenido = VALUES(puntaje_obtenido),
          fecha_respuesta = CURRENT_TIMESTAMP
      `

      conexion.query(
        sqlRespuesta,
        [id, pregunta_id, respuesta, correcta ? 1 : 0, puntos],
        (err) => {
          if (err) {
            console.log("Error al guardar respuesta:", err)
            return res.status(500).json({ status: "error", mensaje: "Error al guardar la respuesta" })
          }

          const sqlResumen = `
            SELECT
              COUNT(*) AS preguntas_respondidas,
              COALESCE(SUM(puntaje_obtenido), 0) AS puntaje_obtenido
            FROM respuestas_estudiante
            WHERE intento_id = ?
          `

          conexion.query(sqlResumen, [id], (err, resumenRows) => {
            if (err) {
              return res.status(500).json({ status: "error", mensaje: "Respuesta guardada, pero no se pudo actualizar el progreso" })
            }

            const preguntasRespondidas = Number(resumenRows[0].preguntas_respondidas) || 0
            const puntajeObtenido = Number(resumenRows[0].puntaje_obtenido) || 0

            conexion.query(
              `UPDATE intentos_evaluacion
               SET preguntas_respondidas = ?, puntaje_obtenido = ?
               WHERE id = ?`,
              [preguntasRespondidas, puntajeObtenido, id],
              (err) => {
                if (err) {
                  return res.status(500).json({ status: "error", mensaje: "Respuesta guardada, pero no se pudo actualizar el progreso" })
                }

                return res.json({
                  status: "ok",
                  preguntas_respondidas: preguntasRespondidas,
                  preguntas_totales: Number(intento.preguntas_totales),
                  puntaje_obtenido: puntajeObtenido
                })
              }
            )
          })
        }
      )
    })
  })
})

// Finaliza definitivamente el intento actual.
app.post("/intentos/:id/finalizar", (req, res) => {
  const { id } = req.params

  const sql = `
    SELECT
      i.*,
      COUNT(r.id) AS respuestas_guardadas,
      COALESCE(SUM(r.puntaje_obtenido), 0) AS puntos_calculados
    FROM intentos_evaluacion i
    LEFT JOIN respuestas_estudiante r ON r.intento_id = i.id
    WHERE i.id = ? AND i.estado = 'en_progreso'
    GROUP BY i.id
  `

  conexion.query(sql, [id], (err, rows) => {
    if (err) {
      console.log("Error al finalizar intento:", err)
      return res.status(500).json({ status: "error", mensaje: "Error al finalizar la actividad" })
    }

    if (rows.length === 0) {
      return res.status(409).json({ status: "error", mensaje: "Este intento ya fue finalizado o no existe" })
    }

    const intento = rows[0]
    const respondidas = Number(intento.respuestas_guardadas) || 0
    const totalPreguntas = Number(intento.preguntas_totales) || 0

    if (respondidas < totalPreguntas) {
      return res.status(400).json({
        status: "error",
        mensaje: `Faltan ${totalPreguntas - respondidas} pregunta(s) por responder`
      })
    }

    const puntos = Number(intento.puntos_calculados) || 0
    const totalPuntos = Number(intento.puntaje_total) || 0
    const porcentaje = totalPuntos > 0 ? Math.round((puntos / totalPuntos) * 10000) / 100 : 0

    const sqlUpdate = `
      UPDATE intentos_evaluacion
      SET
        estado = 'completado',
        preguntas_respondidas = ?,
        puntaje_obtenido = ?,
        porcentaje = ?,
        reintento_habilitado = 0,
        fecha_fin = CURRENT_TIMESTAMP
      WHERE id = ?
    `

    conexion.query(sqlUpdate, [respondidas, puntos, porcentaje, id], (err) => {
      if (err) {
        return res.status(500).json({ status: "error", mensaje: "Error al guardar el resultado final" })
      }

      return res.json({
        status: "ok",
        resultado: {
          intento_id: Number(id),
          numero_intento: Number(intento.numero_intento),
          preguntas_totales: totalPreguntas,
          preguntas_respondidas: respondidas,
          puntaje_obtenido: puntos,
          puntaje_total: totalPuntos,
          porcentaje
        }
      })
    })
  })
})

// Progreso que verá el estudiante en su panel.
app.get("/alumnos/:usuarioId/progreso", (req, res) => {
  const { usuarioId } = req.params

  const sql = `
    SELECT
      c.id,
      c.titulo,
      c.descripcion,
      c.grado,
      (SELECT COUNT(*) FROM preguntas p WHERE p.contenido_id = c.id) AS total_preguntas,
      i.id AS intento_id,
      i.numero_intento,
      i.estado,
      i.preguntas_totales,
      i.preguntas_respondidas,
      i.puntaje_obtenido,
      i.puntaje_total,
      i.porcentaje,
      i.reintento_habilitado,
      i.fecha_inicio,
      i.fecha_fin
    FROM contenidos c
    LEFT JOIN intentos_evaluacion i
      ON i.id = (
        SELECT i2.id
        FROM intentos_evaluacion i2
        WHERE i2.usuario_id = ?
          AND i2.contenido_id = c.id
        ORDER BY i2.numero_intento DESC
        LIMIT 1
      )
    WHERE c.activo = 1
    ORDER BY c.id DESC
  `

  conexion.query(sql, [usuarioId], (err, result) => {
    if (err) {
      console.log("Error al obtener progreso del alumno:", err)
      return res.status(500).json({ status: "error", mensaje: "Error al obtener el progreso" })
    }

    const datos = result.map((item) => ({
      ...item,
      estado: item.intento_id ? item.estado : "sin_iniciar",
      puede_reintentar: item.intento_id && item.estado === "completado"
        ? Boolean(Number(item.reintento_habilitado))
        : true
    }))

    return res.json(datos)
  })
})

// ========================================
// SEGUIMIENTO DEL MAESTRO
// ========================================

app.get("/seguimiento", (req, res) => {
  const sql = `
    SELECT
      u.id AS usuario_id,
      u.nombre AS alumno,
      u.usuario,
      c.id AS contenido_id,
      c.titulo,
      c.grado,
      (SELECT COUNT(*) FROM preguntas p WHERE p.contenido_id = c.id) AS total_preguntas_contenido,
      i.id AS intento_id,
      i.numero_intento,
      i.estado,
      i.preguntas_totales,
      i.preguntas_respondidas,
      i.puntaje_obtenido,
      i.puntaje_total,
      i.porcentaje,
      i.reintento_habilitado,
      i.fecha_inicio,
      i.fecha_fin
    FROM usuarios u
    CROSS JOIN contenidos c
    LEFT JOIN intentos_evaluacion i
      ON i.id = (
        SELECT i2.id
        FROM intentos_evaluacion i2
        WHERE i2.usuario_id = u.id
          AND i2.contenido_id = c.id
        ORDER BY i2.numero_intento DESC
        LIMIT 1
      )
    WHERE LOWER(TRIM(u.rol)) = 'alumno'
      AND c.activo = 1
    ORDER BY c.titulo, u.nombre
  `

  conexion.query(sql, (err, result) => {
    if (err) {
      console.log("Error al obtener seguimiento:", err)
      return res.status(500).json({ status: "error", mensaje: "Error al obtener seguimiento" })
    }

    const datos = result.map((item) => ({
      ...item,
      estado: item.intento_id ? item.estado : "sin_iniciar",
      preguntas_totales: Number(item.preguntas_totales) || Number(item.total_preguntas_contenido) || 0,
      preguntas_respondidas: Number(item.preguntas_respondidas) || 0,
      puntaje_obtenido: Number(item.puntaje_obtenido) || 0,
      puntaje_total: Number(item.puntaje_total) || 0,
      porcentaje: Number(item.porcentaje) || 0,
      numero_intento: Number(item.numero_intento) || 0,
      reintento_habilitado: Boolean(Number(item.reintento_habilitado))
    }))

    return res.json(datos)
  })
})

app.put("/seguimiento/:intentoId/habilitar-reintento", (req, res) => {
  const { intentoId } = req.params

  const sql = `
    UPDATE intentos_evaluacion
    SET reintento_habilitado = 1
    WHERE id = ? AND estado = 'completado'
  `

  conexion.query(sql, [intentoId], (err, result) => {
    if (err) {
      console.log("Error al habilitar reintento:", err)
      return res.status(500).json({ status: "error", mensaje: "Error al habilitar el reintento" })
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: "error",
        mensaje: "No se encontró un intento completado para habilitar"
      })
    }

    return res.json({
      status: "ok",
      mensaje: "Nuevo intento habilitado correctamente"
    })
  })
})

// ========================================
// SERVIDOR
// ========================================

const PORT = process.env.PORT || 3001

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor corriendo en puerto ${PORT}`)
})
