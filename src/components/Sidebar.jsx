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

      <nav className="sidebar-nav">
        <div className="sidebar-separador">INICIO</div>

        <NavLink to="/panel" className={claseLink}>
          <span className="sidebar-icon">🏠</span>
          <span>Dashboard</span>
        </NavLink>

        <div className="sidebar-separador sidebar-separador-interno">
          GESTIÓN ESCOLAR
        </div>

        <NavLink to="/alumnos" className={claseLink}>
          <span className="sidebar-icon">👦</span>
          <span>Alumnos</span>
        </NavLink>

        <NavLink to="/maestros" className={claseLink}>
          <span className="sidebar-icon">👨‍🏫</span>
          <span>Docentes</span>
        </NavLink>

        <NavLink to="/usuarios" className={claseLink}>
          <span className="sidebar-icon">👥</span>
          <span>Usuarios</span>
        </NavLink>

        <div className="sidebar-separador sidebar-separador-interno">
          APRENDIZAJE
        </div>

        <NavLink to="/contenidos" className={claseLink}>
          <span className="sidebar-icon">📚</span>
          <span>Contenidos</span>
        </NavLink>

        <NavLink to="/tareas" className={claseLink}>
          <span className="sidebar-icon">📝</span>
          <span>Tareas</span>
        </NavLink>

        <NavLink to="/entregas-tareas" className={claseLink}>
          <span className="sidebar-icon">📥</span>
          <span>Entregas</span>
        </NavLink>

        <NavLink to="/recursos" className={claseLink}>
          <span className="sidebar-icon">📎</span>
          <span>Recursos</span>
        </NavLink>

        <div className="sidebar-separador sidebar-separador-interno">
          SEGUIMIENTO
        </div>

        <NavLink to="/seguimiento" className={claseLink}>
          <span className="sidebar-icon">📊</span>
          <span>Seguimiento</span>
        </NavLink>

        <NavLink to="/asistente-ia" className={claseLink}>
          <span className="sidebar-icon">🤖</span>
          <span>Asistente IA</span>
        </NavLink>

        <div className="sidebar-separador sidebar-separador-interno">
          CONFIGURACIÓN
        </div>

        <NavLink to="/parametrizaciones" className={claseLink}>
          <span className="sidebar-icon">⚙️</span>
          <span>Parametrizaciones</span>
        </NavLink>

        <NavLink to="/matriculas" className={claseLink}>
          <span className="sidebar-icon">🎓</span>
          <span>Matrículas</span>
        </NavLink>

        <NavLink to="/asignaciones-docente" className={claseLink}>
          <span className="sidebar-icon">🧑‍🏫</span>
          <span>Asignaciones docentes</span>
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
