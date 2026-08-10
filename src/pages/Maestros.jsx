import { useEffect, useState } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"

function Maestros() {
  const navigate = useNavigate()
  const [maestros, setMaestros] = useState([])

  useEffect(() => {
    obtenerMaestros()
  }, [])

  const obtenerMaestros = () => {
    axios.get("http://localhost:3001/maestros")
      .then(res => {
        setMaestros(res.data)
      })
      .catch(error => {
        console.error(error)
        alert("Error al obtener la lista de maestros")
      })
  }

  return (
    <div className="contenido">
      <div className="tabla-card">
        <h2>Lista de Maestros 👨‍🏫</h2>

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
            {maestros.length > 0 ? (
              maestros.map((maestro) => (
                <tr key={maestro.id}>
                  <td>{maestro.nombre}</td>
                  <td>{maestro.usuario}</td>
                  <td>
                    <span className="rol-maestro">
                      {maestro.rol || "Maestro"}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3">No hay maestros registrados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Maestros