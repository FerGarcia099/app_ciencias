import { useEffect, useState } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"

function Usuarios() {
  const navigate = useNavigate()

  const [nombre, setNombre] = useState("")
  const [usuario, setUsuario] = useState("")
  const [password, setPassword] = useState("")
  const [rol, setRol] = useState("alumno")
  const [usuarios, setUsuarios] = useState([])

  useEffect(() => {
    obtenerUsuarios()
  }, [])

  const obtenerUsuarios = () => {
    axios.get("http://localhost:3001/usuarios")
      .then(res => {
        setUsuarios(res.data)
      })
      .catch(error => {
        console.error(error)
        alert("Error al obtener usuarios")
      })
  }

  const guardarUsuario = () => {
    if (
      nombre.trim() === "" ||
      usuario.trim() === "" ||
      password.trim() === "" ||
      rol.trim() === ""
    ) {
      alert("Todos los campos son obligatorios")
      return
    }

    axios.post("http://localhost:3001/usuarios", {
      nombre,
      usuario,
      password,
      rol
    })
    .then(res => {
      if (res.data.status === "ok") {
        alert("Usuario creado correctamente")

        setNombre("")
        setUsuario("")
        setPassword("")
        setRol("alumno")

        obtenerUsuarios()
      } else {
        alert(res.data.mensaje || "Error al crear usuario")
      }
    })
    .catch(error => {
      console.error(error)
      alert("Error al conectar con el servidor")
    })
  }

  return (
    <div className="contenido">
      <div className="usuarios-doble-panel">

        <div className="form-card usuarios-form">
          <h2>Crear Usuarios 👥</h2>

          <input
            type="text"
            placeholder="Nombre completo"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />

          <input
            type="text"
            placeholder="Usuario"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <select
            className="select-rol"
            value={rol}
            onChange={(e) => setRol(e.target.value)}
          >
            <option value="alumno">Alumno</option>
            <option value="maestro">Maestro</option>
          </select>

          <div className="acciones-form">
            <button onClick={guardarUsuario}>
              Guardar Usuario
            </button>

            <button className="btn-regresar" onClick={() => navigate("/panel")}>
              ⬅️ Regresar
            </button>
          </div>
        </div>

        <div className="tabla-card usuarios-tabla">
          <h2>Lista de Usuarios 📋</h2>

          <table className="tabla-alumnos">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Usuario</th>
                <th>Rol</th>
              </tr>
            </thead>

            <tbody>
              {usuarios.length > 0 ? (
                usuarios.map((item) => (
                  <tr key={item.id}>
                    <td>{item.nombre}</td>
                    <td>{item.usuario}</td>
                    <td>
                      <span className={item.rol === "maestro" ? "rol-maestro" : "rol-alumno"}>
                        {item.rol}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3">No hay usuarios registrados</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}

export default Usuarios