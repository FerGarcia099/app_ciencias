import { Navigate } from "react-router-dom"

function obtenerPayloadToken(token) {
  try {
    const parte = token.split(".")[1]

    if (!parte) return null

    const normalizado = parte.replace(/-/g, "+").replace(/_/g, "/")
    const json = decodeURIComponent(
      atob(normalizado)
        .split("")
        .map((caracter) =>
          `%${caracter.charCodeAt(0).toString(16).padStart(2, "0")}`
        )
        .join("")
    )

    return JSON.parse(json)
  } catch {
    return null
  }
}

function obtenerSesionValida() {
  try {
    const token = localStorage.getItem("token")
    const data = localStorage.getItem("usuario")

    if (!token || !data) {
      return null
    }

    const usuario = JSON.parse(data)
    const payload = obtenerPayloadToken(token)

    if (!usuario?.id || !usuario?.rol || !payload?.exp) {
      return null
    }

    const ahora = Math.floor(Date.now() / 1000)

    if (payload.exp <= ahora) {
      return null
    }

    if (
      Number(payload.sub) !== Number(usuario.id) ||
      payload.rol !== usuario.rol
    ) {
      return null
    }

    return usuario
  } catch {
    return null
  }
}

function ProtectedRoute({ children, rolesPermitidos = [] }) {
  const usuario = obtenerSesionValida()

  if (!usuario) {
    localStorage.clear()
    return <Navigate to="/" replace />
  }

  if (
    rolesPermitidos.length > 0 &&
    !rolesPermitidos.includes(usuario.rol)
  ) {
    if (usuario.rol === "alumno") {
      return <Navigate to="/panelAlumno" replace />
    }

    if (usuario.rol === "maestro") {
      return <Navigate to="/panel" replace />
    }

    localStorage.clear()
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute
