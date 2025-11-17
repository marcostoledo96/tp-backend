// Script para crear tablas de roles y permisos
const Database = require('better-sqlite3');
const path = require('path');

const IS_VERCEL = process.env.VERCEL === '1' || process.env.VERCEL_ENV;
const DB_PATH = IS_VERCEL 
  ? '/tmp/sanpaholmes.db'
  : path.join(__dirname, '..', 'db', 'sanpaholmes.db');

console.log('🔐 Creando sistema de roles y permisos...');
console.log('📁 Base de datos:', DB_PATH);

const db = new Database(DB_PATH);

try {
  // 1. Crear tabla de roles
  console.log('\n1️⃣ Creando tabla roles...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT UNIQUE NOT NULL,
      descripcion TEXT,
      activo INTEGER DEFAULT 1,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('✅ Tabla roles creada');

  // 2. Crear tabla de permisos
  console.log('\n2️⃣ Creando tabla permisos...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS permisos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT UNIQUE NOT NULL,
      descripcion TEXT,
      categoria TEXT,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('✅ Tabla permisos creada');

  // 3. Crear tabla relacional roles_permisos (N:M)
  console.log('\n3️⃣ Creando tabla roles_permisos...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS roles_permisos (
      role_id INTEGER NOT NULL,
      permiso_id INTEGER NOT NULL,
      PRIMARY KEY (role_id, permiso_id),
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
      FOREIGN KEY (permiso_id) REFERENCES permisos(id) ON DELETE CASCADE
    );
  `);
  console.log('✅ Tabla roles_permisos creada');

  // 4. Agregar columna role_id a usuarios si no existe
  console.log('\n4️⃣ Actualizando tabla usuarios...');
  try {
    db.exec(`ALTER TABLE usuarios ADD COLUMN role_id INTEGER REFERENCES roles(id)`);
    console.log('✅ Columna role_id agregada a usuarios');
  } catch (e) {
    if (e.message.includes('duplicate column')) {
      console.log('ℹ️  Columna role_id ya existe');
    } else {
      throw e;
    }
  }

  // 5. Insertar roles predeterminados
  console.log('\n5️⃣ Insertando roles predeterminados...');
  const insertRole = db.prepare(`
    INSERT OR IGNORE INTO roles (nombre, descripcion)
    VALUES (?, ?)
  `);

  insertRole.run('admin', 'Administrador - Acceso total: CRUD productos, ventas y usuarios');
  insertRole.run('vendedor', 'Vendedor - CRUD productos y ventas (sin crear usuarios)');
  insertRole.run('visitador', 'Visitador - Solo visualización de productos y ventas');
  
  console.log('✅ Roles insertados');

  // 6. Insertar permisos predeterminados
  console.log('\n6️⃣ Insertando permisos predeterminados...');
  const insertPermiso = db.prepare(`
    INSERT OR IGNORE INTO permisos (nombre, descripcion, categoria)
    VALUES (?, ?, ?)
  `);

  // Permisos de productos
  insertPermiso.run('ver_productos', 'Ver listado de productos', 'productos');
  insertPermiso.run('gestionar_productos', 'Crear, editar y eliminar productos', 'productos');
  
  // Permisos de compras
  insertPermiso.run('crear_compra', 'Crear nuevas compras', 'compras');
  insertPermiso.run('ver_compras', 'Ver historial de compras', 'compras');
  insertPermiso.run('editar_compras', 'Editar estado de compras', 'compras');
  insertPermiso.run('eliminar_compras', 'Eliminar compras', 'compras');
  
  // Permisos de usuarios
  insertPermiso.run('ver_usuarios', 'Ver listado de usuarios', 'usuarios');
  insertPermiso.run('gestionar_usuarios', 'Crear, editar y eliminar usuarios', 'usuarios');
  
  // Permisos de roles
  insertPermiso.run('ver_roles', 'Ver listado de roles', 'roles');
  insertPermiso.run('gestionar_roles', 'Crear, editar y eliminar roles y permisos', 'roles');
  
  console.log('✅ Permisos insertados');

  // 7. Asignar permisos a roles
  console.log('\n7️⃣ Asignando permisos a roles...');
  
  const roleAdmin = db.prepare('SELECT id FROM roles WHERE nombre = ?').get('admin');
  const roleVendedor = db.prepare('SELECT id FROM roles WHERE nombre = ?').get('vendedor');
  const roleVisitador = db.prepare('SELECT id FROM roles WHERE nombre = ?').get('visitador');
  
  const todosLosPermisos = db.prepare('SELECT id FROM permisos').all();
  
  const insertRolePermiso = db.prepare(`
    INSERT OR IGNORE INTO roles_permisos (role_id, permiso_id)
    VALUES (?, ?)
  `);
  
  // Admin: TODOS los permisos (gestiona productos, ventas Y usuarios)
  for (const permiso of todosLosPermisos) {
    insertRolePermiso.run(roleAdmin.id, permiso.id);
  }
  console.log(`  ✓ Admin: ${todosLosPermisos.length} permisos asignados (acceso total)`);
  
  // Vendedor: CRUD productos y ventas (SIN gestionar usuarios)
  const permisosVendedor = [
    'ver_productos', 
    'gestionar_productos', 
    'crear_compra', 
    'ver_compras', 
    'editar_compras', 
    'eliminar_compras',
    'ver_roles' // puede ver roles pero no modificarlos
  ];
  for (const nombrePermiso of permisosVendedor) {
    const permiso = db.prepare('SELECT id FROM permisos WHERE nombre = ?').get(nombrePermiso);
    if (permiso) {
      insertRolePermiso.run(roleVendedor.id, permiso.id);
    }
  }
  console.log(`  ✓ Vendedor: ${permisosVendedor.length} permisos asignados (CRUD productos/ventas)`);
  
  // Visitador: SOLO lectura de productos y ventas
  const permisosVisitador = ['ver_productos', 'ver_compras'];
  for (const nombrePermiso of permisosVisitador) {
    const permiso = db.prepare('SELECT id FROM permisos WHERE nombre = ?').get(nombrePermiso);
    if (permiso) {
      insertRolePermiso.run(roleVisitador.id, permiso.id);
    }
  }
  console.log(`  ✓ Visitador: ${permisosVisitador.length} permisos asignados (solo lectura)`);

  // 8. Asignar rol admin al usuario admin existente
  console.log('\n8️⃣ Asignando rol al usuario admin...');
  const updateUsuario = db.prepare(`
    UPDATE usuarios 
    SET role_id = ? 
    WHERE username = 'admin' AND role_id IS NULL
  `);
  const result = updateUsuario.run(roleAdmin.id);
  
  if (result.changes > 0) {
    console.log('✅ Rol admin asignado al usuario admin');
  } else {
    console.log('ℹ️  Usuario admin ya tiene rol asignado');
  }

  // 9. Verificación
  console.log('\n9️⃣ Verificando sistema de roles...');
  const countRoles = db.prepare('SELECT COUNT(*) as c FROM roles').get();
  const countPermisos = db.prepare('SELECT COUNT(*) as c FROM permisos').get();
  const countRelaciones = db.prepare('SELECT COUNT(*) as c FROM roles_permisos').get();
  
  console.log(`📊 Roles: ${countRoles.c}`);
  console.log(`📊 Permisos: ${countPermisos.c}`);
  console.log(`📊 Relaciones roles-permisos: ${countRelaciones.c}`);

  console.log('\n✅ Sistema de roles y permisos configurado exitosamente');

} catch (error) {
  console.error('❌ Error:', error);
  process.exit(1);
} finally {
  db.close();
}
