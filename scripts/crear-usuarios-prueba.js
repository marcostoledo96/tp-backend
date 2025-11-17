// Script para crear usuarios de prueba con diferentes roles
const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const path = require('path');

const IS_VERCEL = process.env.VERCEL === '1' || process.env.VERCEL_ENV;
const DB_PATH = IS_VERCEL 
  ? '/tmp/sanpaholmes.db'
  : path.join(__dirname, '..', 'db', 'sanpaholmes.db');

console.log('👥 Creando usuarios de prueba...');
console.log('📁 Base de datos:', DB_PATH);

const db = new Database(DB_PATH);

try {
  // Obtener roles
  const roleAdmin = db.prepare('SELECT id FROM roles WHERE nombre = ?').get('admin');
  const roleVendedor = db.prepare('SELECT id FROM roles WHERE nombre = ?').get('vendedor');
  const roleVisitador = db.prepare('SELECT id FROM roles WHERE nombre = ?').get('visitador');

  if (!roleAdmin || !roleVendedor || !roleVisitador) {
    console.error('❌ Error: Los roles no existen. Ejecuta primero setup-roles-permisos.js');
    process.exit(1);
  }

  // Usuarios de prueba
  const usuarios = [
    {
      username: 'admin',
      password: 'admin123',
      nombre: 'Administrador Principal',
      role_id: roleAdmin.id,
      descripcion: 'Usuario administrador con acceso total al sistema'
    },
    {
      username: 'vendedor1',
      password: 'vend123',
      nombre: 'Juan Pérez',
      role_id: roleVendedor.id,
      descripcion: 'Vendedor encargado del turno mañana'
    },
    {
      username: 'vendedor2',
      password: 'vend456',
      nombre: 'María González',
      role_id: roleVendedor.id,
      descripcion: 'Vendedora encargada del turno tarde'
    },
    {
      username: 'visitador1',
      password: 'visit123',
      nombre: 'Carlos Rodríguez',
      role_id: roleVisitador.id,
      descripcion: 'Supervisor de calidad (solo lectura)'
    },
    {
      username: 'visitador2',
      password: 'visit456',
      nombre: 'Ana Martínez',
      role_id: roleVisitador.id,
      descripcion: 'Auditor externo (solo lectura)'
    }
  ];

  const insertUsuario = db.prepare(`
    INSERT OR REPLACE INTO usuarios (username, password_hash, nombre_completo, role_id)
    VALUES (?, ?, ?, ?)
  `);

  console.log('\n🔐 Creando usuarios...\n');

  for (const usuario of usuarios) {
    const hashedPassword = bcrypt.hashSync(usuario.password, 10);
    insertUsuario.run(usuario.username, hashedPassword, usuario.nombre, usuario.role_id);
    
    const roleName = usuario.role_id === roleAdmin.id ? 'admin' 
                   : usuario.role_id === roleVendedor.id ? 'vendedor' 
                   : 'visitador';
    
    console.log(`✅ ${usuario.nombre}`);
    console.log(`   Usuario: ${usuario.username}`);
    console.log(`   Contraseña: ${usuario.password}`);
    console.log(`   Rol: ${roleName}`);
    console.log(`   Descripción: ${usuario.descripcion}\n`);
  }

  // Verificar
  const count = db.prepare('SELECT COUNT(*) as c FROM usuarios').get();
  console.log(`📊 Total de usuarios en la base de datos: ${count.c}`);
  
  console.log('\n✅ Usuarios de prueba creados exitosamente');
  console.log('📄 Consulta el archivo USUARIOS_PRUEBA.md para más detalles');

} catch (error) {
  console.error('❌ Error:', error);
  process.exit(1);
} finally {
  db.close();
}
