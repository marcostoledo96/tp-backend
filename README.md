# TP Final Integrador - Sistema de Carrito de Compras con Gestión de Usuarios y Permisos

Yo: Este proyecto es mi Trabajo Final Integrador para la materia Desarrollo de Software Backend. El objetivo principal es ampliar un sistema de gestión de usuarios, roles y permisos, incorporando un módulo completo de carrito de compras.

##  Descripción General

El sistema permite:
- **CRUD completo de productos** con validaciones de stock y precio
- **Carrito de compras por usuario** autenticado (agregar, modificar, eliminar productos)
- **Registro de compras** con detalles, actualización de stock y control de estados
- **Sistema robusto de roles y permisos** para controlar el acceso a cada funcionalidad
- **Panel de administración** para gestionar usuarios, roles, permisos y productos

##  Arquitectura

El proyecto sigue el patrón **MVC (Model-View-Controller)**:

### Backend (Node.js + Express + SQLite)
```
├── models/          → Lógica de acceso a datos (ProductoModel, CompraModel, RoleModel, etc.)
├── controllers/     → Lógica de negocio (ProductoController, CompraController, AuthController)
├── routes/          → Definición de endpoints API REST (productos.js, compras.js, roles.js)
├── middleware/      → Funciones intermedias (auth.js para verificar autenticación y permisos)
└── db/              → Scripts de inicialización y migraciones SQL
```

### Frontend (React + TypeScript + Vite)
```
├── views/           → Componentes de páginas (Menu, Cart, AdminPanel, RolesAdmin)
├── controllers/     → Context API para estado global (AuthContext, CartContext)
└── components/      → Componentes reutilizables (UI, PoliceButton)
```

##  Base de Datos

### Tablas Principales

#### `usuarios`
- `id`, `username`, `password_hash`, `nombre_completo`, `email`, `role_id` (FK a `roles`), `activo`, `creado_en`
- Yo: Agregué `role_id` para vincular cada usuario con un rol y obtener sus permisos.

#### `roles`
- `id`, `nombre`, `descripcion`, `activo`, `creado_en`
- Roles predefinidos: `admin`, `vendedor`, `visitador`, `comprador`

#### `permisos`
- `id`, `nombre`, `descripcion`, `categoria`, `creado_en`
- Yo: Organicé los permisos en categorías (productos, compras, usuarios, roles) para facilitar la asignación.

#### `roles_permisos` (N:M)
- `role_id` (FK), `permiso_id` (FK)
- Yo: Esta tabla intermedia me permite asignar múltiples permisos a un rol.

#### `productos`
- `id`, `nombre`, `categoria`, `subcategoria`, `precio`, `stock`, `descripcion`, `imagen_url`, `activo`

#### `compras`
- `id`, `numero_orden`, `comprador_nombre`, `comprador_mesa`, `comprador_telefono`, `metodo_pago`, `comprobante_archivo`, `total`, `estado`, `abonado`, `listo`, `entregado`, `fecha`

#### `detalles_compra` (N:M entre compras y productos)
- `id`, `compra_id` (FK), `producto_id` (FK), `cantidad`, `precio_unitario`, `subtotal`, `nombre_producto`
- Yo: Guardo el `nombre_producto` y `precio_unitario` como snapshot para preservar el historial, incluso si después cambio el precio del producto.

### Relaciones
- **Usuario → Rol** (N:1): Cada usuario tiene un rol
- **Rol → Permisos** (N:M): Un rol puede tener muchos permisos, un permiso puede estar en muchos roles
- **Compra → Detalles** (1:N): Una compra tiene muchos detalles (productos comprados)

##  Sistema de Permisos

### Permisos Disponibles

| Permiso               | Descripción                            | Categoría |
|-----------------------|----------------------------------------|-----------|
| `ver_productos`       | Ver listado de productos               | productos |
| `gestionar_productos` | Crear, editar, eliminar productos      | productos |
| `ver_compras`         | Ver historial de compras               | compras   |
| `crear_compra`        | Realizar nuevas compras                | compras   |
| `editar_compras`      | Actualizar estados de compras          | compras   |
| `eliminar_compras`    | Eliminar compras                       | compras   |
| `ver_usuarios`        | Ver listado de usuarios                | usuarios  |
| `gestionar_usuarios`  | Crear, editar, eliminar usuarios       | usuarios  |
| `ver_roles`           | Ver roles y permisos                   | roles     |
| `gestionar_roles`     | Crear, editar roles y asignar permisos | roles     |

### Roles Predefinidos

#### Admin
- **Todos los permisos** del sistema
- Puede crear usuarios y asignar roles
- Puede crear nuevos roles y asignar permisos

#### Vendedor
- `ver_productos`, `gestionar_productos` → Maneja el menú
- `ver_compras`, `editar_compras` → Controla el flujo de pedidos

