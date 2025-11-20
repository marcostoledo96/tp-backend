// CONTROLADOR: Role
// Maneja la lógica de negocio para roles y permisos
// Parte del patrón MVC - Controlador que conecta rutas con modelos

const RoleModel = require('../models/RoleModel');
const PermisoModel = require('../models/PermisoModel');

/**
 * Listar todos los roles
 * GET /api/roles
 */
async function listarRoles(req, res) {
  try {
    const roles = RoleModel.obtenerRoles();
    
    res.json({
      success: true,
      roles
    });
  } catch (error) {
    console.error('Error al listar roles:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al obtener los roles'
    });
  }
}

/**
 * Obtener un rol por ID con sus permisos
 * GET /api/roles/:id
 */
async function obtenerRolPorId(req, res) {
  try {
    const { id } = req.params;
    const rol = RoleModel.obtenerRolPorId(id);
    
    if (!rol) {
      return res.status(404).json({
        success: false,
        mensaje: 'Rol no encontrado'
      });
    }
    
    res.json({
      success: true,
      rol
    });
  } catch (error) {
    console.error('Error al obtener rol:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al obtener el rol'
    });
  }
}

/**
 * Crear un nuevo rol
 * POST /api/roles
 */
async function crearRol(req, res) {
  try {
    const { nombre, descripcion, activo, permisos } = req.body;
    
    // Validaciones
    if (!nombre) {
      return res.status(400).json({
        success: false,
        mensaje: 'El nombre del rol es obligatorio'
      });
    }
    
    const permisoIds = permisos || [];
    
    const nuevoRol = RoleModel.crearRol(
      { nombre, descripcion, activo },
      permisoIds
    );
    
    console.log('✅ Rol creado:', nuevoRol.nombre);
    
    res.status(201).json({
      success: true,
      mensaje: 'Rol creado exitosamente',
      rol: nuevoRol
    });
  } catch (error) {
    console.error('Error al crear rol:', error);
    
    if (error.message.includes('UNIQUE constraint')) {
      return res.status(400).json({
        success: false,
        mensaje: 'Ya existe un rol con ese nombre'
      });
    }
    
    res.status(500).json({
      success: false,
      mensaje: 'Error al crear el rol'
    });
  }
}

/**
 * Actualizar un rol existente
 * PUT /api/roles/:id
 */
async function actualizarRol(req, res) {
  try {
    const { id } = req.params;
    const { nombre, descripcion, activo, permisos } = req.body;
    
    // Logs para debug
    console.log('Datos recibidos en actualizarRol:');
    console.log('  - ID:', id);
    console.log('  - Nombre:', nombre);
    console.log('  - Descripción:', descripcion);
    console.log('  - Activo:', activo);
    console.log('  - Permisos:', permisos);
    
    // Validaciones
    if (!nombre) {
      return res.status(400).json({
        success: false,
        mensaje: 'El nombre del rol es obligatorio'
      });
    }
    
    const permisoIds = permisos !== undefined ? permisos : null;
    
    const rolActualizado = RoleModel.actualizarRol(
      id,
      { nombre, descripcion, activo },
      permisoIds
    );
    
    if (!rolActualizado) {
      return res.status(404).json({
        success: false,
        mensaje: 'Rol no encontrado'
      });
    }
    
    console.log('✅ Rol actualizado:', rolActualizado.nombre);
    console.log('   Permisos asignados:', permisoIds);
    
    res.json({
      success: true,
      mensaje: 'Rol actualizado exitosamente',
      rol: rolActualizado
    });
  } catch (error) {
    console.error('❌ Error al actualizar rol:', error);
    
    if (error.message.includes('UNIQUE constraint')) {
      return res.status(400).json({
        success: false,
        mensaje: 'Ya existe un rol con ese nombre'
      });
    }
    
    res.status(500).json({
      success: false,
      mensaje: 'Error al actualizar el rol'
    });
  }
}

/**
 * Eliminar un rol (soft delete)
 * DELETE /api/roles/:id
 */
async function eliminarRol(req, res) {
  try {
    const { id } = req.params;
    
    // Verificar que el rol existe
    const rol = RoleModel.obtenerRolPorId(id);
    if (!rol) {
      return res.status(404).json({
        success: false,
        mensaje: 'Rol no encontrado'
      });
    }
    
    // Eliminar el rol (esto también eliminará usuarios asociados en cascada)
    const resultado = RoleModel.eliminarRol(id);
    
    if (!resultado.success) {
      return res.status(500).json({
        success: false,
        mensaje: 'Error al eliminar el rol'
      });
    }
    
    console.log(`✅ Rol eliminado: ${rol.nombre}`);
    console.log(`🗑️ ${resultado.usuariosEliminados} usuario(s) eliminado(s) en cascada`);
    
    res.json({
      success: true,
      mensaje: `Rol "${rol.nombre}" eliminado exitosamente. ${resultado.usuariosEliminados} usuario(s) eliminado(s) en cascada.`
    });
  } catch (error) {
    console.error('Error al eliminar rol:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al eliminar el rol'
    });
  }
}

/**
 * Listar todos los permisos disponibles
 * GET /api/roles/permisos/all
 */
async function listarPermisos(req, res) {
  try {
    const permisos = PermisoModel.obtenerPermisosPorCategoria();
    
    res.json({
      success: true,
      permisos
    });
  } catch (error) {
    console.error('Error al listar permisos:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al obtener los permisos'
    });
  }
}

module.exports = {
  listarRoles,
  obtenerRolPorId,
  crearRol,
  actualizarRol,
  eliminarRol,
  listarPermisos
};
