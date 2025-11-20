# TRABAJO FINAL INTEGRADOR
## Extensión del Sistema de Usuarios, Roles y Permisos con Carrito de Compras

> Archivo preparado para mi defensa oral. Me enfoco en backend: arquitectura, modelos, controladores, rutas, permisos, validaciones, concurrencia y decisiones técnicas. Incluyo explicaciones línea por línea de los bloques clave (CRUD productos, compras, usuarios, permisos, autenticación, stock, perfil). Así, si el evaluador me pide “andá al CRUD de productos” o “explicame la parte que descuenta stock” lo tengo listo.

---
## 1. Objetivo General
Amplié el sistema existente de gestión de usuarios, roles y permisos incorporando un módulo de carrito de compras que permite administrar productos, registrar compras y visualizar historial por usuario. Apliqué: relaciones, validaciones, control de acceso por permisos y lógica transaccional en flujo de compra.

## 2. Objetivos Específicos (cómo los cumplí)
1. Implementé tablas de productos, compras y detalles_compra con claves foráneas.
2. Creé CRUD completo de productos con soft delete y opción de hard delete.
3. Desarrollé flujo de carrito+checkout (validación de stock, cálculo total desde BD, snapshot de precios en detalles).
4. Registré compras con número de orden único y detalles persistentes para auditoría.
5. Integré permisos granulares (ver, gestionar productos; crear, ver, editar, eliminar compras; ver y gestionar usuarios y roles).
6. Implementé actualización de perfil propio independiente del CRUD administrativo.

## 3. Consignas del Enunciado y Cómo las abordé
### Base de Datos
- Un usuario tiene muchas compras → relación 1:N (compras guarda comprador_nombre y opcional mesa/teléfono).
- Una compra tiene muchos detalles (detalles_compra) → relación 1:N.
- Cada detalle_compra referencia un producto → foreign key a productos.

### Gestión de Productos (ABM)
Rutas implementadas (todas bajo `/api/productos`):
- GET `/` (listado público solo activos y stock > 0)
- GET `/admin/all` (listado completo para panel)
- GET `/:id`
- POST `/` (crear) – requiere permiso `gestionar_productos`
- PUT `/:id` (actualizar) – requiere permiso `gestionar_productos`
- DELETE `/:id` (soft delete) – requiere permiso `gestionar_productos`
	- Query param `?permanent=true` → hard delete transaccional

Validaciones:
- No permito precio indefinido y luego lo parseo a float.
- No permito stock indefinido y lo normalizo a entero.
- Uso soft delete para mantener historial y no romper FK en detalles.

### Carrito / Compras
Flujo: el frontend arma los productos del carrito, pero en backend recalculo total y revalido stock “real”. Registro compra y luego descuento stock de forma atómica. Si método de pago es transferencia exijo comprobante (archivo convertido a base64). Cada detalle guarda snapshot del precio y nombre para auditoría.

### Permisos Clave
| Permiso               | Uso                                        |
|-----------------------|--------------------------------------------|
| ver_productos         | Listar productos                           |
| gestionar_productos   | Crear/editar/eliminar productos            |
| crear_compra          | Registrar compras                          |
| ver_compras           | Ver historial/estadísticas                 |
| editar_compras        | Cambiar estado (abonado, listo, entregado) |
| eliminar_compras      | Borrar compras                             |
| ver_usuarios          | Ver usuarios                               |
| gestionar_usuarios    | CRUD usuarios                              |
| ver_roles             | Ver roles                                  |
| gestionar_roles       | CRUD roles y asignación permisos           |

Roles creados por script: admin, vendedor, visitador, comprador. Asigné permisos según alcance (admin todos, vendedor gestión de productos y ventas, visitador solo lectura, comprador visualización y compra).

## 4. Arquitectura (MVC + Capas)
- Modelo: encapsula SQL (ProductoModel, CompraModel, UsuarioModel, RoleModel).
- Controlador: valida entrada, compone operaciones, maneja errores (ProductoController, CompraController, UsuarioController).
- Rutas: definen endpoints y aplican middlewares de autenticación y permisos.
- Middleware: `verificarAutenticacion` (JWT) y `verificarPermiso` (rol/permisos).
- Scripts: inicialización de roles y permisos, migraciones, verificación de esquema.

## 5. Autenticación y Autorización
Uso JWT stateless. En cada request protegida verifico encabezado `Authorization: Bearer <token>`. Decodifico token, coloco datos del usuario en `req.usuario`. Luego `verificarPermiso('nombre_permiso')` consulta permisos (o usa lista embebida si el token incluye array). Admin bypass total.

