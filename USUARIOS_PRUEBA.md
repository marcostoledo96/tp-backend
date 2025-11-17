# 👥 Usuarios de Prueba - San Pa' Holmes

## 📋 Credenciales de Acceso

### 🔴 Administrador (Admin)
**Usuario**: `admin`  
**Contraseña**: `admin123`  
**Rol**: Admin  
**Descripción**: Administrador principal con acceso total al sistema

**Permisos**:
- ✅ Ver productos
- ✅ Gestionar productos (CRUD completo)
- ✅ Crear compras
- ✅ Ver compras
- ✅ Editar compras
- ✅ Eliminar compras
- ✅ Ver usuarios
- ✅ Gestionar usuarios (CRUD completo)
- ✅ Ver roles
- ✅ Gestionar roles (CRUD completo)

**Capacidades**:
- Puede modificar TODO en la página web
- CRUD de productos
- CRUD de ventas/compras
- CRUD de usuarios (crear, editar, eliminar)
- Cambiar contraseñas de usuarios
- Asignar y modificar roles
- Acceso a `/vendor/panel`
- Acceso a `/vendor/roles`

---

### 🔵 Vendedor 1
**Usuario**: `vendedor1`  
**Contraseña**: `vend123`  
**Rol**: Vendedor  
**Nombre**: Juan Pérez  
**Descripción**: Vendedor encargado del turno mañana

**Permisos**:
- ✅ Ver productos
- ✅ Gestionar productos (CRUD completo)
- ✅ Crear compras
- ✅ Ver compras
- ✅ Editar compras
- ✅ Eliminar compras
- ✅ Ver roles (solo visualización)
- ❌ Gestionar usuarios (NO PUEDE)
- ❌ Gestionar roles (NO PUEDE)

**Capacidades**:
- CRUD de productos
- CRUD de ventas/compras
- **NO puede** crear nuevos usuarios
- **NO puede** modificar permisos
- **NO puede** eliminar usuarios
- Acceso a `/vendor/panel`
- Acceso limitado a `/vendor/roles` (solo lectura)

---

### 🔵 Vendedor 2
**Usuario**: `vendedor2`  
**Contraseña**: `vend456`  
**Rol**: Vendedor  
**Nombre**: María González  
**Descripción**: Vendedora encargada del turno tarde

**Permisos**: Idénticos a Vendedor 1

---

### 🟢 Visitador 1
**Usuario**: `visitador1`  
**Contraseña**: `visit123`  
**Rol**: Visitador  
**Nombre**: Carlos Rodríguez  
**Descripción**: Supervisor de calidad (solo lectura)

**Permisos**:
- ✅ Ver productos
- ✅ Ver compras
- ❌ Gestionar productos (NO PUEDE)
- ❌ Crear/editar/eliminar compras (NO PUEDE)
- ❌ Ver usuarios (NO PUEDE)
- ❌ Gestionar usuarios (NO PUEDE)
- ❌ Ver roles (NO PUEDE)
- ❌ Gestionar roles (NO PUEDE)

**Capacidades**:
- **SOLO lectura** de productos
- **SOLO lectura** de compras/ventas
- **NO puede** crear, modificar o eliminar nada
- Acceso limitado a `/vendor/panel` (solo visualización)
- **NO tiene** acceso a `/vendor/roles`

---

### 🟢 Visitador 2
**Usuario**: `visitador2`  
**Contraseña**: `visit456`  
**Rol**: Visitador  
**Nombre**: Ana Martínez  
**Descripción**: Auditor externo (solo lectura)

**Permisos**: Idénticos a Visitador 1

---

## 🔐 Tabla Resumen de Permisos

| Permiso | Admin | Vendedor | Visitador |
|---------|-------|----------|-----------|
| Ver productos | ✅ | ✅ | ✅ |
| Gestionar productos | ✅ | ✅ | ❌ |
| Crear compras | ✅ | ✅ | ❌ |
| Ver compras | ✅ | ✅ | ✅ |
| Editar compras | ✅ | ✅ | ❌ |
| Eliminar compras | ✅ | ✅ | ❌ |
| Ver usuarios | ✅ | ❌ | ❌ |
| Gestionar usuarios | ✅ | ❌ | ❌ |
| Ver roles | ✅ | ✅ | ❌ |
| Gestionar roles | ✅ | ❌ | ❌ |

---

## 📍 URLs de Acceso

### Login
```
http://localhost:5173/vendor/login
https://demo-sanpaholmes.vercel.app/vendor/login
```

### Panel de Administración
```
http://localhost:5173/vendor/panel
```
**Acceso**: Admin, Vendedor, Visitador  
**Funcionalidad**: Vendedor y Admin pueden modificar, Visitador solo ver

### Gestión de Usuarios
```
http://localhost:5173/vendor/roles
```
**Acceso**: Solo Admin  
**Funcionalidad**: CRUD completo de usuarios, cambio de contraseñas, asignación de roles

---

## 🚀 Cómo Crear los Usuarios

### 1. Ejecutar setup de roles
```bash
node scripts/setup-roles-permisos.js
```

