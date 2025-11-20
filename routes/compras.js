// RUTAS: Compras
// Define las rutas HTTP para compras/ventas
// Parte del patrón MVC - Rutas que llaman a controladores

const express = require('express');
const router = express.Router();
const CompraController = require('../controllers/CompraController');
const { verificarAutenticacion, verificarPermiso } = require('../middleware/auth');
const multer = require('multer');

// Detectar si estamos en Vercel (modo DEMO - solo lectura)
const IS_VERCEL = process.env.VERCEL === '1' || process.env.VERCEL_ENV;

// Configuración de multer para mantener archivo en MEMORIA
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 3 * 1024 * 1024 // Máximo 3MB
  },
  fileFilter: (req, file, cb) => {
    const tiposPermitidos = /jpeg|jpg|png|webp/;
    const mimetype = tiposPermitidos.test(file.mimetype);
    
    if (mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen (JPG, PNG, WEBP)'));
    }
  }
});

// Middleware para bloquear creación de compras en Vercel
const bloquearComprasEnVercel = (req, res, next) => {
  if (IS_VERCEL) {
    return res.status(403).json({
      success: false,
      mensaje: '🚫 Versión DEMO - No se pueden crear compras reales en la demostración. Los datos no persisten.'
    });
  }
  next();
};

// POST /api/compras - Crear una nueva compra (BLOQUEADO EN VERCEL)
// Requiere autenticación y permiso para crear compras.
router.post(
  '/',
  verificarAutenticacion,
  verificarPermiso('crear_compra'),
  bloquearComprasEnVercel,
  upload.single('comprobante'),
  CompraController.crearCompra
);

// GET /api/compras - Listar todas las compras (requiere autenticación y permisos)
// Solo usuarios con permiso 'ver_compras' pueden ver el historial de ventas.
// Esto protege información sensible de las transacciones.
router.get('/', verificarAutenticacion, verificarPermiso('ver_compras'), CompraController.listarCompras);

// GET /api/compras/estadisticas/ventas - Obtener estadísticas (requiere autenticación y permisos)
router.get('/estadisticas/ventas', verificarAutenticacion, verificarPermiso('ver_compras'), CompraController.obtenerEstadisticas);

// GET /api/compras/:id - Obtener detalle de una compra (requiere autenticación y permisos)
router.get('/:id', verificarAutenticacion, verificarPermiso('ver_compras'), CompraController.obtenerCompraPorId);

// PATCH /api/compras/:id/estado - Actualizar estado de una compra (requiere autenticación y permisos)
// Solo usuarios con 'editar_compras' pueden marcar pedidos como listos/entregados.
// Esto es crítico para el control del flujo de trabajo en cocina.
router.patch('/:id/estado', verificarAutenticacion, verificarPermiso('editar_compras'), CompraController.actualizarEstadoCompra);

// DELETE /api/compras/:id - Eliminar una compra (requiere autenticación y permisos)
// Solo admin puede eliminar compras para mantener auditoría.
router.delete('/:id', verificarAutenticacion, verificarPermiso('eliminar_compras'), CompraController.eliminarCompra);

module.exports = router;
