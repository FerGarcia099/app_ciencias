import { Routes, Route } from "react-router-dom"

import Login from "./App"
import Panel from "./pages/Panel"
import PanelAlumno from "./pages/PanelAlumno"
import ListaAlumnos from "./pages/ListaAlumnos"
import Maestros from "./pages/Maestros"
import Usuarios from "./pages/Usuarios"
import Contenidos from "./pages/Contenidos"
import ContenidoAlumno from "./pages/ContenidoAlumno"
import Seguimiento from "./pages/Seguimiento"

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/panel" element={<Panel />} />
      <Route path="/panelAlumno" element={<PanelAlumno />} />
      <Route path="/alumnos" element={<ListaAlumnos />} />
      <Route path="/maestros" element={<Maestros />} />
      <Route path="/usuarios" element={<Usuarios />} />
      <Route path="/contenidos" element={<Contenidos />} />
      <Route path="/seguimiento" element={<Seguimiento />} />
      <Route path="/contenido-alumno/:id" element={<ContenidoAlumno />} />
      <Route path="/contenidoAlumno" element={<PanelAlumno />} />
    </Routes>
  )
}

export default AppRouter
