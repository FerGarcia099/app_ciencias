import { NavLink, useNavigate } from "react-router-dom"
import "./Sidebar.css"

function Sidebar() {
  const navigate = useNavigate()

  const salir = () => {
    localStorage.clear()
    navigate("/")
  }

  const claseLink = ({ isActive }) =>
    `sidebar-link ${isActive ? "sidebar-activo" : ""}`

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">🎒</div>

        <div>
          <h2>Eco Holistic</h2>
          <span>Panel educativo</span>
        </div>
      </div>

      <div className="sidebar-separador">MENÚ PRINCIPAL</div>

      <nav className="sidebar-nav">
        <NavLink to="/panel" className={claseLink}>
          <span className="sidebar-icon">🏠</span>
          <span>Inicio</span>
        </NavLink>

        <NavLink to="/alumnos" className={claseLink}>
          <span className="sidebar-icon">👦</span>
          <span>Alumnos</span>
        </NavLink>

        <NavLink to="/maestros" className={claseLink}>
          <span className="sidebar-icon">👨‍🏫</span>
          <span>Maestros</span>
        </NavLink>

        <NavLink to="/usuarios" className={claseLink}>
          <span className="sidebar-icon">👥</span>
          <span>Crear usuarios</span>
        </NavLink>

        <NavLink to="/contenidos" className={claseLink}>
          <span className="sidebar-icon">📚</span>
          <span>Contenidos</span>
        </NavLink>

        <NavLink to="/seguimiento" className={claseLink}>
          <span className="sidebar-icon">📊</span>
          <span>Seguimiento</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <button className="sidebar-salir" onClick={salir}>
          <span>🚪</span>
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
