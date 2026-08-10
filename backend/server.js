const express = require("express")
const mysql = require("mysql2")
const cors = require("cors")
require("dotenv").config()

const app = express()

app.use(cors())
app.use(express.json())

// CONEXIÓN A MYSQL
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

// RUTA DE PRUEBA
app.get("/", (req, res) => {
  res.send("Servidor funcionando correctamente")
})

// LOGIN CON ROLES
app.post("/login", (req, res) => {
  const { usuario, password } = req.body

  if (!usuario || !password) {
    return res.json({
      status: "error",
      mensaje: "Usuario y contraseña son obligatorios"
    })
  }

  const sql = "SELECT * FROM usuarios WHERE usuario = ? AND password = ?"

  conexion.query(sql, [usuario, password], (err, result) => {
    if (err) {
      console.log("Error en login:", err)

      return res.json({
        status: "error",
        mensaje: "Error en el servidor"
      })
    }

    if (result.length > 0) {
      return res.json({
        status: "ok",
        nombre: result[0].nombre,
        rol: result[0].rol
      })
    } else {
      return res.json({
        status: "error",
        mensaje: "Usuario o contraseña incorrectos"
      })
    }
  })
})

// CREAR USUARIO
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

  const verificar = "SELECT * FROM usuarios WHERE usuario = ?"

  conexion.query(verificar, [usuario], (err, result) => {
    if (err) {
      console.log("Error al verificar usuario:", err)

      return res.json({
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

    const sql = "INSERT INTO usuarios(nombre, usuario, password, rol) VALUES (?, ?, ?, ?)"

    conexion.query(sql, [nombre, usuario, password, rol], (err, result) => {
      if (err) {
        console.log("Error al crear usuario:", err)

        return res.json({
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

// LISTAR USUARIOS
app.get("/usuarios", (req, res) => {
  const sql = "SELECT id, nombre, usuario, rol FROM usuarios"

  conexion.query(sql, (err, result) => {
    if (err) {
      console.log("Error al obtener usuarios:", err)

      return res.json({
        status: "error",
        mensaje: "Error al obtener usuarios"
      })
    }

    return res.json(result)
  })
})

// REGISTRAR ALUMNO
app.post("/alumnos", (req, res) => {
  const { nombre, grado, seccion } = req.body

  if (!nombre || !grado || !seccion) {
    return res.json({
      status: "error",
      mensaje: "Todos los campos son obligatorios"
    })
  }

  const sql = "INSERT INTO alumnos(nombre, grado, seccion) VALUES (?, ?, ?)"

  conexion.query(sql, [nombre, grado, seccion], (err, result) => {
    if (err) {
      console.log("Error al registrar alumno:", err)

      return res.json({
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

// VER SOLO USUARIOS CON ROL ALUMNO
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

      return res.json({
        status: "error",
        mensaje: "Error al obtener alumnos"
      })
    }

    return res.json(result)
  })
})

// REGISTRO DE USUARIO PARA LOGIN
app.post("/registro", (req, res) => {
  const { nombre, usuario, password } = req.body

  if (!nombre || !usuario || !password) {
    return res.json({
      status: "error",
      mensaje: "Todos los campos son obligatorios"
    })
  }

  const sql = "INSERT INTO usuarios(nombre, usuario, password) VALUES (?, ?, ?)"

  conexion.query(sql, [nombre, usuario, password], (err, result) => {
    if (err) {
      console.log("Error al registrar usuario:", err)

      return res.json({
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
// ===============================
// CONTENIDOS
// ===============================

// CREAR CONTENIDO
app.post("/contenidos", (req, res) => {
  const { titulo, descripcion, grado } = req.body

  if (!titulo || !descripcion || !grado) {
    return res.json({
      status: "error",
      mensaje: "Todos los campos son obligatorios"
    })
  }

  const sql = "INSERT INTO contenidos(titulo, descripcion, grado) VALUES (?, ?, ?)"

  conexion.query(sql, [titulo, descripcion, grado], (err, result) => {
    if (err) {
      console.log("Error al crear contenido:", err)

      return res.json({
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

// LISTAR CONTENIDOS
app.get("/contenidos", (req, res) => {
  const sql = "SELECT * FROM contenidos ORDER BY id DESC"

  conexion.query(sql, (err, result) => {
    if (err) {
      console.log("Error al obtener contenidos:", err)

      return res.json({
        status: "error",
        mensaje: "Error al obtener contenidos"
      })
    }

    return res.json(result)
  })
})

// OBTENER UN CONTENIDO POR ID
app.get("/contenidos/:id", (req, res) => {
  const { id } = req.params

  const sql = "SELECT * FROM contenidos WHERE id = ?"

  conexion.query(sql, [id], (err, result) => {
    if (err) {
      console.log("Error al obtener contenido:", err)

      return res.json({
        status: "error",
        mensaje: "Error al obtener contenido"
      })
    }

    if (result.length === 0) {
      return res.json({
        status: "error",
        mensaje: "Contenido no encontrado"
      })
    }

    return res.json(result[0])
  })
})

// ===============================
// PREGUNTAS
// ===============================

// CREAR PREGUNTA CON PUNTAJE
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
    !puntaje
  ) {
    return res.json({
      status: "error",
      mensaje: "Todos los campos son obligatorios"
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
      respuesta_correcta,
      puntaje
    ],
    (err, result) => {
      if (err) {
        console.log("Error al crear pregunta:", err)

        return res.json({
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

// CREAR PREGUNTA CON PUNTAJE
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
    !puntaje
  ) {
    return res.json({
      status: "error",
      mensaje: "Todos los campos son obligatorios"
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
      respuesta_correcta,
      puntaje
    ],
    (err, result) => {
      if (err) {
        console.log("Error al crear pregunta:", err)

        return res.json({
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

// VER SOLO USUARIOS CON ROL MAESTRO
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

      return res.json({
        status: "error",
        mensaje: "Error al obtener maestros"
      })
    }

    return res.json(result)
  })
})

// SERVIDOR
app.listen(3001, () => {
  console.log("Servidor corriendo en puerto 3001")
})