import { useState } from "react"
import axios from "axios"
import "./App.css"
import { useNavigate } from "react-router-dom"
import { API_URL } from "./config"

function App() {
  const navigate = useNavigate()

  const [usuario, setUsuario] = useState("")
  const [password, setPassword] = useState("")
  const [mensaje, setMensaje] = useState("")

  const login = () => {
    if (usuario.trim() === "" || password.trim() === "") {
      setMensaje("Escribe usuario y contraseña")
      return
    }

    axios
      .post(`${API_URL}/login`, {
        usuario,
        password
      })
      .then((res) => {
        if (res.data.status === "ok") {
          const usuarioSesion = {
            id: res.data.id,
            nombre: res.data.nombre,
            usuario: res.data.usuario,
            rol: res.data.rol
          }

          localStorage.setItem("usuario", JSON.stringify(usuarioSesion))
          localStorage.setItem("usuarioId", String(res.data.id))
          localStorage.setItem("nombre", res.data.nombre)
          localStorage.setItem("rol", res.data.rol)

          setMensaje("Bienvenido " + res.data.nombre)

          if (res.data.rol === "maestro") {
            navigate("/panel")
          } else if (res.data.rol === "alumno") {
            navigate("/panelAlumno")
          } else {
            setMensaje("Rol no válido")
          }
        } else {
          setMensaje(res.data.mensaje || "Usuario incorrecto")
        }
      })
      .catch((error) => {
        console.error(error)
        setMensaje("No se pudo conectar con el servidor")
      })
  }

  const presionarEnter = (e) => {
    if (e.key === "Enter") {
      login()
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Eco Holistic 🎒</h1>

        <input
          type="text"
          placeholder="Usuario"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          onKeyDown={presionarEnter}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={presionarEnter}
        />

        <button onClick={login}>Entrar</button>

        {mensaje && <h3>{mensaje}</h3>}
      </div>
    </div>
  )
}

export default App
