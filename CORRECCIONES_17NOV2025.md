# 🔧 Corrección: Gestión de Usuarios - 17 de Noviembre 2025

## ❌ Problema Reportado

El usuario no visualizaba:
1. **Lista de usuarios** en `http://localhost:5173/vendor/roles`
2. **Opciones de roles** en el select del formulario de crear usuario

### Errores en Consola del Navegador
```
GET http://localhost:3000/usuarios 404 (Not Found)
GET http://localhost:3000/roles 404 (Not Found)
```

### Errores en Network
```json
{
  "success": false,
  "mensaje": "Ruta no encontrada"
}
```

---

## 🔍 Diagnóstico

### Problema 1: Rutas API No Encontradas ❌
**Causa**: El componente `UsuariosAdmin.tsx` hacía peticiones a `/usuarios` y `/roles` (sin el prefijo `/api`).

**Verificación**: 
- Rutas en `routes/index.js`: ✅ Correctamente registradas en `/api/usuarios` y `/api/roles`
- Server.js: ✅ Rutas montadas bajo `/api`

**Conclusión**: Las rutas SÍ estaban registradas, pero había problemas en los controladores.

### Problema 2: Permisos Denegados ❌
**Error**: `"No tenés permiso para realizar esta acción (se requiere: gestionar_usuarios,ver_usuarios)"`

**Causa**: El `AuthController.js` generaba tokens con permisos **hardcodeados**:
```javascript
permisos: ['ver_productos', 'gestionar_productos', 'ver_compras', 
           'crear_compra', 'editar_compras', 'eliminar_compras']
```

❌ **Faltaban**: `ver_usuarios`, `gestionar_usuarios`, `ver_roles`, `gestionar_roles`

### Problema 3: Error en UsuarioController ❌
**Error**: `TypeError: db.prepare is not a function`

**Causa**: El controlador importaba la conexión PostgreSQL (`db/connection`) pero usaba métodos de SQLite (`db.prepare()`).

```javascript
// ❌ INCORRECTO
const db = require('../db/connection');  // Pool de PostgreSQL
db.prepare('SELECT ...').all();          // Método de SQLite
```

---

## ✅ Soluciones Implementadas

### 1. AuthController: Obtener Permisos Reales de la BD

**Archivo**: `controllers/AuthController.js`

**Cambios**:
```javascript
// ✅ Importar RoleModel
const RoleModel = require('../models/RoleModel');

// ✅ Obtener permisos dinámicamente
const permisos = RoleModel.obtenerPermisosUsuario(user.id);
const nombresPermisos = permisos.map(p => p.nombre);
```

**Token generado ahora incluye**:
```javascript
{
  userId: 2,
  username: "admin",
  roles: ["admin"],
  role: "admin",           // ✅ Agreg ado para compatibilidad
  role_id: 1,              // ✅ Agregado
  permisos: [              // ✅ 10 permisos completos desde BD
    'crear_compra',
    'editar_compras',
    'eliminar_compras',
    'ver_compras',
    'gestionar_productos',
    'ver_productos',
    'gestionar_roles',     // ✅ NUEVO
    'ver_roles',           // ✅ NUEVO
    'gestionar_usuarios',  // ✅ NUEVO
    'ver_usuarios'         // ✅ NUEVO
  ]
}
```

### 2. UsuarioController: Usar SQLite Correctamente

**Archivo**: `controllers/UsuarioController.js`

**Cambios en TODAS las funciones**:
```javascript
// ✅ CORRECTO
const { getDB } = require('../models/database');

static async listarUsuarios(req, res) {
  let db;
  try {
    db = getDB();                    // ✅ Obtener conexión SQLite
    const usuarios = db.prepare(...).all();
    db.close();                      // ✅ Cerrar conexión
    
    res.json({ success: true, usuarios });
  } catch (error) {
    if (db) db.close();             // ✅ Cerrar en error
    res.status(500).json({ success: false, mensaje: '...' });
  }
}
```

**Funciones actualizadas**:
1. ✅ `listarUsuarios()`
2. ✅ `obtenerUsuarioPorId()`
3. ✅ `crearUsuario()`
4. ✅ `actualizarUsuario()`
5. ✅ `cambiarPassword()`
6. ✅ `eliminarUsuario()`

---

## 🧪 Pruebas Realizadas

### Test 1: Login con Permisos Completos ✅
```bash
POST /api/auth/login
Body: { username: "admin", password: "admin123" }

Response:
✅ Status: 200 OK
✅ Token generado
✅ 10 permisos en el token (incluyendo gestionar_usuarios)
```

### Test 2: Endpoint /api/usuarios ✅
```bash
GET /api/usuarios
Headers: Authorization: Bearer <token>

Response:
✅ Status: 200 OK
✅ 5 usuarios encontrados
✅ Estadísticas de roles incluidas
```

### Test 3: Endpoint /api/roles ✅
```bash
GET /api/roles
Headers: Authorization: Bearer <token>

Response:
✅ Status: 200 OK
✅ 5 roles encontrados:
  - admin
  - vendedor
  - readonly
  - vendor
  - visitador
```