#### Visitador
- `ver_productos`, `ver_compras` → Solo lectura (monitoreo)

#### Comprador
- `ver_productos`, `crear_compra`, `ver_compras` → Usuario registrado que puede comprar

Yo: Implementé el rol "comprador" para cumplir con el requisito de que solo usuarios registrados puedan comprar.

##  Middleware de Autenticación

### `verificarAutenticacion`
1. Extrae el token JWT del header `Authorization: Bearer <token>`
2. Verifica la firma y validez del token con `JWT_SECRET`
3. Guarda los datos del usuario en `req.usuario` para usarlos en controladores

### `verificarPermiso(nombrePermiso)`
1. Obtiene el `role_id` del usuario autenticado
2. Consulta la tabla `roles_permisos` para verificar si el rol tiene el permiso requerido
3. Si no tiene permiso → responde `403 Forbidden`
4. Si tiene permiso → continúa al controlador

Yo: Este middleware me permite proteger cada endpoint con permisos específicos, implementando control de acceso granular.

## 🛒 Flujo de Compra

### 1. Usuario navega al menú
- GET `/api/productos` (público) → Listado de productos activos

### 2. Usuario agrega productos al carrito
- El carrito se almacena en `localStorage` (frontend)
- Puede modificar cantidades o eliminar items

### 3. Usuario procede al checkout
- Formulario: nombre, teléfono, mesa, método de pago, comprobante (opcional)

### 4. Se envía la compra al backend
- POST `/api/compras` con el carrito completo

### 5. El backend valida y procesa
```javascript
// Yo: Este es el flujo crítico que implementé en CompraController.crearCompra()

// 1. Validar que existan datos obligatorios
if (!comprador_nombre || !productos || productos.length === 0) {
  return res.status(400).json({ error: 'Faltan datos obligatorios' });
}

// 2. Validar stock ACTUAL en base de datos (NO confiar en frontend)
for (const item of productos) {
  const productoActual = ProductoModel.obtenerProductoPorId(item.id);
  if (productoActual.stock < item.cantidad) {
    return res.status(400).json({ 
      error: `Stock insuficiente para ${productoActual.nombre}. Disponible: ${productoActual.stock}` 
    });
  }
}

// 3. Recalcular total con precios de BD (evitar manipulación)
let totalReal = 0;
for (const item of productos) {
  const productoActual = ProductoModel.obtenerProductoPorId(item.id);
  totalReal += productoActual.precio * item.cantidad;
}

// 4. Crear compra y detalles en transacción
const compra = CompraModel.crearCompra(datosCompra, detallesCompra);

// 5. Descontar stock de forma atómica
for (const item of productos) {
  ProductoModel.descontarStock(item.id, item.cantidad);
  // Esta función usa WHERE stock >= cantidad para garantizar atomicidad
}
```

### 6. Confirmación
- Se devuelve el `numero_orden` y el `id` de la compra
- El frontend limpia el carrito y muestra confirmación

##  Validaciones Implementadas

### Productos
-  Precio no puede ser negativo
-  Stock no puede ser negativo
-  Nombre es obligatorio

### Compras
-  Stock suficiente antes de crear compra
-  Total recalculado con precios de BD (evita manipulación)
-  Descuento atómico de stock con `WHERE stock >= ?`
-  Método de pago válido (`efectivo` o `transferencia`)

### Usuarios
-  Username único
-  Role_id válido (debe existir en tabla `roles`)
-  **Sin requisitos mínimos de contraseña** (según consigna del TP)

## 📁 Migraciones

### `001_add_roles_permisos_system.sql`
Yo: Creé esta migración para agregar el sistema completo de roles y permisos a SQLite:
- Crea tablas `roles`, `permisos`, `roles_permisos`
- Agrega columna `role_id` a `usuarios`
- Inserta los 4 roles predefinidos
- Inserta los 10 permisos organizados por categoría
- Asigna permisos a cada rol según su función

### Aplicar migración
```powershell
node db/apply-sqlite-migration.js 001_add_roles_permisos_system.sql
```

##  Instalación y Ejecución

### Requisitos
- Node.js v18+
- npm o yarn

### Instalar dependencias
```powershell
npm install
```

### Inicializar base de datos SQLite
```powershell
node db/sqlite-init.js
```

Esto crea `db/sanpaholmes.db` con:
- Usuario admin (username: `admin`, password: `admin123`)
- Productos de ejemplo
- Compras de ejemplo

### Aplicar migración de roles/permisos
```powershell
node db/apply-sqlite-migration.js 001_add_roles_permisos_system.sql
```

### Levantar backend
```powershell
node server.js
```
Backend corre en `http://localhost:3000`

