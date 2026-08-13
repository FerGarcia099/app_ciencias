import { useEffect, useState } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import Sidebar from "../components/Sidebar"
import { API_URL } from "../config"
import "./AdminModules.css"

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
    axios
      .get(`${API_URL}/usuarios`)
      .then((res) => {
        setUsuarios(res.data)
      })
      .catch((error) => {
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

    axios
      .post(`${API_URL}/usuarios`, {
        nombre,
        usuario,
        password,
        rol
      })
      .then((res) => {
        if (res.data.status === "ok") {

          alert("Usuario creado correctamente")

          setNombre("")
          setUsuario("")
          setPassword("")
          setRol("alumno")

          obtenerUsuarios()

        } else {

          alert(
            res.data.mensaje ||
              "Error al crear usuario"
          )

        }
      })
      .catch((error) => {
        console.error(error)
        alert("Error al conectar con el servidor")
      })
  }

  return (
    <>
      <Sidebar />

      <div className="admin-page">

        <div className="admin-deco admin-deco-1">
          👥
        </div>

        <div className="admin-deco admin-deco-2">
          ✏️
        </div>

        <div className="admin-deco admin-deco-3">
          📚
        </div>

        <main className="admin-container">

          <section className="admin-header">

            <div className="admin-header-info">

              <div className="admin-header-icon">
                👥
              </div>

              <div className="admin-header-text">

                <small>
                  Administración de accesos
                </small>

                <h1>
                  Usuarios
                </h1>

                <p>
                  Crea cuentas para alumnos y maestros.
                </p>

              </div>

            </div>

            <div className="admin-counter">

              <strong>
                {usuarios.length}
              </strong>

              <span>
                USUARIOS
              </span>

            </div>

          </section>

          <div className="admin-grid-two">

            {/* FORMULARIO */}

            <section className="admin-form-card">

              <div className="admin-form-title">

                <div className="admin-form-icon">
                  ➕
                </div>

                <div>
                  <h2>
                    Crear usuario
                  </h2>

                  <p>
                    Ingresa los datos del nuevo usuario.
                  </p>
                </div>

              </div>

              <div className="admin-field">
                <label>
                  Nombre completo
                </label>

                <input
                  type="text"
                  placeholder="Ej. Juan Pérez"
                  value={nombre}
                  onChange={(e) =>
                    setNombre(e.target.value)
                  }
                />
              </div>

              <div className="admin-field">
                <label>
                  Usuario
                </label>

                <input
                  type="text"
                  placeholder="Ej. jperez"
                  value={usuario}
                  onChange={(e) =>
                    setUsuario(e.target.value)
                  }
                />
              </div>

              <div className="admin-field">
                <label>
                  Contraseña
                </label>

                <input
                  type="password"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                />
              </div>

              <div className="admin-field">
                <label>
                  Rol
                </label>

                <select
                  value={rol}
                  onChange={(e) =>
                    setRol(e.target.value)
                  }
                >
                  <option value="alumno">
                    👦 Alumno
                  </option>

                  <option value="maestro">
                    👨‍🏫 Maestro
                  </option>
                </select>
              </div>

              <div className="admin-actions">

                <button
                  className="admin-primary"
                  onClick={guardarUsuario}
                >
                  💾 Guardar usuario
                </button>

                <button
                  className="admin-secondary"
                  onClick={() =>
                    navigate("/panel")
                  }
                >
                  ← Regresar
                </button>

              </div>

            </section>

            {/* LISTADO */}

            <section className="admin-card">

              <div className="admin-card-header">

                <small>
                  📋 USUARIOS
                </small>

                <h2>
                  Usuarios registrados
                </h2>

                <p>
                  Alumnos y maestros del sistema.
                </p>

              </div>

              <div className="admin-table-wrapper">

                <table className="admin-table">

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

                          <td>
                            {item.nombre}
                          </td>

                          <td>
                            @{item.usuario}
                          </td>

                          <td>
                            <span
                              className={
                                item.rol === "maestro"
                                  ? "badge-admin badge-maestro"
                                  : "badge-admin badge-alumno"
                              }
                            >
                              {item.rol}
                            </span>
                          </td>

                        </tr>

                      ))
                    ) : (

                      <tr>
                        <td colSpan="3">
                          No hay usuarios registrados
                        </td>
                      </tr>

                    )}

                  </tbody>

                </table>

              </div>

            </section>

          </div>

        </main>

      </div>
    </>
  )
}

export default Usuarios