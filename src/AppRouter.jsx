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
import Parametrizaciones from "./pages/Parametrizaciones"
import Matriculas from "./pages/Matriculas"
import AsignacionesDocente from "./pages/AsignacionesDocente"
import Tareas from "./pages/Tareas"
import EntregasTareas from "./pages/EntregasTareas"
import Recursos from "./pages/Recursos"
import MisTareas from "./pages/MisTareas"
import AsistenteIA from "./pages/AsistenteIA"

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


      <Route
        path="/parametrizaciones"
        element={
          <ProtectedRoute rolesPermitidos={["maestro"]}>
            <Parametrizaciones />
          </ProtectedRoute>
        }
      />

      <Route
        path="/matriculas"
        element={
          <ProtectedRoute rolesPermitidos={["maestro"]}>
            <Matriculas />
          </ProtectedRoute>
        }
      />

      <Route
        path="/asignaciones-docente"
        element={
          <ProtectedRoute rolesPermitidos={["maestro"]}>
            <AsignacionesDocente />
          </ProtectedRoute>
        }
      />

      <Route
        path="/tareas"
        element={
          <ProtectedRoute rolesPermitidos={["maestro"]}>
            <Tareas />
          </ProtectedRoute>
        }
      />

      <Route
        path="/entregas-tareas"
        element={
          <ProtectedRoute rolesPermitidos={["maestro"]}>
            <EntregasTareas />
          </ProtectedRoute>
        }
      />

      <Route
        path="/recursos"
        element={
          <ProtectedRoute rolesPermitidos={["maestro"]}>
            <Recursos />
          </ProtectedRoute>
        }
      />

      <Route
        path="/asistente-ia"
        element={
          <ProtectedRoute rolesPermitidos={["maestro"]}>
            <AsistenteIA />
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

      <Route
        path="/mis-tareas"
        element={
          <ProtectedRoute rolesPermitidos={["alumno"]}>
            <MisTareas />
          </ProtectedRoute>
        }
      />

      {/* Cualquier URL desconocida vuelve al login */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default AppRouter