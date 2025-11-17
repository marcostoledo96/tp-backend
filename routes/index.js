// ARCHIVO PRINCIPAL DE RUTAS
// Centraliza todas las rutas de la API
// Parte del patrón MVC - Router principal

const express = require('express');
const router = express.Router();

// Importar rutas
const productosRoutes = require('./productos');
const comprasRoutes = require('./compras');
const authRoutes = require('./auth');
const rolesRoutes = require('./roles');
const usuariosRoutes = require('./usuarios');

// Montar rutas
router.use('/productos', productosRoutes);
router.use('/compras', comprasRoutes);
router.use('/auth', authRoutes);
router.use('/roles', rolesRoutes);
router.use('/usuarios', usuariosRoutes);

// Ruta de health check
router.get('/health', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  
  // Verificar que la base de datos SQLite existe
  const dbPath = path.join(__dirname, '..', 'db', 'sanpaholmes.db');
  const dbExists = fs.existsSync(dbPath);
  
  res.json({
    success: true,
    mensaje: '✅ API funcionando correctamente - Arquitectura MVC',
    timestamp: new Date().toISOString(),
    architecture: 'MVC (Modelo-Vista-Controlador)',
    database: {
      type: 'SQLite',
      connected: dbExists,
      path: 'db/sanpaholmes.db',
      info: 'Base de datos local con CRUD completo'
    },
    environment: process.env.NODE_ENV || 'development'
  });
});

module.exports = router;
