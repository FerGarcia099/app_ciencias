import { useEffect, useState } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import Sidebar from "../components/Sidebar"
import { API_URL } from "../config"
import "./AdminModules.css"

function ListaAlumnos() {
  const navigate = useNavigate()
  const [alumnos, setAlumnos] = useState([])

  useEffect(() => {
    obtenerAlumnos()
  }, [])

  const obtenerAlumnos = () => {
    axios
      .get(`${API_URL}/alumnos`)
      .then((res) => {
        setAlumnos(res.data)
      })
      .catch((error) => {
        console.error(error)
        alert("Error al obtener la lista de alumnos")
      })
  }

  return (
    <>
      <Sidebar />

      <div className="admin-page">

        <div className="admin-deco admin-deco-1">
          📚
        </div>

        <div className="admin-deco admin-deco-2">
          ✏️
        </div>

        <div className="admin-deco admin-deco-3">
          🎒
        </div>

        <main className="admin-container">

          <section className="admin-header">

            <div className="admin-header-info">

              <div className="admin-header-icon">
                👦
              </div>

              <div className="admin-header-text">
                <small>
                  Gestión escolar
                </small>

                <h1>
                  Alumnos registrados
                </h1>

                <p>
                  Consulta los estudiantes con acceso
                  a la plataforma.
                </p>
              </div>

            </div>

            <div className="admin-counter">
              <strong>
                {alumnos.length}
              </strong>

              <span>
                ALUMNOS
              </span>
            </div>

          </section>

          <section className="admin-card">

            <div className="admin-card-header">
              <small>
                👨‍🎓 ESTUDIANTES
              </small>

              <h2>
                Lista de alumnos
              </h2>

              <p>
                Usuarios registrados con rol de alumno.
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
                    <th>Alumno</th>
                    <th>Usuario</th>
                    <th>Rol</th>
                  </tr>
                </thead>

                <tbody>

                  {alumnos.length > 0 ? (
                    alumnos.map((alumno) => (

                      <tr key={alumno.id}>

                        <td>
                          <div className="persona-info">

                            <div className="persona-avatar">
                              🧒
                            </div>

                            <span className="persona-nombre">
                              {alumno.nombre}
                            </span>

                          </div>
                        </td>

                        <td>
                          @{alumno.usuario}
                        </td>

                        <td>
                          <span className="badge-admin badge-alumno">
                            {alumno.rol || "Alumno"}
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

                          No hay alumnos registrados
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

export default ListaAlumnos