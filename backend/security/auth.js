const crypto = require("crypto")

const JWT_HEADER = {
  alg: "HS256",
  typ: "JWT"
}

function base64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
}

function decodeBase64url(input) {
  let normalizado = input.replace(/-/g, "+").replace(/_/g, "/")
  while (normalizado.length % 4 !== 0) {
    normalizado += "="
  }
  return Buffer.from(normalizado, "base64").toString("utf8")
}

function firmar(contenido, secret) {
  return crypto
    .createHmac("sha256", secret)
    .update(contenido)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
}

function obtenerSecret() {
  const secret = process.env.JWT_SECRET

  if (!secret || secret.length < 32) {
    throw new Error(
      "JWT_SECRET no esta configurado o tiene menos de 32 caracteres"
    )
  }

  return secret
}

function crearToken(usuario, duracionSegundos = 8 * 60 * 60) {
  const secret = obtenerSecret()
  const ahora = Math.floor(Date.now() / 1000)

  const payload = {
    sub: Number(usuario.id),
    nombre: usuario.nombre,
    usuario: usuario.usuario,
    rol: usuario.rol,
    iat: ahora,
    exp: ahora + duracionSegundos
  }

  const encabezadoCodificado = base64url(JSON.stringify(JWT_HEADER))
  const payloadCodificado = base64url(JSON.stringify(payload))
  const cuerpo = `${encabezadoCodificado}.${payloadCodificado}`
  const firma = firmar(cuerpo, secret)

  return `${cuerpo}.${firma}`
}

function verificarToken(token) {
  const secret = obtenerSecret()
  const partes = token.split(".")

  if (partes.length !== 3) {
    throw new Error("Token invalido")
  }

  const [encabezadoCodificado, payloadCodificado, firmaRecibida] = partes
  const cuerpo = `${encabezadoCodificado}.${payloadCodificado}`
  const firmaEsperada = firmar(cuerpo, secret)

  const firmaA = Buffer.from(firmaRecibida)
  const firmaB = Buffer.from(firmaEsperada)

  if (
    firmaA.length !== firmaB.length ||
    !crypto.timingSafeEqual(firmaA, firmaB)
  ) {
    throw new Error("Firma invalida")
  }

  const encabezado = JSON.parse(decodeBase64url(encabezadoCodificado))
  const payload = JSON.parse(decodeBase64url(payloadCodificado))

  if (encabezado.alg !== "HS256" || encabezado.typ !== "JWT") {
    throw new Error("Token no permitido")
  }

  const ahora = Math.floor(Date.now() / 1000)

  if (!payload.exp || payload.exp <= ahora) {
    throw new Error("Token expirado")
  }

  if (!payload.sub || !payload.rol) {
    throw new Error("Token incompleto")
  }

  return payload
}

function autenticarToken(req, res, next) {
  const authorization = req.headers.authorization || ""
  const [tipo, token] = authorization.split(" ")

  if (tipo !== "Bearer" || !token) {
    return res.status(401).json({
      status: "error",
      mensaje: "Debes iniciar sesion para continuar"
    })
  }

  try {
    const payload = verificarToken(token)

    req.usuario = {
      id: Number(payload.sub),
      nombre: payload.nombre,
      usuario: payload.usuario,
      rol: payload.rol
    }

    return next()
  } catch (error) {
    return res.status(401).json({
      status: "error",
      mensaje: "La sesion no es valida o ha expirado"
    })
  }
}

function autorizarRoles(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({
        status: "error",
        mensaje: "Debes iniciar sesion para continuar"
      })
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({
        status: "error",
        mensaje: "No tienes permisos para realizar esta accion"
      })
    }

    return next()
  }
}

module.exports = {
  crearToken,
  autenticarToken,
  autorizarRoles
}
