import { Navigate, Route, Routes } from "react-router-dom"

import Login from "./App"
import Panel from "./pages/Panel"
import PanelAlumno from "./pages/PanelAlumno"
import ListaAlumnos from "./pages/ListaAlumnos"
import Maestros from "./pages/Maestros"
import Usuarios from "./pages/Usuarios"
import Contenidos from "./pages/Contenidos"
import ContenidoAlumno from "./pages/ContenidoAlumno"
import Seguimiento from "./pages/Seguimiento"

import ProtectedRoute from "./components/ProtectedRoute"

function AppRouter() {
  return (
    <Routes>
      {/* Ruta pública */}
      <Route path="/" element={<Login />} />

      {/* ================================
          RUTAS DEL MAESTRO
      ================================= */}
      <Route
        path="/panel"
        element={
          <ProtectedRoute rolesPermitidos={["maestro"]}>
            <Panel />
          </ProtectedRoute>
        }
      />

      <Route
        path="/alumnos"
        element={
          <ProtectedRoute rolesPermitidos={["maestro"]}>
            <ListaAlumnos />
          </ProtectedRoute>
        }
      />

      <Route
        path="/maestros"
        element={
          <ProtectedRoute rolesPermitidos={["maestro"]}>
            <Maestros />
          </ProtectedRoute>
        }
      />

      <Route
        path="/usuarios"
        element={
          <ProtectedRoute rolesPermitidos={["maestro"]}>
            <Usuarios />
          </ProtectedRoute>
        }
      />

      <Route
        path="/contenidos"
        element={
          <ProtectedRoute rolesPermitidos={["maestro"]}>
            <Contenidos />
          </ProtectedRoute>
        }
      />

      <Route
        path="/seguimiento"
        element={
          <ProtectedRoute rolesPermitidos={["maestro"]}>
            <Seguimiento />
          </ProtectedRoute>
        }
      />

      {/* ================================
          RUTAS DEL ALUMNO
      ================================= */}
      <Route
        path="/panelAlumno"
        element={
          <ProtectedRoute rolesPermitidos={["alumno"]}>
            <PanelAlumno />
          </ProtectedRoute>
        }
      />

      <Route
        path="/contenido-alumno/:id"
        element={
          <ProtectedRoute rolesPermitidos={["alumno"]}>
            <ContenidoAlumno />
          </ProtectedRoute>
        }
      />

      <Route
        path="/contenidoAlumno"
        element={
          <ProtectedRoute rolesPermitidos={["alumno"]}>
            <PanelAlumno />
          </ProtectedRoute>
        }
      />

      {/* Cualquier URL desconocida vuelve al login */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default AppRouter