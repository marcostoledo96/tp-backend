// Yo: Script para aplicar una migración específica a la base de datos SQLite
// Lo uso para actualizar el esquema sin recrear toda la base de datos.

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'sanpaholmes.db');

// Verificar que existe la base de datos
if (!fs.existsSync(DB_PATH)) {
  console.error('❌ No se encontró la base de datos en:', DB_PATH);
  console.log('💡 Ejecutá primero: node db/sqlite-init.js');
  process.exit(1);
}

// Obtener el nombre del archivo de migración desde argumentos
const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('❌ Debes especificar el archivo de migración.');
  console.log('💡 Uso: node db/apply-sqlite-migration.js 001_add_roles_permisos_system.sql');
  process.exit(1);
}

const migrationPath = path.join(__dirname, 'migrations', migrationFile);

if (!fs.existsSync(migrationPath)) {
  console.error('❌ No se encontró la migración:', migrationPath);
  process.exit(1);
}

console.log('🔄 Aplicando migración:', migrationFile);
console.log('');

// Yo: Abro la base de datos y ejecuto el SQL de la migración
const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

try {
  // Leer el contenido del archivo SQL
  const sql = fs.readFileSync(migrationPath, 'utf-8');
  
  // Yo: Ejecuto todo el SQL dentro de una transacción para garantizar atomicidad
  // Si algo falla, se revierte todo automáticamente
  db.transaction(() => {
    db.exec(sql);
  })();
  
  console.log('✅ Migración aplicada exitosamente');
  console.log('');
  
  // Verificar que las nuevas tablas existan
  const tablas = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name IN ('roles', 'permisos', 'roles_permisos')
    ORDER BY name
  `).all();
  
  if (tablas.length > 0) {
    console.log('📋 Tablas creadas:');
    tablas.forEach(t => console.log(`  ✓ ${t.name}`));
    console.log('');
  }
  
  // Contar registros
  const countRoles = db.prepare('SELECT COUNT(*) as total FROM roles').get();
  const countPermisos = db.prepare('SELECT COUNT(*) as total FROM permisos').get();
  
  console.log('📊 Datos insertados:');
  console.log(`  • Roles: ${countRoles.total}`);
  console.log(`  • Permisos: ${countPermisos.total}`);
  console.log('');
  
} catch (error) {
  console.error('❌ Error al aplicar migración:', error.message);
  process.exit(1);
} finally {
  db.close();
}

console.log('✅ Proceso completado');
