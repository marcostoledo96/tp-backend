// Script temporal para verificar y migrar datos
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'db', 'sanpaholmes.db');
const db = new Database(DB_PATH);

console.log('📊 Verificando datos...\n');

// Ver tablas
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tablas existentes:', tables.map(t => t.name).join(', '));
console.log('');

// Ver datos en detalle_compra
try {
  const countOld = db.prepare('SELECT COUNT(*) as c FROM detalle_compra').get();
  console.log(`Registros en detalle_compra: ${countOld.c}`);
  
  if (countOld.c > 0) {
    console.log('\n🔄 Migrando datos...');
    const detalles = db.prepare('SELECT * FROM detalle_compra').all();
    
    const insertDetalle = db.prepare(`
      INSERT INTO detalles_compra (compra_id, producto_id, cantidad, precio_unitario, subtotal, nombre_producto)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    for (const detalle of detalles) {
      const producto = db.prepare('SELECT nombre FROM productos WHERE id = ?').get(detalle.producto_id);
      const nombreProducto = producto ? producto.nombre : `Producto ID ${detalle.producto_id}`;
      
      insertDetalle.run(
        detalle.compra_id,
        detalle.producto_id,
        detalle.cantidad,
        detalle.precio_unitario,
        detalle.subtotal,
        nombreProducto
      );
    }
    console.log(`✅ ${detalles.length} registros migrados`);
  }
} catch (e) {
  console.log('⚠️ Tabla detalle_compra no existe o está vacía');
}

// Ver datos en detalles_compra
const countNew = db.prepare('SELECT COUNT(*) as c FROM detalles_compra').get();
console.log(`Registros en detalles_compra: ${countNew.c}`);

// Ver compras
const countCompras = db.prepare('SELECT COUNT(*) as c FROM compras').get();
console.log(`Registros en compras: ${countCompras.c}`);

db.close();
console.log('\n✅ Verificación completada');
