const Database = require('better-sqlite3');
const db = new Database('./db/sanpaholmes.db');

console.log('=== VERIFICANDO PERMISOS DEL ADMIN ===\n');

const resultado = db.prepare(`
  SELECT 
    u.id, 
    u.username, 
    r.nombre as rol,
    GROUP_CONCAT(p.nombre) as permisos
  FROM usuarios u
  LEFT JOIN roles r ON u.role_id = r.id
  LEFT JOIN roles_permisos rp ON r.id = rp.role_id
  LEFT JOIN permisos p ON rp.permiso_id = p.id
  WHERE u.username = 'admin'
  GROUP BY u.id
`).get();

console.log('Usuario:', resultado.username);
console.log('Rol:', resultado.rol);
console.log('Permisos:', resultado.permisos);
console.log('\n');

// Verificar específicamente gestionar_productos
const tienePermiso = resultado.permisos.split(',').includes('gestionar_productos');
console.log('✅ Tiene permiso "gestionar_productos":', tienePermiso);

db.close();
