// MODELO: Usuario
// Maneja todas las operaciones de base de datos relacionadas con usuarios
// Parte del patrón MVC - Modelo de datos para usuarios y autenticación

const { getDB } = require('./database');

/**
 * Obtener un usuario por username
 * @param {string} username - Nombre de usuario
 * @returns {Object|null} Usuario encontrado o null
 */
function obtenerUsuarioPorUsername(username) {
  const db = getDB();
  
  const usuario = db.prepare(`
    SELECT 
      u.id, 
      u.username, 
      u.password_hash, 
      u.nombre_completo, 
      u.email, 
      u.telefono,
      u.role_id,
      u.activo,
      r.nombre as role,
      r.descripcion as role_descripcion
    FROM usuarios u
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE u.username = ? AND u.activo = 1
  `).get(username);
  
  db.close();
  
  if (!usuario) return null;
  
  return {
    ...usuario,
    telefono: usuario.telefono || null,
    activo: Boolean(usuario.activo)
  };
}

/**
 * Verificar si un usuario existe y está activo
 * @param {string} username - Nombre de usuario
 * @returns {boolean} true si el usuario existe
 */
function existeUsuario(username) {
  const db = getDB();
  
  const result = db.prepare(`
    SELECT COUNT(*) as count
    FROM usuarios
    WHERE username = ? AND activo = 1
  `).get(username);
  
  db.close();
  
  return result.count > 0;
}

/**
 * Obtener estadísticas de usuarios
 * @returns {Object} Objeto con estadísticas de usuarios
 */
function obtenerEstadisticasUsuarios() {
  const db = getDB();
  
  const stats = {
    totalUsuarios: db.prepare('SELECT COUNT(*) as count FROM usuarios WHERE activo = 1').get().count,
    totalAdmins: db.prepare(`
      SELECT COUNT(*) as count 
      FROM usuarios u
      JOIN roles r ON u.role_id = r.id
      WHERE r.nombre = "admin" AND u.activo = 1
    `).get().count
  };
  
  db.close();
  
  return stats;
}

module.exports = {
  obtenerUsuarioPorUsername,
  existeUsuario,
  obtenerEstadisticasUsuarios
};