### Levantar frontend
```powershell
npm run dev
```
Frontend corre en `http://localhost:5173`

##  Verificación Manual

### 1. Login y obtención de token
```powershell
# Hacer login
curl -X POST http://localhost:3000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"username":"admin","password":"admin123"}'

# Copiar el token de la respuesta
```

### 2. Listar roles
```powershell
curl http://localhost:3000/api/roles `
  -H "Authorization: Bearer <TOKEN>"
```

### 3. Listar permisos agrupados
```powershell
curl http://localhost:3000/api/roles/permisos/all `
  -H "Authorization: Bearer <TOKEN>"
```

### 4. Crear un rol nuevo
```powershell
curl -X POST http://localhost:3000/api/roles `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer <TOKEN>" `
  -d '{"nombre":"cajero","descripcion":"Opera caja","permisos":[1,2,3]}'
```

### 5. Crear usuario
```powershell
curl -X POST http://localhost:3000/api/usuarios `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer <TOKEN>" `
  -d '{"username":"vendedor1","password":"vendedor123","nombre":"Vendedor 1","role_id":2}'
```

### 6. Crear producto
```powershell
curl -X POST http://localhost:3000/api/productos `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer <TOKEN>" `
  -d '{"nombre":"Pizza Muzzarella","categoria":"cena","subcategoria":"principales","precio":5000,"stock":20}'
```

### 7. Crear compra
```powershell
curl -X POST http://localhost:3000/api/compras `
  -H "Content-Type: application/json" `
  -d '{
    "comprador_nombre":"Juan Pérez",
    "comprador_mesa":5,
    "metodo_pago":"efectivo",
    "productos":"[{\"id\":1,\"cantidad\":2}]"
  }'
```

### 8. Verificar que se descontó stock
```powershell
curl http://localhost:3000/api/productos/1
```

##  Notas de Implementación

### Decisiones Técnicas

**1. ¿Por qué SQLite?**
Yo: Elegí SQLite para el desarrollo local porque es simple, no requiere instalación de servidor y el archivo `.db` es portable. Para producción a gran escala migraría a PostgreSQL.

**2. ¿Por qué JWT y no sesiones?**
Yo: JWT es stateless, ideal para APIs REST. No requiere almacenar sesiones en servidor, facilitando el escalado horizontal.

**3. ¿Por qué guardar items de compra con nombre y precio?**
Yo: Para preservar el historial exacto. Si después cambio el precio del producto, las compras viejas mantienen el precio original (auditoría).

**4. ¿Por qué validar stock y total en backend?**
Yo: **Nunca confiar en el cliente**. Las validaciones frontend son UX, las del backend son seguridad.

**5. ¿Cómo manejas concurrencia en el descuento de stock?**
Yo: La cláusula `WHERE stock >= ?` en el UPDATE garantiza atomicidad. Si dos usuarios compran simultáneamente el último producto, solo una transacción tendrá éxito (`result.changes = 1`), la otra fallará (`result.changes = 0`).

##  Para la Defensa

### Puntos Clave a Mencionar

1. **Arquitectura MVC**: Separación clara de responsabilidades (modelo, vista, controlador)
2. **Control de permisos granular**: Cada endpoint verifica permisos específicos
3. **Validaciones en múltiples capas**: Frontend (UX) + Backend (seguridad)
4. **Transacciones atómicas**: Garantizan consistencia en operaciones críticas
5. **Auditoría**: Snapshots de precios/nombres en `detalles_compra`

### Endpoints Críticos para Demostrar

- `POST /api/auth/login` → Autenticación y generación de JWT
- `GET /api/roles` → Sistema de roles
- `GET /api/roles/permisos/all` → Permisos agrupados por categoría
- `POST /api/compras` → Validación de stock y descuento atómico
- `POST /api/roles` → Creación de roles con permisos personalizados

### Comandos de Verificación

```powershell
# Verificar roles predefinidos
node scripts/check-login-roles.js

# Ver esquema de base de datos
sqlite3 db/sanpaholmes.db ".schema"

# Contar registros
sqlite3 db/sanpaholmes.db "SELECT COUNT(*) FROM roles;"
sqlite3 db/sanpaholmes.db "SELECT COUNT(*) FROM permisos;"
```

##  Soporte

Si tenés dudas o problemas:
1. Revisá los logs de consola (`console.log` en backend, DevTools en frontend)
2. Verificá que la base de datos esté inicializada (`db/sanpaholmes.db` debe existir)
3. Confirmá que aplicaste las migraciones (`node db/apply-sqlite-migration.js ...`)
4. Revisá que el token JWT esté incluido en el header `Authorization`

---

**Autor**: Marcos Toledo  
**Materia**: Desarrollo de Software Backend  
**Instituto**: IFTS 16  
**Año**: 2025
