-- Migración: Sistema de Roles y Permisos para SQLite
-- Yo: Agregué esta migración para implementar el sistema de roles y permisos
--     que me permite controlar qué usuarios pueden hacer qué acciones en el sistema.
--     Esto es fundamental para cumplir con los requisitos del TP integrador.

-- Tabla roles: define los diferentes roles del sistema (admin, vendedor, visitador, comprador)
CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT UNIQUE NOT NULL,
  descripcion TEXT,
  activo INTEGER DEFAULT 1,
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla permisos: lista todos los permisos disponibles en el sistema
CREATE TABLE IF NOT EXISTS permisos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT UNIQUE NOT NULL,
  descripcion TEXT,
  categoria TEXT DEFAULT 'general',
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla roles_permisos: relación N:M entre roles y permisos
-- Yo: Esta tabla me permite asignar múltiples permisos a un rol,
--     y un permiso puede estar en múltiples roles.
CREATE TABLE IF NOT EXISTS roles_permisos (
  role_id INTEGER NOT NULL,
  permiso_id INTEGER NOT NULL,
  PRIMARY KEY (role_id, permiso_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permiso_id) REFERENCES permisos(id) ON DELETE CASCADE
);

-- Agregar role_id a la tabla usuarios si no existe
-- Yo: Necesito conectar cada usuario con un rol para saber qué permisos tiene.
ALTER TABLE usuarios ADD COLUMN role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL;

-- Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_roles_nombre ON roles(nombre);
CREATE INDEX IF NOT EXISTS idx_permisos_nombre ON permisos(nombre);
CREATE INDEX IF NOT EXISTS idx_permisos_categoria ON permisos(categoria);
CREATE INDEX IF NOT EXISTS idx_usuarios_role_id ON usuarios(role_id);

-- Insertar roles por defecto
-- Yo: Creo los 4 roles principales que necesito para el TP
INSERT INTO roles (nombre, descripcion) VALUES 
  ('admin', 'Administrador con acceso total al sistema'),
  ('vendedor', 'Puede gestionar productos y ver compras'),
  ('visitador', 'Solo puede visualizar productos y compras'),
  ('comprador', 'Usuario registrado que puede realizar compras');

-- Insertar permisos organizados por categoría
-- Yo: Definí todos los permisos necesarios para controlar el acceso a cada funcionalidad
INSERT INTO permisos (nombre, descripcion, categoria) VALUES 
  -- Productos
  ('ver_productos', 'Puede ver el listado de productos', 'productos'),
  ('gestionar_productos', 'Puede crear, editar y eliminar productos', 'productos'),
  
  -- Compras
  ('ver_compras', 'Puede ver el listado de compras', 'compras'),
  ('crear_compra', 'Puede realizar nuevas compras', 'compras'),
  ('editar_compras', 'Puede editar compras y actualizar estados', 'compras'),
  ('eliminar_compras', 'Puede eliminar compras', 'compras'),
  
  -- Usuarios
  ('ver_usuarios', 'Puede ver el listado de usuarios', 'usuarios'),
  ('gestionar_usuarios', 'Puede crear, editar y eliminar usuarios', 'usuarios'),
  
  -- Roles y permisos
  ('ver_roles', 'Puede ver roles y permisos', 'roles'),
  ('gestionar_roles', 'Puede crear, editar y eliminar roles y asignar permisos', 'roles');

-- Asignar permisos a roles
-- Yo: Configuro qué permisos tiene cada rol por defecto

-- Admin: tiene TODOS los permisos
INSERT INTO roles_permisos (role_id, permiso_id) 
SELECT 
  (SELECT id FROM roles WHERE nombre = 'admin'),
  id 
FROM permisos;

-- Vendedor: gestiona productos y ve compras
INSERT INTO roles_permisos (role_id, permiso_id) VALUES 
  ((SELECT id FROM roles WHERE nombre = 'vendedor'), (SELECT id FROM permisos WHERE nombre = 'ver_productos')),
  ((SELECT id FROM roles WHERE nombre = 'vendedor'), (SELECT id FROM permisos WHERE nombre = 'gestionar_productos')),
  ((SELECT id FROM roles WHERE nombre = 'vendedor'), (SELECT id FROM permisos WHERE nombre = 'ver_compras')),
  ((SELECT id FROM roles WHERE nombre = 'vendedor'), (SELECT id FROM permisos WHERE nombre = 'editar_compras'));

-- Visitador: solo ve productos y compras (sin editar)
INSERT INTO roles_permisos (role_id, permiso_id) VALUES 
  ((SELECT id FROM roles WHERE nombre = 'visitador'), (SELECT id FROM permisos WHERE nombre = 'ver_productos')),
  ((SELECT id FROM roles WHERE nombre = 'visitador'), (SELECT id FROM permisos WHERE nombre = 'ver_compras'));

-- Comprador: ve productos y puede crear compras
INSERT INTO roles_permisos (role_id, permiso_id) VALUES 
  ((SELECT id FROM roles WHERE nombre = 'comprador'), (SELECT id FROM permisos WHERE nombre = 'ver_productos')),
  ((SELECT id FROM roles WHERE nombre = 'comprador'), (SELECT id FROM permisos WHERE nombre = 'crear_compra')),
  ((SELECT id FROM roles WHERE nombre = 'comprador'), (SELECT id FROM permisos WHERE nombre = 'ver_compras'));

-- Actualizar usuario admin existente para asignarle el rol admin
-- Yo: Conecto el usuario 'admin' con el rol de administrador
UPDATE usuarios 
SET role_id = (SELECT id FROM roles WHERE nombre = 'admin')
WHERE username = 'admin';
