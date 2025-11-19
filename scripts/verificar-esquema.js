// Script para verificar el esquema de la base de datos
// Yo: creo este script para comprobar que las tablas y datos existan correctamente

const { getDB } = require('../models/database');

console.log('🔍 Verificando esquema de base de datos...\n');

try {
  const db = getDB();
  
  // Verificar tabla roles
  console.log('📋 TABLA: roles');
  const roles = db.prepare('SELECT * FROM roles').all();
  console.log(`   Total roles: ${roles.length}`);
  roles.forEach(r => console.log(`   - ${r.id}: ${r.nombre} (activo: ${r.activo})`));
  
  console.log('\n📋 TABLA: permisos');
  const permisos = db.prepare('SELECT * FROM permisos ORDER BY categoria, nombre').all();
  console.log(`   Total permisos: ${permisos.length}`);
  const permisosPorCat = {};
  permisos.forEach(p => {
    if (!permisosPorCat[p.categoria]) permisosPorCat[p.categoria] = [];
    permisosPorCat[p.categoria].push(`${p.id}: ${p.nombre}`);
  });
  Object.keys(permisosPorCat).forEach(cat => {
    console.log(`   ${cat}:`);
    permisosPorCat[cat].forEach(p => console.log(`     - ${p}`));
  });
  
  console.log('\n📋 TABLA: roles_permisos');
  const rolesPermisos = db.prepare('SELECT * FROM roles_permisos').all();
  console.log(`   Total asignaciones: ${rolesPermisos.length}`);
  
  // Agrupar por rol
  const porRol = {};
  rolesPermisos.forEach(rp => {
    if (!porRol[rp.role_id]) porRol[rp.role_id] = [];
    porRol[rp.role_id].push(rp.permiso_id);
  });
  
  Object.keys(porRol).forEach(roleId => {
    const rol = roles.find(r => r.id === parseInt(roleId));
    console.log(`   Rol "${rol?.nombre}" (ID ${roleId}): ${porRol[roleId].length} permisos asignados`);
    console.log(`     IDs: [${porRol[roleId].join(', ')}]`);
  });
  
  console.log('\n📋 TABLA: usuarios (sample)');
  const usuarios = db.prepare('SELECT id, username, nombre, role_id FROM usuarios LIMIT 5').all();
  console.log(`   Total usuarios (mostrando 5): ${usuarios.length}`);
  usuarios.forEach(u => {
    const rol = roles.find(r => r.id === u.role_id);
    console.log(`   - ${u.id}: ${u.username} (${u.nombre}) -> Rol: ${rol?.nombre || 'N/A'}`);
  });
  
  db.close();
  console.log('\n✅ Verificación completada');
  
} catch (error) {
  console.error('❌ Error al verificar esquema:', error);
  process.exit(1);
}