Este script:
- Crea las tablas: `roles`, `permisos`, `roles_permisos`
- Inserta 3 roles: admin, vendedor, visitador
- Inserta 10 permisos en 4 categorías
- Asigna permisos a cada rol
- Vincula el usuario admin con el rol admin

### 2. Ejecutar creación de usuarios de prueba
```bash
node scripts/crear-usuarios-prueba.js
```

Este script:
- Crea/actualiza los 5 usuarios de prueba
- Hash de contraseñas con bcrypt (salt rounds: 10)
- Asigna roles correspondientes

### 3. Verificar en la base de datos
```bash
sqlite3 db/sanpaholmes.db "SELECT u.id, u.username, u.nombre, r.nombre as rol FROM usuarios u LEFT JOIN roles r ON u.role_id = r.id;"
```

---

## 🧪 Casos de Prueba

### Test 1: Login de Admin
1. Ir a `/vendor/login`
2. Usuario: `admin`, Contraseña: `admin123`
3. Verificar acceso a `/vendor/panel` y `/vendor/roles`
4. Verificar que puede crear usuarios

### Test 2: Login de Vendedor
1. Ir a `/vendor/login`
2. Usuario: `vendedor1`, Contraseña: `vend123`
3. Verificar acceso a `/vendor/panel`
4. Verificar que puede hacer CRUD de productos y compras
5. Verificar que `/vendor/roles` está restringido o solo lectura

### Test 3: Login de Visitador
1. Ir a `/vendor/login`
2. Usuario: `visitador1`, Contraseña: `visit123`
3. Verificar acceso limitado a `/vendor/panel`
4. Verificar que solo puede ver, no modificar
5. Verificar que `/vendor/roles` está bloqueado

### Test 4: Crear Usuario desde Admin
1. Login como admin
2. Ir a `/vendor/roles`
3. Click en "Nuevo Usuario"
4. Completar formulario con rol "vendedor"
5. Verificar que se crea correctamente
6. Intentar login con el nuevo usuario

### Test 5: Cambiar Contraseña
1. Login como admin
2. Ir a `/vendor/roles`
3. Click en ícono de llave (Key) de un usuario
4. Ingresar nueva contraseña
5. Logout y verificar login con nueva contraseña

### Test 6: Eliminar Usuario
1. Login como admin
2. Ir a `/vendor/roles`
3. Intentar eliminar al usuario admin (debe fallar)
4. Eliminar un usuario custom (debe funcionar)

---

## 🔄 Resetear Base de Datos

Si necesitas empezar de cero:

```bash
# Eliminar base de datos actual
rm db/sanpaholmes.db

# Recrear estructura
node db/init.js

# Crear sistema de roles
node scripts/setup-roles-permisos.js

# Crear usuarios de prueba
node scripts/crear-usuarios-prueba.js
```

---

## 📊 Estructura de la Base de Datos

### Tabla `usuarios`
```sql
CREATE TABLE usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  nombre TEXT,
  role_id INTEGER REFERENCES roles(id),
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla `roles`
```sql
CREATE TABLE roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT UNIQUE NOT NULL,
  descripcion TEXT,
  activo INTEGER DEFAULT 1,
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla `permisos`
```sql
CREATE TABLE permisos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT UNIQUE NOT NULL,
  descripcion TEXT,
  categoria TEXT,
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla `roles_permisos` (N:M)
```sql
CREATE TABLE roles_permisos (
  role_id INTEGER NOT NULL,
  permiso_id INTEGER NOT NULL,
  PRIMARY KEY (role_id, permiso_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permiso_id) REFERENCES permisos(id) ON DELETE CASCADE
);
```

---

## 🎯 Flujo de Autenticación

1. Usuario ingresa credenciales en `/vendor/login`
2. `AuthController.login()` valida username/password
3. Se genera JWT con payload: `{ id, username, role, role_id }`
4. Token se guarda en localStorage
5. Middleware `verificarToken()` valida JWT en cada request
6. Middleware `verificarPermiso()` verifica permisos vía `RoleModel.usuarioTienePermiso()`
7. Si pasa, se ejecuta el controller

---

## 🛡️ Seguridad

- **Contraseñas**: Hash con bcrypt (salt rounds: 10)
- **JWT Secret**: `sanpaholmes-secret-key-2025`
- **Token Expiry**: No configurado (sesión permanente hasta logout)
- **CORS**: Habilitado en desarrollo
- **SQL Injection**: Protegido con prepared statements
- **Demo Mode**: Escrituras bloqueadas en Vercel

---

## 📝 Notas Adicionales

- El usuario `admin` (ID 1) **no puede ser eliminado**
- Los roles `admin` y `vendedor` son roles de sistema (protegidos)
- El rol `visitador` puede ser eliminado/modificado
- Los permisos están agrupados en 4 categorías: productos, compras, usuarios, roles
- La interfaz `/vendor/roles` muestra tabla completa con todos los datos de usuarios
- Se puede cambiar contraseña sin conocer la anterior (solo admin)
- Se puede ver detalle completo de permisos por usuario

---

**Fecha de Creación**: Diciembre 2024  
**Proyecto**: San Pa' Holmes - Sistema de Pedidos Policía  
**Versión**: 1.0
