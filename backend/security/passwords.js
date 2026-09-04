const crypto = require("crypto")

const PREFIJO = "scrypt"
const LONGITUD_SAL = 16
const LONGITUD_HASH = 64

function hashPassword(password) {
  const salt = crypto.randomBytes(LONGITUD_SAL).toString("hex")
  const hash = crypto.scryptSync(password, salt, LONGITUD_HASH).toString("hex")

  return `${PREFIJO}$${salt}$${hash}`
}

function esHashSeguro(valor) {
  return typeof valor === "string" && valor.startsWith(`${PREFIJO}$`)
}

function verificarPassword(password, almacenado) {
  if (typeof almacenado !== "string") {
    return false
  }

  // Compatibilidad temporal con contrasenas antiguas en texto plano.
  // En el primer login correcto se migran automaticamente a scrypt.
  if (!esHashSeguro(almacenado)) {
    return almacenado === password
  }

  const partes = almacenado.split("$")

  if (partes.length !== 3) {
    return false
  }

  const [, salt, hashHex] = partes

  try {
    const hashGuardado = Buffer.from(hashHex, "hex")
    const hashCalculado = crypto.scryptSync(
      password,
      salt,
      hashGuardado.length
    )

    return (
      hashGuardado.length === hashCalculado.length &&
      crypto.timingSafeEqual(hashGuardado, hashCalculado)
    )
  } catch {
    return false
  }
}

module.exports = {
  hashPassword,
  verificarPassword,
  esHashSeguro
}
