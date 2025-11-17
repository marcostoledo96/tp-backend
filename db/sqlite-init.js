// Script de inicialización de SQLite para el demo
// Este archivo crea la base de datos local y las tablas necesarias

const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'sanpaholmes.db');

// Eliminar base de datos anterior si existe (para desarrollo)
if (fs.existsSync(DB_PATH)) {
  console.log('🗑️  Eliminando base de datos anterior...');
  fs.unlinkSync(DB_PATH);
}

console.log('🚀 Iniciando creación de base de datos SQLite...\n');

// Crear/conectar a la base de datos
const db = new Database(DB_PATH, { verbose: console.log });

// Habilitar foreign keys
db.pragma('foreign_keys = ON');

console.log('✅ Base de datos creada en:', DB_PATH);
console.log('');

// ==================== CREAR TABLAS ====================

console.log('📋 Creando tablas...\n');

// Tabla de usuarios (admin y vendedores)
db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    nombre_completo TEXT NOT NULL,
    email TEXT,
    role TEXT DEFAULT 'vendor',
    activo INTEGER DEFAULT 1,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
console.log('  ✓ Tabla usuarios');

// Tabla de productos
db.exec(`
  CREATE TABLE IF NOT EXISTS productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    categoria TEXT NOT NULL,
    subcategoria TEXT,
    precio REAL NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    descripcion TEXT,
    imagen_url TEXT,
    activo INTEGER DEFAULT 1,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
console.log('  ✓ Tabla productos');

// Tabla de compras
db.exec(`
  CREATE TABLE IF NOT EXISTS compras (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero_orden TEXT UNIQUE NOT NULL,
    comprador_nombre TEXT NOT NULL,
    comprador_mesa INTEGER,
    comprador_telefono TEXT,
    metodo_pago TEXT NOT NULL CHECK(metodo_pago IN ('efectivo', 'transferencia')),
    comprobante_archivo TEXT,
    total REAL NOT NULL,
    estado TEXT DEFAULT 'pendiente',
    abonado INTEGER DEFAULT 0,
    listo INTEGER DEFAULT 0,
    entregado INTEGER DEFAULT 0,
    detalles_pedido TEXT,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
console.log('  ✓ Tabla compras');

// Tabla de detalles de compras (relación N:M entre compras y productos)
db.exec(`
  CREATE TABLE IF NOT EXISTS detalles_compra (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    compra_id INTEGER NOT NULL,
    producto_id INTEGER NOT NULL,
    cantidad INTEGER NOT NULL,
    precio_unitario REAL NOT NULL,
    subtotal REAL NOT NULL,
    nombre_producto TEXT,
    FOREIGN KEY (compra_id) REFERENCES compras(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE SET NULL
  )
`);
console.log('  ✓ Tabla detalles_compra');

// Crear índices para mejorar performance
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_detalles_compra_compra_id ON detalles_compra(compra_id);
  CREATE INDEX IF NOT EXISTS idx_detalles_compra_producto_id ON detalles_compra(producto_id);
`);
console.log('  ✓ Índices creados');

console.log('');

// ==================== CREAR USUARIO ADMIN ====================

console.log('🔑 Creando usuario administrador...\n');

const passwordHash = bcrypt.hashSync('admin123', 10);

const insertAdmin = db.prepare(`
  INSERT INTO usuarios (username, password_hash, nombre_completo, email, role)
  VALUES (?, ?, ?, ?, ?)
`);

insertAdmin.run('admin', passwordHash, 'Administrador Demo', 'admin@sanpaholmes.com', 'admin');

console.log('  ✓ Usuario: admin / admin123 (role: admin)');
console.log('');

// ==================== CARGAR PRODUCTOS REALES ====================

console.log('🍔 Cargando productos reales desde producción...\n');

// Leer el archivo JSON con los productos reales
const productosReales = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'productos_reales_final.json'), 'utf-8')
);

const insertProducto = db.prepare(`
  INSERT INTO productos (nombre, categoria, subcategoria, precio, stock, descripcion, imagen_url, activo)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

// Insertar todos los productos en una transacción
const insertMany = db.transaction((productos) => {
  for (const p of productos) {
    insertProducto.run(
      p.nombre,
      p.categoria,
      p.subcategoria,
      p.precio,
      p.stock,
      p.descripcion,
      p.imagen_url,
      p.activo ? 1 : 0
    );
  }
});

insertMany(productosReales);

console.log(`  ✓ ${productosReales.length} productos cargados`);
console.log('');

// ==================== CREAR COMPRAS DE EJEMPLO ====================

console.log('🛒 Creando compras de ejemplo...\n');

const insertCompra = db.prepare(`
  INSERT INTO compras (numero_orden, comprador_nombre, comprador_mesa, metodo_pago, total, estado, abonado)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const insertDetalle = db.prepare(`
  INSERT INTO detalle_compra (compra_id, producto_id, cantidad, precio_unitario, subtotal)
  VALUES (?, ?, ?, ?, ?)
`);

// Compra 1: Pizza y bebida
const compra1 = insertCompra.run('SH-1731700000001', 'Juan Pérez', 5, 'efectivo', 1700, 'completado', 1);
insertDetalle.run(compra1.lastInsertRowid, 8, 1, 1200, 1200); // Pizza Muzzarela
insertDetalle.run(compra1.lastInsertRowid, 4, 1, 500, 500);   // Cunnington Naranja

// Compra 2: Café y medialunas
const compra2 = insertCompra.run('SH-1731700000002', 'María García', 3, 'transferencia', 2000, 'completado', 1);
insertDetalle.run(compra2.lastInsertRowid, 11, 1, 1000, 1000); // Café
insertDetalle.run(compra2.lastInsertRowid, 21, 1, 1000, 1000); // Medialunas

// Compra 3: Pancho y nuggets
const compra3 = insertCompra.run('SH-1731700000003', 'Carlos López', 8, 'efectivo', 6000, 'pendiente', 0);
insertDetalle.run(compra3.lastInsertRowid, 7, 1, 2000, 2000);  // Pancho
insertDetalle.run(compra3.lastInsertRowid, 6, 1, 4000, 4000);  // Nuggets

console.log('  ✓ 3 compras de ejemplo creadas');
console.log('');

// ==================== VERIFICAR DATOS ====================

console.log('📊 Verificando datos cargados...\n');

const totalProductos = db.prepare('SELECT COUNT(*) as total FROM productos WHERE activo = 1').get();
console.log(`  📦 Productos activos: ${totalProductos.total}`);

const totalCompras = db.prepare('SELECT COUNT(*) as total FROM compras').get();
console.log(`  🛒 Compras registradas: ${totalCompras.total}`);

const totalUsuarios = db.prepare('SELECT COUNT(*) as total FROM usuarios WHERE activo = 1').get();
console.log(`  👤 Usuarios activos: ${totalUsuarios.total}`);

console.log('');

// ==================== ÍNDICES PARA PERFORMANCE ====================

console.log('⚡ Creando índices para optimización...\n');

db.exec('CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria)');
db.exec('CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos(activo)');
db.exec('CREATE INDEX IF NOT EXISTS idx_compras_fecha ON compras(fecha)');
db.exec('CREATE INDEX IF NOT EXISTS idx_compras_estado ON compras(estado)');

console.log('  ✓ Índices creados');
console.log('');

// Cerrar conexión
db.close();

console.log('✅ ¡Base de datos SQLite inicializada correctamente!');
console.log('');
console.log('💡 Credenciales de acceso:');
console.log('   Usuario: admin');
console.log('   Contraseña: admin123');
console.log('');
console.log('📁 Ubicación: db/sanpaholmes.db');
console.log('');