### Middleware `auth.js` (Explicación línea por línea)
```javascript
// Middleware de autenticación y permisos
const jwt = require('jsonwebtoken'); // Yo: importo JWT para verificar firmas.
const JWT_SECRET = process.env.JWT_SECRET || 'sanpaholmes-secret-key-2025'; // Yo: clave consistente.

function verificarAutenticacion(req, res, next) {
	const authHeader = req.headers.authorization; // Yo: leo header Authorization.
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return res.status(401).json({ success:false, mensaje:'No se proporcionó token' });
	}
	const token = authHeader.substring(7); // Yo: quito 'Bearer '.
	try {
		const decoded = jwt.verify(token, JWT_SECRET); // Yo: verifico y obtengo payload.
		req.usuario = decoded; // Yo: guardo datos (id, role, permisos) para siguientes capas.
		next(); // Yo: continúa pipeline.
	} catch(error){
		return res.status(401).json({ success:false, mensaje: 'Token inválido' });
	}
}

function verificarPermiso(permisoRequerido){
	return (req,res,next) => {
		if(!req.usuario){ return res.status(401).json({success:false,mensaje:'Usuario no autenticado'}); }
		if(req.usuario.role === 'admin'){ return next(); } // Yo: admin tiene todo.
		if(req.usuario.permisos && Array.isArray(req.usuario.permisos)){
			if(!req.usuario.permisos.includes(permisoRequerido)){
				return res.status(403).json({success:false,mensaje:`No tenés permiso (${permisoRequerido})`});
			}
			return next();
		}
		if(req.usuario.role_id){
			const RoleModel = require('../models/RoleModel');
			const tienePermiso = RoleModel.usuarioTienePermiso(req.usuario.id, permisoRequerido);
			if(!tienePermiso){
				return res.status(403).json({success:false,mensaje:`No tenés permiso (${permisoRequerido})`});
			}
			return next();
		}
		return res.status(403).json({success:false,mensaje:'No tenés permisos asignados'});
	};
}
module.exports = { verificarAutenticacion, verificarPermiso };
```

**Decisión:** Mantengo compatibilidad con dos formas: permisos incluidos en token o consulta dinámica usando `RoleModel`.

## 6. CRUD de Productos (Ruta + Controlador + Modelo)
### Rutas `routes/productos.js` (Resumen funcional)
```javascript
router.get('/', ProductoController.listarProductos); // Yo: público, filtra activo y stock.
router.get('/admin/all', verificarAutenticacion, ProductoController.listarTodosLosProductos); // Yo: panel completo.
router.get('/:id', ProductoController.obtenerProductoPorId); // Yo: detalle público.
router.post('/', verificarAutenticacion, verificarPermiso('gestionar_productos'), ProductoController.crearProducto); // Crear.
router.put('/:id', verificarAutenticacion, verificarPermiso('gestionar_productos'), ProductoController.actualizarProducto); // Actualizar.
router.delete('/:id', verificarAutenticacion, verificarPermiso('gestionar_productos'), ProductoController.eliminarProducto); // Soft/hard delete.
```

