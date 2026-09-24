import { useEffect, useState } from "react"
import axios from "axios"
import Sidebar from "../components/Sidebar"
import { API_URL } from "../config"
import "./AdminModules.css"

function Maestros() {
  const [maestros, setMaestros] = useState([])

  useEffect(() => {
    obtenerMaestros()
  }, [])

  const obtenerMaestros = () => {
    axios
      .get(`${API_URL}/maestros`)
      .then((res) => {
        setMaestros(res.data)
      })
      .catch((error) => {
        console.error(error)
        alert(
          error.response?.data?.mensaje ||
            "Error al obtener la lista de docentes"
        )
      })
  }

  return (
    <>
      <Sidebar />

      <div className="admin-page">
        <div className="admin-deco admin-deco-1">📐</div>
        <div className="admin-deco admin-deco-2">📖</div>
        <div className="admin-deco admin-deco-3">🎓</div>

        <main className="admin-container">
          <section className="admin-header">
            <div className="admin-header-info">
              <div className="admin-header-icon">👨‍🏫</div>

              <div className="admin-header-text">
                <small>Gestión escolar</small>
                <h1>Docentes</h1>
                <p>
                  Consulta el personal docente activo. Las cuentas y contraseñas
                  se administran desde Usuarios.
                </p>
              </div>
            </div>

            <div className="admin-counter">
              <strong>{maestros.length}</strong>
              <span>DOCENTES ACTIVOS</span>
            </div>
          </section>

          <section className="admin-card">
            <div className="admin-card-header">
              <small>👨‍🏫 PERSONAL DOCENTE</small>
              <h2>Lista de docentes</h2>
              <p>
                En una siguiente fase este módulo mostrará cursos, grados,
                secciones y grupos asignados a cada docente.
              </p>
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Docente</th>
                    <th>Usuario</th>
                    <th>Tipo</th>
                  </tr>
                </thead>

                <tbody>
                  {maestros.length > 0 ? (
                    maestros.map((maestro) => (
                      <tr key={maestro.id}>
                        <td>
                          <div className="persona-info">
                            <div className="persona-avatar">👨‍🏫</div>

                            <span className="persona-nombre">
                              {maestro.nombre}
                            </span>
                          </div>
                        </td>

                        <td>@{maestro.usuario}</td>

                        <td>
                          <span className="badge-admin badge-maestro">
                            Docente
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3">
                        <div className="admin-empty">
                          <div className="admin-empty-icon">📭</div>
                          No hay docentes activos registrados
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </>
  )
}

export default Maestros
