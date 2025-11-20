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
  console.log('Inicializando DB para Vercel en /tmp...');
  const { getDB } = require('./models/database');
  try {
    const db = getDB();
    db.close();
    console.log('OK: DB inicializada correctamente en Vercel');
  } catch (error) {
    console.error('ERROR: Error al inicializar DB:', error);
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
  // En desarrollo, redirigir al servidor de Vite (puerto 5173)
  // En producción, servir el build de dist/
  if (process.env.NODE_ENV === 'production') {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  } else {
    res.send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Backend corriendo - Ir al Frontend</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: #f5f5f5;
          }
          .card {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          h1 { color: #2c3e50; }
          h2 { color: #3498db; margin-top: 30px; }
          code {
            background: #ecf0f1;
            padding: 2px 8px;
            border-radius: 4px;
            font-family: monospace;
          }
          .status { color: #27ae60; font-weight: bold; }
          .warning { color: #e74c3c; }
          ul { line-height: 1.8; }
          a {
            display: inline-block;
            margin-top: 20px;
            padding: 12px 24px;
            background: #3498db;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
          }
          a:hover { background: #2980b9; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Backend API - SanpaHolmes</h1>
          <p class="status">✓ El servidor backend está corriendo correctamente en el puerto 3000</p>
          
          <h2>Para ver el frontend:</h2>
          <p class="warning">El frontend de React corre en un servidor separado (Vite).</p>
          <p>Abre una nueva terminal y ejecuta:</p>
          <code>npm run dev</code>
          <p>Luego abre: <a href="http://localhost:5173" target="_blank">http://localhost:5173</a></p>
          
          <h2>Endpoints API disponibles:</h2>
          <ul>
            <li><a href="/api/health">/api/health</a> - Estado del servidor</li>
            <li><a href="/api/productos">/api/productos</a> - Listado de productos</li>
            <li>/api/auth/login - Login (POST)</li>
            <li>/api/compras - Gestión de compras (requiere auth)</li>
          </ul>
          
          <h2>Documentación:</h2>
          <p>Consulta el archivo <code>DEFENSA_V2.md</code> para documentación completa del backend.</p>
        </div>
      </body>
      </html>
    `);
  }
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
    console.log(`\nServidor corriendo en http://localhost:${PORT}`);
    console.log(`Arquitectura: MVC (Modelo-Vista-Controlador)`);
    console.log(`API Health: http://localhost:${PORT}/api/health`);
    console.log(`API Productos: http://localhost:${PORT}/api/productos`);
    console.log(`API Compras: http://localhost:${PORT}/api/compras`);
    console.log(`API Auth: http://localhost:${PORT}/api/auth/login\n`);
  });
}

// Exportar para Vercel
module.exports = app;