### Controlador `controllers/ProductoController.js` (Explicación detallada)
```javascript
const ProductoModel = require('../models/ProductoModel'); // Yo: modelo con lógica SQL.

async function listarProductos(req,res){
	const { categoria, subcategoria } = req.query; // Yo: filtros opcionales.
	let productos = ProductoModel.obtenerProductos(); // Yo: activos + stock>0.
	if(categoria){ productos = productos.filter(p => p.categoria === categoria); }
	if(subcategoria){ productos = productos.filter(p => p.subcategoria === subcategoria); }
	return res.json({ success:true, productos }); // Yo: devuelvo lista.
}

async function listarTodosLosProductos(req,res){
	const productos = ProductoModel.obtenerTodosLosProductos(); // Yo: incluye inactivos.
	return res.json({ success:true, productos });
}

async function obtenerProductoPorId(req,res){
	const { id } = req.params;
	const producto = ProductoModel.obtenerProductoPorId(id); // Yo: consulta directa.
	if(!producto){ return res.status(404).json({success:false,mensaje:'Producto no encontrado'}); }
	return res.json({ success:true, producto });
}

async function crearProducto(req,res){
	const { nombre, categoria, subcategoria, precio, stock, descripcion, imagen_url, activo } = req.body;
	if(!nombre || !categoria || precio === undefined){ // Yo: validación básica.
		return res.status(400).json({success:false,mensaje:'Faltan datos obligatorios'});
	}
	const nuevo = ProductoModel.crearProducto({
		nombre,
		categoria,
		subcategoria: subcategoria || null,
		precio: parseFloat(precio), // Yo: normalizo tipos.
		stock: parseInt(stock) || 0,
		descripcion: descripcion || null,
		imagen_url: imagen_url || null,
		activo: activo !== undefined ? activo : true
	});
	return res.status(201).json({ success:true, mensaje:'Producto creado', producto:nuevo });
}

async function actualizarProducto(req,res){
	const { id } = req.params;
	const existente = ProductoModel.obtenerProductoPorId(id); // Yo: aseguro existencia.
	if(!existente){ return res.status(404).json({success:false,mensaje:'Producto no encontrado'}); }
	const { nombre, categoria, subcategoria, precio, stock, descripcion, imagen_url, activo } = req.body;
	const actualizado = ProductoModel.actualizarProducto(id, {
		nombre: nombre || existente.nombre,
		categoria: categoria || existente.categoria,
		subcategoria: subcategoria !== undefined ? subcategoria : existente.subcategoria,
		precio: precio !== undefined ? parseFloat(precio) : existente.precio,
		stock: stock !== undefined ? parseInt(stock) : existente.stock,
		descripcion: descripcion !== undefined ? descripcion : existente.descripcion,
		imagen_url: imagen_url !== undefined ? imagen_url : existente.imagen_url,
		activo: activo !== undefined ? activo : existente.activo
	});
	return res.json({ success:true, mensaje:'Producto actualizado', producto:actualizado });
}

async function eliminarProducto(req,res){
	const { id } = req.params; const { permanent } = req.query;
	const existente = ProductoModel.obtenerProductoPorId(id);
	if(!existente){ return res.status(404).json({success:false,mensaje:'Producto no encontrado'}); }
	if(permanent === 'true'){ // Yo: hard delete con transacción.
		const ok = ProductoModel.eliminarProductoPermanente(id);
		if(!ok){ return res.status(500).json({success:false,mensaje:'Error al eliminar definitivamente'}); }
		return res.json({ success:true, mensaje:'Producto eliminado definitivamente' });
	}
	const ok = ProductoModel.eliminarProducto(id); // Yo: soft delete (activo=0).
	if(!ok){ return res.status(500).json({success:false,mensaje:'Error al eliminar'}); }
	return res.json({ success:true, mensaje:'Producto eliminado (inactivo)' });
}
module.exports = { listarProductos, listarTodosLosProductos, obtenerProductoPorId, crearProducto, actualizarProducto, eliminarProducto };
```

### Modelo `models/ProductoModel.js` (Línea por línea en funciones clave)
```javascript
function obtenerProductos(){
	const db = getDB(); // Yo: abro conexión SQLite.
	const productos = db.prepare(`SELECT id,nombre,categoria,subcategoria,precio,stock,descripcion,imagen_url,activo FROM productos WHERE activo = 1 AND stock > 0 ORDER BY categoria, subcategoria, nombre`).all(); // Yo: filtro activo + stock>0.
	db.close();
	return productos.map(p => ({ ...p, activo:Boolean(p.activo), disponible: p.stock > 0 && Boolean(p.activo) })); // Yo: normalizo boolean y agrego flag.
}

function crearProducto(datos){
	const db = getDB();
	const stmt = db.prepare(`INSERT INTO productos (nombre,categoria,subcategoria,precio,stock,descripcion,imagen_url,activo) VALUES (?,?,?,?,?,?,?,?)`); // Yo: statement parametrizado.
	const result = stmt.run(datos.nombre, datos.categoria, datos.subcategoria||null, datos.precio, datos.stock||0, datos.descripcion||null, datos.imagen_url||null, datos.activo?1:0); // Yo: normalizo nulos y boolean.
	db.close();
	return { id: result.lastInsertRowid, ...datos, activo:Boolean(datos.activo) }; // Yo: devuelvo objeto creado.
}

function actualizarProducto(id, datos){
	const db = getDB();
	const stmt = db.prepare(`UPDATE productos SET nombre=?, categoria=?, subcategoria=?, precio=?, stock=?, descripcion=?, imagen_url=?, activo=? WHERE id=?`); // Yo: update completo.
	const result = stmt.run(datos.nombre, datos.categoria, datos.subcategoria||null, datos.precio, datos.stock, datos.descripcion||null, datos.imagen_url||null, datos.activo?1:0, id);
	db.close();
	if(result.changes === 0){ return null; } // Yo: no existía.
	return { id: parseInt(id), ...datos, activo:Boolean(datos.activo) };
}

function eliminarProducto(id){
	const db = getDB();
	const result = db.prepare(`UPDATE productos SET activo=0 WHERE id=?`).run(id); // Yo: soft delete.
	db.close();
	return result.changes>0;
}

function eliminarProductoPermanente(id){
	const db = getDB();
	try {
		db.prepare('BEGIN TRANSACTION').run(); // Yo: inicio transacción.
		const result = db.prepare(`DELETE FROM productos WHERE id=?`).run(id); // Yo: borro definitivo.
		db.prepare('COMMIT').run(); // Yo: confirmo.
		db.close();
		return result.changes>0;
	} catch(e){ db.prepare('ROLLBACK').run(); db.close(); throw e; }
}

function descontarStock(id,cantidad){
	const db = getDB();
	const producto = db.prepare('SELECT stock FROM productos WHERE id=?').get(id); // Yo: obtengo stock actual.
	if(!producto){ db.close(); throw new Error('Producto no encontrado'); }
	if(producto.stock < cantidad){ db.close(); throw new Error(`Stock insuficiente (disp: ${producto.stock}, req: ${cantidad})`); }
	const result = db.prepare(`UPDATE productos SET stock = stock - ? WHERE id = ? AND stock >= ?`).run(cantidad, id, cantidad); // Yo: atomicidad con WHERE.
	db.close();
	return result.changes>0; // Yo: true si se descontó.
}
```

