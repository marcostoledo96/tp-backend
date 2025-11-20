// Servidor principal con Express - Arquitectura MVC
// Backend organizado según el patrón Modelo-Vista-Controlador
// Servidor Express que sirve el frontend React y la API REST

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// Inicializar DB en Vercel (copiar a /tmp)
const { IS_VERCEL } = require('./models/database');
if (IS_VERCEL) {
  console.log('🔧 Inicializando DB para Vercel en /tmp...');
  const { getDB } = require('./models/database');
  try {
    const db = getDB();
    db.close();
    console.log('✅ DB inicializada correctamente en Vercel');
  } catch (error) {
    console.error('❌ Error al inicializar DB:', error);
  }
}

// Middlewares globales
app.use(cors()); // Permite peticiones desde otros dominios
app.use(express.json()); // Para leer JSON en las peticiones
app.use(express.urlencoded({ extended: true })); // Para leer formularios

// Servimos los archivos estáticos (imágenes, CSS, JS)
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// Rutas de la API - Arquitectura MVC
// Todas las rutas están centralizadas en routes/index.js
const apiRoutes = require('./routes');

app.use('/api', apiRoutes);

// Ruta para la raíz - sirve el frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    success: false,
    mensaje: 'Ruta no encontrada'
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    mensaje: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Iniciar el servidor (evitar levantar múltiples veces en entorno de test)
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`\n🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`🏗️  Arquitectura: MVC (Modelo-Vista-Controlador)`);
    console.log(`📋 API Health: http://localhost:${PORT}/api/health`);
    console.log(`🛍️ API Productos: http://localhost:${PORT}/api/productos`);
    console.log(`🛒 API Compras: http://localhost:${PORT}/api/compras`);
    console.log(`🔐 API Auth: http://localhost:${PORT}/api/auth/login\n`);
  });
}

// Exportar para Vercel
module.exports = app;
