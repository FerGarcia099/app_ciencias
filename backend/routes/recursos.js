const express = require("express")

function crearRutasRecursos({ conexion, autorizarRoles }) {
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
    return res.status(500).json({ status: "error", mensaje })
  }

  const tiposValidos = ["video", "enlace", "documento", "imagen", "otro"]

  // ============================================================
  // LISTADO GENERAL - MAESTRO
  // ============================================================
  router.get("/", autorizarRoles("maestro"), async (req, res) => {
    try {
      const contenidoId = Number(req.query.contenido_id) || null
      const params = [req.usuario.id]
      let filtroContenido = ""

      if (contenidoId) {
        filtroContenido = "AND r.contenido_id = ?"
        params.push(contenidoId)
      }

      const rows = await query(
        `
          SELECT
            r.id,
            r.contenido_id,
            r.tipo,
            r.titulo,
            r.descripcion,
            r.url,
            r.orden,
            r.activo,
            r.fecha_creacion,
            c.titulo AS contenido,
            c.grado
          FROM recursos_contenido r
          INNER JOIN contenidos c ON c.id = r.contenido_id
          WHERE r.creado_por = ?
            ${filtroContenido}
          ORDER BY r.activo DESC, c.titulo ASC, r.orden ASC, r.id DESC
        `,
        params
      )

      return res.json(rows)
    } catch (error) {
      return responderError(res, error, "Error al obtener los recursos")
    }
  })

  // ============================================================
  // CREAR RECURSO - MAESTRO
  // ============================================================
  router.post("/", autorizarRoles("maestro"), async (req, res) => {
    try {
      const contenidoId = Number(req.body.contenido_id)
      const tipo = tiposValidos.includes(req.body.tipo) ? req.body.tipo : "enlace"
      const titulo = req.body.titulo?.trim()
      const descripcion = req.body.descripcion?.trim() || null
      const url = req.body.url?.trim()
      const orden = Number(req.body.orden) || 1

      if (!contenidoId || !titulo || !url) {
        return res.status(400).json({
          status: "error",
          mensaje: "Contenido, título y URL son obligatorios"
        })
      }

      const contenido = await query(
        "SELECT id FROM contenidos WHERE id = ? AND activo = 1 LIMIT 1",
        [contenidoId]
      )

      if (!contenido.length) {
        return res.status(404).json({ status: "error", mensaje: "Contenido no encontrado" })
      }

      const result = await query(
        `
          INSERT INTO recursos_contenido
            (contenido_id, creado_por, tipo, titulo, descripcion, url, orden, activo)
          VALUES (?, ?, ?, ?, ?, ?, ?, 1)
        `,
        [contenidoId, req.usuario.id, tipo, titulo, descripcion, url, orden]
      )

      return res.status(201).json({
        status: "ok",
        mensaje: "Recurso agregado correctamente",
        id: result.insertId
      })
    } catch (error) {
      return responderError(res, error, "Error al crear el recurso")
    }
  })

  // ============================================================
  // ACTUALIZAR RECURSO - MAESTRO
  // ============================================================
  router.put("/:id", autorizarRoles("maestro"), async (req, res) => {
    try {
      const contenidoId = Number(req.body.contenido_id)
      const tipo = tiposValidos.includes(req.body.tipo) ? req.body.tipo : "enlace"
      const titulo = req.body.titulo?.trim()
      const descripcion = req.body.descripcion?.trim() || null
      const url = req.body.url?.trim()
      const orden = Number(req.body.orden) || 1

      if (!contenidoId || !titulo || !url) {
        return res.status(400).json({ status: "error", mensaje: "Completa los campos obligatorios" })
      }

      const result = await query(
        `
          UPDATE recursos_contenido
          SET contenido_id = ?, tipo = ?, titulo = ?, descripcion = ?, url = ?, orden = ?
          WHERE id = ? AND creado_por = ?
        `,
        [contenidoId, tipo, titulo, descripcion, url, orden, req.params.id, req.usuario.id]
      )

      if (!result.affectedRows) {
        return res.status(404).json({ status: "error", mensaje: "Recurso no encontrado" })
      }

      return res.json({ status: "ok", mensaje: "Recurso actualizado correctamente" })
    } catch (error) {
      return responderError(res, error, "Error al actualizar el recurso")
    }
  })

  // ============================================================
  // DESACTIVAR / RESTAURAR - MAESTRO
  // ============================================================
  router.delete("/:id", autorizarRoles("maestro"), async (req, res) => {
    try {
      const result = await query(
        "UPDATE recursos_contenido SET activo = 0 WHERE id = ? AND creado_por = ?",
        [req.params.id, req.usuario.id]
      )

      if (!result.affectedRows) {
        return res.status(404).json({ status: "error", mensaje: "Recurso no encontrado" })
      }

      return res.json({ status: "ok", mensaje: "Recurso desactivado correctamente" })
    } catch (error) {
      return responderError(res, error, "Error al desactivar el recurso")
    }
  })

  router.put("/:id/restaurar", autorizarRoles("maestro"), async (req, res) => {
    try {
      const result = await query(
        "UPDATE recursos_contenido SET activo = 1 WHERE id = ? AND creado_por = ?",
        [req.params.id, req.usuario.id]
      )

      if (!result.affectedRows) {
        return res.status(404).json({ status: "error", mensaje: "Recurso no encontrado" })
      }

      return res.json({ status: "ok", mensaje: "Recurso restaurado correctamente" })
    } catch (error) {
      return responderError(res, error, "Error al restaurar el recurso")
    }
  })

  // ============================================================
  // RECURSOS ACTIVOS DE UN CONTENIDO - MAESTRO O ALUMNO
  // ============================================================
  router.get("/contenido/:contenidoId", async (req, res) => {
    try {
      const rows = await query(
        `
          SELECT r.id, r.contenido_id, r.tipo, r.titulo, r.descripcion, r.url, r.orden
          FROM recursos_contenido r
          INNER JOIN contenidos c ON c.id = r.contenido_id AND c.activo = 1
          WHERE r.contenido_id = ? AND r.activo = 1
          ORDER BY r.orden ASC, r.id ASC
        `,
        [req.params.contenidoId]
      )

      return res.json(rows)
    } catch (error) {
      return responderError(res, error, "Error al obtener los recursos del contenido")
    }
  })

  return router
}

module.exports = crearRutasRecursos
