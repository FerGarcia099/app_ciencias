const express = require("express")

function crearRutasAlumnosAcademico({ conexion, autorizarRoles }) {
  const router = express.Router()

  router.use(autorizarRoles("maestro"))

  const query = (sql, params = []) =>
    new Promise((resolve, reject) => {
      conexion.query(sql, params, (err, rows) => {
        if (err) return reject(err)
        resolve(rows)
      })
    })

  const responderError = (res, error, mensaje) => {
    console.log(mensaje, error)

    return res.status(500).json({
      status: "error",
      mensaje
    })
  }

  router.get("/dashboard", async (req, res) => {
    try {
      const [grados, secciones, periodos] = await Promise.all([
        query(`
          SELECT id, nombre, nivel, orden
          FROM grados
          WHERE activo = 1
          ORDER BY orden ASC, nombre ASC
        `),
        query(`
          SELECT id, nombre
          FROM secciones
          WHERE activo = 1
          ORDER BY nombre ASC
        `),
        query(`
          SELECT id, nombre, anio, estado, fecha_inicio, fecha_fin
          FROM periodos_academicos
          WHERE activo = 1
          ORDER BY anio DESC, fecha_inicio DESC
        `)
      ])

      const periodoSolicitado = Number(req.query.periodo_id) || null
      const gradoId = Number(req.query.grado_id) || null
      const seccionId = Number(req.query.seccion_id) || null

      const periodoActivo = periodos.find((periodo) => periodo.estado === "activo")
      const periodoSolicitadoValido = periodoSolicitado
        ? periodos.find((periodo) => Number(periodo.id) === periodoSolicitado)
        : null

      const periodoSeleccionado = periodoSolicitadoValido
        ? Number(periodoSolicitadoValido.id)
        : periodoActivo
          ? Number(periodoActivo.id)
          : periodos.length > 0
            ? Number(periodos[0].id)
            : null

      const params = []
      let joinMatricula

      if (periodoSeleccionado) {
        joinMatricula = `
          LEFT JOIN matriculas m
            ON m.usuario_id = u.id
            AND m.periodo_id = ?
            AND m.estado = 'activo'
        `
        params.push(periodoSeleccionado)
      } else {
        joinMatricula = `
          LEFT JOIN matriculas m
            ON m.id = (
              SELECT m2.id
              FROM matriculas m2
              INNER JOIN periodos_academicos p2 ON p2.id = m2.periodo_id
              WHERE m2.usuario_id = u.id
                AND m2.estado = 'activo'
              ORDER BY
                CASE WHEN p2.estado = 'activo' THEN 0 ELSE 1 END ASC,
                p2.anio DESC,
                m2.id DESC
              LIMIT 1
            )
        `
      }

      const filtroTareasPeriodo = periodoSeleccionado
        ? "AND mt.periodo_id = ?"
        : ""

      if (periodoSeleccionado) {
        params.push(periodoSeleccionado)
      }

      const condiciones = [
        "LOWER(TRIM(u.rol)) = 'alumno'",
        "u.activo = 1"
      ]

      if (gradoId) {
        condiciones.push("m.grado_id = ?")
        params.push(gradoId)
      }

      if (seccionId) {
        condiciones.push("m.seccion_id = ?")
        params.push(seccionId)
      }

      const sql = `
        SELECT
          u.id,
          u.nombre,
          u.usuario,
          u.activo,

          m.id AS matricula_id,
          m.grado_id,
          g.nombre AS grado,
          m.seccion_id,
          s.nombre AS seccion,
          m.periodo_id,
          p.nombre AS periodo,
          p.anio,
          m.estado AS estado_matricula,

          COALESCE(ev.actividades_completadas, 0) AS actividades_completadas,
          ev.promedio_evaluaciones,
          ev.ultima_actividad,

          COALESCE(tr.tareas_asignadas, 0) AS tareas_asignadas,
          COALESCE(tr.tareas_pendientes, 0) AS tareas_pendientes,

          COALESCE(ct.total_contenidos, 0) AS total_contenidos,

          CASE
            WHEN COALESCE(ct.total_contenidos, 0) = 0 THEN 0
            ELSE ROUND(
              LEAST(
                100,
                (COALESCE(ev.actividades_completadas, 0) / ct.total_contenidos) * 100
              ),
              2
            )
          END AS progreso

        FROM usuarios u

        ${joinMatricula}

        LEFT JOIN grados g ON g.id = m.grado_id
        LEFT JOIN secciones s ON s.id = m.seccion_id
        LEFT JOIN periodos_academicos p ON p.id = m.periodo_id

        LEFT JOIN (
          SELECT
            ult.usuario_id,
            COUNT(*) AS actividades_completadas,
            ROUND(AVG(ult.porcentaje), 2) AS promedio_evaluaciones,
            MAX(ult.fecha_fin) AS ultima_actividad
          FROM intentos_evaluacion ult
          INNER JOIN contenidos c_activo
            ON c_activo.id = ult.contenido_id
            AND c_activo.activo = 1
          WHERE ult.estado = 'completado'
            AND ult.id = (
              SELECT i2.id
              FROM intentos_evaluacion i2
              WHERE i2.usuario_id = ult.usuario_id
                AND i2.contenido_id = ult.contenido_id
                AND i2.estado = 'completado'
              ORDER BY i2.numero_intento DESC, i2.id DESC
              LIMIT 1
            )
          GROUP BY ult.usuario_id
        ) ev ON ev.usuario_id = u.id

        LEFT JOIN (
          SELECT
            mt.usuario_id,
            COUNT(DISTINCT t.id) AS tareas_asignadas,
            COUNT(
              DISTINCT CASE
                WHEN e.id IS NULL OR e.estado = 'pendiente' THEN t.id
                ELSE NULL
              END
            ) AS tareas_pendientes
          FROM matriculas mt
          INNER JOIN asignaciones_docente ad
            ON ad.grado_id = mt.grado_id
            AND ad.seccion_id = mt.seccion_id
            AND ad.periodo_id = mt.periodo_id
            AND ad.activo = 1
          INNER JOIN tareas t
            ON t.asignacion_docente_id = ad.id
            AND t.estado IN ('publicada', 'cerrada')
          LEFT JOIN entregas_tarea e
            ON e.tarea_id = t.id
            AND e.alumno_id = mt.usuario_id
          WHERE mt.estado = 'activo'
            ${filtroTareasPeriodo}
          GROUP BY mt.usuario_id
        ) tr ON tr.usuario_id = u.id

        CROSS JOIN (
          SELECT COUNT(*) AS total_contenidos
          FROM contenidos
          WHERE activo = 1
        ) ct

        WHERE ${condiciones.join("\n          AND ")}
        ORDER BY
          CASE WHEN m.id IS NULL THEN 1 ELSE 0 END ASC,
          g.orden ASC,
          s.nombre ASC,
          u.nombre ASC
      `

      const rows = await query(sql, params)

      const alumnos = rows.map((row) => ({
        ...row,
        id: Number(row.id),
        activo: Boolean(Number(row.activo)),
        matricula_id: row.matricula_id === null ? null : Number(row.matricula_id),
        grado_id: row.grado_id === null ? null : Number(row.grado_id),
        seccion_id: row.seccion_id === null ? null : Number(row.seccion_id),
        periodo_id: row.periodo_id === null ? null : Number(row.periodo_id),
        anio: row.anio === null ? null : Number(row.anio),
        actividades_completadas: Number(row.actividades_completadas) || 0,
        promedio_evaluaciones:
          row.promedio_evaluaciones === null
            ? null
            : Number(row.promedio_evaluaciones),
        tareas_asignadas: Number(row.tareas_asignadas) || 0,
        tareas_pendientes: Number(row.tareas_pendientes) || 0,
        total_contenidos: Number(row.total_contenidos) || 0,
        progreso: Number(row.progreso) || 0
      }))

      const alumnosAcademicos = periodoSeleccionado
        ? alumnos.filter((alumno) => alumno.matricula_id !== null)
        : alumnos

      const promedios = alumnosAcademicos
        .map((alumno) => alumno.promedio_evaluaciones)
        .filter((valor) => valor !== null)

      const promedioGeneral = promedios.length
        ? Math.round(
            (promedios.reduce((acumulado, valor) => acumulado + valor, 0) /
              promedios.length) *
              100
          ) / 100
        : null

      const resumen = {
        total_alumnos: alumnos.length,
        matriculados: alumnos.filter((alumno) => alumno.matricula_id !== null).length,
        promedio_general: promedioGeneral,
        tareas_pendientes: alumnos.reduce(
          (total, alumno) => total + alumno.tareas_pendientes,
          0
        ),
        necesitan_refuerzo: alumnosAcademicos.filter(
          (alumno) =>
            alumno.promedio_evaluaciones !== null &&
            alumno.promedio_evaluaciones < 60
        ).length
      }

      return res.json({
        status: "ok",
        periodo_seleccionado: periodoSeleccionado,
        resumen,
        filtros: {
          grados,
          secciones,
          periodos
        },
        alumnos
      })
    } catch (error) {
      return responderError(
        res,
        error,
        "Error al obtener el dashboard académico de alumnos"
      )
    }
  })

  // ============================================================
  // FASE 3 - FICHA ACADÉMICA COMPLETA DEL ESTUDIANTE
  // ============================================================
  router.get("/:id/ficha", async (req, res) => {
    try {
      const alumnoId = Number(req.params.id)

      if (!alumnoId) {
        return res.status(400).json({
          status: "error",
          mensaje: "El identificador del alumno no es válido"
        })
      }

      const alumnoRows = await query(
        `
          SELECT id, nombre, usuario, activo
          FROM usuarios
          WHERE id = ?
            AND LOWER(TRIM(rol)) = 'alumno'
          LIMIT 1
        `,
        [alumnoId]
      )

      if (!alumnoRows.length) {
        return res.status(404).json({
          status: "error",
          mensaje: "Alumno no encontrado"
        })
      }

      const alumno = {
        ...alumnoRows[0],
        id: Number(alumnoRows[0].id),
        activo: Boolean(Number(alumnoRows[0].activo))
      }

      const matriculasRows = await query(
        `
          SELECT
            m.id,
            m.usuario_id,
            m.grado_id,
            g.nombre AS grado,
            m.seccion_id,
            s.nombre AS seccion,
            m.periodo_id,
            p.nombre AS periodo,
            p.anio,
            p.estado AS periodo_estado,
            p.fecha_inicio,
            p.fecha_fin,
            m.estado,
            m.fecha_matricula,
            m.observaciones
          FROM matriculas m
          INNER JOIN grados g ON g.id = m.grado_id
          INNER JOIN secciones s ON s.id = m.seccion_id
          INNER JOIN periodos_academicos p ON p.id = m.periodo_id
          WHERE m.usuario_id = ?
          ORDER BY
            p.anio DESC,
            p.fecha_inicio DESC,
            m.id DESC
        `,
        [alumnoId]
      )

      const matriculas = matriculasRows.map((row) => ({
        ...row,
        id: Number(row.id),
        usuario_id: Number(row.usuario_id),
        grado_id: Number(row.grado_id),
        seccion_id: Number(row.seccion_id),
        periodo_id: Number(row.periodo_id),
        anio: Number(row.anio)
      }))

      const periodoSolicitado = Number(req.query.periodo_id) || null
      const matriculaSolicitada = periodoSolicitado
        ? matriculas.find(
            (item) => Number(item.periodo_id) === Number(periodoSolicitado)
          )
        : null

      const matriculaActiva = matriculas.find(
        (item) =>
          item.periodo_estado === "activo" && item.estado === "activo"
      )

      const matriculaSeleccionada =
        matriculaSolicitada || matriculaActiva || matriculas[0] || null

      const periodoSeleccionado = matriculaSeleccionada
        ? Number(matriculaSeleccionada.periodo_id)
        : null

      const evaluacionesRows = await query(
        `
          SELECT
            i.id AS intento_id,
            i.contenido_id,
            c.titulo AS contenido,
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
          FROM intentos_evaluacion i
          INNER JOIN contenidos c ON c.id = i.contenido_id
          WHERE i.usuario_id = ?
            AND i.estado = 'completado'
          ORDER BY
            i.fecha_fin DESC,
            i.id DESC
        `,
        [alumnoId]
      )

      const evaluaciones = evaluacionesRows.map((row) => ({
        ...row,
        intento_id: Number(row.intento_id),
        contenido_id: Number(row.contenido_id),
        numero_intento: Number(row.numero_intento) || 0,
        preguntas_totales: Number(row.preguntas_totales) || 0,
        preguntas_respondidas: Number(row.preguntas_respondidas) || 0,
        puntaje_obtenido: Number(row.puntaje_obtenido) || 0,
        puntaje_total: Number(row.puntaje_total) || 0,
        porcentaje: Number(row.porcentaje) || 0,
        reintento_habilitado: Boolean(Number(row.reintento_habilitado))
      }))

      const ultimasEvaluacionesRows = await query(
        `
          SELECT
            i.id AS intento_id,
            i.contenido_id,
            c.titulo AS contenido,
            i.numero_intento,
            i.porcentaje,
            i.fecha_fin
          FROM intentos_evaluacion i
          INNER JOIN contenidos c
            ON c.id = i.contenido_id
            AND c.activo = 1
          WHERE i.usuario_id = ?
            AND i.estado = 'completado'
            AND i.id = (
              SELECT i2.id
              FROM intentos_evaluacion i2
              WHERE i2.usuario_id = i.usuario_id
                AND i2.contenido_id = i.contenido_id
                AND i2.estado = 'completado'
              ORDER BY i2.numero_intento DESC, i2.id DESC
              LIMIT 1
            )
          ORDER BY c.titulo ASC
        `,
        [alumnoId]
      )

      const ultimasEvaluaciones = ultimasEvaluacionesRows.map((row) => ({
        ...row,
        intento_id: Number(row.intento_id),
        contenido_id: Number(row.contenido_id),
        numero_intento: Number(row.numero_intento) || 0,
        porcentaje: Number(row.porcentaje) || 0
      }))

      const progresoRows = await query(
        `
          SELECT
            c.id AS contenido_id,
            c.titulo AS contenido,
            c.descripcion,
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
              ORDER BY i2.numero_intento DESC, i2.id DESC
              LIMIT 1
            )
          WHERE c.activo = 1
          ORDER BY c.titulo ASC
        `,
        [alumnoId]
      )

      const progreso = progresoRows.map((row) => ({
        ...row,
        contenido_id: Number(row.contenido_id),
        intento_id: row.intento_id === null ? null : Number(row.intento_id),
        numero_intento: Number(row.numero_intento) || 0,
        preguntas_totales: Number(row.preguntas_totales) || 0,
        preguntas_respondidas: Number(row.preguntas_respondidas) || 0,
        puntaje_obtenido: Number(row.puntaje_obtenido) || 0,
        puntaje_total: Number(row.puntaje_total) || 0,
        porcentaje: row.porcentaje === null ? null : Number(row.porcentaje),
        reintento_habilitado: Boolean(Number(row.reintento_habilitado))
      }))

      let tareas = []

      if (matriculaSeleccionada) {
        const tareasRows = await query(
          `
            SELECT DISTINCT
              t.id,
              t.titulo,
              t.descripcion,
              t.fecha_publicacion,
              t.fecha_limite,
              t.puntaje_maximo,
              t.estado AS estado_tarea,
              c.nombre AS curso,
              co.titulo AS contenido,
              a.periodo_id,
              e.id AS entrega_id,
              e.fecha_entrega,
              e.es_tardia,
              COALESCE(e.estado, 'pendiente') AS estado_entrega,
              e.calificacion,
              e.observaciones_maestro,
              e.fecha_calificacion
            FROM asignaciones_docente a
            INNER JOIN tareas t
              ON t.asignacion_docente_id = a.id
              AND t.estado IN ('publicada', 'cerrada')
            INNER JOIN cursos c ON c.id = a.curso_id
            LEFT JOIN contenidos co ON co.id = t.contenido_id
            LEFT JOIN entregas_tarea e
              ON e.tarea_id = t.id
              AND e.alumno_id = ?
            WHERE a.grado_id = ?
              AND a.seccion_id = ?
              AND a.periodo_id = ?
              AND a.activo = 1
            ORDER BY
              CASE WHEN e.id IS NULL THEN 0 ELSE 1 END ASC,
              t.fecha_limite IS NULL ASC,
              t.fecha_limite ASC,
              t.id DESC
          `,
          [
            alumnoId,
            matriculaSeleccionada.grado_id,
            matriculaSeleccionada.seccion_id,
            matriculaSeleccionada.periodo_id
          ]
        )

        tareas = tareasRows.map((row) => ({
          ...row,
          id: Number(row.id),
          periodo_id: Number(row.periodo_id),
          puntaje_maximo: Number(row.puntaje_maximo) || 0,
          entrega_id: row.entrega_id === null ? null : Number(row.entrega_id),
          es_tardia: Boolean(Number(row.es_tardia)),
          calificacion: row.calificacion === null ? null : Number(row.calificacion)
        }))
      }

      const promedioEvaluaciones = ultimasEvaluaciones.length
        ? Math.round(
            (ultimasEvaluaciones.reduce(
              (total, item) => total + Number(item.porcentaje || 0),
              0
            ) /
              ultimasEvaluaciones.length) *
              100
          ) / 100
        : null

      const actividadesCompletadas = progreso.filter(
        (item) => item.estado === "completado"
      ).length

      const totalContenidos = progreso.length
      const progresoGeneral = totalContenidos
        ? Math.round((actividadesCompletadas / totalContenidos) * 10000) / 100
        : 0

      const tareasPendientes = tareas.filter(
        (item) => item.estado_entrega === "pendiente"
      ).length

      const tareasEntregadas = tareas.filter(
        (item) => item.estado_entrega === "entregada"
      ).length

      const tareasCalificadas = tareas.filter(
        (item) => item.estado_entrega === "calificada"
      ).length

      return res.json({
        status: "ok",
        alumno,
        periodo_seleccionado: periodoSeleccionado,
        matricula_actual: matriculaSeleccionada,
        resumen: {
          promedio_evaluaciones: promedioEvaluaciones,
          actividades_completadas: actividadesCompletadas,
          total_contenidos: totalContenidos,
          progreso_general: progresoGeneral,
          tareas_asignadas: tareas.length,
          tareas_pendientes: tareasPendientes,
          tareas_entregadas: tareasEntregadas,
          tareas_calificadas: tareasCalificadas,
          necesita_refuerzo:
            promedioEvaluaciones !== null && promedioEvaluaciones < 60
        },
        progreso,
        evaluaciones,
        tareas,
        historial_matriculas: matriculas,
        nota_evaluaciones:
          "Las evaluaciones actuales no guardan periodo_id; por eso el historial de evaluaciones se muestra de forma global. Las tareas y matrículas sí respetan el periodo seleccionado."
      })
    } catch (error) {
      return responderError(
        res,
        error,
        "Error al obtener la ficha académica del alumno"
      )
    }
  })

  return router
}

module.exports = crearRutasAlumnosAcademico
