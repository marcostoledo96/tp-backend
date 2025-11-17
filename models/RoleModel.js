// MODELO: Role
// Maneja todas las operaciones de base de datos relacionadas con roles
// Parte del patrón MVC - Modelo de datos para roles

const { getDB } = require('./database');

/**
 * Obtener todos los roles
 * @returns {Array} Lista de roles
 */
function obtenerRoles() {
  const db = getDB();
  const roles = db.prepare(`
    SELECT id, nombre, descripcion, activo, creado_en
    FROM roles
    WHERE activo = 1
    ORDER BY nombre
  `).all();
  db.close();
  
  return roles.map(r => ({
    ...r,
    activo: Boolean(r.activo)
  }));
}

/**
 * Obtener un rol por ID con sus permisos
 * @param {number} id - ID del rol
 * @returns {Object|null} Rol con permisos o null si no existe
 */
function obtenerRolPorId(id) {
  const db = getDB();
  
  const rol = db.prepare(`
    SELECT id, nombre, descripcion, activo, creado_en
    FROM roles
    WHERE id = ?
  `).get(id);
  
  if (!rol) {
    db.close();
    return null;
  }
  
  // Obtener permisos del rol
  const permisos = db.prepare(`
    SELECT p.id, p.nombre, p.descripcion, p.categoria
    FROM permisos p
    INNER JOIN roles_permisos rp ON p.id = rp.permiso_id
    WHERE rp.role_id = ?
    ORDER BY p.categoria, p.nombre
  `).all(id);
  
  db.close();
  
  return {
    ...rol,
    activo: Boolean(rol.activo),
    permisos
  };
}

/**
 * Crear un nuevo rol
 * @param {Object} datos - Datos del rol
 * @param {Array} permisos - IDs de permisos a asignar
 * @returns {Object} Rol creado con su ID
 */
function crearRol(datos, permisos = []) {
  const db = getDB();
  
  try {
    db.prepare('BEGIN TRANSACTION').run();
    
    // Insertar rol
    const stmt = db.prepare(`
      INSERT INTO roles (nombre, descripcion, activo)
      VALUES (?, ?, ?)
    `);
    
    const result = stmt.run(
      datos.nombre,
      datos.descripcion || null,
      datos.activo !== undefined ? (datos.activo ? 1 : 0) : 1
    );
    
    const rolId = result.lastInsertRowid;
    
    // Asignar permisos
    if (permisos.length > 0) {
      const stmtPermiso = db.prepare(`
        INSERT INTO roles_permisos (role_id, permiso_id)
        VALUES (?, ?)
      `);
      
      for (const permisoId of permisos) {
        stmtPermiso.run(rolId, permisoId);
      }
    }
    
    db.prepare('COMMIT').run();
    db.close();
    
    return {
      id: rolId,
      ...datos,
      permisos
    };
    
  } catch (error) {
    db.prepare('ROLLBACK').run();
    db.close();
    throw error;
  }
}

/**
 * Actualizar un rol existente
 * @param {number} id - ID del rol
 * @param {Object} datos - Datos actualizados
 * @param {Array} permisos - IDs de permisos a asignar (reemplaza los existentes)
 * @returns {Object|null} Rol actualizado o null si no existe
 */
function actualizarRol(id, datos, permisos = null) {
  const db = getDB();
  
  try {
    db.prepare('BEGIN TRANSACTION').run();
    
    // Actualizar rol
    const stmt = db.prepare(`
      UPDATE roles
      SET nombre = ?,
          descripcion = ?,
          activo = ?
      WHERE id = ?
    `);
    
    const result = stmt.run(
      datos.nombre,
      datos.descripcion || null,
      datos.activo ? 1 : 0,
      id
    );
    
    if (result.changes === 0) {
      db.prepare('ROLLBACK').run();
      db.close();
      return null;
    }
    
    // Actualizar permisos si se proporcionaron
    if (permisos !== null) {
      // Eliminar permisos actuales
      db.prepare('DELETE FROM roles_permisos WHERE role_id = ?').run(id);
      
      // Insertar nuevos permisos
      if (permisos.length > 0) {
        const stmtPermiso = db.prepare(`
          INSERT INTO roles_permisos (role_id, permiso_id)
          VALUES (?, ?)
        `);
        
        for (const permisoId of permisos) {
          stmtPermiso.run(id, permisoId);
        }
      }
    }
    
    db.prepare('COMMIT').run();
    db.close();
    
    return {
      id: parseInt(id),
      ...datos,
      permisos
    };
    
  } catch (error) {
    db.prepare('ROLLBACK').run();
    db.close();
    throw error;
  }
}

/**
 * Eliminar un rol (soft delete)
 * @param {number} id - ID del rol
 * @returns {boolean} true si se eliminó correctamente
 */
function eliminarRol(id) {
  const db = getDB();
  
  const stmt = db.prepare(`
    UPDATE roles
    SET activo = 0
    WHERE id = ?
  `);
  
  const result = stmt.run(id);
  db.close();
  
  return result.changes > 0;
}

/**
 * Verificar si un usuario tiene un permiso específico
 * @param {number} userId - ID del usuario
 * @param {string} nombrePermiso - Nombre del permiso a verificar
 * @returns {boolean} true si el usuario tiene el permiso
 */
function usuarioTienePermiso(userId, nombrePermiso) {
  const db = getDB();
  
  const result = db.prepare(`
    SELECT COUNT(*) as count
    FROM usuarios u
    INNER JOIN roles r ON u.role_id = r.id
    INNER JOIN roles_permisos rp ON r.id = rp.role_id
    INNER JOIN permisos p ON rp.permiso_id = p.id
    WHERE u.id = ? AND p.nombre = ? AND u.activo = 1 AND r.activo = 1
  `).get(userId, nombrePermiso);
  
  db.close();
  
  return result.count > 0;
}

/**
 * Obtener permisos de un usuario
 * @param {number} userId - ID del usuario
 * @returns {Array} Lista de permisos del usuario
 */
function obtenerPermisosUsuario(userId) {
  const db = getDB();
  
  const permisos = db.prepare(`
    SELECT DISTINCT p.nombre, p.descripcion, p.categoria
    FROM usuarios u
    INNER JOIN roles r ON u.role_id = r.id
    INNER JOIN roles_permisos rp ON r.id = rp.role_id
    INNER JOIN permisos p ON rp.permiso_id = p.id
    WHERE u.id = ? AND u.activo = 1 AND r.activo = 1
    ORDER BY p.categoria, p.nombre
  `).all(userId);
  
  db.close();
  
  return permisos;
}

module.exports = {
  obtenerRoles,
  obtenerRolPorId,
  crearRol,
  actualizarRol,
  eliminarRol,
  usuarioTienePermiso,
  obtenerPermisosUsuario
};
