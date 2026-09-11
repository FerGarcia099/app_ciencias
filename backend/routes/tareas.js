const express = require("express")

function crearRutasTareas({ conexion, autorizarRoles }) {
  const router = express.Router()

  const query = (sql, params = []) =>
    new Promise((resolve, reject) => {
      conexion.query(sql, params, (err, rows) => {
        if (err) return reject(err)
        resolve(rows)
      })
    })

  const responderError = (res, error, mensaje) => {
    console.log(mensaje, error)

    if (error?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        status: "error",
        mensaje: "Ya existe un registro con esos datos"
      })
    }

    return res.status(500).json({
      status: "error",
      mensaje
    })
  }

  const normalizarEstadoTarea = (estado) =>
    ["borrador", "publicada", "cerrada", "archivada"].includes(estado)
      ? estado
      : "borrador"

  const normalizarFechaMysql = (valor) => {
    if (!valor) return null
    const texto = valor.toString().trim().replace("T", " ")
    return texto.length === 16 ? `${texto}:00` : texto.slice(0, 19)
  }

  // ============================================================
  // OPCIONES PARA CREAR TAREAS - MAESTRO
  // ============================================================
  router.get("/opciones", autorizarRoles("maestro"), async (req, res) => {
    try {
      const [asignaciones, contenidos] = await Promise.all([
        query(
          `
            SELECT
              a.id,
              c.nombre AS curso,
              g.nombre AS grado,
              s.nombre AS seccion,
              p.nombre AS periodo,
              p.anio
            FROM asignaciones_docente a
            INNER JOIN cursos c ON c.id = a.curso_id
            INNER JOIN grados g ON g.id = a.grado_id
            INNER JOIN secciones s ON s.id = a.seccion_id
            INNER JOIN periodos_academicos p ON p.id = a.periodo_id
            WHERE a.maestro_id = ?
              AND a.activo = 1
            ORDER BY p.anio DESC, g.orden ASC, s.nombre ASC, c.nombre ASC
          `,
          [req.usuario.id]
        ),
        query(`
          SELECT id, titulo, grado
          FROM contenidos
          WHERE activo = 1
          ORDER BY titulo ASC
        `)
      ])

      return res.json({ asignaciones, contenidos })
    } catch (error) {
      return responderError(res, error, "Error al cargar las opciones de tareas")
    }
  })

  // ============================================================
  // LISTADO DE TAREAS DEL MAESTRO
  // ============================================================
  router.get("/", autorizarRoles("maestro"), async (req, res) => {
    try {
      const rows = await query(
        `
          SELECT
            t.id,
            t.asignacion_docente_id,
            t.contenido_id,
            t.titulo,
            t.descripcion,
            t.instrucciones,
            t.fecha_publicacion,
            t.fecha_limite,
            t.puntaje_maximo,
            t.estado,
            t.fecha_creacion,
            co.titulo AS contenido,
            c.nombre AS curso,
            g.nombre AS grado,
            s.nombre AS seccion,
            p.nombre AS periodo,
            p.anio,
            COUNT(e.id) AS entregas,
            SUM(CASE WHEN e.estado = 'calificada' THEN 1 ELSE 0 END) AS calificadas
          FROM tareas t
          INNER JOIN asignaciones_docente a ON a.id = t.asignacion_docente_id
          INNER JOIN cursos c ON c.id = a.curso_id
          INNER JOIN grados g ON g.id = a.grado_id
          INNER JOIN secciones s ON s.id = a.seccion_id
          INNER JOIN periodos_academicos p ON p.id = a.periodo_id
          LEFT JOIN contenidos co ON co.id = t.contenido_id
          LEFT JOIN entregas_tarea e ON e.tarea_id = t.id
          WHERE t.creado_por = ?
            AND t.estado <> 'archivada'
          GROUP BY
            t.id,
            t.asignacion_docente_id,
            t.contenido_id,
            t.titulo,
            t.descripcion,
            t.instrucciones,
            t.fecha_publicacion,
            t.fecha_limite,
            t.puntaje_maximo,
            t.estado,
            t.fecha_creacion,
            co.titulo,
            c.nombre,
            g.nombre,
            s.nombre,
            p.nombre,
            p.anio
          ORDER BY t.fecha_creacion DESC, t.id DESC
        `,
        [req.usuario.id]
      )

      return res.json(
        rows.map((row) => ({
          ...row,
          puntaje_maximo: Number(row.puntaje_maximo) || 0,
          entregas: Number(row.entregas) || 0,
          calificadas: Number(row.calificadas) || 0
        }))
      )
    } catch (error) {
      return responderError(res, error, "Error al obtener las tareas")
    }
  })

  // ============================================================
  // CREAR TAREA - MAESTRO
  // ============================================================
  router.post("/", autorizarRoles("maestro"), async (req, res) => {
    try {
      const asignacionId = Number(req.body.asignacion_docente_id)
      const contenidoId = req.body.contenido_id ? Number(req.body.contenido_id) : null
      const titulo = req.body.titulo?.trim()
      const descripcion = req.body.descripcion?.trim()
      const instrucciones = req.body.instrucciones?.trim() || null
      const fechaPublicacion = normalizarFechaMysql(req.body.fecha_publicacion) || new Date().toISOString().slice(0, 19).replace("T", " ")
      const fechaLimite = normalizarFechaMysql(req.body.fecha_limite)
      const puntajeMaximo = Number(req.body.puntaje_maximo)
      const estado = normalizarEstadoTarea(req.body.estado)

      if (!asignacionId || !titulo || !descripcion || !Number.isFinite(puntajeMaximo) || puntajeMaximo <= 0) {
        return res.status(400).json({
          status: "error",
          mensaje: "Asignación, título, descripción y puntaje son obligatorios"
        })
      }

      if (fechaLimite && new Date(fechaLimite.replace(" ", "T")) < new Date(fechaPublicacion.replace(" ", "T"))) {
        return res.status(400).json({
          status: "error",
          mensaje: "La fecha límite no puede ser anterior a la fecha de publicación"
        })
      }

      const asignacion = await query(
        `
          SELECT id
          FROM asignaciones_docente
          WHERE id = ? AND maestro_id = ? AND activo = 1
          LIMIT 1
        `,
        [asignacionId, req.usuario.id]
      )

      if (!asignacion.length) {
        return res.status(403).json({
          status: "error",
          mensaje: "La asignación docente seleccionada no es válida"
        })
      }

      if (contenidoId) {
        const contenido = await query(
          "SELECT id FROM contenidos WHERE id = ? AND activo = 1 LIMIT 1",
          [contenidoId]
        )

        if (!contenido.length) {
          return res.status(400).json({
            status: "error",
            mensaje: "El contenido seleccionado no es válido"
          })
        }
      }

      const result = await query(
        `
          INSERT INTO tareas
          (
            asignacion_docente_id,
            contenido_id,
            creado_por,
            titulo,
            descripcion,
            instrucciones,
            fecha_publicacion,
            fecha_limite,
            puntaje_maximo,
            estado
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          asignacionId,
          contenidoId,
          req.usuario.id,
          titulo,
          descripcion,
          instrucciones,
          fechaPublicacion,
          fechaLimite,
          puntajeMaximo,
          estado
        ]
      )

      return res.status(201).json({
        status: "ok",
        mensaje: "Tarea creada correctamente",
        id: result.insertId
      })
    } catch (error) {
      return responderError(res, error, "Error al crear la tarea")
    }
  })

  // ============================================================
  // ACTUALIZAR TAREA - MAESTRO
  // ============================================================
  router.put("/:id", autorizarRoles("maestro"), async (req, res) => {
    try {
      const tareaId = Number(req.params.id)
      const asignacionId = Number(req.body.asignacion_docente_id)
      const contenidoId = req.body.contenido_id ? Number(req.body.contenido_id) : null
      const titulo = req.body.titulo?.trim()
      const descripcion = req.body.descripcion?.trim()
      const instrucciones = req.body.instrucciones?.trim() || null
      const fechaPublicacion = normalizarFechaMysql(req.body.fecha_publicacion)
      const fechaLimite = normalizarFechaMysql(req.body.fecha_limite)
      const puntajeMaximo = Number(req.body.puntaje_maximo)
      const estado = normalizarEstadoTarea(req.body.estado)

      if (!tareaId || !asignacionId || !titulo || !descripcion || !fechaPublicacion || !Number.isFinite(puntajeMaximo) || puntajeMaximo <= 0) {
        return res.status(400).json({
          status: "error",
          mensaje: "Completa los campos obligatorios de la tarea"
        })
      }

      if (fechaLimite && new Date(fechaLimite.replace(" ", "T")) < new Date(fechaPublicacion.replace(" ", "T"))) {
        return res.status(400).json({
          status: "error",
          mensaje: "La fecha límite no puede ser anterior a la publicación"
        })
      }

      const asignacion = await query(
        `SELECT id FROM asignaciones_docente WHERE id = ? AND maestro_id = ? AND activo = 1 LIMIT 1`,
        [asignacionId, req.usuario.id]
      )

      if (!asignacion.length) {
        return res.status(403).json({ status: "error", mensaje: "Asignación docente no válida" })
      }

      const result = await query(
        `
          UPDATE tareas
          SET asignacion_docente_id = ?, contenido_id = ?, titulo = ?, descripcion = ?,
              instrucciones = ?, fecha_publicacion = ?, fecha_limite = ?,
              puntaje_maximo = ?, estado = ?
          WHERE id = ? AND creado_por = ? AND estado <> 'archivada'
        `,
        [
          asignacionId,
          contenidoId,
          titulo,
          descripcion,
          instrucciones,
          fechaPublicacion,
          fechaLimite,
          puntajeMaximo,
          estado,
          tareaId,
          req.usuario.id
        ]
      )

      if (!result.affectedRows) {
        return res.status(404).json({ status: "error", mensaje: "Tarea no encontrada" })
      }

      return res.json({ status: "ok", mensaje: "Tarea actualizada correctamente" })
    } catch (error) {
      return responderError(res, error, "Error al actualizar la tarea")
    }
  })

  // ============================================================
  // CAMBIAR ESTADO DE TAREA - MAESTRO
  // ============================================================
  router.put("/:id/estado", autorizarRoles("maestro"), async (req, res) => {
    try {
      const estado = req.body.estado

      if (!["borrador", "publicada", "cerrada"].includes(estado)) {
        return res.status(400).json({ status: "error", mensaje: "Estado de tarea no válido" })
      }

      const result = await query(
        "UPDATE tareas SET estado = ? WHERE id = ? AND creado_por = ? AND estado <> 'archivada'",
        [estado, req.params.id, req.usuario.id]
      )

      if (!result.affectedRows) {
        return res.status(404).json({ status: "error", mensaje: "Tarea no encontrada" })
      }

      return res.json({ status: "ok", mensaje: "Estado actualizado correctamente" })
    } catch (error) {
      return responderError(res, error, "Error al cambiar el estado de la tarea")
    }
  })

  // ============================================================
  // ARCHIVAR TAREA - MAESTRO
  // ============================================================
  router.delete("/:id", autorizarRoles("maestro"), async (req, res) => {
    try {
      const result = await query(
        "UPDATE tareas SET estado = 'archivada' WHERE id = ? AND creado_por = ?",
        [req.params.id, req.usuario.id]
      )

      if (!result.affectedRows) {
        return res.status(404).json({ status: "error", mensaje: "Tarea no encontrada" })
      }

      return res.json({ status: "ok", mensaje: "Tarea archivada correctamente" })
    } catch (error) {
      return responderError(res, error, "Error al archivar la tarea")
    }
  })

  // ============================================================
  // ENTREGAS DE UNA TAREA - MAESTRO
  // Incluye alumnos pendientes aunque todavía no exista entrega.
  // ============================================================
  router.get("/:id/entregas", autorizarRoles("maestro"), async (req, res) => {
    try {
      const tarea = await query(
        `
          SELECT
            t.id,
            t.titulo,
            t.puntaje_maximo,
            t.estado,
            c.nombre AS curso,
            g.nombre AS grado,
            s.nombre AS seccion,
            p.nombre AS periodo,
            p.anio,
            a.grado_id,
            a.seccion_id,
            a.periodo_id
          FROM tareas t
          INNER JOIN asignaciones_docente a ON a.id = t.asignacion_docente_id
          INNER JOIN cursos c ON c.id = a.curso_id
          INNER JOIN grados g ON g.id = a.grado_id
          INNER JOIN secciones s ON s.id = a.seccion_id
          INNER JOIN periodos_academicos p ON p.id = a.periodo_id
          WHERE t.id = ? AND t.creado_por = ? AND t.estado <> 'archivada'
          LIMIT 1
        `,
        [req.params.id, req.usuario.id]
      )

      if (!tarea.length) {
        return res.status(404).json({ status: "error", mensaje: "Tarea no encontrada" })
      }

      const t = tarea[0]
      const entregas = await query(
        `
          SELECT
            u.id AS alumno_id,
            u.nombre AS alumno,
            u.usuario,
            e.id AS entrega_id,
            e.respuesta_texto,
            e.url_entrega,
            e.fecha_entrega,
            e.es_tardia,
            COALESCE(e.estado, 'pendiente') AS estado,
            e.calificacion,
            e.observaciones_maestro,
            e.fecha_calificacion
          FROM matriculas m
          INNER JOIN usuarios u ON u.id = m.usuario_id
          LEFT JOIN entregas_tarea e
            ON e.alumno_id = u.id
            AND e.tarea_id = ?
          WHERE m.grado_id = ?
            AND m.seccion_id = ?
            AND m.periodo_id = ?
            AND m.estado = 'activo'
            AND LOWER(TRIM(u.rol)) = 'alumno'
          ORDER BY u.nombre ASC
        `,
        [req.params.id, t.grado_id, t.seccion_id, t.periodo_id]
      )

      return res.json({
        tarea: {
          ...t,
          puntaje_maximo: Number(t.puntaje_maximo) || 0
        },
        entregas: entregas.map((row) => ({
          ...row,
          es_tardia: Boolean(Number(row.es_tardia)),
          calificacion: row.calificacion === null ? null : Number(row.calificacion)
        }))
      })
    } catch (error) {
      return responderError(res, error, "Error al obtener las entregas")
    }
  })

  // ============================================================
  // CALIFICAR ENTREGA - MAESTRO
  // ============================================================
  router.put("/entregas/:entregaId/calificar", autorizarRoles("maestro"), async (req, res) => {
    try {
      const calificacion = Number(req.body.calificacion)
      const observaciones = req.body.observaciones_maestro?.trim() || null

      const rows = await query(
        `
          SELECT e.id, t.puntaje_maximo
          FROM entregas_tarea e
          INNER JOIN tareas t ON t.id = e.tarea_id
          WHERE e.id = ? AND t.creado_por = ?
          LIMIT 1
        `,
        [req.params.entregaId, req.usuario.id]
      )

      if (!rows.length) {
        return res.status(404).json({ status: "error", mensaje: "Entrega no encontrada" })
      }

      const maximo = Number(rows[0].puntaje_maximo) || 0

      if (!Number.isFinite(calificacion) || calificacion < 0 || calificacion > maximo) {
        return res.status(400).json({
          status: "error",
          mensaje: `La calificación debe estar entre 0 y ${maximo}`
        })
      }

      await query(
        `
          UPDATE entregas_tarea
          SET calificacion = ?, observaciones_maestro = ?, estado = 'calificada',
              calificado_por = ?, fecha_calificacion = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
        [calificacion, observaciones, req.usuario.id, req.params.entregaId]
      )

      return res.json({ status: "ok", mensaje: "Entrega calificada correctamente" })
    } catch (error) {
      return responderError(res, error, "Error al calificar la entrega")
    }
  })

  // ============================================================
  // TAREAS DEL ALUMNO
  // ============================================================
  router.get("/mias", autorizarRoles("alumno"), async (req, res) => {
    try {
      const rows = await query(
        `
          SELECT DISTINCT
            t.id,
            t.titulo,
            t.descripcion,
            t.instrucciones,
            t.fecha_publicacion,
            t.fecha_limite,
            t.puntaje_maximo,
            t.estado AS estado_tarea,
            c.nombre AS curso,
            g.nombre AS grado,
            s.nombre AS seccion,
            co.titulo AS contenido,
            e.id AS entrega_id,
            e.respuesta_texto,
            e.url_entrega,
            e.fecha_entrega,
            e.es_tardia,
            COALESCE(e.estado, 'pendiente') AS estado_entrega,
            e.calificacion,
            e.observaciones_maestro,
            e.fecha_calificacion
          FROM matriculas m
          INNER JOIN asignaciones_docente a
            ON a.grado_id = m.grado_id
            AND a.seccion_id = m.seccion_id
            AND a.periodo_id = m.periodo_id
            AND a.activo = 1
          INNER JOIN tareas t
            ON t.asignacion_docente_id = a.id
            AND t.estado IN ('publicada', 'cerrada')
          INNER JOIN cursos c ON c.id = a.curso_id
          INNER JOIN grados g ON g.id = a.grado_id
          INNER JOIN secciones s ON s.id = a.seccion_id
          LEFT JOIN contenidos co ON co.id = t.contenido_id
          LEFT JOIN entregas_tarea e
            ON e.tarea_id = t.id
            AND e.alumno_id = m.usuario_id
          WHERE m.usuario_id = ?
            AND m.estado = 'activo'
          ORDER BY
            CASE WHEN e.id IS NULL THEN 0 ELSE 1 END ASC,
            t.fecha_limite IS NULL ASC,
            t.fecha_limite ASC,
            t.id DESC
        `,
        [req.usuario.id]
      )

      return res.json(
        rows.map((row) => ({
          ...row,
          puntaje_maximo: Number(row.puntaje_maximo) || 0,
          es_tardia: Boolean(Number(row.es_tardia)),
          calificacion: row.calificacion === null ? null : Number(row.calificacion),
          puede_entregar: row.estado_tarea === "publicada"
        }))
      )
    } catch (error) {
      return responderError(res, error, "Error al obtener las tareas del alumno")
    }
  })

  // ============================================================
  // ENTREGAR / ACTUALIZAR TAREA - ALUMNO
  // ============================================================
  router.put("/:id/entrega", autorizarRoles("alumno"), async (req, res) => {
    try {
      const tareaId = Number(req.params.id)
      const respuestaTexto = req.body.respuesta_texto?.trim() || null
      const urlEntrega = req.body.url_entrega?.trim() || null

      if (!respuestaTexto && !urlEntrega) {
        return res.status(400).json({
          status: "error",
          mensaje: "Escribe una respuesta o agrega un enlace de entrega"
        })
      }

      const rows = await query(
        `
          SELECT t.id, t.fecha_limite, t.estado
          FROM tareas t
          INNER JOIN asignaciones_docente a ON a.id = t.asignacion_docente_id
          INNER JOIN matriculas m
            ON m.grado_id = a.grado_id
            AND m.seccion_id = a.seccion_id
            AND m.periodo_id = a.periodo_id
          WHERE t.id = ?
            AND t.estado = 'publicada'
            AND a.activo = 1
            AND m.usuario_id = ?
            AND m.estado = 'activo'
          LIMIT 1
        `,
        [tareaId, req.usuario.id]
      )

      if (!rows.length) {
        return res.status(403).json({
          status: "error",
          mensaje: "La tarea no está disponible para este alumno"
        })
      }

      const fechaLimite = rows[0].fecha_limite ? new Date(rows[0].fecha_limite) : null
      const esTardia = fechaLimite && new Date() > fechaLimite ? 1 : 0

      await query(
        `
          INSERT INTO entregas_tarea
          (
            tarea_id,
            alumno_id,
            respuesta_texto,
            url_entrega,
            fecha_entrega,
            es_tardia,
            estado,
            calificacion,
            observaciones_maestro,
            calificado_por,
            fecha_calificacion
          )
          VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?, 'entregada', NULL, NULL, NULL, NULL)
          ON DUPLICATE KEY UPDATE
            respuesta_texto = VALUES(respuesta_texto),
            url_entrega = VALUES(url_entrega),
            fecha_entrega = CURRENT_TIMESTAMP,
            es_tardia = VALUES(es_tardia),
            estado = 'entregada',
            calificacion = NULL,
            observaciones_maestro = NULL,
            calificado_por = NULL,
            fecha_calificacion = NULL
        `,
        [tareaId, req.usuario.id, respuestaTexto, urlEntrega, esTardia]
      )

      return res.json({
        status: "ok",
        mensaje: esTardia
          ? "Tarea entregada correctamente. La entrega quedó marcada como tardía."
          : "Tarea entregada correctamente",
        es_tardia: Boolean(esTardia)
      })
    } catch (error) {
      return responderError(res, error, "Error al entregar la tarea")
    }
  })

  return router
}

module.exports = crearRutasTareas
