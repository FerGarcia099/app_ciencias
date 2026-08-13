import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./PanelAlumno.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function PanelAlumno() {
  const navigate = useNavigate();
  const [contenidos, setContenidos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const usuarioGuardado = JSON.parse(localStorage.getItem("usuario")) || {};
  const nombreAlumno = usuarioGuardado.nombre || "Estudiante";

  useEffect(() => {
    obtenerContenidos();
  }, []);

  const obtenerContenidos = async () => {
    try {
      const response = await axios.get(`${API_URL}/contenidos`);
      setContenidos(response.data || []);
    } catch (error) {
      console.error("Error al obtener contenidos:", error);
      alert("Error al obtener contenidos");
    } finally {
      setCargando(false);
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem("usuario");
    navigate("/");
  };

  const verPreguntas = (id) => {
    navigate(`/contenido-alumno/${id}`);
  };

  return (
    <div className="panel-alumno-page">
      {/* Figuras decorativas del fondo */}
      <div className="floating-shape shape-1">📚</div>
      <div className="floating-shape shape-2">✏️</div>
      <div className="floating-shape shape-3">🎒</div>
      <div className="floating-shape shape-4">⚽</div>
      <div className="floating-shape shape-5">🧸</div>
      <div className="floating-shape shape-6">🖍️</div>
      <div className="floating-shape shape-7">📒</div>
      <div className="floating-shape shape-8">👧</div>
      <div className="floating-shape shape-9">🧒</div>

      <div className="panel-alumno-container">
        <div className="panel-header-card">
          <h1>🌟 Inicio del Alumno 🌟</h1>
          <p>
            ¡Bienvenido <strong>{nombreAlumno}</strong>!
          </p>
          <span className="subtexto">
            Aprende, responde y diviértete explorando tus contenidos.
          </span>

          <div className="panel-botones">
            <button
              className="btn-principal"
              onClick={() =>
                document
                  .getElementById("contenidos-section")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              📘 Ver Contenidos y Preguntas
            </button>

            <button className="btn-salir" onClick={cerrarSesion}>
              🚪 Cerrar sesión
            </button>
          </div>
        </div>

        <section id="contenidos-section" className="contenidos-section">
          <h2>📚 Contenidos disponibles 🌱</h2>

          {cargando ? (
            <div className="mensaje-panel">Cargando contenidos...</div>
          ) : contenidos.length === 0 ? (
            <div className="mensaje-panel">
              No hay contenidos disponibles por el momento.
            </div>
          ) : (
            <div className="contenidos-grid">
              {contenidos.map((contenido) => (
                <div className="contenido-card" key={contenido.id}>
                  <div className="contenido-icono">📝</div>

                  <h3>{contenido.titulo || "Sin título"}</h3>

                  <div className="grado-badge">
                    Grado: {contenido.grado || "No definido"}
                  </div>

                  <p>
                    {contenido.descripcion ||
                      contenido.contenido ||
                      "Contenido disponible para aprender y responder preguntas."}
                  </p>

                  <button
                    className="btn-ver"
                    onClick={() => verPreguntas(contenido.id)}
                  >
                    👀 Ver preguntas
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}