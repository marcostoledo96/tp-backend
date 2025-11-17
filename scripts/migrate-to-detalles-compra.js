// Script de migración: Crear tabla detalles_compra
// Este script migra de items JSON a una tabla relacional normalizada

const Database = require('better-sqlite3');
const path = require('path');

// Detectar si estamos en Vercel
const IS_VERCEL = process.env.VERCEL === '1' || process.env.VERCEL_ENV;
const DB_PATH = IS_VERCEL 
  ? '/tmp/sanpaholmes.db'
  : path.join(__dirname, '..', 'db', 'sanpaholmes.db');

console.log('📦 Iniciando migración a tabla detalles_compra...');
console.log('📁 Base de datos:', DB_PATH);

const db = new Database(DB_PATH);

try {
  // 1. Verificar si ya existe la tabla con el nombre nuevo
  const tableExists = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='detalles_compra'
  `).get();
  
  if (tableExists) {
    console.log('✅ La tabla detalles_compra ya existe');
    const count = db.prepare('SELECT COUNT(*) as count FROM detalles_compra').get();
    console.log(`📊 Registros existentes: ${count.count}`);
    process.exit(0);
  }

  // 2. Verificar si existe la tabla antigua
  const oldTableExists = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='detalle_compra'
  `).get();
  
  console.log('\n1️⃣ Creando tabla detalles_compra...');
  
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
    );
  `);
  
  console.log('✅ Tabla detalles_compra creada');

  // 3. Crear índices para mejorar performance
  console.log('\n2️⃣ Creando índices...');
  
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_detalles_compra_compra_id ON detalles_compra(compra_id);
    CREATE INDEX IF NOT EXISTS idx_detalles_compra_producto_id ON detalles_compra(producto_id);
  `);
  
  console.log('✅ Índices creados');

  // 4. Migrar datos de la tabla antigua si existe
  if (oldTableExists) {
    console.log('\n3️⃣ Migrando datos desde detalle_compra...');
    
    const detalles = db.prepare('SELECT * FROM detalle_compra').all();
    
    const insertDetalle = db.prepare(`
      INSERT INTO detalles_compra (id, compra_id, producto_id, cantidad, precio_unitario, subtotal, nombre_producto)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (const detalle of detalles) {
      // Obtener el nombre del producto si aún existe
      const producto = db.prepare('SELECT nombre FROM productos WHERE id = ?').get(detalle.producto_id);
      const nombreProducto = producto ? producto.nombre : `Producto ID ${detalle.producto_id}`;
      
      insertDetalle.run(
        detalle.id,
        detalle.compra_id,
        detalle.producto_id,
        detalle.cantidad,
        detalle.precio_unitario,
        detalle.subtotal,
        nombreProducto
      );
    }
    
    console.log(`✅ ${detalles.length} detalles migrados exitosamente`);
    
    console.log('\n4️⃣ Eliminando tabla antigua...');
    db.exec('DROP TABLE IF EXISTS detalle_compra');
    console.log('✅ Tabla detalle_compra eliminada');
  }

  // 5. Verificar migración
  console.log('\n5️⃣ Verificando migración...');
  
  const countCompras = db.prepare('SELECT COUNT(*) as count FROM compras').get();
  const countDetalles = db.prepare('SELECT COUNT(*) as count FROM detalles_compra').get();
  
  console.log(`📊 Compras: ${countCompras.count}`);
  console.log(`📊 Detalles: ${countDetalles.count}`);

  console.log('\n✅ Migración completada exitosamente');

} catch (error) {
  console.error('❌ Error durante la migración:', error);
  process.exit(1);
} finally {
  db.close();
}
