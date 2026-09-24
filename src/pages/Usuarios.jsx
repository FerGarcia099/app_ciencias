import { useEffect, useState } from "react"
import axios from "axios"
import Sidebar from "../components/Sidebar"
import { API_URL } from "../config"
import "./AdminModules.css"

function Usuarios() {
  const [nombre, setNombre] = useState("")
  const [usuario, setUsuario] = useState("")
  const [password, setPassword] = useState("")
  const [rol, setRol] = useState("alumno")
  const [usuarios, setUsuarios] = useState([])

  const [modoEdicion, setModoEdicion] = useState(false)
  const [usuarioEditandoId, setUsuarioEditandoId] = useState(null)

  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [usuarioPasswordId, setUsuarioPasswordId] = useState(null)
  const [usuarioPasswordNombre, setUsuarioPasswordNombre] = useState("")
  const [nuevaPassword, setNuevaPassword] = useState("")
  const [confirmarPassword, setConfirmarPassword] = useState("")

  const [usuarioEstado, setUsuarioEstado] = useState(null)
  const [accionEstado, setAccionEstado] = useState("")
  const [procesandoEstado, setProcesandoEstado] = useState(false)

  const usuarioSesionId = Number(localStorage.getItem("usuarioId"))

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
        alert(
          error.response?.data?.mensaje ||
            "Error al obtener usuarios"
        )
      })
  }

  const cancelarEdicion = () => {
    setNombre("")
    setUsuario("")
    setPassword("")
    setRol("alumno")
    setUsuarioEditandoId(null)
    setModoEdicion(false)
  }

  const editarUsuario = (id) => {
    axios
      .get(`${API_URL}/usuarios/${id}`)
      .then((res) => {
        const item = res.data

        setNombre(item.nombre)
        setUsuario(item.usuario)
        setRol(item.rol)
        setPassword("")
        setUsuarioEditandoId(item.id)
        setModoEdicion(true)
      })
      .catch((error) => {
        console.error(error)
        alert(
          error.response?.data?.mensaje ||
            "Error al obtener usuario"
        )
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
          cancelarEdicion()
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
        alert(
          error.response?.data?.mensaje ||
            "Error al conectar con el servidor"
        )
      })
  }

  const actualizarUsuario = () => {
    if (
      nombre.trim() === "" ||
      usuario.trim() === "" ||
      rol.trim() === ""
    ) {
      alert("Nombre, usuario y rol son obligatorios")
      return
    }

    axios
      .put(`${API_URL}/usuarios/${usuarioEditandoId}`, {
        nombre,
        usuario,
        rol
      })
      .then((res) => {
        if (res.data.status === "ok") {
          alert("Usuario actualizado correctamente")
          cancelarEdicion()
          obtenerUsuarios()
        } else {
          alert(
            res.data.mensaje ||
              "Error al actualizar usuario"
          )
        }
      })
      .catch((error) => {
        console.error(error)
        alert(
          error.response?.data?.mensaje ||
            "Error al actualizar usuario"
        )
      })
  }

  const abrirCambioPassword = (item) => {
    setUsuarioPasswordId(item.id)
    setUsuarioPasswordNombre(item.nombre)
    setNuevaPassword("")
    setConfirmarPassword("")
    setMostrarPassword(true)
  }

  const cancelarCambioPassword = () => {
    setMostrarPassword(false)
    setUsuarioPasswordId(null)
    setUsuarioPasswordNombre("")
    setNuevaPassword("")
    setConfirmarPassword("")
  }

  const cambiarPassword = () => {
    if (nuevaPassword.trim() === "") {
      alert("Escribe la nueva contraseña")
      return
    }

    if (nuevaPassword.length < 4) {
      alert("La contraseña debe tener al menos 4 caracteres")
      return
    }

    if (nuevaPassword !== confirmarPassword) {
      alert("Las contraseñas no coinciden")
      return
    }

    axios
      .put(`${API_URL}/usuarios/${usuarioPasswordId}/password`, {
        password: nuevaPassword
      })
      .then((res) => {
        if (res.data.status === "ok") {
          alert("Contraseña actualizada correctamente")
          cancelarCambioPassword()
        } else {
          alert(
            res.data.mensaje ||
              "No se pudo cambiar la contraseña"
          )
        }
      })
      .catch((error) => {
        console.error(error)
        alert(
          error.response?.data?.mensaje ||
            "Error al cambiar la contraseña"
        )
      })
  }


  const abrirCambioEstado = (item, accion) => {
    setUsuarioEstado(item)
    setAccionEstado(accion)
  }

  const cancelarCambioEstado = () => {
    if (procesandoEstado) return

    setUsuarioEstado(null)
    setAccionEstado("")
  }

  const confirmarCambioEstado = () => {
    if (!usuarioEstado || !accionEstado || procesandoEstado) {
      return
    }

    if (
      accionEstado === "desactivar" &&
      Number(usuarioEstado.id) === usuarioSesionId
    ) {
      alert("No puedes desactivar tu propio usuario")
      cancelarCambioEstado()
      return
    }

    setProcesandoEstado(true)

    const peticion =
      accionEstado === "desactivar"
        ? axios.delete(`${API_URL}/usuarios/${usuarioEstado.id}`)
        : axios.put(`${API_URL}/usuarios/${usuarioEstado.id}/restaurar`)

    peticion
      .then((res) => {
        if (res.data.status !== "ok") {
          throw new Error(
            res.data.mensaje ||
              "No se pudo actualizar el estado del usuario"
          )
        }

        if (accionEstado === "desactivar") {
          if (Number(usuarioEditandoId) === Number(usuarioEstado.id)) {
            cancelarEdicion()
          }

          if (Number(usuarioPasswordId) === Number(usuarioEstado.id)) {
            cancelarCambioPassword()
          }
        }

        alert(res.data.mensaje || "Estado actualizado correctamente")
        setUsuarioEstado(null)
        setAccionEstado("")
        obtenerUsuarios()
      })
      .catch((error) => {
        console.error(error)

        alert(
          error.response?.data?.mensaje ||
            error.message ||
            "Error al actualizar el estado del usuario"
        )
      })
      .finally(() => {
        setProcesandoEstado(false)
      })
  }

  return (
    <>
      <Sidebar />

      <div className="admin-page">
        <div className="admin-deco admin-deco-1">👥</div>
        <div className="admin-deco admin-deco-2">✏️</div>
        <div className="admin-deco admin-deco-3">📚</div>

        <main className="admin-container">
          <section className="admin-header">
            <div className="admin-header-info">
              <div className="admin-header-icon">👥</div>

              <div className="admin-header-text">
                <small>Administración de accesos</small>
                <h1>Usuarios</h1>
                <p>Crea y administra cuentas para alumnos y docentes.</p>
              </div>
            </div>

            <div className="admin-counter">
              <strong>{usuarios.length}</strong>
              <span>USUARIOS</span>
            </div>
          </section>

          <div className="admin-grid-two">
            {/* FORMULARIO */}
            <section className="admin-form-card">
              <div className="admin-form-title">
                <div className="admin-form-icon">
                  {modoEdicion ? "✏️" : "➕"}
                </div>

                <div>
                  <h2>
                    {modoEdicion
                      ? "Editar usuario"
                      : "Crear usuario"}
                  </h2>

                  <p>
                    {modoEdicion
                      ? "Modifica los datos del usuario seleccionado."
                      : "Ingresa los datos del nuevo usuario."}
                  </p>
                </div>
              </div>

              <div className="admin-field">
                <label>Nombre completo</label>
                <input
                  type="text"
                  placeholder="Ej. Juan Pérez"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>

              <div className="admin-field">
                <label>Usuario</label>
                <input
                  type="text"
                  placeholder="Ej. jperez"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                />
              </div>

              {!modoEdicion && (
                <div className="admin-field">
                  <label>Contraseña</label>
                  <input
                    type="password"
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              )}

              <div className="admin-field">
                <label>Rol</label>
                <select
                  value={rol}
                  onChange={(e) => setRol(e.target.value)}
                >
                  <option value="alumno">👦 Alumno</option>
                  <option value="maestro">👨‍🏫 Maestro</option>
                </select>
              </div>

              <div className="admin-actions">
                <button
                  type="button"
                  className="admin-primary"
                  onClick={
                    modoEdicion
                      ? actualizarUsuario
                      : guardarUsuario
                  }
                >
                  {modoEdicion
                    ? "💾 Guardar cambios"
                    : "💾 Guardar usuario"}
                </button>

                {modoEdicion && (
                  <button
                    type="button"
                    className="admin-secondary"
                    onClick={cancelarEdicion}
                  >
                    ✖ Cancelar edición
                  </button>
                )}
              </div>
            </section>

            {/* LISTADO */}
            <section className="admin-card">
              <div className="admin-card-header">
                <small>📋 USUARIOS</small>
                <h2>Usuarios registrados</h2>
                <p>Alumnos y docentes del sistema.</p>
              </div>

              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Usuario</th>
                      <th>Rol</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {usuarios.length > 0 ? (
                      usuarios.map((item) => (
                        <tr key={item.id}>
                          <td>{item.nombre}</td>
                          <td>@{item.usuario}</td>

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

                          <td>
                            {Number(item.activo) === 1 ? (
                              <span className="usuario-estado usuario-activo">
                                ● Activo
                              </span>
                            ) : (
                              <span className="usuario-estado usuario-inactivo">
                                ● Inactivo
                              </span>
                            )}
                          </td>

                          <td>
                            <div className="usuario-acciones">
                              <button
                                type="button"
                                title="Editar usuario"
                                onClick={() => editarUsuario(item.id)}
                              >
                                ✏️
                              </button>

                              <button
                                type="button"
                                title="Cambiar contraseña"
                                onClick={() => abrirCambioPassword(item)}
                              >
                                🔑
                              </button>

                              {Number(item.activo) === 1 ? (
                                Number(item.id) === usuarioSesionId ? (
                                  <button
                                    type="button"
                                    className="usuario-action-disabled"
                                    title="No puedes desactivar tu propio usuario"
                                    disabled
                                  >
                                    🚫
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    title="Desactivar usuario"
                                    onClick={() =>
                                      abrirCambioEstado(item, "desactivar")
                                    }
                                  >
                                    🚫
                                  </button>
                                )
                              ) : (
                                <button
                                  type="button"
                                  title="Reactivar usuario"
                                  onClick={() =>
                                    abrirCambioEstado(item, "reactivar")
                                  }
                                >
                                  ✅
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5">
                          No hay usuarios registrados
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {mostrarPassword && (
            <div
              className="usuario-modal-backdrop"
              onClick={cancelarCambioPassword}
            >
              <section
                className="usuario-modal"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="admin-form-title">
                  <div className="admin-form-icon">🔑</div>

                  <div>
                    <h2>Cambiar contraseña</h2>
                    <p>
                      Usuario: <strong>{usuarioPasswordNombre}</strong>
                    </p>
                  </div>
                </div>

                <div className="admin-field">
                  <label>Nueva contraseña</label>
                  <input
                    type="password"
                    placeholder="Nueva contraseña"
                    value={nuevaPassword}
                    onChange={(e) => setNuevaPassword(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="admin-field">
                  <label>Confirmar contraseña</label>
                  <input
                    type="password"
                    placeholder="Repite la contraseña"
                    value={confirmarPassword}
                    onChange={(e) => setConfirmarPassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") cambiarPassword()
                    }}
                  />
                </div>

                <div className="admin-actions">
                  <button
                    type="button"
                    className="admin-primary"
                    onClick={cambiarPassword}
                  >
                    🔑 Cambiar contraseña
                  </button>

                  <button
                    type="button"
                    className="admin-secondary"
                    onClick={cancelarCambioPassword}
                  >
                    ✖ Cancelar
                  </button>
                </div>
              </section>
            </div>
          )}

          {usuarioEstado && (
            <div
              className="usuario-modal-backdrop"
              onClick={cancelarCambioEstado}
            >
              <section
                className="usuario-modal usuario-modal-confirmacion"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="admin-form-title">
                  <div className="admin-form-icon">
                    {accionEstado === "desactivar" ? "🚫" : "✅"}
                  </div>

                  <div>
                    <h2>
                      {accionEstado === "desactivar"
                        ? "Desactivar usuario"
                        : "Reactivar usuario"}
                    </h2>

                    <p>
                      {accionEstado === "desactivar"
                        ? "El usuario no podrá iniciar sesión hasta que lo reactives."
                        : "El usuario podrá volver a iniciar sesión."}
                    </p>
                  </div>
                </div>

                <div className="usuario-confirmacion-nombre">
                  {usuarioEstado.nombre}
                  <small>@{usuarioEstado.usuario}</small>
                </div>

                <div className="admin-actions">
                  <button
                    type="button"
                    className={
                      accionEstado === "desactivar"
                        ? "usuario-btn-danger"
                        : "usuario-btn-success"
                    }
                    onClick={confirmarCambioEstado}
                    disabled={procesandoEstado}
                  >
                    {procesandoEstado
                      ? "Procesando..."
                      : accionEstado === "desactivar"
                        ? "🚫 Sí, desactivar"
                        : "✅ Sí, reactivar"}
                  </button>

                  <button
                    type="button"
                    className="admin-secondary"
                    onClick={cancelarCambioEstado}
                    disabled={procesandoEstado}
                  >
                    Cancelar
                  </button>
                </div>
              </section>
            </div>
          )}

        </main>
      </div>
    </>
  )
}

export default Usuarios
