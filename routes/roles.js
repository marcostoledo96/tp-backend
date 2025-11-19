// RUTAS: Roles
// Define las rutas HTTP para roles y permisos
// Parte del patrón MVC - Rutas que llaman a controladores

const express = require('express');
const router = express.Router();
const RoleController = require('../controllers/RoleController');
const { verificarAutenticacion, verificarPermiso } = require('../middleware/auth');

// Detectar si estamos en Vercel (modo DEMO - solo lectura)
const IS_VERCEL = process.env.VERCEL === '1' || process.env.VERCEL_ENV;

// Middleware para bloquear escritura en Vercel
const bloquearEscrituraEnVercel = (req, res, next) => {
  if (IS_VERCEL) {
    return res.status(403).json({
      success: false,
      mensaje: '🚫 Versión DEMO - Esta acción no está disponible en la versión de demostración'
    });
  }
  next();
};

// 📋 GET /api/roles/permisos/all - Listar todos los permisos disponibles
// Yo: Esta ruta devuelve permisos agrupados por categoría para facilitar la UI de asignación.
router.get('/permisos/all', verificarAutenticacion, RoleController.listarPermisos);

// 📋 GET /api/roles - Listar todos los roles
// Yo: Solo usuarios con 'ver_roles' pueden ver los roles del sistema.
router.get('/', verificarAutenticacion, verificarPermiso('ver_roles'), RoleController.listarRoles);

// 🔍 GET /api/roles/:id - Obtener un rol específico con sus permisos
router.get('/:id', verificarAutenticacion, verificarPermiso('ver_roles'), RoleController.obtenerRolPorId);

// ➕ POST /api/roles - Crear un nuevo rol (BLOQUEADO EN VERCEL)
router.post('/', bloquearEscrituraEnVercel, verificarAutenticacion, verificarPermiso('gestionar_roles'), RoleController.crearRol);

// ✏️ PUT /api/roles/:id - Actualizar un rol (BLOQUEADO EN VERCEL)
router.put('/:id', bloquearEscrituraEnVercel, verificarAutenticacion, verificarPermiso('gestionar_roles'), RoleController.actualizarRol);

// 🗑️ DELETE /api/roles/:id - Eliminar un rol (BLOQUEADO EN VERCEL)
router.delete('/:id', bloquearEscrituraEnVercel, verificarAutenticacion, verificarPermiso('gestionar_roles'), RoleController.eliminarRol);

module.exports = router;
