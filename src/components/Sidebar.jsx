import { Link, useNavigate } from "react-router-dom"
import "./Sidebar.css"

function Sidebar() {
  const navigate = useNavigate()

  const salir = () => {
    localStorage.clear()
    navigate("/")
  }

  return (
    <div className="sidebar">
      <h2 className="logo">🎒 Escuela</h2>

      <Link to="/panel" className="sidebar-link">
        🏠 Inicio
      </Link>

      <Link to="/alumnos" className="sidebar-link">
        👦 Alumnos
      </Link>

      <Link to="/maestros" className="sidebar-link">
        👩‍🏫 Maestros
      </Link>

      <Link to="/usuarios" className="sidebar-link">
        👥 Crear Usuarios
      </Link>

      <Link to="/contenidos" className="sidebar-link">
        📚 Contenidos
      </Link>

      <button className="sidebar-link salir" onClick={salir}>
        🚪 Salir
      </button>
    </div>
  )
}

export default Sidebar