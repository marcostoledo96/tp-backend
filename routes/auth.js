// RUTAS: Autenticación
// Define las rutas HTTP para autenticación
// Parte del patrón MVC - Rutas que llaman a controladores

const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');

// POST /api/auth/login - Inicio de sesión
router.post('/login', AuthController.login);

// GET /api/auth/me - Obtener información del usuario autenticado
router.get('/me', AuthController.obtenerUsuarioActual);

module.exports = router;
