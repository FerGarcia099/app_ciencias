import { Routes, Route } from "react-router-dom"

// LOGIN
import Login from "./App"

// PANELES
import Panel from "./pages/Panel"
import PanelAlumno from "./pages/PanelAlumno"

// PAGINAS
import ListaAlumnos from "./pages/ListaAlumnos"
import Maestros from "./pages/Maestros"
import Usuarios from "./pages/Usuarios"
import Contenidos from "./pages/Contenidos"
import ContenidoAlumno from "./pages/ContenidoAlumno"

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
      <Route path="/contenidoAlumno" element={<ContenidoAlumno />} />
    </Routes>
  )
}

export default AppRouter