**Atomicidad:** Explico siempre que el `WHERE stock >= ?` evita que dos operaciones simultáneas generen stock negativo.

## 7. Flujo de Compras (Controlador + Modelo)
### Controlador `controllers/CompraController.js` (Partes clave)
```javascript
async function crearCompra(req,res){
	const { comprador_nombre, comprador_telefono, comprador_mesa, metodo_pago, productos, detalles_pedido } = req.body; // Yo: obtengo datos.
	if(!comprador_nombre || !metodo_pago){ return res.status(400).json({success:false,mensaje:'Faltan datos'}); } // Yo: validación mínima.
	if(!['efectivo','transferencia'].includes(metodo_pago)){ return res.status(400).json({success:false,mensaje:'Método inválido'}); }
	if(metodo_pago === 'transferencia' && !req.file){ return res.status(400).json({success:false,mensaje:'Comprobante requerido'}); }
	let productosArray = typeof productos === 'string' ? JSON.parse(productos) : productos; // Yo: parseo JSON si viene string.
	if(!Array.isArray(productosArray) || productosArray.length===0){ return res.status(400).json({success:false,mensaje:'Sin productos'}); }
	for(const item of productosArray){ // Yo: validación de stock real.
		const producto = ProductoModel.obtenerProductoPorId(item.producto_id);
		if(!producto || !producto.activo){ return res.status(404).json({success:false,mensaje:`Producto ${item.producto_id} no disponible`}); }
		if(producto.stock < item.cantidad){ return res.status(400).json({success:false,mensaje:`Stock insuficiente para ${producto.nombre}`}); }
	}
	let total=0; const detalles = productosArray.map(item => { const prod = ProductoModel.obtenerProductoPorId(item.producto_id); const subtotal = prod.precio * item.cantidad; total += subtotal; return { producto_id:item.producto_id, cantidad:item.cantidad, precio_unitario:prod.precio, subtotal, nombre_producto:prod.nombre }; }); // Yo: recálculo total y snapshot.
	let comprobante_archivo = null; if(req.file){ comprobante_archivo = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`; } // Yo: guardo base64 si transferencia.
	const compra = CompraModel.crearCompra({ comprador_nombre, comprador_telefono: comprador_telefono||null, comprador_mesa: comprador_mesa?parseInt(comprador_mesa):null, metodo_pago, comprobante_archivo, total, detalles_pedido: detalles_pedido||null }, detalles); // Yo: transacción creación.
	for(const d of detalles){ try { ProductoModel.descontarStock(d.producto_id, d.cantidad); } catch(e){ console.error('Error descontando stock', e.message); } } // Yo: descuento stock luego (podría mover a misma transacción futura).
	return res.status(201).json({ success:true, mensaje:'Compra registrada', compra });
}
```

### Modelo `models/CompraModel.js` (Crear compra)
```javascript
function crearCompra(datosCompra, detallesCompra){
	const db = getDB();
	try {
		db.prepare('BEGIN TRANSACTION').run(); // Yo: inicio atomicidad compuesta.
		const numeroOrden = `SH-${Date.now()}`; // Yo: número único rápido.
		const resultCompra = db.prepare(`INSERT INTO compras (numero_orden, comprador_nombre, comprador_mesa, comprador_telefono, metodo_pago, comprobante_archivo, total, estado, detalles_pedido) VALUES (?,?,?,?,?,?,?,?,?)`).run(numeroOrden, datosCompra.comprador_nombre, datosCompra.comprador_mesa||null, datosCompra.comprador_telefono||null, datosCompra.metodo_pago, datosCompra.comprobante_archivo||null, datosCompra.total, 'pendiente', datosCompra.detalles_pedido||null);
		const compraId = resultCompra.lastInsertRowid; // Yo: id generado.
		const stmtDetalle = db.prepare(`INSERT INTO detalles_compra (compra_id, producto_id, cantidad, precio_unitario, subtotal, nombre_producto) VALUES (?,?,?,?,?,?)`);
		for(const d of detallesCompra){ stmtDetalle.run(compraId, d.producto_id, d.cantidad, d.precio_unitario, d.subtotal, d.nombre_producto||null); } // Yo: snapshot historial.
		db.prepare('COMMIT').run(); // Yo: confirmo.
		db.close();
		return { id: compraId, numero_orden: numeroOrden, ...datosCompra };
	} catch(e){ db.prepare('ROLLBACK').run(); db.close(); throw e; }
}
```

**Snapshot:** guardo `precio_unitario` y `nombre_producto` en detalles para auditoría futura si cambia precio o nombre.

## 8. CRUD de Usuarios + Perfil
### Controlador `UsuarioController` (fragmentos críticos)
```javascript
static async crearUsuario(req,res){
	const { username, password, nombre, telefono, role_id } = req.body; // Yo: datos básicos.
	if(!username || !password || !nombre || !role_id){ return res.status(400).json({success:false,mensaje:'Todos los campos son obligatorios'}); }
	const existente = db.prepare('SELECT id FROM usuarios WHERE username=?').get(username); // Yo: único.
	if(existente){ return res.status(400).json({success:false,mensaje:'Username ya existe'}); }
	const role = db.prepare('SELECT id,nombre FROM roles WHERE id=? AND activo=1').get(role_id); // Yo: rol válido.
	if(!role){ return res.status(400).json({success:false,mensaje:'Rol inválido'}); }
	const hashedPassword = bcrypt.hashSync(password,10); // Yo: hash seguro.
	const result = db.prepare(`INSERT INTO usuarios (username,password_hash,nombre_completo,telefono,role_id) VALUES (?,?,?,?,?)`).run(username, hashedPassword, nombre, telefono||null, role_id);
	return res.status(201).json({ success:true, usuario:{ id: result.lastInsertRowid, username, nombre, role_id, role_nombre: role.nombre } });
}

