const mysql = require("mysql2")

const conexion = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  connectTimeout: 10000
})

function probarConexion() {
  conexion.getConnection((err, connection) => {
    if (err) {
      console.log("MySQL connection error:", err.code, err.message)
      return
    }

    console.log("MySQL connected correctly")
    connection.release()
  })
}

module.exports = {
  conexion,
  probarConexion
}
