import { useEffect, useState } from "react"
import axios from "axios"
import Sidebar from "../components/Sidebar"
import { API_URL } from "../config"
import "./AdminModules.css"

function ListaAlumnos() {
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
        alert(
          error.response?.data?.mensaje ||
            "Error al obtener la lista de alumnos"
        )
      })
  }

  return (
    <>
      <Sidebar />

      <div className="admin-page">
        <div className="admin-deco admin-deco-1">📚</div>
        <div className="admin-deco admin-deco-2">✏️</div>
        <div className="admin-deco admin-deco-3">🎒</div>

        <main className="admin-container">
          <section className="admin-header">
            <div className="admin-header-info">
              <div className="admin-header-icon">👦</div>

              <div className="admin-header-text">
                <small>Gestión escolar</small>
                <h1>Alumnos</h1>
                <p>
                  Consulta los estudiantes activos de la plataforma.
                  En la siguiente fase este módulo mostrará su información académica.
                </p>
              </div>
            </div>

            <div className="admin-counter">
              <strong>{alumnos.length}</strong>
              <span>ALUMNOS ACTIVOS</span>
            </div>
          </section>

          <section className="admin-card">
            <div className="admin-card-header">
              <small>👨‍🎓 ESTUDIANTES</small>
              <h2>Lista de alumnos</h2>
              <p>
                Esta vista corresponde a alumnos activos. La administración de
                cuentas se realiza desde Usuarios.
              </p>
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Alumno</th>
                    <th>Usuario</th>
                    <th>Tipo</th>
                  </tr>
                </thead>

                <tbody>
                  {alumnos.length > 0 ? (
                    alumnos.map((alumno) => (
                      <tr key={alumno.id}>
                        <td>
                          <div className="persona-info">
                            <div className="persona-avatar">🧒</div>

                            <span className="persona-nombre">
                              {alumno.nombre}
                            </span>
                          </div>
                        </td>

                        <td>@{alumno.usuario}</td>

                        <td>
                          <span className="badge-admin badge-alumno">
                            Alumno
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3">
                        <div className="admin-empty">
                          <div className="admin-empty-icon">📭</div>
                          No hay alumnos activos registrados
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
