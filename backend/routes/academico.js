const express = require("express")

function crearRutasAcademicas({ conexion, autorizarRoles }) {
  const router = express.Router()

  // Todo el modulo academico es administrado por maestros.
  router.use(autorizarRoles("maestro"))

  const query = (sql, params = []) =>
    new Promise((resolve, reject) => {
      conexion.query(sql, params, (err, rows) => {
        if (err) return reject(err)
        resolve(rows)
      })
    })

  const catalogos = {
    grados: {
      tabla: "grados",
      campos: ["nombre", "nivel", "orden"],
      requeridos: ["nombre"],
      orden: "orden ASC, nombre ASC",
      normalizar: (body) => ({
        nombre: body.nombre?.trim(),
        nivel: body.nivel?.trim() || "Primaria",
        orden: Number(body.orden) || 1
      })
    },
    secciones: {
      tabla: "secciones",
      campos: ["nombre", "descripcion"],
      requeridos: ["nombre"],
      orden: "nombre ASC",
      normalizar: (body) => ({
        nombre: body.nombre?.trim(),
        descripcion: body.descripcion?.trim() || null
      })
    },
    cursos: {
      tabla: "cursos",
      campos: ["codigo", "nombre", "descripcion"],
      requeridos: ["codigo", "nombre"],
      orden: "nombre ASC",
      normalizar: (body) => ({
        codigo: body.codigo?.trim().toUpperCase(),
        nombre: body.nombre?.trim(),
        descripcion: body.descripcion?.trim() || null
      })
    },
    periodos: {
      tabla: "periodos_academicos",
      campos: ["nombre", "anio", "fecha_inicio", "fecha_fin", "estado"],
      requeridos: ["nombre", "anio", "fecha_inicio", "fecha_fin"],
      orden: "anio DESC, fecha_inicio DESC",
      normalizar: (body) => ({
        nombre: body.nombre?.trim(),
        anio: Number(body.anio),
        fecha_inicio: body.fecha_inicio,
        fecha_fin: body.fecha_fin,
        estado: ["planificado", "activo", "cerrado"].includes(body.estado)
          ? body.estado
          : "planificado"
      })
    },
    "tipos-logro": {
      tabla: "tipos_logro",
      campos: ["nombre", "descripcion", "icono"],
      requeridos: ["nombre"],
      orden: "nombre ASC",
      normalizar: (body) => ({
        nombre: body.nombre?.trim(),
        descripcion: body.descripcion?.trim() || null,
        icono: body.icono?.trim() || "🏆"
      })
    }
  }

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

  function obtenerDefinicionCatalogo(tipo) {
    return catalogos[tipo] || null
  }

  function faltanRequeridos(definicion, datos) {
    return definicion.requeridos.some((campo) => {
      const valor = datos[campo]
      return valor === undefined || valor === null || valor === "" || Number.isNaN(valor)
    })
  }

  // ============================================================
  // OPCIONES PARA FORMULARIOS
  // ============================================================
  router.get("/opciones", async (req, res) => {
    try {
      const [alumnos, maestros, grados, secciones, cursos, periodos, tiposLogro] =
        await Promise.all([
          query(`
            SELECT id, nombre, usuario
            FROM usuarios
            WHERE LOWER(TRIM(rol)) = 'alumno'
            ORDER BY nombre ASC
          `),
          query(`
            SELECT id, nombre, usuario
            FROM usuarios
            WHERE LOWER(TRIM(rol)) = 'maestro'
            ORDER BY nombre ASC
          `),
          query(`SELECT * FROM grados WHERE activo = 1 ORDER BY orden, nombre`),
          query(`SELECT * FROM secciones WHERE activo = 1 ORDER BY nombre`),
          query(`SELECT * FROM cursos WHERE activo = 1 ORDER BY nombre`),
          query(`
            SELECT *
            FROM periodos_academicos
            WHERE activo = 1
            ORDER BY anio DESC, fecha_inicio DESC
          `),
          query(`SELECT * FROM tipos_logro WHERE activo = 1 ORDER BY nombre`)
        ])

      return res.json({
        alumnos,
        maestros,
        grados,
        secciones,
        cursos,
        periodos,
        tipos_logro: tiposLogro
      })
    } catch (error) {
      return responderError(res, error, "Error al obtener las opciones académicas")
    }
  })

  // ============================================================
  // CRUD GENERICO PARA LAS 5 PARAMETRIZACIONES
  // ============================================================
  router.get("/parametros/:tipo", async (req, res) => {
    const definicion = obtenerDefinicionCatalogo(req.params.tipo)

    if (!definicion) {
      return res.status(404).json({
        status: "error",
        mensaje: "Parametrización no reconocida"
      })
    }

    const incluirInactivos = req.query.incluir_inactivos === "1"

    try {
      const rows = await query(`
        SELECT *
        FROM ${definicion.tabla}
        ${incluirInactivos ? "" : "WHERE activo = 1"}
        ORDER BY ${definicion.orden}
      `)

      return res.json(rows)
    } catch (error) {
      return responderError(res, error, "Error al consultar la parametrización")
    }
  })

  router.post("/parametros/:tipo", async (req, res) => {
    const definicion = obtenerDefinicionCatalogo(req.params.tipo)

    if (!definicion) {
      return res.status(404).json({
        status: "error",
        mensaje: "Parametrización no reconocida"
      })
    }

    const datos = definicion.normalizar(req.body)

    if (faltanRequeridos(definicion, datos)) {
      return res.status(400).json({
        status: "error",
        mensaje: "Completa todos los campos obligatorios"
      })
    }

    if (req.params.tipo === "periodos") {
      if (datos.anio < 2000 || datos.anio > 2100) {
        return res.status(400).json({
          status: "error",
          mensaje: "El año del periodo no es válido"
        })
      }

      if (datos.fecha_fin < datos.fecha_inicio) {
        return res.status(400).json({
          status: "error",
          mensaje: "La fecha final no puede ser anterior a la fecha inicial"
        })
      }
    }

    try {
      const columnas = definicion.campos.join(", ")
      const placeholders = definicion.campos.map(() => "?").join(", ")
      const valores = definicion.campos.map((campo) => datos[campo])

      const result = await query(
        `INSERT INTO ${definicion.tabla} (${columnas}, activo) VALUES (${placeholders}, 1)`,
        valores
      )

      return res.status(201).json({
        status: "ok",
        mensaje: "Registro creado correctamente",
        id: result.insertId
      })
    } catch (error) {
      return responderError(res, error, "Error al crear el registro")
    }
  })

  router.put("/parametros/:tipo/:id", async (req, res) => {
    const definicion = obtenerDefinicionCatalogo(req.params.tipo)

    if (!definicion) {
      return res.status(404).json({
        status: "error",
        mensaje: "Parametrización no reconocida"
      })
    }

    const datos = definicion.normalizar(req.body)

    if (faltanRequeridos(definicion, datos)) {
      return res.status(400).json({
        status: "error",
        mensaje: "Completa todos los campos obligatorios"
      })
    }

    try {
      const setSql = definicion.campos.map((campo) => `${campo} = ?`).join(", ")
      const valores = definicion.campos.map((campo) => datos[campo])
      valores.push(req.params.id)

      const result = await query(
        `UPDATE ${definicion.tabla} SET ${setSql} WHERE id = ?`,
        valores
      )

      if (!result.affectedRows) {
        return res.status(404).json({
          status: "error",
          mensaje: "Registro no encontrado"
        })
      }

      return res.json({
        status: "ok",
        mensaje: "Registro actualizado correctamente"
      })
    } catch (error) {
      return responderError(res, error, "Error al actualizar el registro")
    }
  })

  router.delete("/parametros/:tipo/:id", async (req, res) => {
    const definicion = obtenerDefinicionCatalogo(req.params.tipo)

    if (!definicion) {
      return res.status(404).json({
        status: "error",
        mensaje: "Parametrización no reconocida"
      })
    }

    try {
      const result = await query(
        `UPDATE ${definicion.tabla} SET activo = 0 WHERE id = ?`,
        [req.params.id]
      )

      if (!result.affectedRows) {
        return res.status(404).json({
          status: "error",
          mensaje: "Registro no encontrado"
        })
      }

      return res.json({
        status: "ok",
        mensaje: "Registro desactivado correctamente"
      })
    } catch (error) {
      return responderError(res, error, "Error al desactivar el registro")
    }
  })

  router.put("/parametros/:tipo/:id/restaurar", async (req, res) => {
    const definicion = obtenerDefinicionCatalogo(req.params.tipo)

    if (!definicion) {
      return res.status(404).json({
        status: "error",
        mensaje: "Parametrización no reconocida"
      })
    }

    try {
      const result = await query(
        `UPDATE ${definicion.tabla} SET activo = 1 WHERE id = ?`,
        [req.params.id]
      )

      if (!result.affectedRows) {
        return res.status(404).json({
          status: "error",
          mensaje: "Registro no encontrado"
        })
      }

      return res.json({
        status: "ok",
        mensaje: "Registro restaurado correctamente"
      })
    } catch (error) {
      return responderError(res, error, "Error al restaurar el registro")
    }
  })

  // ============================================================
  // MATRICULAS
  // ============================================================
  router.get("/matriculas", async (req, res) => {
    try {
      const rows = await query(`
        SELECT
          m.id,
          m.usuario_id,
          u.nombre AS alumno,
          u.usuario,
          m.grado_id,
          g.nombre AS grado,
          m.seccion_id,
          s.nombre AS seccion,
          m.periodo_id,
          p.nombre AS periodo,
          p.anio,
          m.estado,
          m.fecha_matricula,
          m.observaciones
        FROM matriculas m
        INNER JOIN usuarios u ON u.id = m.usuario_id
        INNER JOIN grados g ON g.id = m.grado_id
        INNER JOIN secciones s ON s.id = m.seccion_id
        INNER JOIN periodos_academicos p ON p.id = m.periodo_id
        ORDER BY p.anio DESC, g.orden ASC, s.nombre ASC, u.nombre ASC
      `)

      return res.json(rows)
    } catch (error) {
      return responderError(res, error, "Error al obtener las matrículas")
    }
  })

  async function validarMatricula(body) {
    const usuarioId = Number(body.usuario_id)
    const gradoId = Number(body.grado_id)
    const seccionId = Number(body.seccion_id)
    const periodoId = Number(body.periodo_id)

    if (!usuarioId || !gradoId || !seccionId || !periodoId) {
      return { ok: false, mensaje: "Alumno, grado, sección y periodo son obligatorios" }
    }

    const rows = await query(
      `
        SELECT
          EXISTS(
            SELECT 1 FROM usuarios
            WHERE id = ? AND LOWER(TRIM(rol)) = 'alumno'
          ) AS alumno_ok,
          EXISTS(SELECT 1 FROM grados WHERE id = ? AND activo = 1) AS grado_ok,
          EXISTS(SELECT 1 FROM secciones WHERE id = ? AND activo = 1) AS seccion_ok,
          EXISTS(SELECT 1 FROM periodos_academicos WHERE id = ? AND activo = 1) AS periodo_ok
      `,
      [usuarioId, gradoId, seccionId, periodoId]
    )

    const v = rows[0]

    if (!Number(v.alumno_ok)) return { ok: false, mensaje: "El alumno seleccionado no es válido" }
    if (!Number(v.grado_ok)) return { ok: false, mensaje: "El grado seleccionado no es válido" }
    if (!Number(v.seccion_ok)) return { ok: false, mensaje: "La sección seleccionada no es válida" }
    if (!Number(v.periodo_ok)) return { ok: false, mensaje: "El periodo seleccionado no es válido" }

    return { ok: true }
  }

  router.post("/matriculas", async (req, res) => {
    try {
      const validacion = await validarMatricula(req.body)

      if (!validacion.ok) {
        return res.status(400).json({ status: "error", mensaje: validacion.mensaje })
      }

      const fechaMatricula = req.body.fecha_matricula || new Date().toISOString().slice(0, 10)
      const observaciones = req.body.observaciones?.trim() || null

      await query(
        `
          INSERT INTO matriculas
            (usuario_id, grado_id, seccion_id, periodo_id, estado, fecha_matricula, observaciones)
          VALUES (?, ?, ?, ?, 'activo', ?, ?)
          ON DUPLICATE KEY UPDATE
            grado_id = VALUES(grado_id),
            seccion_id = VALUES(seccion_id),
            estado = 'activo',
            fecha_matricula = VALUES(fecha_matricula),
            observaciones = VALUES(observaciones)
        `,
        [
          Number(req.body.usuario_id),
          Number(req.body.grado_id),
          Number(req.body.seccion_id),
          Number(req.body.periodo_id),
          fechaMatricula,
          observaciones
        ]
      )

      return res.status(201).json({
        status: "ok",
        mensaje: "Matrícula guardada correctamente"
      })
    } catch (error) {
      return responderError(res, error, "Error al guardar la matrícula")
    }
  })

  router.put("/matriculas/:id", async (req, res) => {
    try {
      const validacion = await validarMatricula(req.body)

      if (!validacion.ok) {
        return res.status(400).json({ status: "error", mensaje: validacion.mensaje })
      }

      const estado = ["activo", "retirado", "finalizado"].includes(req.body.estado)
        ? req.body.estado
        : "activo"

      const result = await query(
        `
          UPDATE matriculas
          SET usuario_id = ?, grado_id = ?, seccion_id = ?, periodo_id = ?,
              estado = ?, fecha_matricula = ?, observaciones = ?
          WHERE id = ?
        `,
        [
          Number(req.body.usuario_id),
          Number(req.body.grado_id),
          Number(req.body.seccion_id),
          Number(req.body.periodo_id),
          estado,
          req.body.fecha_matricula,
          req.body.observaciones?.trim() || null,
          req.params.id
        ]
      )

      if (!result.affectedRows) {
        return res.status(404).json({ status: "error", mensaje: "Matrícula no encontrada" })
      }

      return res.json({ status: "ok", mensaje: "Matrícula actualizada correctamente" })
    } catch (error) {
      return responderError(res, error, "Error al actualizar la matrícula")
    }
  })

  router.delete("/matriculas/:id", async (req, res) => {
    try {
      const result = await query(
        "UPDATE matriculas SET estado = 'retirado' WHERE id = ?",
        [req.params.id]
      )

      if (!result.affectedRows) {
        return res.status(404).json({ status: "error", mensaje: "Matrícula no encontrada" })
      }

      return res.json({ status: "ok", mensaje: "Matrícula retirada correctamente" })
    } catch (error) {
      return responderError(res, error, "Error al retirar la matrícula")
    }
  })

  // ============================================================
  // ASIGNACIONES DOCENTE
  // ============================================================
  router.get("/asignaciones-docente", async (req, res) => {
    try {
      const rows = await query(`
        SELECT
          a.id,
          a.maestro_id,
          u.nombre AS maestro,
          a.curso_id,
          c.codigo AS curso_codigo,
          c.nombre AS curso,
          a.grado_id,
          g.nombre AS grado,
          a.seccion_id,
          s.nombre AS seccion,
          a.periodo_id,
          p.nombre AS periodo,
          p.anio,
          a.activo,
          a.fecha_asignacion,
          a.observaciones
        FROM asignaciones_docente a
        INNER JOIN usuarios u ON u.id = a.maestro_id
        INNER JOIN cursos c ON c.id = a.curso_id
        INNER JOIN grados g ON g.id = a.grado_id
        INNER JOIN secciones s ON s.id = a.seccion_id
        INNER JOIN periodos_academicos p ON p.id = a.periodo_id
        ORDER BY a.activo DESC, p.anio DESC, u.nombre, c.nombre, g.orden, s.nombre
      `)

      return res.json(rows)
    } catch (error) {
      return responderError(res, error, "Error al obtener las asignaciones docentes")
    }
  })

  async function validarAsignacion(body) {
    const maestroId = Number(body.maestro_id)
    const cursoId = Number(body.curso_id)
    const gradoId = Number(body.grado_id)
    const seccionId = Number(body.seccion_id)
    const periodoId = Number(body.periodo_id)

    if (!maestroId || !cursoId || !gradoId || !seccionId || !periodoId) {
      return { ok: false, mensaje: "Maestro, curso, grado, sección y periodo son obligatorios" }
    }

    const rows = await query(
      `
        SELECT
          EXISTS(
            SELECT 1 FROM usuarios
            WHERE id = ? AND LOWER(TRIM(rol)) = 'maestro'
          ) AS maestro_ok,
          EXISTS(SELECT 1 FROM cursos WHERE id = ? AND activo = 1) AS curso_ok,
          EXISTS(SELECT 1 FROM grados WHERE id = ? AND activo = 1) AS grado_ok,
          EXISTS(SELECT 1 FROM secciones WHERE id = ? AND activo = 1) AS seccion_ok,
          EXISTS(SELECT 1 FROM periodos_academicos WHERE id = ? AND activo = 1) AS periodo_ok
      `,
      [maestroId, cursoId, gradoId, seccionId, periodoId]
    )

    const v = rows[0]

    if (!Number(v.maestro_ok)) return { ok: false, mensaje: "El maestro seleccionado no es válido" }
    if (!Number(v.curso_ok)) return { ok: false, mensaje: "El curso seleccionado no es válido" }
    if (!Number(v.grado_ok)) return { ok: false, mensaje: "El grado seleccionado no es válido" }
    if (!Number(v.seccion_ok)) return { ok: false, mensaje: "La sección seleccionada no es válida" }
    if (!Number(v.periodo_ok)) return { ok: false, mensaje: "El periodo seleccionado no es válido" }

    return { ok: true }
  }

  router.post("/asignaciones-docente", async (req, res) => {
    try {
      const validacion = await validarAsignacion(req.body)

      if (!validacion.ok) {
        return res.status(400).json({ status: "error", mensaje: validacion.mensaje })
      }

      const fecha = req.body.fecha_asignacion || new Date().toISOString().slice(0, 10)

      await query(
        `
          INSERT INTO asignaciones_docente
            (maestro_id, curso_id, grado_id, seccion_id, periodo_id, activo, fecha_asignacion, observaciones)
          VALUES (?, ?, ?, ?, ?, 1, ?, ?)
          ON DUPLICATE KEY UPDATE
            activo = 1,
            fecha_asignacion = VALUES(fecha_asignacion),
            observaciones = VALUES(observaciones)
        `,
        [
          Number(req.body.maestro_id),
          Number(req.body.curso_id),
          Number(req.body.grado_id),
          Number(req.body.seccion_id),
          Number(req.body.periodo_id),
          fecha,
          req.body.observaciones?.trim() || null
        ]
      )

      return res.status(201).json({
        status: "ok",
        mensaje: "Asignación docente guardada correctamente"
      })
    } catch (error) {
      return responderError(res, error, "Error al guardar la asignación docente")
    }
  })

  router.put("/asignaciones-docente/:id", async (req, res) => {
    try {
      const validacion = await validarAsignacion(req.body)

      if (!validacion.ok) {
        return res.status(400).json({ status: "error", mensaje: validacion.mensaje })
      }

      const result = await query(
        `
          UPDATE asignaciones_docente
          SET maestro_id = ?, curso_id = ?, grado_id = ?, seccion_id = ?, periodo_id = ?,
              activo = ?, fecha_asignacion = ?, observaciones = ?
          WHERE id = ?
        `,
        [
          Number(req.body.maestro_id),
          Number(req.body.curso_id),
          Number(req.body.grado_id),
          Number(req.body.seccion_id),
          Number(req.body.periodo_id),
          req.body.activo === false || Number(req.body.activo) === 0 ? 0 : 1,
          req.body.fecha_asignacion,
          req.body.observaciones?.trim() || null,
          req.params.id
        ]
      )

      if (!result.affectedRows) {
        return res.status(404).json({ status: "error", mensaje: "Asignación no encontrada" })
      }

      return res.json({ status: "ok", mensaje: "Asignación actualizada correctamente" })
    } catch (error) {
      return responderError(res, error, "Error al actualizar la asignación docente")
    }
  })

  router.delete("/asignaciones-docente/:id", async (req, res) => {
    try {
      const result = await query(
        "UPDATE asignaciones_docente SET activo = 0 WHERE id = ?",
        [req.params.id]
      )

      if (!result.affectedRows) {
        return res.status(404).json({ status: "error", mensaje: "Asignación no encontrada" })
      }

      return res.json({ status: "ok", mensaje: "Asignación desactivada correctamente" })
    } catch (error) {
      return responderError(res, error, "Error al desactivar la asignación docente")
    }
  })

  return router
}

module.exports = crearRutasAcademicas
