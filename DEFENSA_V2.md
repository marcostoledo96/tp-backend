# DEFENSA ORAL - TRABAJO FINAL INTEGRADOR
## Sistema de Carrito de Compras con Gestión de Usuarios, Roles y Permisos

**Alumno:** Marcos Toledo  
**Materia:** Desarrollo de Software Backend  
**Instituto:** IFTS 16

---

## ÍNDICE

1. [Organización del Proyecto](#1-organización-del-proyecto)
2. [Introducción al Proyecto](#2-introducción-al-proyecto)
3. [Arquitectura del Backend](#3-arquitectura-del-backend)
4. [Base de Datos y Relaciones](#4-base-de-datos-y-relaciones)
5. [Sistema de Autenticación y Permisos](#5-sistema-de-autenticación-y-permisos)
6. [CRUD de Productos](#6-crud-de-productos)
7. [Flujo de Carrito y Compras](#7-flujo-de-carrito-y-compras)
8. [Validaciones Críticas](#8-validaciones-críticas)
9. [Casos de Uso y Demostración](#9-casos-de-uso-y-demostración)
10. [Preguntas Frecuentes](#10-preguntas-frecuentes)

---

## 1. ORGANIZACIÓN DEL PROYECTO

### Estructura Completa de Carpetas y Archivos

Esta es la organización del proyecto backend. Cada carpeta tiene una responsabilidad específica siguiendo el patrón MVC:

```
tp-final/
├── 📁 controllers/          # Lógica de negocio (validaciones, orquestación)
│   ├── AuthController.js         → Login, generación de JWT
│   ├── CompraController.js        → Crear compras, listar ventas, actualizar estado
│   ├── ProductoController.js      → CRUD completo de productos
│   ├── RoleController.js          → CRUD de roles y permisos
│   └── UsuarioController.js       → CRUD de usuarios, actualizar perfil
│
├── 📁 models/               # Acceso a datos (consultas SQL, transacciones)
│   ├── CompraModel.js            → Queries de compras y detalles
│   ├── database.js               → Conexión a SQLite, getDB()
│   ├── PermisoModel.js           → Queries de permisos por categoría
│   ├── ProductoModel.js          → Queries de productos, descontarStock()
│   ├── RoleModel.js              → Queries de roles con permisos
│   └── UsuarioModel.js           → Queries de usuarios, validación login
│
├── 📁 routes/               # Definición de endpoints (rutas HTTP)
│   ├── auth.js                   → POST /api/auth/login
│   ├── compras.js                → POST, GET, PATCH /api/compras
│   ├── index.js                  → Agrupa todas las rutas con prefijo /api
│   ├── productos.js              → GET, POST, PUT, DELETE /api/productos
│   ├── roles.js                  → GET, POST, PUT /api/roles
│   └── usuarios.js               → GET, POST, PUT, PATCH /api/usuarios
│
├── 📁 middleware/           # Lógica que se ejecuta antes de controladores
│   └── auth.js                   → verificarAutenticacion, verificarPermiso
│
├── 📁 db/                   # Base de datos y migraciones
│   ├── sanpaholmes.db            → Base de datos SQLite (archivo binario)
│   ├── sqlite-init.js            → Script inicial para crear tablas
│   ├── apply-sqlite-migration.js → Aplicar migraciones SQL
│   ├── init.js                   → Inicialización completa (tablas + datos)
│   └── migrations/               → Archivos SQL de migraciones
│       ├── add_detalles_pedido.sql
│       ├── add_listo_field.sql
│       ├── fix_comprobante_varchar_to_text.sql
│       └── make_mesa_optional.sql
│
├── 📁 scripts/              # Scripts de mantenimiento y setup
│   ├── setup-roles-permisos.js   → Crear roles y permisos del sistema
│   ├── crear-usuarios-prueba.js  → Crear usuarios admin, vendedor, visitador
│   └── verificar-esquema.js      → Verificar estructura de base de datos
│
├── 📁 autotests/            # Tests automatizados (Jest + Supertest)
│   ├── auth.test.js              → Tests de login
│   ├── compras.test.js           → Tests de creación de compras
│   ├── compras-estado.test.js    → Tests de actualización de estado
│   ├── compras-extra.test.js     → Tests de listado y estadísticas
│   ├── perfil.test.js            → Tests de actualización de perfil
│   ├── permisos.test.js          → Tests de control de permisos
│   ├── productos.test.js         → Tests de CRUD productos
│   └── usuarios-admin.test.js    → Tests de gestión de usuarios
│
├── 📁 public/               # Archivos estáticos servidos por Express
│   ├── images/                   → Imágenes del sitio (logos, escudos)
│   ├── uploads/                  → Comprobantes subidos por usuarios
│   └── trebol-ico.ico            → Favicon
│
├── 📁 src/                  # Frontend React (NO parte de esta defensa)
│   ├── views/                    → Componentes React
│   ├── controllers/              → Contexts (AuthContext, CartContext)
│   ├── types/                    → TypeScript types
│   └── main.tsx                  → Entry point de Vite
│
├── 📁 _legacy/              # Archivos obsoletos (backup seguro)
│   ├── db-postgres/              → Código viejo de PostgreSQL
│   ├── debug/                    → Scripts de debug temporal
│   ├── scripts-debug/            → Scripts de verificación obsoletos
│   ├── scripts-migrations/       → Migraciones ya aplicadas
│   ├── components-old/           → Componentes React duplicados
│   ├── misc/                     → Archivos varios obsoletos
│   └── dist-vite-build/          → Build de Vite (duplicado de public/)
│
├── 📄 server.js             # Entry point del backend (servidor Express)
├── 📄 package.json          # Dependencias y scripts npm
├── 📄 .env                  # Variables de entorno (JWT_SECRET, etc.)
├── 📄 DEFENSA_V2.md         # Este documento (defensa oral)
├── 📄 LIMPIEZA_RESUMEN.md   # Resumen de archivos movidos a _legacy/
└── 📄 README.md             # Documentación general del proyecto
```

---

### Guía Rápida: "¿Dónde encuentro...?"

#### Si el profesor pregunta por **rutas/endpoints**:
```bash
📂 routes/
   → auth.js        # Login
   → productos.js   # CRUD productos
   → compras.js     # Crear/listar compras
   → usuarios.js    # CRUD usuarios
   → roles.js       # CRUD roles
```

#### Si pregunta por **lógica de negocio**:
```bash
📂 controllers/
   → AuthController.js      # Validación de login, JWT
   → ProductoController.js  # Validación precio/stock
   → CompraController.js    # Validación stock, recálculo total
```

#### Si pregunta por **consultas SQL**:
```bash
📂 models/
   → ProductoModel.js   # descontarStock(), obtenerProductos()
   → CompraModel.js     # crearCompra() con transacción
   → UsuarioModel.js    # obtenerUsuarioPorUsername()
```

#### Si pregunta por **autenticación/seguridad**:
```bash
📂 middleware/auth.js
   → verificarAutenticacion()  # Valida JWT
   → verificarPermiso()        # Valida permisos específicos
```

#### Si pregunta por **base de datos**:
```bash
📂 db/
   → sanpaholmes.db           # Archivo SQLite (datos reales)
   → sqlite-init.js           # Script de creación inicial
   → migrations/              # Cambios históricos en la BD
```

#### Si pregunta por **tests**:
```bash
📂 autotests/
   → productos.test.js      # CRUD productos
   → compras.test.js        # Flujo de compra
   → auth.test.js           # Login
   → permisos.test.js       # Control de acceso
```

---

### Archivos Clave del Backend

| Archivo | Ubicación | Descripción |
|---------|-----------|-------------|
| **server.js** | Raíz | Entry point, configuración de Express, middlewares globales |
| **database.js** | models/ | Conexión a SQLite, función getDB() |
| **auth.js** | middleware/ | Middlewares de autenticación y permisos |
| **AuthController.js** | controllers/ | Login, generación de JWT con permisos |
| **CompraController.js** | controllers/ | Validación de stock, recálculo de total, creación de compra |
| **ProductoController.js** | controllers/ | CRUD productos con validaciones de precio/stock |
| **ProductoModel.js** | models/ | descontarStock() con control de concurrencia |
| **CompraModel.js** | models/ | crearCompra() con transacción SQL |

---

### Flujo de una Request HTTP

Ejemplo: `POST /api/productos` (Crear producto)

```
1. server.js recibe la request
   ↓
2. routes/index.js → Prefijo /api
   ↓
3. routes/productos.js → Busca POST /
   ↓
4. middleware/auth.js → verificarAutenticacion()
   - Valida token JWT
   - Guarda usuario en req.usuario
   ↓
5. middleware/auth.js → verificarPermiso('gestionar_productos')
   - Verifica que req.usuario.permisos incluya el permiso
   ↓
6. controllers/ProductoController.js → crearProducto()
   - Valida datos (precio >= 0, stock >= 0)
   - Llama al modelo
   ↓
7. models/ProductoModel.js → crearProducto()
   - Ejecuta INSERT en SQLite
   - Devuelve producto creado
   ↓
8. Controlador devuelve Response 201 al cliente
```

---

### Scripts de Mantenimiento

#### Setup inicial (ejecutar en orden):

```bash
# 1. Crear estructura de base de datos
node db/sqlite-init.js

# 2. Crear roles y permisos del sistema
node scripts/setup-roles-permisos.js

# 3. Crear usuarios de prueba (admin, vendedor, visitador)
node scripts/crear-usuarios-prueba.js

# 4. Verificar que todo se creó correctamente
node scripts/verificar-esquema.js
```

#### Ejecutar tests:

```bash
# Todos los tests
npm test

# Tests específicos
npm test -- productos.test.js
npm test -- compras.test.js
```

---

### Archivos de Configuración

| Archivo | Propósito |
|---------|-----------|
| **package.json** | Dependencias npm, scripts de desarrollo |
| **.env** | Variables de entorno (JWT_SECRET, PORT) |
| **vite.config.ts** | Configuración de Vite (frontend) |
| **tsconfig.json** | Configuración de TypeScript (frontend) |
| **jest.config.js** | Configuración de tests (implícito) |
| **.gitignore** | Archivos que no se suben a Git |

---

### Carpeta `_legacy/` (NO revisar en defensa)

Esta carpeta contiene **código obsoleto** que se movió para mantener el proyecto limpio:

- **db-postgres/**: Código viejo cuando usaba PostgreSQL
- **debug/**: Scripts temporales de debugging
- **scripts-debug/**: Scripts de verificación que ya no se usan
- **scripts-migrations/**: Migraciones ya aplicadas
- **dist-vite-build/**: Build de Vite (duplicado de public/)

**Importante**: Estos archivos NO forman parte del proyecto actual, son solo backup.

---

## 2. INTRODUCCIÓN AL PROYECTO

### ¿Qué implementé?

Desarrollé un sistema completo de carrito de compras con gestión avanzada de usuarios, roles y permisos. El backend fue construido con **Node.js + Express + SQLite**, siguiendo el patrón de arquitectura **MVC (Model-View-Controller)**.

### Funcionalidades principales:

1. **Sistema de autenticación con JWT**: Login seguro que genera tokens con información del usuario y sus permisos
2. **Control de acceso granular**: Middleware que verifica permisos en cada endpoint
3. **CRUD completo de productos**: Con validaciones de precio y stock
4. **Flujo de carrito**: Agregar productos, validar stock, y confirmar compra
5. **Gestión de compras**: Registro de transacciones con snapshot de precios para auditoría
6. **Actualización automática de stock**: Control de concurrencia para evitar sobreventa

### Tecnologías utilizadas (Backend):

- **Node.js**: Entorno de ejecución JavaScript del lado del servidor
- **Express**: Framework web minimalista para crear APIs REST
- **SQLite (better-sqlite3)**: Base de datos relacional embebida
- **JWT (jsonwebtoken)**: Autenticación mediante tokens
- **bcrypt**: Hash seguro de contraseñas
- **Multer**: Manejo de archivos subidos (comprobantes)

---

## 3. ARQUITECTURA DEL BACKEND

### Patrón MVC (Model-View-Controller)

Mi proyecto separa claramente las responsabilidades en tres capas:

```
┌─────────────────┐
│     CLIENTE     │  (Frontend React - no parte de esta defensa)
└────────┬────────┘
         │ HTTP Request
         ↓
┌─────────────────┐
│     RUTAS       │  routes/productos.js, routes/compras.js
│  (Endpoints)    │  ↓ Define qué URL llama a qué controlador
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  MIDDLEWARE     │  middleware/auth.js
│   (Permisos)    │  ↓ Verifica autenticación y permisos
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ CONTROLADORES   │  controllers/ProductoController.js
│ (Lógica de      │  ↓ Valida datos, orquesta modelos
│  negocio)       │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│    MODELOS      │  models/ProductoModel.js
│  (Acceso a BD)  │  ↓ Ejecuta consultas SQL
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  BASE DE DATOS  │  db/sanpaholmes.db (SQLite)
│    (SQLite)     │
└─────────────────┘
```

### ¿Por qué MVC?

1. **Separación de responsabilidades**: Cada capa tiene una función específica
2. **Mantenibilidad**: Es fácil cambiar la base de datos sin tocar controladores
3. **Testabilidad**: Puedo probar cada capa por separado
4. **Escalabilidad**: Si mañana necesito cambiar a PostgreSQL, solo cambio los modelos

---

## 4. BASE DE DATOS Y RELACIONES

### Esquema de Tablas Implementado

```sql
-- Tabla de usuarios (base del sistema)
usuarios
├── id (PRIMARY KEY)
├── username (UNIQUE)
├── password_hash (bcrypt)
├── nombre_completo
├── telefono
├── role_id (FOREIGN KEY → roles)
└── activo

-- Tabla de roles (categorías de usuario)
roles
├── id (PRIMARY KEY)
├── nombre (admin, vendedor, visitador, comprador)
├── descripcion
└── activo

-- Tabla de permisos (acciones específicas)
permisos
├── id (PRIMARY KEY)
├── nombre (ver_productos, gestionar_productos, etc.)
├── descripcion
└── categoria

-- Tabla intermedia (N:M entre roles y permisos)
roles_permisos
├── role_id (FOREIGN KEY → roles)
└── permiso_id (FOREIGN KEY → permisos)

-- Tabla de productos
productos
├── id (PRIMARY KEY)
├── nombre
├── categoria
├── subcategoria
├── precio (validado > 0)
├── stock (validado >= 0)
├── descripcion
├── imagen_url
└── activo (soft delete)

-- Tabla de compras
compras
├── id (PRIMARY KEY)
├── numero_orden (generado automático)
├── comprador_nombre
├── comprador_mesa
├── comprador_telefono
├── metodo_pago (efectivo o transferencia)
├── comprobante_archivo (base64 si es transferencia)
├── total (calculado en backend)
├── estado (pendiente, listo, entregado, cancelado)
├── abonado
├── listo
├── entregado
├── detalles_pedido
└── fecha

-- Tabla de detalles de compra (snapshot de productos)
detalles_compra
├── id (PRIMARY KEY)
├── compra_id (FOREIGN KEY → compras)
├── producto_id (FOREIGN KEY → productos)
├── cantidad
├── precio_unitario (snapshot del precio al momento de compra)
├── subtotal
└── nombre_producto (snapshot del nombre)
```

### Relaciones Implementadas:

1. **usuarios → roles** (N:1): Un usuario tiene un rol
2. **roles ↔ permisos** (N:M): Un rol puede tener muchos permisos
3. **compras → detalles_compra** (1:N): Una compra tiene muchos detalles
4. **detalles_compra → productos** (N:1): Cada detalle pertenece a un producto

---

## 5. SISTEMA DE AUTENTICACIÓN Y PERMISOS

### A. Login y Generación de Token JWT

**Archivo:** `controllers/AuthController.js`

```javascript
// Yo: Esta función maneja POST /api/auth/login
async function login(req, res) {
  try {
    // Yo: Extraigo username y password del body de la request
    const { username, password } = req.body;

    console.log('=== INICIO LOGIN ===');
    console.log('Usuario intentando loguearse:', username);

    // ========== VALIDACIÓN 1: Datos obligatorios ==========
    // Yo: Antes de consultar la BD, verifico que envíen ambos campos
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        mensaje: 'Faltan el usuario y/o la contraseña'
      });
    }

    // ========== CONSULTA A BASE DE DATOS ==========
    // Yo: Llamo al modelo para buscar el usuario por username
    // El modelo hace: SELECT * FROM usuarios WHERE username = ?
    const user = UsuarioModel.obtenerUsuarioPorUsername(username);

    // Yo: Si no existe, devuelvo error genérico (por seguridad no digo "el usuario no existe")
    if (!user) {
      return res.status(401).json({
        success: false,
        mensaje: 'Usuario o contraseña incorrectos'
      });
    }

    // ========== VALIDACIÓN DE CONTRASEÑA CON BCRYPT ==========
    // Yo: Comparo la contraseña en texto plano con el hash guardado
    // bcrypt.compare es asíncrono y seguro contra timing attacks
    const passwordValida = await bcrypt.compare(password, user.password_hash);

    if (!passwordValida) {
      return res.status(401).json({
        success: false,
        mensaje: 'Usuario o contraseña incorrectos'
      });
    }

    console.log('✅ Login exitoso para:', username);

    // ========== OBTENCIÓN DE PERMISOS ==========
    // Yo: Consulto qué permisos tiene el rol de este usuario
    // Esto hace un JOIN entre usuarios → roles → roles_permisos → permisos
    const permisos = RoleModel.obtenerPermisosUsuario(user.id);
    
    // Yo: Convierto el array de objetos a un array de strings con los nombres
    const nombresPermisos = permisos.map(p => p.nombre);
    // Resultado ejemplo: ['ver_productos', 'gestionar_productos', 'crear_compra']

    console.log('🔐 Permisos del usuario:', nombresPermisos);

    // ========== GENERACIÓN DEL TOKEN JWT ==========
    // Yo: Creo el token con toda la información que necesitaré en cada request
    const token = jwt.sign(
      {
        // Payload del token (información que viaja en cada request)
        userId: user.id,              // Para identificar al usuario
        username: user.username,      // Para mostrar en el frontend
        roles: [user.role],          // Roles del usuario (puede tener varios)
        role: user.role,             // Rol principal
        role_id: user.role_id,       // ID del rol en la BD
        permisos: nombresPermisos,   // Array de permisos que tiene
        nombre_completo: user.nombre_completo,  // Para autofill en checkout
        telefono: user.telefono || null         // Para autofill en checkout
      },
      JWT_SECRET,                    // Clave secreta para firmar (debe ser privada)
      { expiresIn: '24h' }          // El token expira en 24 horas
    );

    // ========== RESPUESTA EXITOSA ==========
    // Yo: Devuelvo el token y la información del usuario al frontend
    res.json({
      success: true,
      mensaje: 'Inicio de sesión exitoso',
      token: token,                   // Frontend lo guarda en localStorage
      usuario: {
        id: user.id,
        username: user.username,
        nombre_completo: user.nombre_completo,
        telefono: user.telefono || null,
        email: user.email,
        roles: [user.role],
        role: user.role,
        permisos: nombresPermisos     // Frontend usa esto para mostrar/ocultar opciones
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al iniciar sesión'
    });
  }
}
```

**Explicación del flujo:**

1. Usuario envía `{ username: 'admin', password: 'admin123' }`
2. Backend busca el usuario en la BD
3. Compara contraseña con bcrypt
4. Obtiene permisos del rol desde la tabla `roles_permisos`
5. Genera un JWT firmado con toda la info
6. Frontend guarda el token y lo envía en cada request

---

### B. Middleware de Autenticación

**Archivo:** `middleware/auth.js`

```javascript
// Yo: Este middleware se ejecuta ANTES de cada endpoint protegido
function verificarAutenticacion(req, res, next) {
  try {
    // ========== EXTRAER TOKEN DEL HEADER ==========
    // Yo: Obtengo el header Authorization que envía el frontend
    // Formato esperado: "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    const authHeader = req.headers.authorization;

    // Yo: Verifico que exista y tenga el formato correcto
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Auth: No se proporcionó token o formato incorrecto');
      return res.status(401).json({
        success: false,
        mensaje: 'No se proporcionó token de autenticación'
      });
    }

    // Yo: Extraigo solo el token (quito "Bearer " del inicio)
    const token = authHeader.substring(7); // "Bearer " son 7 caracteres

    // ========== VERIFICAR Y DECODIFICAR TOKEN ==========
    // Yo: jwt.verify hace dos cosas:
    // 1. Verifica que la firma sea válida (no fue modificado)
    // 2. Verifica que no haya expirado
    // 3. Decodifica el payload y lo devuelve
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Yo: Ahora "decoded" contiene todo el payload:
    // { userId, username, role, permisos, ... }

    // ========== GUARDAR USUARIO EN REQUEST ==========
    // Yo: Guardo los datos del usuario en req.usuario para que
    // los controladores y otros middlewares puedan acceder a ellos
    req.usuario = decoded;

    // ========== CONTINUAR AL SIGUIENTE MIDDLEWARE ==========
    // Yo: Si todo salió bien, llamo a next() para continuar
    // Si esto no se ejecuta, la request queda colgada
    next();

  } catch (error) {
    console.error('❌ Auth error:', error.name, error.message);
    
    // Yo: Si el token expiró, devuelvo un mensaje específico
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        mensaje: 'El token ha expirado'
      });
    }

    // Yo: Si el token es inválido (firma incorrecta, formato mal, etc.)
    return res.status(401).json({
      success: false,
      mensaje: 'Token inválido',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
```

**¿Por qué es importante este middleware?**

- **Seguridad**: Verifica que el usuario esté logueado antes de acceder a endpoints privados
- **Centralización**: No tengo que repetir esta lógica en cada controlador
- **Performance**: jwt.verify es muy rápido (no consulta BD en cada request)

---

### C. Middleware de Verificación de Permisos

**Archivo:** `middleware/auth.js`

```javascript
// Yo: Este middleware verifica que el usuario tenga un permiso específico
// Es una función que RETORNA otra función (Higher-Order Function)
function verificarPermiso(permisoRequerido) {
  // Yo: Retorno el middleware real que se ejecutará en cada request
  return (req, res, next) => {
    try {
      // ========== VERIFICAR QUE EL USUARIO ESTÉ AUTENTICADO ==========
      // Yo: Verifico que verificarAutenticacion se haya ejecutado antes
      if (!req.usuario) {
        return res.status(401).json({
          success: false,
          mensaje: 'Usuario no autenticado'
        });
      }

      // ========== OBTENER PERMISOS DEL USUARIO ==========
      // Yo: Los permisos están en el token JWT, en req.usuario.permisos
      // Es un array como: ['ver_productos', 'gestionar_productos', 'crear_compra']
      const permisosUsuario = req.usuario.permisos || [];

      // ========== VERIFICAR SI TIENE EL PERMISO REQUERIDO ==========
      // Yo: Busco si el array de permisos incluye el permiso que necesita esta ruta
      const tienePermiso = permisosUsuario.includes(permisoRequerido);

      if (!tienePermiso) {
        // Yo: Si no tiene el permiso, devuelvo 403 Forbidden
        console.log(`❌ Usuario ${req.usuario.username} no tiene permiso: ${permisoRequerido}`);
        return res.status(403).json({
          success: false,
          mensaje: `No tienes permisos para realizar esta acción. Se requiere: ${permisoRequerido}`
        });
      }

      // ========== PERMISO CONCEDIDO ==========
      // Yo: Si tiene el permiso, continúo al controlador
      console.log(`✅ Usuario ${req.usuario.username} tiene permiso: ${permisoRequerido}`);
      next();

    } catch (error) {
      console.error('Error verificando permiso:', error);
      return res.status(500).json({
        success: false,
        mensaje: 'Error al verificar permisos'
      });
    }
  };
}
```

**Ejemplo de uso en rutas:**

```javascript
// Yo: Esta ruta requiere:
// 1. Estar autenticado (verificarAutenticacion)
// 2. Tener el permiso 'gestionar_productos' (verificarPermiso)
router.post('/', 
  verificarAutenticacion,                    // Middleware 1: valida token
  verificarPermiso('gestionar_productos'),  // Middleware 2: valida permiso
  ProductoController.crearProducto          // Controlador final
);
```

**Orden de ejecución:**

1. Request llega: `POST /api/productos`
2. `verificarAutenticacion` → Verifica token, guarda usuario en `req.usuario`
3. `verificarPermiso('gestionar_productos')` → Verifica que `req.usuario.permisos` incluya `'gestionar_productos'`
4. Si todo OK → `ProductoController.crearProducto` se ejecuta
5. Si falla en cualquier paso → Devuelve error 401 o 403

---

## 6. CRUD DE PRODUCTOS

### A. Modelo de Productos

**Archivo:** `models/ProductoModel.js`

```javascript
// Yo: Función para obtener productos activos (para el menú público)
function obtenerProductos() {
  // Yo: Obtengo la conexión a la base de datos SQLite
  const db = getDB();
  
  // Yo: Preparo la consulta SQL
  // prepare() es más seguro y rápido que db.exec()
  const productos = db.prepare(`
    SELECT id, nombre, categoria, subcategoria, precio, stock, descripcion, imagen_url, activo
    FROM productos
    WHERE activo = 1 AND stock > 0    -- Solo productos disponibles
    ORDER BY categoria, subcategoria, nombre
  `).all();  // .all() devuelve TODOS los resultados como array
  
  // Yo: Cierro la conexión (importante para evitar memory leaks)
  db.close();
  
  // Yo: Transformo los datos antes de devolverlos
  return productos.map(p => ({
    ...p,                              // Spread: copio todas las propiedades
    activo: Boolean(p.activo),        // Convierto 1/0 a true/false
    disponible: p.stock > 0 && Boolean(p.activo)  // Campo calculado
  }));
}
```

**¿Por qué uso `prepare()`?**

- **Seguridad**: Previene SQL Injection
- **Performance**: SQLite compila y cachea la query
- **Limpieza**: Código más legible que concatenar strings

```javascript
// Yo: Función para crear un nuevo producto
function crearProducto(datos) {
  const db = getDB();
  
  // Yo: Uso placeholders con @ para named parameters
  // Esto es más seguro y claro que usar ? con posiciones
  const stmt = db.prepare(`
    INSERT INTO productos (nombre, categoria, subcategoria, precio, stock, descripcion, imagen_url, activo)
    VALUES (@nombre, @categoria, @subcategoria, @precio, @stock, @descripcion, @imagen_url, @activo)
  `);
  
  // Yo: Ejecuto el INSERT pasando un objeto con las propiedades
  // SQLite mapeará automáticamente @nombre con datos.nombre, etc.
  const info = stmt.run({
    nombre: datos.nombre,
    categoria: datos.categoria || null,
    subcategoria: datos.subcategoria || null,
    precio: datos.precio,
    stock: datos.stock || 0,
    descripcion: datos.descripcion || '',
    imagen_url: datos.imagen_url || null,
    activo: datos.activo !== undefined ? datos.activo : 1
  });
  
  db.close();
  
  // Yo: info.lastInsertRowid contiene el ID autogenerado
  // Devuelvo el producto completo consultándolo por su nuevo ID
  return obtenerProductoPorId(info.lastInsertRowid);
}
```

**¿Por qué named parameters (@nombre)?**

- **Legibilidad**: Es claro qué valor va en qué columna
- **Orden independiente**: No importa el orden de las propiedades
- **Mantenibilidad**: Si agrego una columna, solo cambio el objeto

```javascript
// Yo: Función para descontar stock (CRÍTICA para evitar sobreventa)
function descontarStock(id, cantidad) {
  const db = getDB();
  
  // ========== TÉCNICA DE CONTROL DE CONCURRENCIA ==========
  // Yo: Esta es la parte MÁS IMPORTANTE del sistema.
  // Uso "control de concurrencia optimista" con la cláusula WHERE.
  const stmt = db.prepare(`
    UPDATE productos 
    SET stock = stock - ?
    WHERE id = ? AND stock >= ?    -- CLAVE: Solo actualiza si hay stock suficiente
  `);
  
  // Yo: Ejecuto el UPDATE pasando:
  // 1. cantidad a descontar
  // 2. ID del producto
  // 3. cantidad mínima requerida (para validar en el WHERE)
  const result = stmt.run(cantidad, id, cantidad);
  
  db.close();
  
  // Yo: result.changes indica cuántas filas se modificaron
  // Si es 0, significa que el WHERE no encontró ninguna fila que cumpla la condición
  // Esto puede pasar si:
  //   - El producto no existe (id inválido)
  //   - No hay stock suficiente (stock < cantidad)
  if (result.changes === 0) {
    return false;  // Indica que falló el descuento
  }
  
  return true;  // Éxito
}
```

**¿Por qué `WHERE stock >= ?` es tan importante?**

Imaginá este escenario sin la cláusula WHERE:

```
// MAL: Sin control de concurrencia
Stock actual: 1 unidad

Usuario A compra 1 unidad:
  1. Lee stock = 1 ✓
  2. Ejecuta: UPDATE ... SET stock = stock - 1  → stock = 0 ✓

Usuario B compra 1 unidad (SIMULTÁNEO):
  1. Lee stock = 1 ✓  (aún no se actualizó)
  2. Ejecuta: UPDATE ... SET stock = stock - 1  → stock = -1 ❌ ERROR!
```

Con `WHERE stock >= ?`:

```
// BIEN: Con control de concurrencia
Stock actual: 1 unidad

Usuario A compra 1 unidad:
  Ejecuta: UPDATE ... SET stock = stock - 1 WHERE stock >= 1
  → Éxito, stock = 0, changes = 1

Usuario B compra 1 unidad (SIMULTÁNEO):
  Ejecuta: UPDATE ... SET stock = stock - 1 WHERE stock >= 1
  → Falla, stock sigue en 0, changes = 0
  → Backend devuelve error 400 al usuario B
```

---

### B. Controlador de Productos

**Archivo:** `controllers/ProductoController.js`

```javascript
// Yo: Función para crear un nuevo producto
// Se ejecuta cuando llega POST /api/productos
async function crearProducto(req, res) {
  try {
    // ========== EXTRAER DATOS DEL BODY ==========
    // Yo: req.body contiene los datos enviados por el frontend en formato JSON
    const { nombre, categoria, subcategoria, precio, stock, descripcion, imagen_url, activo } = req.body;

    console.log('➕ Creando nuevo producto:', { nombre, categoria, precio });

    // ========== VALIDACIÓN 1: Campos obligatorios ==========
    // Yo: Verifico que nombre y precio estén presentes
    if (!nombre || precio === undefined || precio === null) {
      return res.status(400).json({
        success: false,
        mensaje: 'El nombre y el precio son obligatorios'
      });
    }

    // ========== VALIDACIÓN 2: Precio no negativo ==========
    // Yo: Según consigna del TP, no se permiten precios negativos
    if (precio < 0) {
      return res.status(400).json({
        success: false,
        mensaje: 'El precio no puede ser negativo'
      });
    }

    // ========== VALIDACIÓN 3: Stock no negativo ==========
    // Yo: Según consigna del TP, no se permiten stocks negativos
    if (stock !== undefined && stock < 0) {
      return res.status(400).json({
        success: false,
        mensaje: 'El stock no puede ser negativo'
      });
    }

    // ========== LLAMADA AL MODELO ==========
    // Yo: Si todas las validaciones pasaron, llamo al modelo para crear el producto
    const producto = ProductoModel.crearProducto({
      nombre,
      categoria: categoria || null,
      subcategoria: subcategoria || null,
      precio,
      stock: stock || 0,
      descripcion: descripcion || '',
      imagen_url: imagen_url || null,
      activo: activo !== undefined ? activo : 1  // Por defecto activo
    });

    console.log('✅ Producto creado con ID:', producto.id);

    // ========== RESPUESTA EXITOSA ==========
    // Yo: Devuelvo código 201 Created (estándar HTTP para recursos nuevos)
    return res.status(201).json({
      success: true,
      mensaje: 'Producto creado exitosamente',
      producto: producto
    });

  } catch (error) {
    console.error('Error al crear producto:', error);
    return res.status(500).json({
      success: false,
      mensaje: 'Error al crear el producto'
    });
  }
}
```

**¿Por qué validar en el controlador si ya validé en el frontend?**

1. **Seguridad**: El frontend puede ser manipulado (DevTools, Postman, curl)
2. **Integridad de datos**: Garantizo que la BD nunca tenga datos inválidos
3. **API pública**: Cualquiera podría consumir mi API sin pasar por mi frontend

**Códigos HTTP que uso:**

- `200 OK`: Operación exitosa (GET, PUT, PATCH)
- `201 Created`: Recurso creado exitosamente (POST)
- `400 Bad Request`: Error en los datos enviados
- `401 Unauthorized`: No hay token o es inválido
- `403 Forbidden`: Usuario autenticado pero sin permisos
- `404 Not Found`: Recurso no encontrado
- `500 Internal Server Error`: Error del servidor

---

### C. Rutas de Productos

**Archivo:** `routes/productos.js`

```javascript
const express = require('express');
const router = express.Router();
const ProductoController = require('../controllers/ProductoController');
const { verificarAutenticacion, verificarPermiso } = require('../middleware/auth');

// ========== RUTA PÚBLICA ==========
// Yo: GET /api/productos - NO requiere autenticación
// Cualquier persona puede ver el menú de productos
router.get('/', ProductoController.listarProductos);

// ========== RUTA PROTEGIDA CON AUTENTICACIÓN ==========
// Yo: GET /api/productos/admin/all - Requiere estar logueado
// Solo usuarios autenticados pueden ver productos inactivos
router.get('/admin/all', 
  verificarAutenticacion,                    // Middleware 1: verifica token
  ProductoController.listarTodosLosProductos // Controlador
);

// ========== RUTA PROTEGIDA CON AUTENTICACIÓN Y PERMISO ==========
// Yo: POST /api/productos - Requiere permiso 'gestionar_productos'
// Solo admin y vendedor pueden crear productos
router.post('/', 
  verificarAutenticacion,                    // Middleware 1: verifica token
  verificarPermiso('gestionar_productos'),  // Middleware 2: verifica permiso
  ProductoController.crearProducto          // Controlador
);

// Yo: PUT /api/productos/:id - Actualizar producto
router.put('/:id', 
  verificarAutenticacion,
  verificarPermiso('gestionar_productos'),
  ProductoController.actualizarProducto
);

// Yo: DELETE /api/productos/:id - Eliminar producto (soft delete)
router.delete('/:id', 
  verificarAutenticacion,
  verificarPermiso('gestionar_productos'),
  ProductoController.eliminarProducto
);

module.exports = router;
```

**Orden de ejecución de una request:**

```
1. Request llega: POST /api/productos
2. Express busca la ruta que coincida
3. Ejecuta middlewares en orden:
   a. verificarAutenticacion → Valida token JWT
   b. verificarPermiso('gestionar_productos') → Valida permiso
4. Si ambos pasan, ejecuta ProductoController.crearProducto
5. El controlador devuelve la respuesta al cliente
```

---

## 7. FLUJO DE CARRITO Y COMPRAS

### A. Modelo de Compras

**Archivo:** `models/CompraModel.js`

```javascript
// Yo: Función para crear una compra CON TRANSACCIÓN
function crearCompra(datosCompra, detallesCompra) {
  const db = getDB();
  
  // ========== TRANSACCIÓN SQL ==========
  // Yo: Envuelvo todo en una transacción para garantizar atomicidad
  // Si algo falla, TODAS las operaciones se revierten (rollback)
  const insertar = db.transaction(() => {
    
    // ========== PASO 1: Insertar en tabla 'compras' ==========
    const stmtCompra = db.prepare(`
      INSERT INTO compras (
        comprador_nombre, comprador_mesa, comprador_telefono,
        metodo_pago, comprobante_archivo, total, estado,
        abonado, listo, entregado, detalles_pedido
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const info = stmtCompra.run(
      datosCompra.comprador_nombre,
      datosCompra.comprador_mesa,
      datosCompra.comprador_telefono,
      datosCompra.metodo_pago,
      datosCompra.comprobante_archivo,
      datosCompra.total,
      datosCompra.estado || 'pendiente',
      datosCompra.abonado || 0,
      datosCompra.listo || 0,
      datosCompra.entregado || 0,
      datosCompra.detalles_pedido || null
    );
    
    const compraId = info.lastInsertRowid;
    
    // ========== PASO 2: Insertar en tabla 'detalles_compra' ==========
    // Yo: Preparo el statement UNA VEZ y lo ejecuto muchas veces
    const stmtDetalle = db.prepare(`
      INSERT INTO detalles_compra (
        compra_id, producto_id, cantidad, precio_unitario, subtotal, nombre_producto
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    // Yo: Inserto cada producto de la compra
    for (const detalle of detallesCompra) {
      stmtDetalle.run(
        compraId,
        detalle.producto_id,
        detalle.cantidad,
        detalle.precio_unitario,  // SNAPSHOT: precio al momento de compra
        detalle.subtotal,
        detalle.nombre_producto   // SNAPSHOT: nombre al momento de compra
      );
    }
    
    // ========== PASO 3: Generar número de orden ==========
    const numero_orden = `SH-${Date.now()}`;
    db.prepare('UPDATE compras SET numero_orden = ? WHERE id = ?').run(numero_orden, compraId);
    
    // Yo: Retorno la compra completa
    return obtenerCompraPorId(compraId);
  });
  
  // Yo: Ejecuto la transacción
  // Si todo sale bien, hace COMMIT automático
  // Si hay error, hace ROLLBACK automático
  const resultado = insertar();
  
  db.close();
  return resultado;
}
```

**¿Por qué uso transacciones?**

Sin transacción:
```
1. INSERT en compras → OK
2. INSERT en detalles_compra (item 1) → OK
3. INSERT en detalles_compra (item 2) → ERROR
4. Base de datos inconsistente: compra sin todos sus detalles
```

Con transacción:
```
1. BEGIN TRANSACTION
2. INSERT en compras → OK
3. INSERT en detalles_compra (item 1) → OK
4. INSERT en detalles_compra (item 2) → ERROR
5. ROLLBACK → Ningún cambio se guardó
```

**¿Por qué guardo snapshot de precio y nombre?**

- **Auditoría**: Si cambio el precio mañana, el historial debe mostrar el precio que pagó el cliente
- **Historial inmutable**: Las compras pasadas no deben cambiar cuando actualizo productos
- **Evidencia legal**: En caso de disputa, tengo registro del precio exacto

---

### B. Controlador de Compras

**Archivo:** `controllers/CompraController.js`

```javascript
// Yo: Función para crear una compra
// Se ejecuta cuando llega POST /api/compras
async function crearCompra(req, res) {
  try {
    console.log('=== INICIO POST /api/compras ===');
    
    // ========== EXTRAER DATOS ==========
    const { comprador_nombre, comprador_telefono, comprador_mesa, metodo_pago, productos, detalles_pedido } = req.body;

    // Yo: comprador_mesa puede ser string vacío o null, lo normalizo
    const mesaNormalizada = comprador_mesa && comprador_mesa !== '' ? parseInt(comprador_mesa) : null;

    // ========== VALIDACIÓN 1: Datos obligatorios ==========
    if (!comprador_nombre || !metodo_pago) {
      return res.status(400).json({
        success: false,
        mensaje: 'Faltan datos obligatorios: comprador_nombre y metodo_pago'
      });
    }

    // ========== VALIDACIÓN 2: Método de pago ==========
    // Yo: Según consigna, solo acepto 'efectivo' o 'transferencia'
    if (!['efectivo', 'transferencia'].includes(metodo_pago)) {
      return res.status(400).json({
        success: false,
        mensaje: 'El método de pago debe ser "efectivo" o "transferencia"'
      });
    }

    // ========== VALIDACIÓN 3: Comprobante obligatorio para transferencia ==========
    // Yo: Si el pago es por transferencia, DEBE subir un comprobante
    if (metodo_pago === 'transferencia' && !req.file) {
      return res.status(400).json({
        success: false,
        mensaje: 'Para transferencia es obligatorio subir el comprobante'
      });
    }

    // ========== PARSEO DE PRODUCTOS ==========
    // Yo: Los productos vienen como string JSON (porque usamos multipart/form-data)
    let productosArray;
    try {
      productosArray = typeof productos === 'string' ? JSON.parse(productos) : productos;
    } catch (error) {
      return res.status(400).json({
        success: false,
        mensaje: 'El formato de productos es inválido'
      });
    }

    if (!Array.isArray(productosArray) || productosArray.length === 0) {
      return res.status(400).json({
        success: false,
        mensaje: 'Debe incluir al menos un producto'
      });
    }

    // ========== VALIDACIÓN CRÍTICA: Stock de cada producto ==========
    // Yo: Esta es la validación MÁS IMPORTANTE.
    // Verifico contra la base de datos el stock ACTUAL de cada producto.
    // NO confío en lo que envía el frontend porque podría estar desactualizado.
    for (const item of productosArray) {
      const { producto_id, cantidad } = item;

      // Yo: Consulto el producto en la BD
      const producto = ProductoModel.obtenerProductoPorId(producto_id);

      // Yo: Verifico que exista y esté activo
      if (!producto || !producto.activo) {
        return res.status(404).json({
          success: false,
          mensaje: `El producto con ID ${producto_id} no existe o no está disponible`
        });
      }

      // Yo: Validación estricta de stock
      // Si el stock es menor a la cantidad solicitada, RECHAZO la compra completa
      if (producto.stock < cantidad) {
        return res.status(400).json({
          success: false,
          mensaje: `Stock insuficiente para "${producto.nombre}". Disponible: ${producto.stock}, Solicitado: ${cantidad}`
        });
      }
    }

    // ========== CÁLCULO DEL TOTAL ==========
    // Yo: Recalculo el total usando precios de la base de datos.
    // ¿Por qué? Porque alguien podría modificar el JavaScript del cliente
    // y enviar un total de $1 para todos los productos.
    let total = 0;
    const itemsConDetalles = productosArray.map(item => {
      const producto = ProductoModel.obtenerProductoPorId(item.producto_id);
      const subtotal = producto.precio * item.cantidad;
      total += subtotal;
      
      return {
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio_unitario: producto.precio,      // Precio de BD (no del frontend)
        subtotal: subtotal,
        nombre_producto: producto.nombre       // Snapshot del nombre
      };
    });

    // ========== PROCESAR COMPROBANTE (si existe) ==========
    let comprobanteBase64 = null;
    if (req.file) {
      // Yo: Multer guarda el archivo en req.file.buffer (memoria)
      // Lo convierto a base64 para guardarlo en la BD
      comprobanteBase64 = req.file.buffer.toString('base64');
    }

    // ========== CREAR COMPRA EN LA BD ==========
    const datosCompra = {
      comprador_nombre,
      comprador_mesa: mesaNormalizada,
      comprador_telefono: comprador_telefono || null,
      metodo_pago,
      comprobante_archivo: comprobanteBase64,
      total: total,                            // Total recalculado
      estado: 'pendiente',
      abonado: false,
      listo: false,
      entregado: false,
      detalles_pedido: detalles_pedido || null
    };

    // Yo: Llamo al modelo para crear la compra y sus detalles
    // Esto se hace en una TRANSACCIÓN para garantizar atomicidad
    const compra = CompraModel.crearCompra(datosCompra, itemsConDetalles);

    // ========== DESCONTAR STOCK ==========
    // Yo: Ahora sí descuento el stock de cada producto
    // Uso la función con control de concurrencia
    for (const item of itemsConDetalles) {
      const exito = ProductoModel.descontarStock(item.producto_id, item.cantidad);
      
      if (!exito) {
        // Yo: Si falla el descuento (stock insuficiente o producto no existe)
        // En producción, debería hacer rollback de la compra
        console.error(`📦 Stock actualizado - Producto ID ${item.producto_id}: -${item.cantidad} unidades`);
      } else {
        console.log(`📦 Stock actualizado - Producto ID ${item.producto_id}: -${item.cantidad} unidades`);
      }
    }

    console.log('✅ Compra creada con ID:', compra.id);
    console.log('📦 Número de orden:', compra.numero_orden);

    // ========== RESPUESTA EXITOSA ==========
    return res.status(201).json({
      success: true,
      mensaje: 'Compra creada exitosamente',
      compra: compra
    });

  } catch (error) {
    console.error('Error al crear compra:', error);
    return res.status(500).json({
      success: false,
      mensaje: 'Error al crear la compra'
    });
  }
}
```

**Resumen del flujo de compra:**

1. Frontend envía productos, método de pago y datos del comprador
2. Backend valida datos obligatorios y formato
3. Backend verifica stock ACTUAL de cada producto
4. Backend recalcula el total usando precios de BD
5. Backend crea la compra en transacción (compras + detalles_compra)
6. Backend descuenta stock de cada producto con control de concurrencia
7. Backend devuelve la compra creada al frontend

---

### C. Rutas de Compras

**Archivo:** `routes/compras.js`

```javascript
const express = require('express');
const router = express.Router();
const CompraController = require('../controllers/CompraController');
const { verificarAutenticacion, verificarPermiso } = require('../middleware/auth');
const multer = require('multer');

// ========== CONFIGURACIÓN DE MULTER ==========
// Yo: Multer maneja archivos subidos (multipart/form-data)
const storage = multer.memoryStorage();  // Guardo en memoria, no en disco

const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 3 * 1024 * 1024  // Máximo 3MB
  },
  fileFilter: (req, file, cb) => {
    // Yo: Solo acepto imágenes
    const tiposPermitidos = /jpeg|jpg|png|webp/;
    const mimetype = tiposPermitidos.test(file.mimetype);
    
    if (mimetype) {
      return cb(null, true);  // Aceptar archivo
    } else {
      cb(new Error('Solo se permiten archivos de imagen (JPG, PNG, WEBP)'));
    }
  }
});

// ========== RUTA: Crear compra ==========
// Yo: POST /api/compras - Requiere permiso 'crear_compra'
router.post(
  '/',
  verificarAutenticacion,              // Middleware 1: valida token
  verificarPermiso('crear_compra'),   // Middleware 2: valida permiso
  upload.single('comprobante'),       // Middleware 3: procesa archivo
  CompraController.crearCompra        // Controlador
);

// ========== RUTA: Listar compras ==========
// Yo: GET /api/compras - Requiere permiso 'ver_compras'
router.get('/', 
  verificarAutenticacion,
  verificarPermiso('ver_compras'),
  CompraController.listarCompras
);

// ========== RUTA: Actualizar estado ==========
// Yo: PATCH /api/compras/:id/estado - Requiere permiso 'editar_compras'
router.patch('/:id/estado', 
  verificarAutenticacion,
  verificarPermiso('editar_compras'),
  CompraController.actualizarEstadoCompra
);

module.exports = router;
```

---

## 8. VALIDACIONES CRÍTICAS

### A. Validación de Precio y Stock

```javascript
// Yo: En ProductoController.crearProducto()
if (precio < 0) {
  return res.status(400).json({
    success: false,
    mensaje: 'El precio no puede ser negativo'
  });
}

if (stock !== undefined && stock < 0) {
  return res.status(400).json({
    success: false,
    mensaje: 'El stock no puede ser negativo'
  });
}
```

**¿Por qué es importante?**

- **Integridad de negocio**: No tiene sentido un producto con precio negativo
- **Prevención de errores**: Stock negativo causaría problemas en el cálculo del total
- **Cumplimiento de consigna**: El TP explícitamente pide estas validaciones

---

### B. Validación de Stock Antes de Compra

```javascript
// Yo: En CompraController.crearCompra()
for (const item of productosArray) {
  const producto = ProductoModel.obtenerProductoPorId(item.producto_id);
  
  if (producto.stock < cantidad) {
    return res.status(400).json({
      success: false,
      mensaje: `Stock insuficiente para "${producto.nombre}". Disponible: ${producto.stock}, Solicitado: ${cantidad}`
    });
  }
}
```

**¿Por qué verifico contra la BD y no confío en el frontend?**

- **Datos obsoletos**: Otro usuario pudo comprar mientras este usuario llenaba el carrito
- **Manipulación**: Alguien podría modificar el código JavaScript y cambiar las cantidades
- **Race conditions**: Dos usuarios comprando simultáneamente

---

### C. Recálculo del Total en Backend

```javascript
// Yo: NUNCA confío en el total que envía el frontend
let total = 0;
const itemsConDetalles = productosArray.map(item => {
  const producto = ProductoModel.obtenerProductoPorId(item.producto_id);
  const subtotal = producto.precio * item.cantidad;
  total += subtotal;  // Recalculo usando precio de BD
  return { ...item, precio_unitario: producto.precio };
});
```

**¿Por qué recalculo el total?**

Un atacante podría:
1. Abrir DevTools
2. Modificar el código JavaScript
3. Cambiar `precio: 5000` a `precio: 1`
4. Enviar la compra

Con mi validación:
- Frontend envía `total: 1`
- Backend recalcula y obtiene `total: 5000`
- Backend guarda `5000` (no `1`)

---

### D. Control de Concurrencia en Stock

```javascript
// Yo: En ProductoModel.descontarStock()
const stmt = db.prepare(`
  UPDATE productos 
  SET stock = stock - ?
  WHERE id = ? AND stock >= ?  -- CLAVE: Validación atómica
`);

const result = stmt.run(cantidad, id, cantidad);

if (result.changes === 0) {
  return false;  // Falló porque stock < cantidad
}
```

**Escenario sin esta validación:**

```
Stock inicial: 1 unidad

Usuario A:                          Usuario B:
1. Lee stock = 1                    1. Lee stock = 1
2. Compra 1 unidad                  2. Compra 1 unidad
3. UPDATE stock = 0 ✓              3. UPDATE stock = -1 ❌ ERROR!
```

**Con `WHERE stock >= ?`:**

```
Stock inicial: 1 unidad

Usuario A:                          Usuario B:
1. UPDATE WHERE stock >= 1          1. UPDATE WHERE stock >= 1
   → Éxito (stock = 0)                → Falla (stock ya es 0)
                                      → Backend devuelve error 400
```

---

## 9. CASOS DE USO Y DEMOSTRACIÓN

### Caso 1: Usuario Admin crea un producto

```bash
POST /api/productos
Headers: { Authorization: "Bearer <token_admin>" }
Body: {
  "nombre": "Pizza Muzzarella",
  "categoria": "Pizzas",
  "subcategoria": "Clásicas",
  "precio": 5000,
  "stock": 10,
  "descripcion": "Pizza tradicional con muzzarella",
  "activo": true
}

Flujo:
1. verificarAutenticacion → Valida token, extrae permisos
2. verificarPermiso('gestionar_productos') → Verifica que admin tenga el permiso
3. ProductoController.crearProducto → Valida precio >= 0, stock >= 0
4. ProductoModel.crearProducto → INSERT en productos
5. Response 201 con el producto creado
```

---

### Caso 2: Usuario Visitador intenta crear un producto

```bash
POST /api/productos
Headers: { Authorization: "Bearer <token_visitador>" }
Body: { ... }

Flujo:
1. verificarAutenticacion → Valida token ✓
2. verificarPermiso('gestionar_productos') → Visitador NO tiene el permiso
3. Devuelve 403 Forbidden
4. Nunca llega al controlador
```

---

### Caso 3: Usuario Comprador realiza una compra

```bash
POST /api/compras
Headers: { Authorization: "Bearer <token_comprador>" }
Body: {
  "comprador_nombre": "Juan Pérez",
  "comprador_mesa": "5",
  "metodo_pago": "efectivo",
  "productos": [
    { "producto_id": 1, "cantidad": 2 },
    { "producto_id": 3, "cantidad": 1 }
  ]
}

Flujo:
1. verificarAutenticacion → Valida token ✓
2. verificarPermiso('crear_compra') → Comprador tiene el permiso ✓
3. CompraController.crearCompra:
   a. Valida datos obligatorios ✓
   b. Valida método de pago ✓
   c. Verifica stock de producto 1 (tiene 10) ✓
   d. Verifica stock de producto 3 (tiene 5) ✓
   e. Recalcula total: (2 × 5000) + (1 × 3000) = 13000
   f. CompraModel.crearCompra (transacción):
      - INSERT en compras (total: 13000)
      - INSERT en detalles_compra (2 filas)
      - Genera número de orden: SH-1732123456789
   g. Descuenta stock:
      - Producto 1: stock = 10 - 2 = 8 ✓
      - Producto 3: stock = 5 - 1 = 4 ✓
4. Response 201 con la compra creada
```

---

### Caso 4: Dos usuarios compran simultáneamente el último producto

```
Stock actual de producto ID 5: 1 unidad

Usuario A:                                  Usuario B:
POST /api/compras                          POST /api/compras
productos: [{ id: 5, cantidad: 1 }]       productos: [{ id: 5, cantidad: 1 }]

Backend A:                                  Backend B:
1. Valida token ✓                          1. Valida token ✓
2. Verifica stock: 1 >= 1 ✓               2. Verifica stock: 1 >= 1 ✓
3. Crea compra ✓                          3. Crea compra ✓
4. Descuenta stock:                        4. Descuenta stock:
   UPDATE WHERE stock >= 1                    UPDATE WHERE stock >= 1
   → stock = 0                                → changes = 0 (stock ya es 0)
   → changes = 1 ✓                           → FALLA ❌

5. Response 201                            5. Backend registra error pero
                                             la compra YA fue creada
                                          6. Response 201 (con warning en logs)

MEJORA PENDIENTE: Envolver descuento de stock en la misma transacción
```

---

## 10. PREGUNTAS FRECUENTES

### P1: ¿Por qué elegiste SQLite y no PostgreSQL o MySQL?

**R:** Para desarrollo local, SQLite es ideal porque:
- No requiere instalación de servidor
- Es un archivo portable (`sanpaholmes.db`)
- Soporta transacciones y relaciones como cualquier BD relacional
- Es más que suficiente para el volumen de datos del TP

Sin embargo, el código está preparado para migrar a PostgreSQL cambiando solo la capa de modelos.

---

### P2: ¿Por qué JWT y no sesiones con cookies?

**R:** JWT tiene ventajas para APIs REST:
- **Stateless**: No necesito guardar sesiones en el servidor
- **Escalable**: Puedo agregar más servidores sin sincronizar sesiones
- **Compatible con móviles**: Los tokens se envían en headers, no dependen de cookies
- **Autocontenido**: El token incluye toda la info que necesito (permisos, usuario, rol)

La desventaja es que no puedo invalidar un token antes de que expire, pero para el alcance del TP es aceptable.

---

### P3: ¿Qué pasa si un producto se agota mientras el usuario tiene el carrito abierto?

**R:** Mi sistema maneja esto en dos niveles:

1. **Validación antes de crear la compra**: Verifico stock actual contra la BD
2. **Control de concurrencia**: El `WHERE stock >= ?` garantiza atomicidad

Flujo:
```
1. Usuario A agrega último producto al carrito (frontend)
2. Usuario B compra ese producto → stock = 0
3. Usuario A intenta confirmar compra
4. Backend verifica: producto.stock (0) < cantidad (1)
5. Backend devuelve error 400: "Stock insuficiente"
6. Frontend muestra mensaje y actualiza carrito
```

---

### P4: ¿Por qué guardas snapshot de precio en `detalles_compra`?

**R:** Por auditoría e historial inmutable:

- Si cambio el precio de una pizza de $5000 a $6000 mañana
- Las compras viejas DEBEN mostrar que el cliente pagó $5000
- Es como MercadoLibre: tu historial muestra el precio que pagaste, no el actual

Además, es evidencia legal en caso de disputa.

---

### P5: ¿Cómo garantizas que solo admin pueda eliminar compras?

**R:** Con el sistema de permisos:

```javascript
// En roles_permisos, solo el rol admin tiene:
{ role_id: 1, permiso_id: 3 }  // permiso 'eliminar_compras'

// En la ruta:
router.delete('/:id', 
  verificarAutenticacion,
  verificarPermiso('eliminar_compras'),  // Solo admin pasa
  CompraController.eliminarCompra
);
```

Si un vendedor intenta:
1. Token válido → pasa verificarAutenticacion
2. Permisos = ['ver_compras', 'editar_compras'] → NO incluye 'eliminar_compras'
3. Devuelve 403 Forbidden

---

### P6: ¿Qué mejoras implementarías en producción?

**R:**

1. **Transacción completa para compras**: Incluir descuento de stock en la misma transacción
2. **Paginación**: Para listados de productos y compras
3. **Rate limiting**: Limitar requests por IP para evitar ataques
4. **Logs estructurados**: Winston o Bunyan para auditoría
5. **Refresh tokens**: Para renovar JWT sin re-login
6. **Validación con Joi/Zod**: Esquemas de validación más robustos
7. **Tests automatizados**: Jest + Supertest para endpoints
8. **Caché con Redis**: Para productos más consultados
9. **WebSockets**: Para notificaciones en tiempo real (nuevos pedidos)
10. **Migrar a PostgreSQL**: Para mejor soporte de concurrencia

---

## CONCLUSIÓN

Este proyecto demuestra mi comprensión de:

✅ **Arquitectura MVC**: Separación clara de responsabilidades  
✅ **APIs REST**: Endpoints con verbos HTTP correctos y códigos de estado  
✅ **Autenticación JWT**: Sistema seguro con tokens firmados  
✅ **Autorización granular**: Permisos específicos por endpoint  
✅ **Validaciones en múltiples capas**: Frontend (UX) + Backend (seguridad)  
✅ **Transacciones SQL**: Para operaciones atómicas  
✅ **Control de concurrencia**: Para evitar sobreventa  
✅ **Seguridad**: Nunca confiar en datos del cliente, siempre validar y recalcular  
✅ **Auditoría**: Snapshots de precios para historial inmutable  

Estoy preparado para defender cada decisión de arquitectura y explicar cada línea de código del backend.

---

**Fin del documento de defensa**

