// Controller para gestión de usuarios (CRUD)
// Solo accesible para usuarios con rol admin

const { getDB } = require('../models/database');
const bcrypt = require('bcrypt');
const RoleModel = require('../models/RoleModel');

class UsuarioController {
  /**
   * Listar todos los usuarios con su rol
   */
  static async listarUsuarios(req, res) {
    let db;
    try {
      db = getDB();
      const usuarios = db.prepare(`
        SELECT 
          u.id,
          u.username,
          u.nombre_completo as nombre,
          u.telefono,
          u.role_id,
          r.nombre as role_nombre,
          r.descripcion as role_descripcion,
          u.creado_en
        FROM usuarios u
        LEFT JOIN roles r ON u.role_id = r.id
        ORDER BY u.id ASC
      `).all();

      // Obtener estadísticas
      // Genero un snapshot de roles para el dashboard sin hacer otra llamada HTTP
      const stats = db.prepare(`
        SELECT 
          r.nombre as role,
          r.descripcion,
          COUNT(u.id) as cantidad
        FROM roles r
        LEFT JOIN usuarios u ON r.id = u.role_id
        GROUP BY r.id, r.nombre, r.descripcion
        ORDER BY r.id
      `).all();

      db.close();

      res.json({
        success: true,
        usuarios,
        estadisticas: stats
      });
    } catch (error) {
      console.error('Error al listar usuarios:', error);
      if (db) db.close();
      res.status(500).json({
        success: false,
        mensaje: 'Error al obtener usuarios'
      });
    }
  }

  /**
   * Obtener un usuario específico por ID con sus permisos
   */
  static async obtenerUsuarioPorId(req, res) {
    let db;
    try {
      const { id } = req.params;
      db = getDB();

      const usuario = db.prepare(`
        SELECT 
          u.id,
          u.username,
          u.nombre_completo as nombre,
          u.telefono,
          u.role_id,
          r.nombre as role_nombre,
          r.descripcion as role_descripcion,
          u.creado_en
        FROM usuarios u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.id = ?
      `).get(id);

      if (!usuario) {
        return res.status(404).json({
          success: false,
          mensaje: 'Usuario no encontrado'
        });
      }

      // Obtener permisos del usuario
      const permisos = db.prepare(`
        SELECT p.id, p.nombre, p.descripcion, p.categoria
        FROM permisos p
        INNER JOIN roles_permisos rp ON p.id = rp.permiso_id
        WHERE rp.role_id = ?
      `).all(usuario.role_id);

      usuario.permisos = permisos;

      db.close();

      res.json({
        success: true,
        usuario
      });
    } catch (error) {
      console.error('Error al obtener usuario:', error);
      if (db) db.close();
      res.status(500).json({
        success: false,
        mensaje: 'Error al obtener usuario'
      });
    }
  }

  /**
   * Crear nuevo usuario
   */
  static async crearUsuario(req, res) {
    let db;
    try {
      const { username, password, nombre, telefono, role_id } = req.body;
      db = getDB();

      // Validaciones
      // El administrador debe enviar username, password, nombre y role_id.
      // No se aplica restricción de longitud mínima a la contraseña.
      if (!username || !password || !nombre || !role_id) {
        return res.status(400).json({
          success: false,
          mensaje: 'Todos los campos son obligatorios'
        });
      }

      if (username.length < 3) {
        return res.status(400).json({
          success: false,
          mensaje: 'El username debe tener al menos 3 caracteres'
        });
      }

      // No se aplica validación de longitud mínima a la contraseña.

      // Verificar que el username no exista
      const existente = db.prepare('SELECT id FROM usuarios WHERE username = ?').get(username);
      if (existente) {
        return res.status(400).json({
          success: false,
          mensaje: 'El nombre de usuario ya existe'
        });
      }

      // Verificar que el rol existe
      const role = db.prepare('SELECT id, nombre FROM roles WHERE id = ? AND activo = 1').get(role_id);
      if (!role) {
        return res.status(400).json({
          success: false,
          mensaje: 'El rol especificado no existe o está inactivo'
        });
      }

      // Hash de la contraseña
      const hashedPassword = bcrypt.hashSync(password, 10);

      // Insertar usuario
      const result = db.prepare(`
        INSERT INTO usuarios (username, password_hash, nombre_completo, telefono, role_id)
        VALUES (?, ?, ?, ?, ?)
      `).run(username, hashedPassword, nombre, telefono || null, role_id);

      db.close();

      res.status(201).json({
        success: true,
        mensaje: 'Usuario creado exitosamente',
        usuario: {
          id: result.lastInsertRowid,
          username,
          nombre,
          role_id,
          role_nombre: role.nombre
        }
      });
    } catch (error) {
      console.error('Error al crear usuario:', error);
      if (db) db.close();
      res.status(500).json({
        success: false,
        mensaje: 'Error al crear usuario'
      });
    }
  }

