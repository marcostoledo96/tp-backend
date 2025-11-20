// Script para eliminar todos los datos de prueba generados por tests
const Database = require('better-sqlite3');
const path = require('path');

const IS_VERCEL = process.env.VERCEL === '1' || process.env.VERCEL_ENV;
const DB_PATH = IS_VERCEL 
  ? '/tmp/sanpaholmes.db'
  : path.join(__dirname, '..', 'db', 'sanpaholmes.db');

console.log('🧹 LIMPIANDO DATOS DE PRUEBA...');
console.log('📁 Base de datos:', DB_PATH);

const db = new Database(DB_PATH);

try {
  console.log('\n=== ANÁLISIS PREVIO ===');
  const statsAntes = {
    productos: db.prepare('SELECT COUNT(*) as c FROM productos').get().c,
    productosTests: db.prepare('SELECT COUNT(*) as c FROM productos WHERE categoria = ?').get('Tests').c,
    usuarios: db.prepare('SELECT COUNT(*) as c FROM usuarios').get().c,
    usuariosPrueba: db.prepare('SELECT COUNT(*) as c FROM usuarios WHERE id > 8').get().c,
    compras: db.prepare('SELECT COUNT(*) as c FROM compras').get().c
  };
  
  console.log('Total productos:', statsAntes.productos, '(Tests:', statsAntes.productosTests + ')');
  console.log('Total usuarios:', statsAntes.usuarios, '(Prueba:', statsAntes.usuariosPrueba + ')');
  console.log('Total compras:', statsAntes.compras);

  // Usar transacción para garantizar atomicidad
  const limpiar = db.transaction(() => {
    console.log('\n=== ELIMINANDO DATOS ===');
    
    // 1. Primero eliminar detalles de compra relacionados con productos de prueba
    console.log('\n1. Eliminando detalles de compra de productos de prueba...');
    const resultDetallesPrueba = db.prepare(`
      DELETE FROM detalles_compra 
      WHERE producto_id IN (SELECT id FROM productos WHERE categoria = 'Tests')
    `).run();
    console.log(`   ✓ ${resultDetallesPrueba.changes} detalles eliminados`);
    
    // 2. Eliminar compras que ya no tienen detalles
    console.log('\n2. Eliminando compras huérfanas...');
    const resultCompras = db.prepare(`
      DELETE FROM compras 
      WHERE id NOT IN (SELECT DISTINCT compra_id FROM detalles_compra)
    `).run();
    console.log(`   ✓ ${resultCompras.changes} compras eliminadas`);
    
    // 3. Ahora sí eliminar productos de prueba (categoría "Tests")
    console.log('\n3. Eliminando productos de prueba...');
    const resultProductos = db.prepare(`
      DELETE FROM productos 
      WHERE categoria = 'Tests'
    `).run();
    console.log(`   ✓ ${resultProductos.changes} productos eliminados`);
    
    // 4. Eliminar usuarios de prueba (id > 8, excepto admin original)
    console.log('\n4. Eliminando usuarios de prueba...');
    const resultUsuarios = db.prepare(`
      DELETE FROM usuarios 
      WHERE id > 8
    `).run();
    console.log(`   ✓ ${resultUsuarios.changes} usuarios eliminados`);
    
    // 5. Limpiar roles duplicados o de prueba (mantener solo los 4 oficiales + el default)
    console.log('\n5. Limpiando roles...');
    const rolesOficiales = ['admin', 'vendedor', 'visitador', 'comprador', 'default'];
    const placeholders = rolesOficiales.map(() => '?').join(',');
    const resultRoles = db.prepare(`
      DELETE FROM roles 
      WHERE nombre NOT IN (${placeholders})
    `).run(...rolesOficiales);
    console.log(`   ✓ ${resultRoles.changes} roles duplicados eliminados`);
  });

  // Ejecutar limpieza
  limpiar();

  console.log('\n=== ANÁLISIS POST-LIMPIEZA ===');
  const statsDespues = {
    productos: db.prepare('SELECT COUNT(*) as c FROM productos').get().c,
    productosTests: db.prepare('SELECT COUNT(*) as c FROM productos WHERE categoria = ?').get('Tests').c,
    usuarios: db.prepare('SELECT COUNT(*) as c FROM usuarios').get().c,
    usuariosPrueba: db.prepare('SELECT COUNT(*) as c FROM usuarios WHERE id > 8').get().c,
    compras: db.prepare('SELECT COUNT(*) as c FROM compras').get().c
  };
  
  console.log('Total productos:', statsDespues.productos, '(Tests:', statsDespues.productosTests + ')');
  console.log('Total usuarios:', statsDespues.usuarios, '(Prueba:', statsDespues.usuariosPrueba + ')');
  console.log('Total compras:', statsDespues.compras);

  console.log('\n=== RESUMEN ===');
  console.log('✅ Productos eliminados:', statsAntes.productos - statsDespues.productos);
  console.log('✅ Usuarios eliminados:', statsAntes.usuarios - statsDespues.usuarios);
  console.log('✅ Compras eliminadas:', statsAntes.compras - statsDespues.compras);
  
  console.log('\n✅ LIMPIEZA COMPLETADA EXITOSAMENTE');

} catch (error) {
  console.error('\n❌ ERROR:', error.message);
  process.exit(1);
} finally {
  db.close();
}
