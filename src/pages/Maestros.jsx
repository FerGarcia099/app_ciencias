import { useEffect, useState } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import Sidebar from "../components/Sidebar"
import { API_URL } from "../config"
import "./AdminModules.css"

function Maestros() {
  const navigate = useNavigate()
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
        alert("Error al obtener la lista de maestros")
      })
  }

  return (
    <>
      <Sidebar />

      <div className="admin-page">

        <div className="admin-deco admin-deco-1">
          📐
        </div>

        <div className="admin-deco admin-deco-2">
          📖
        </div>

        <div className="admin-deco admin-deco-3">
          🎓
        </div>

        <main className="admin-container">

          <section className="admin-header">

            <div className="admin-header-info">

              <div className="admin-header-icon">
                👨‍🏫
              </div>

              <div className="admin-header-text">

                <small>
                  Equipo docente
                </small>

                <h1>
                  Maestros registrados
                </h1>

                <p>
                  Consulta los docentes con acceso
                  administrativo al sistema.
                </p>

              </div>

            </div>

            <div className="admin-counter">
              <strong>
                {maestros.length}
              </strong>

              <span>
                MAESTROS
              </span>
            </div>

          </section>

          <section className="admin-card">

            <div className="admin-card-header">

              <small>
                👨‍🏫 PERSONAL DOCENTE
              </small>

              <h2>
                Lista de maestros
              </h2>

              <p>
                Usuarios registrados con rol maestro.
              </p>

            </div>

            <button
              className="admin-back"
              onClick={() =>
                navigate("/panel")
              }
            >
              ← Regresar al panel
            </button>

            <div className="admin-table-wrapper">

              <table className="admin-table">

                <thead>
                  <tr>
                    <th>Maestro</th>
                    <th>Usuario</th>
                    <th>Rol</th>
                  </tr>
                </thead>

                <tbody>

                  {maestros.length > 0 ? (
                    maestros.map((maestro) => (

                      <tr key={maestro.id}>

                        <td>
                          <div className="persona-info">

                            <div className="persona-avatar">
                              👨‍🏫
                            </div>

                            <span className="persona-nombre">
                              {maestro.nombre}
                            </span>

                          </div>
                        </td>

                        <td>
                          @{maestro.usuario}
                        </td>

                        <td>
                          <span className="badge-admin badge-maestro">
                            {maestro.rol || "Maestro"}
                          </span>
                        </td>

                      </tr>

                    ))
                  ) : (

                    <tr>
                      <td colSpan="3">

                        <div className="admin-empty">
                          <div className="admin-empty-icon">
                            📭
                          </div>

                          No hay maestros registrados
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