// CONTROLADOR: Autenticación
// Maneja la lógica de negocio para autenticación y autorización
// Parte del patrón MVC - Controlador que conecta rutas con modelos

const UsuarioModel = require('../models/UsuarioModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Clave secreta para firmar tokens JWT (debe coincidir con middleware/auth.js)
const JWT_SECRET = process.env.JWT_SECRET || 'sanpaholmes-secret-key-2025';

/**
 * Inicio de sesión
 * POST /api/auth/login
 */
async function login(req, res) {
  try {
    const { username, password } = req.body;

    console.log('=== INICIO LOGIN ===');
    console.log('Usuario intentando loguearse:', username);

    // Validación básica
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        mensaje: 'Faltan el usuario y/o la contraseña'
      });
    }

    // Buscar usuario en el modelo
    const user = UsuarioModel.obtenerUsuarioPorUsername(username);

    if (!user) {
      return res.status(401).json({
        success: false,
        mensaje: 'Usuario o contraseña incorrectos'
      });
    }

    // Verificar la contraseña con bcrypt
    const passwordValida = await bcrypt.compare(password, user.password_hash);

    if (!passwordValida) {
      return res.status(401).json({
        success: false,
        mensaje: 'Usuario o contraseña incorrectos'
      });
    }

    console.log('✅ Login exitoso para:', username);

    // Generar token JWT
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        roles: [user.role],
        permisos: ['ver_productos', 'gestionar_productos', 'ver_compras', 'crear_compra', 'editar_compras', 'eliminar_compras']
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Responder con éxito
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
}

/**
 * Obtener información del usuario autenticado
 * GET /api/auth/me
 */
async function obtenerUsuarioActual(req, res) {
  try {
    // Extraer el token del header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        mensaje: 'No se proporcionó token de autenticación'
      });
    }

    // Quitar "Bearer " para obtener solo el token
    const token = authHeader.substring(7);

    // Verificar el token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return res.status(401).json({
        success: false,
        mensaje: 'Token inválido o expirado'
      });
    }

    // Obtener el usuario del modelo
    const user = UsuarioModel.obtenerUsuarioPorUsername(decoded.username);

    if (!user) {
      return res.status(404).json({
        success: false,
        mensaje: 'Usuario no encontrado'
      });
    }

    // Responder con los datos del usuario
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
}

module.exports = {
  login,
  obtenerUsuarioActual
};
