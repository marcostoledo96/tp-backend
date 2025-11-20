// Script para agregar columna telefono a tabla usuarios
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'db', 'sanpaholmes.db');

console.log('🔧 Aplicando migración: agregar columna telefono...');
console.log('📁 Base de datos:', DB_PATH);

const db = new Database(DB_PATH);

try {
  // Verificar si la columna ya existe
  const columns = db.pragma('table_info(usuarios)');
  const telefonoExists = columns.some(col => col.name === 'telefono');
  
  if (telefonoExists) {
    console.log('ℹ️  La columna telefono ya existe en la tabla usuarios');
  } else {
    // Agregar la columna telefono
    db.exec('ALTER TABLE usuarios ADD COLUMN telefono TEXT');
    console.log('✅ Columna telefono agregada exitosamente');
  }
  
  // Mostrar estructura actual
  console.log('\n📋 Estructura actual de la tabla usuarios:');
  const finalColumns = db.pragma('table_info(usuarios)');
  finalColumns.forEach(col => {
    console.log(`   - ${col.name} (${col.type})`);
  });
  
} catch (error) {
  console.error('❌ Error al aplicar migración:', error.message);
  process.exit(1);
} finally {
  db.close();
}

console.log('\n✅ Migración completada');
