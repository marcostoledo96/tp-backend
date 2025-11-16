// Sistema de base de datos JSON para la demo
// Este archivo maneja la lectura de datos desde database.json
// IMPORTANTE: En esta demo, los datos NO se modifican realmente

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

// Ruta al archivo de base de datos
const DB_PATH = path.join(__dirname, 'database.json');

// Leemos los datos del archivo JSON
function leerBaseDeDatos() {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Error al leer la base de datos:', error);
    throw new Error('No se pudo leer la base de datos');
  }
}

// ===== FUNCIONES DE USUARIOS =====

// Buscar usuario por username
function buscarUsuarioPorUsername(username) {
  const db = leerBaseDeDatos();
  return db.usuarios.find(u => u.username === username);
}

// Verificar contraseña
async function verificarPassword(password, hash) {
  // Para la demo, si la contraseña es "admin123" siempre es válida
  if (password === 'admin123') {
    return true;
  }
  // También verificamos con bcrypt por si acaso
  return await bcrypt.compare(password, hash);
}

// ===== FUNCIONES DE PRODUCTOS =====

// Obtener todos los productos activos (para el menú público)
function obtenerProductosActivos(filtros = {}) {
  const db = leerBaseDeDatos();
  let productos = db.productos.filter(p => p.activo === true);

  // Aplicamos filtros si existen
  if (filtros.categoria) {
    productos = productos.filter(p => p.categoria === filtros.categoria);
  }
  if (filtros.subcategoria) {
    productos = productos.filter(p => p.subcategoria === filtros.subcategoria);
  }

  return productos;
}

// Obtener TODOS los productos (para el panel admin)
function obtenerTodosLosProductos(filtros = {}) {
  const db = leerBaseDeDatos();
  let productos = db.productos;

  // Aplicamos filtros si existen
  if (filtros.categoria) {
    productos = productos.filter(p => p.categoria === filtros.categoria);
  }
  if (filtros.subcategoria) {
    productos = productos.filter(p => p.subcategoria === filtros.subcategoria);
  }

  // Ordenamos: activos primero
  return productos.sort((a, b) => {
    if (a.activo === b.activo) return 0;
    return a.activo ? -1 : 1;
  });
}

// Obtener un producto por ID
function obtenerProductoPorId(id) {
  const db = leerBaseDeDatos();
  return db.productos.find(p => p.id === parseInt(id));
}

// ===== FUNCIONES DE COMPRAS =====

// Obtener todas las compras (para el panel admin)
function obtenerTodasLasCompras() {
  const db = leerBaseDeDatos();
  return db.compras.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
}

// Obtener una compra por ID
function obtenerCompraPorId(id) {
  const db = leerBaseDeDatos();
  return db.compras.find(c => c.id === parseInt(id));
}

// Obtener el total de ventas
function obtenerTotalVentas() {
  const db = leerBaseDeDatos();
  return db.compras.reduce((total, compra) => total + compra.total, 0);
}

// ===== FUNCIONES DE SIMULACIÓN =====
// Estas funciones simulan operaciones de escritura pero NO modifican el JSON

// Simular creación de compra
function simularCrearCompra(datosCompra) {
  // Generamos un ID aleatorio para la simulación
  const nuevoId = Math.floor(Math.random() * 10000) + 1000;
  
  return {
    id: nuevoId,
    ...datosCompra,
    fecha: new Date().toISOString(),
    estado: 'pendiente',
    abonado: datosCompra.metodo_pago === 'transferencia',
    listo: false,
    entregado: false
  };
}

// Simular creación de producto
function simularCrearProducto(datosProducto) {
  const nuevoId = Math.floor(Math.random() * 10000) + 1000;
  
  return {
    id: nuevoId,
    ...datosProducto,
    activo: true,
    creado_en: new Date().toISOString()
  };
}

// Simular actualización de producto
function simularActualizarProducto(id, datosActualizados) {
  const producto = obtenerProductoPorId(id);
  if (!producto) return null;
  
  return {
    ...producto,
    ...datosActualizados
  };
}

// Simular eliminación de producto (soft delete)
function simularEliminarProducto(id) {
  const producto = obtenerProductoPorId(id);
  if (!producto) return null;
  
  return {
    ...producto,
    activo: false
  };
}

// Simular actualización de compra
function simularActualizarCompra(id, datosActualizados) {
  const compra = obtenerCompraPorId(id);
  if (!compra) return null;
  
  return {
    ...compra,
    ...datosActualizados
  };
}

// ===== VERIFICACIONES =====

// Verificar si hay stock suficiente
function verificarStock(productoId, cantidad) {
  const producto = obtenerProductoPorId(productoId);
  if (!producto) return false;
  return producto.stock >= cantidad;
}

// Verificar si un producto está activo
function verificarProductoActivo(productoId) {
  const producto = obtenerProductoPorId(productoId);
  if (!producto) return false;
  return producto.activo;
}

// ===== EXPORTAMOS TODAS LAS FUNCIONES =====

module.exports = {
  // Usuarios
  buscarUsuarioPorUsername,
  verificarPassword,
  
  // Productos
  obtenerProductosActivos,
  obtenerTodosLosProductos,
  obtenerProductoPorId,
  
  // Compras
  obtenerTodasLasCompras,
  obtenerCompraPorId,
  obtenerTotalVentas,
  
  // Simulaciones (NO modifican el JSON)
  simularCrearCompra,
  simularCrearProducto,
  simularActualizarProducto,
  simularEliminarProducto,
  simularActualizarCompra,
  
  // Verificaciones
  verificarStock,
  verificarProductoActivo
};
