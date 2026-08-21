import { Navigate } from "react-router-dom"

function obtenerUsuarioSesion() {
  try {
    const data = localStorage.getItem("usuario")

    if (!data) {
      return null
    }

    const usuario = JSON.parse(data)

    if (!usuario?.id || !usuario?.rol) {
      return null
    }

    return usuario
  } catch {
    return null
  }
}

function ProtectedRoute({ children, rolesPermitidos = [] }) {
  const usuario = obtenerUsuarioSesion()

  // No existe una sesión válida
  if (!usuario) {
    localStorage.clear()
    return <Navigate to="/" replace />
  }

  // Existe sesión, pero el rol no tiene permiso para esta ruta
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