// RUTAS: Productos
// Define las rutas HTTP para productos
// Parte del patrón MVC - Rutas que llaman a controladores

const express = require('express');
const router = express.Router();
const ProductoController = require('../controllers/ProductoController');
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

// 📋 GET /api/productos - Listar todos los productos activos (público)
router.get('/', ProductoController.listarProductos);

// 🔐 GET /api/productos/admin/all - Listar TODOS los productos (requiere autenticación)
router.get('/admin/all', verificarAutenticacion, ProductoController.listarTodosLosProductos);

// 🔍 GET /api/productos/:id - Obtener un producto específico
router.get('/:id', ProductoController.obtenerProductoPorId);

// ➕ POST /api/productos - Crear un nuevo producto (BLOQUEADO EN VERCEL)
router.post('/', bloquearEscrituraEnVercel, verificarAutenticacion, verificarPermiso('gestionar_productos'), ProductoController.crearProducto);

// ✏️ PUT /api/productos/:id - Actualizar un producto (BLOQUEADO EN VERCEL)
router.put('/:id', bloquearEscrituraEnVercel, verificarAutenticacion, verificarPermiso('gestionar_productos'), ProductoController.actualizarProducto);

// 🗑️ DELETE /api/productos/:id - Eliminar un producto (BLOQUEADO EN VERCEL)
router.delete('/:id', bloquearEscrituraEnVercel, verificarAutenticacion, verificarPermiso('gestionar_productos'), ProductoController.eliminarProducto);

module.exports = router;