static async actualizarPerfil(req,res){
	const userId = req.user.userId; // Yo: ID desde JWT.
	const { nombre_completo, telefono, password } = req.body;
	const usuario = db.prepare('SELECT * FROM usuarios WHERE id=?').get(userId); // Yo: existencia.
	if(!usuario){ return res.status(404).json({success:false,mensaje:'Usuario no encontrado'}); }
	const updates=[]; const values=[];
	if(nombre_completo){ updates.push('nombre_completo = ?'); values.push(nombre_completo); }
	if(telefono !== undefined){ updates.push('telefono = ?'); values.push(telefono||null); }
	if(password){ const hash = bcrypt.hashSync(password,10); updates.push('password_hash = ?'); values.push(hash); }
	if(updates.length===0){ return res.status(400).json({success:false,mensaje:'No hay datos'}); }
	values.push(userId);
	db.prepare(`UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`).run(...values); // Yo: update dinámico.
	return res.json({ success:true, mensaje:'Perfil actualizado exitosamente' });
}
```

**Diferencia Perfil vs CRUD Admin:** El perfil usa endpoint separado `/api/usuarios/profile` sin requerir permiso especial; solo requiere estar autenticado. El CRUD completo (crear, listar otros usuarios, eliminar) exige permiso `gestionar_usuarios`.

## 9. Sistema de Roles y Permisos (Script de Setup)
### Script `scripts/setup-roles-permisos.js` (resumen lógico)
```javascript
// Creo tablas roles, permisos, roles_permisos si no existen.
// Agrego columna role_id a usuarios (ALTER TABLE defensivo, ignoro duplicado).
// Inserto roles base: admin, vendedor, visitador, comprador.
// Inserto permisos granulares agrupados por categoría.
// Asigno TODOS a admin; subconjuntos a cada rol según alcance.
// Actualizo usuario 'admin' existente para agregar role_id si no lo tenía.
// Verifico conteos finales (roles, permisos, relaciones) para asegurar integridad.
```

**Decisión:** Uso `INSERT OR IGNORE` para idempotencia: correr el script dos veces no duplica datos.

## 10. Mecanismo de Stock y Atomicidad
- Validación previa: consulto stock actual antes de descontar para mensaje claro.
- Descuento atómico: `UPDATE ... SET stock = stock - ? WHERE id = ? AND stock >= ?` garantiza que si el stock ya fue tomado por otra operación mi `changes` será 0 y puedo manejarlo.
- Evito condición de carrera sin bloqueos explícitos (optimistic concurrency control).

## 11. Estrategia de Errores y Respuestas
- Siempre respondo con `{ success: boolean, mensaje: string, ... }` para consistencia.
- Uso 400 para validación, 404 para inexistente, 401 para auth fallida, 403 para falta de permisos, 500 para errores inesperados.

## 12. Posibles Preguntas y Respuestas Breves
| Pregunta | Respuesta Resumida |
|----------|--------------------|
| ¿Cómo evito doble venta del último stock? | WHERE stock >= ? en UPDATE (atomicidad). |

| ¿Por qué guardo precio_unitario en detalles_compra? | Auditoría; si cambia el precio mantengo histórico. |

| ¿Por qué soft delete en productos? | Mantener referencias históricas y evitar inconsistencia. |

| ¿Qué pasa si falla descuento de stock después de crear compra? | Registro error; mejora futura: transacción conjunta o rollback. |

| ¿Por qué JWT y no sesiones? | Stateless, escalable, simple para API multi-cliente. |

| ¿Cómo agrego un permiso nuevo? | Insert en permisos, asignación en roles_permisos; el middleware lo toma automáticamente. |

| ¿Cómo valido rol vs permiso? | Primero admin bypass; luego array de permisos del token o consulta RoleModel. |

| ¿Qué diferencia hay entre perfil y usuario CRUD? | Perfil: sólo modifica sus datos; CRUD: admin gestiona terceros. |

## 13. Consultas SQL de Verificación Rápida
```sql
-- Usuarios con sus roles
SELECT u.username, r.nombre FROM usuarios u JOIN roles r ON u.role_id = r.id;
-- Productos activos y stock
SELECT id, nombre, stock, precio FROM productos WHERE activo = 1;
-- Última compra
SELECT * FROM compras ORDER BY fecha DESC LIMIT 1;
-- Permisos por rol
SELECT r.nombre, p.nombre FROM roles r JOIN roles_permisos rp ON r.id = rp.role_id JOIN permisos p ON p.id = rp.permiso_id ORDER BY r.nombre;
```

## 14. Mejoras Futuras (menciono si lo piden)
1. Unificar descuento de stock dentro de misma transacción de compra.
2. Paginación y filtros avanzados en listados.
3. Logs estructurados con Winston.
4. Rate limiting (evitar abuso de endpoints sensibles).
5. Tests automáticos (Jest + Supertest) para controladores y modelos.
6. Refresh tokens y expiración corta del access token.
7. Validación de esquema con Zod/Joi en capa de entrada.

## 15. Checklist Pre-Defensa
- BD inicializada y script de roles/permisos corrido.
- Usuario admin con role asignado.
- Endpoints de productos respondiendo (GET/POST/PUT/DELETE).
- Flujo compra probado (compra efectiva y transferencia con comprobante base64).
- Stock se descuenta y no permite negativos.
- Perfil actualiza nombre/teléfono/contraseña.
- Middleware de permisos responde 403 cuando corresponde.

## 16. Conclusión Personal
Yo estructuré el backend para que cada responsabilidad esté clara y defendible: modelos limpios, controladores enfocados, permisos explícitos, validaciones coherentes y garantías de integridad en puntos críticos (stock y snapshot de precios). Puedo navegar cualquier bloque y justificar cada decisión técnica.

---
> Fin del documento de estudio para la defensa. Todo aquí me permite responder rápido y con profundidad ante pedidos de “mostrar y explicar” cada parte del backend.
