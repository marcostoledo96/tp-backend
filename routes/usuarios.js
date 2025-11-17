// Rutas para gestión de usuarios (CRUD)
// Solo accesible para usuarios con rol admin

const express = require('express');
const router = express.Router();
const UsuarioController = require('../controllers/UsuarioController');
const { verificarToken, verificarPermiso } = require('../middleware/auth');

// Middleware para detectar entorno Vercel
const bloquearEscrituraEnVercel = (req, res, next) => {
  const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;
  const metodosEscritura = ['POST', 'PUT', 'DELETE', 'PATCH'];
  
  if (isVercel && metodosEscritura.includes(req.method)) {
    return res.status(403).json({
      success: false,
      mensaje: 'Modo demostración: No se permiten modificaciones en Vercel',
      demo: true
    });
  }
  
  next();
};

// Todas las rutas requieren autenticación
router.use(verificarToken);

// GET /api/usuarios - Listar todos los usuarios (admin y vendedor pueden ver)
router.get('/', 
  verificarPermiso(['gestionar_usuarios', 'ver_usuarios']),
  UsuarioController.listarUsuarios
);

// GET /api/usuarios/:id - Obtener usuario específico
router.get('/:id', 
  verificarPermiso(['gestionar_usuarios', 'ver_usuarios']),
  UsuarioController.obtenerUsuarioPorId
);

// POST /api/usuarios - Crear nuevo usuario (SOLO admin)
router.post('/', 
  bloquearEscrituraEnVercel,
  verificarPermiso('gestionar_usuarios'),
  UsuarioController.crearUsuario
);

// PUT /api/usuarios/:id - Actualizar usuario (SOLO admin)
router.put('/:id', 
  bloquearEscrituraEnVercel,
  verificarPermiso('gestionar_usuarios'),
  UsuarioController.actualizarUsuario
);

// PUT /api/usuarios/:id/password - Cambiar contraseña (SOLO admin)
router.put('/:id/password', 
  bloquearEscrituraEnVercel,
  verificarPermiso('gestionar_usuarios'),
  UsuarioController.cambiarPassword
);

// DELETE /api/usuarios/:id - Eliminar usuario (SOLO admin)
router.delete('/:id', 
  bloquearEscrituraEnVercel,
  verificarPermiso('gestionar_usuarios'),
  UsuarioController.eliminarUsuario
);

module.exports = router;
