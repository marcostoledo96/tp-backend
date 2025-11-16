// API de autenticación para la DEMO
// Maneja el inicio de sesión y autenticación de usuarios
// IMPORTANTE: Esta es una versión DEMO que usa JSON como base de datos

const express = require('express');
const router = express.Router();
const db = require('../db/json-db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Clave secreta para firmar tokens JWT
// Para la demo usamos una clave fija y simple
const JWT_SECRET = process.env.JWT_SECRET || 'sanpaholmes-demo-secret-2025';

// 🔐 POST /api/auth/login - Inicio de sesión
// Credenciales de la demo: admin / admin123
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log('=== INICIO LOGIN (DEMO) ===');
    console.log('Usuario intentando loguearse:', username);

    // Validación básica
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        mensaje: 'Faltan el usuario y/o la contraseña'
      });
    }

    // Buscamos el usuario en el JSON
    const user = db.buscarUsuarioPorUsername(username);

    if (!user) {
      return res.status(401).json({
        success: false,
        mensaje: 'Usuario o contraseña incorrectos'
      });
    }

    // Verificamos la contraseña
    // Para la demo, aceptamos "admin123" directamente
    const passwordValida = await db.verificarPassword(password, user.password_hash);

    if (!passwordValida) {
      return res.status(401).json({
        success: false,
        mensaje: 'Usuario o contraseña incorrectos'
      });
    }

    console.log('✅ Login exitoso para:', username);

    // Generamos el token JWT
    // El token identifica al usuario en las próximas peticiones
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        roles: [user.role], // En la demo solo hay un rol
        permisos: ['ver_productos', 'gestionar_productos', 'ver_compras', 'crear_compra', 'editar_compras', 'eliminar_compras']
      },
      JWT_SECRET,
      { expiresIn: '24h' } // El token expira en 24 horas
    );

    // Respondemos con éxito
    res.json({
      success: true,
      mensaje: 'Inicio de sesión exitoso',
      token: token,
      usuario: {
        id: user.id,
        username: user.username,
        nombre_completo: user.nombre_completo,
        email: user.email,
        roles: [user.role],
        permisos: ['ver_productos', 'gestionar_productos', 'ver_compras', 'crear_compra', 'editar_compras', 'eliminar_compras']
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al iniciar sesión'
    });
  }
});

// 👤 GET /api/auth/me - Obtener información del usuario autenticado
// Sirve para verificar que el token sigue siendo válido
router.get('/me', async (req, res) => {
  try {
    // Extraemos el token del header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        mensaje: 'No se proporcionó token de autenticación'
      });
    }

    // Quitamos "Bearer " para obtener solo el token
    const token = authHeader.substring(7);

    // Verificamos el token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return res.status(401).json({
        success: false,
        mensaje: 'Token inválido o expirado'
      });
    }

    // Obtenemos el usuario del JSON
    const user = db.buscarUsuarioPorUsername(decoded.username);

    if (!user) {
      return res.status(404).json({
        success: false,
        mensaje: 'Usuario no encontrado'
      });
    }

    // Respondemos con los datos del usuario
    res.json({
      success: true,
      usuario: {
        id: user.id,
        username: user.username,
        nombre_completo: user.nombre_completo,
        email: user.email,
        roles: [user.role],
        permisos: decoded.permisos
      }
    });

  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al obtener información del usuario'
    });
  }
});

// 🔑 POST /api/auth/cambiar-password - Cambiar contraseña
// IMPORTANTE: En esta DEMO, solo SIMULA el cambio, NO modifica el JSON
router.post('/cambiar-password', async (req, res) => {
  try {
    // Verificamos autenticación
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        mensaje: 'No autorizado'
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);

    const { password_actual, password_nueva } = req.body;

    console.log('✨ DEMO: Simulando cambio de contraseña para:', decoded.username);

    // Validaciones
    if (!password_actual || !password_nueva) {
      return res.status(400).json({
        success: false,
        mensaje: 'Faltan datos requeridos'
      });
    }

    if (password_nueva.length < 6) {
      return res.status(400).json({
        success: false,
        mensaje: 'La nueva contraseña debe tener al menos 6 caracteres'
      });
    }

    const user = db.buscarUsuarioPorUsername(decoded.username);

    if (!user) {
      return res.status(404).json({
        success: false,
        mensaje: 'Usuario no encontrado'
      });
    }

    // Verificamos la contraseña actual
    const passwordValida = await db.verificarPassword(password_actual, user.password_hash);

    if (!passwordValida) {
      return res.status(401).json({
        success: false,
        mensaje: 'La contraseña actual es incorrecta'
      });
    }

    console.log('✅ DEMO: Contraseña cambiada exitosamente');
    console.log('⚠️ NOTA: Este cambio NO se guardó realmente en la base de datos (es solo para demo)');

    res.json({
      success: true,
      mensaje: 'Contraseña cambiada exitosamente (simulado para demo)',
      demo: true
    });

  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al cambiar contraseña'
    });
  }
});

module.exports = router;