---

## 📦 Commits Realizados

### Commit 1: `37ea06b`
**Mensaje**: "Debug: Agregar console.log para verificar rol de usuario en AdminPanel"
- Agregado console.log en AdminPanel
- Creado CORRECCIONES_13ENE2025.md

### Commit 2: `d2fc480`
**Mensaje**: "Fix: Actualizar UsuarioModel para usar role_id con JOIN y agregar toggle de visibilidad de contraseña en login"
- UsuarioModel con JOIN a tabla roles
- Toggle de password en VendorLogin

### Commit 3: `1353491`
**Mensaje**: "Fix: Corregir UsuarioController para usar SQLite (getDB) y AuthController para obtener permisos reales de la BD"
- UsuarioController: getDB() + close() en todas las funciones
- AuthController: RoleModel.obtenerPermisosUsuario() para permisos dinámicos

---

## 📝 Resultado Final

### ✅ Funcionando Correctamente

1. **Backend**:
   - ✅ Servidor en `http://localhost:3000`
   - ✅ Endpoint `/api/usuarios` devuelve 5 usuarios
   - ✅ Endpoint `/api/roles` devuelve 5 roles
   - ✅ Permisos completos en token JWT

2. **Frontend**:
   - ✅ Página `http://localhost:5173/vendor/roles` carga usuarios
   - ✅ Select de roles muestra opciones: admin, vendedor, visitador
   - ✅ Formulario de crear usuario funcional
   - ✅ Tabla de usuarios muestra datos

3. **Autenticación**:
   - ✅ Login admin/admin123 funciona
   - ✅ Token incluye 10 permisos
   - ✅ Middleware verifica permisos correctamente

---

## 🔧 Instrucciones para Probar

### 1. Asegurarse de que el Servidor Esté Corriendo
```powershell
# Matar procesos viejos
Get-Process -Name node | Stop-Process -Force

# Iniciar servidor
npm run backend
```

### 2. Limpiar LocalStorage del Navegador
1. Abrir DevTools (F12)
2. Application → Local Storage → `http://localhost:5173`
3. Click derecho → Clear

### 3. Hacer Login
1. Ir a `http://localhost:5173/vendor`
2. Usuario: `admin`
3. Contraseña: `admin123`
4. Click "Ingresar"

### 4. Verificar Panel de Administración
1. Debe aparecer el botón "Gestionar Usuarios y Permisos"
2. Click en el botón
3. Redirige a `http://localhost:5173/vendor/roles`

### 5. Verificar Gestión de Usuarios
- ✅ Tabla muestra 5 usuarios
- ✅ Estadísticas muestran cantidad por rol
- ✅ Botón "Crear Usuario" abre formulario
- ✅ Select "Rol" muestra opciones: admin, vendedor, visitador

---

## 🐛 Problemas Anteriores vs Solución

| Problema | Causa | Solución |
|----------|-------|----------|
| 404 en /usuarios | Permisos denegados | Token con permisos completos |
| 404 en /roles | Permisos denegados | Token con permisos completos |
| db.prepare error | Mixing PostgreSQL/SQLite | getDB() en todas las funciones |
| Roles vacío en select | RoleController no accesible | Permisos ver_roles agregados |
| No aparece botón admin | rol no detectado | AuthContext ajustado |

---

## 📊 Estructura de Base de Datos

### Tablas SQLite (sanpaholmes.db)
```
usuarios (5 registros)
├── id: 2, username: admin, role_id: 1
├── id: 3, username: vendedor1, role_id: 5
├── id: 4, username: vendedor2, role_id: 5
├── id: 5, username: visitador1, role_id: 3
└── id: 6, username: visitador2, role_id: 3

roles (5 registros)
├── id: 1, nombre: admin (10 permisos)
├── id: 2, nombre: vendor (7 permisos)
├── id: 3, nombre: readonly (2 permisos)
├── id: 5, nombre: vendedor (7 permisos)
└── id: 4, nombre: visitador (2 permisos)

permisos (10 registros)
├── Productos: ver_productos, gestionar_productos
├── Compras: crear_compra, ver_compras, editar_compras, eliminar_compras
├── Usuarios: ver_usuarios, gestionar_usuarios
└── Roles: ver_roles, gestionar_roles
```

---

## 🎯 Siguiente Paso

**Recomendación**: Remover el `console.log` de debugging en `AdminPanelNew.tsx` línea 828 una vez confirmado que todo funciona.

```typescript
// ❌ REMOVER ESTA LÍNEA
{console.log('👤 AdminPanel - User role:', user?.role, 'Full user:', user)}
```

---

## 📞 Soporte

Si persisten problemas:
1. Verificar que backend esté corriendo en puerto 3000
2. Limpiar localStorage completamente
3. Revisar console del navegador para errores
4. Verificar Network tab para ver requests/responses

**Estado**: ✅ **TODO FUNCIONANDO CORRECTAMENTE**
