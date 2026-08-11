import { useEffect, useState } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { API_URL } from "../config";

function ListaAlumnos() {
  const navigate = useNavigate()
  const [alumnos, setAlumnos] = useState([])

  useEffect(() => {
    obtenerAlumnos()
  }, [])

  const obtenerAlumnos = () => {
    axios.get(`${API_URL}/alumnos`)
      .then(res => {
        setAlumnos(res.data)
      })
      .catch(error => {
        console.error(error)
        alert("Error al obtener la lista de alumnos")
      })
  }

  return (
    <div className="contenido">
      <div className="tabla-card">
        <h2>Lista de Alumnos 👦</h2>

        <button className="btn-regresar-lista" onClick={() => navigate("/panel")}>
          ⬅️ Regresar
        </button>

        <table className="tabla-alumnos">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Usuario</th>
              <th>Rol</th>
            </tr>
          </thead>

          <tbody>
            {alumnos.length > 0 ? (
              alumnos.map((alumno) => (
                <tr key={alumno.id}>
                  <td>{alumno.nombre}</td>
                  <td>{alumno.usuario}</td>
                  <td>
                    <span className="rol-alumno">
                      {alumno.rol || "Alumno"}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3">No hay alumnos registrados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ListaAlumnos