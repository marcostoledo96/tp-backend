// MODELO: Permiso
// Maneja todas las operaciones de base de datos relacionadas con permisos

const { getDB } = require('./database');

/**
 * Obtener todos los permisos
 * @returns {Array} Lista de permisos organizados por categoría
 */
function obtenerPermisos() {
  const db = getDB();
  const permisos = db.prepare(`
    SELECT id, nombre, descripcion, categoria, creado_en
    FROM permisos
    ORDER BY categoria, nombre
  `).all();
  db.close();
  
  return permisos;
}

/**
 * Obtener permisos agrupados por categoría
 * @returns {Object} Permisos agrupados {categoria: [permisos]}
 */
function obtenerPermisosPorCategoria() {
  const permisos = obtenerPermisos();
  
  const agrupados = {};
  for (const permiso of permisos) {
    const cat = permiso.categoria || 'otros';
    if (!agrupados[cat]) {
      agrupados[cat] = [];
    }
    agrupados[cat].push(permiso);
  }
  
  return agrupados;
}

/**
 * Obtener un permiso por ID
 * @param {number} id - ID del permiso
 * @returns {Object|null} Permiso o null si no existe
 */
function obtenerPermisoPorId(id) {
  const db = getDB();
  const permiso = db.prepare(`
    SELECT id, nombre, descripcion, categoria, creado_en
    FROM permisos
    WHERE id = ?
  `).get(id);
  db.close();
  
  return permiso || null;
}

/**
 * Obtener un permiso por nombre
 * @param {string} nombre - Nombre del permiso
 * @returns {Object|null} Permiso o null si no existe
 */
function obtenerPermisoPorNombre(nombre) {
  const db = getDB();
  const permiso = db.prepare(`
    SELECT id, nombre, descripcion, categoria, creado_en
    FROM permisos
    WHERE nombre = ?
  `).get(nombre);
  db.close();
  
  return permiso || null;
}

module.exports = {
  obtenerPermisos,
  obtenerPermisosPorCategoria,
  obtenerPermisoPorId,
  obtenerPermisoPorNombre
};