  /**
   * Actualizar usuario (datos básicos y rol)
   */
  static async actualizarUsuario(req, res) {
    let db;
    try {
      const { id } = req.params;
      const { username, nombre, telefono, role_id } = req.body;
      db = getDB();

      // Verificar que el usuario existe
      const usuario = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id);
      if (!usuario) {
        return res.status(404).json({
          success: false,
          mensaje: 'Usuario no encontrado'
        });
      }

      // No permitir modificar al admin principal (id = 1)
      if (parseInt(id) === 1 && usuario.username === 'admin') {
        return res.status(403).json({
          success: false,
          mensaje: 'No se puede modificar el usuario administrador principal'
        });
      }

      // Si cambia el username, verificar que no exista otro con ese nombre
      if (username && username !== usuario.username) {
        const existente = db.prepare('SELECT id FROM usuarios WHERE username = ? AND id != ?').get(username, id);
        if (existente) {
          return res.status(400).json({
            success: false,
            mensaje: 'El nombre de usuario ya existe'
          });
        }
      }

      // Verificar que el rol existe
      if (role_id) {
        const role = db.prepare('SELECT id FROM roles WHERE id = ? AND activo = 1').get(role_id);
        if (!role) {
          return res.status(400).json({
            success: false,
            mensaje: 'El rol especificado no existe o está inactivo'
          });
        }
      }

      // Construir query de actualización
      const updates = [];
      const values = [];

      if (username) {
        updates.push('username = ?');
        values.push(username);
      }
      if (nombre) {
        updates.push('nombre_completo = ?');
        values.push(nombre);
      }
      if (telefono !== undefined) {
        updates.push('telefono = ?');
        values.push(telefono || null);
      }
      if (role_id) {
        updates.push('role_id = ?');
        values.push(role_id);
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          mensaje: 'No hay datos para actualizar'
        });
      }

      values.push(id);
      const query = `UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`;
      
      db.prepare(query).run(...values);

      db.close();

      res.json({
        success: true,
        mensaje: 'Usuario actualizado exitosamente'
      });
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      if (db) db.close();
      res.status(500).json({
        success: false,
        mensaje: 'Error al actualizar usuario'
      });
    }
  }

  /**
   * Cambiar contraseña de usuario
   */
  static async cambiarPassword(req, res) {
    let db;
    try {
      const { id } = req.params;
      const { password, password_confirm } = req.body;
      db = getDB();

      if (!password || !password_confirm) {
        return res.status(400).json({
          success: false,
          mensaje: 'Debe proporcionar la contraseña y su confirmación'
        });
      }

      if (password !== password_confirm) {
        return res.status(400).json({
          success: false,
          mensaje: 'Las contraseñas no coinciden'
        });
      }

      // No se aplica validación de longitud mínima a la nueva contraseña.

      // Verificar que el usuario existe
      const usuario = db.prepare('SELECT id FROM usuarios WHERE id = ?').get(id);
      if (!usuario) {
        return res.status(404).json({
          success: false,
          mensaje: 'Usuario no encontrado'
        });
      }

      // Hash de la nueva contraseña
      const hashedPassword = bcrypt.hashSync(password, 10);

      db.prepare('UPDATE usuarios SET password_hash = ? WHERE id = ?').run(hashedPassword, id);

      db.close();

      res.json({
        success: true,
        mensaje: 'Contraseña actualizada exitosamente'
      });
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      if (db) db.close();
      res.status(500).json({
        success: false,
        mensaje: 'Error al cambiar contraseña'
      });
    }
  }

  /**
   * Actualizar perfil propio (cualquier usuario autenticado)
   * Solo puede modificar: nombre_completo, telefono y password
   */
  static async actualizarPerfil(req, res) {
    let db;
    try {
      // El ID del usuario viene del token JWT (req.usuario)
      const userId = req.usuario.userId;
      const { nombre_completo, telefono, password } = req.body;
      db = getDB();

      // Verificar que el usuario existe
      const usuario = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(userId);
      if (!usuario) {
        return res.status(404).json({
          success: false,
          mensaje: 'Usuario no encontrado'
        });
      }

      // Construir query de actualización
      const updates = [];
      const values = [];

      if (nombre_completo) {
        updates.push('nombre_completo = ?');
        values.push(nombre_completo);
      }
      
      if (telefono !== undefined) {
        updates.push('telefono = ?');
        values.push(telefono || null);
      }

      // Si se proporciona nueva contraseña, hashearla
      if (password) {
        const hashedPassword = bcrypt.hashSync(password, 10);
        updates.push('password_hash = ?');
        values.push(hashedPassword);
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          mensaje: 'No hay datos para actualizar'
        });
      }

      values.push(userId);
      const query = `UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`;
      
      db.prepare(query).run(...values);

      db.close();

      res.json({
        success: true,
        mensaje: 'Perfil actualizado exitosamente'
      });
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      if (db) db.close();
      res.status(500).json({
        success: false,
        mensaje: 'Error al actualizar perfil'
      });
    }
  }

  /**
   * Eliminar usuario (dar de baja)
   */
  static async eliminarUsuario(req, res) {
    let db;
    try {
      const { id } = req.params;
      db = getDB();

      // No permitir eliminar al admin principal (id = 1)
      if (parseInt(id) === 1) {
        return res.status(403).json({
          success: false,
          mensaje: 'No se puede eliminar el usuario administrador principal'
        });
      }

      // No permitir que el usuario se elimine a sí mismo
      if (parseInt(id) === req.usuario.userId) {
        return res.status(403).json({
          success: false,
          mensaje: 'No puedes eliminar tu propio usuario'
        });
      }

      const usuario = db.prepare('SELECT username FROM usuarios WHERE id = ?').get(id);
      if (!usuario) {
        return res.status(404).json({
          success: false,
          mensaje: 'Usuario no encontrado'
        });
      }

      const result = db.prepare('DELETE FROM usuarios WHERE id = ?').run(id);

      if (result.changes > 0) {
        db.close();
        res.json({
          success: true,
          mensaje: `Usuario ${usuario.username} eliminado exitosamente`
        });
      } else {
        db.close();
        res.status(404).json({
          success: false,
          mensaje: 'No se pudo eliminar el usuario'
        });
      }
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      if (db) db.close();
      res.status(500).json({
        success: false,
        mensaje: 'Error al eliminar usuario'
      });
    }
  }
}

module.exports = UsuarioController;
