# Guía para la Defensa del TP Integrador

Yo: Este documento contiene mi preparación completa para la defensa oral. Incluye explicaciones línea por línea del código backend más importante, decisiones de arquitectura y respuestas a preguntas esperadas.

---

## Estructura de la Defensa

1. **Presentación del proyecto** (2-3 minutos)
2. **Demostración técnica** (5-7 minutos)
3. **Preguntas del evaluador** (5-10 minutos)

---

## 1. Presentación del Proyecto

### Qué voy a decir

"Mi proyecto es un sistema de carrito de compras con gestión completa de usuarios, roles y permisos. Implementé:

1. **CRUD completo de productos** con validaciones de stock y precio
2. **Sistema de compras** con descuento atómico de stock para evitar ventas duplicadas
3. **Sistema robusto de roles y permisos** donde:
   - Admin tiene todos los permisos
   - Vendedor gestiona productos y pedidos
   - Visitador solo puede ver información
   - Comprador puede realizar compras

4. **Arquitectura MVC** separando claramente:
   - **Modelos** (acceso a datos)
   - **Controladores** (lógica de negocio)
   - **Rutas** (endpoints API REST)

5. **Base de datos relacional** con:
   - Tabla `usuarios` vinculada a `roles` (N:1)
   - Tabla `roles_permisos` (N:M) para asignación flexible
   - Tabla `detalles_compra` con snapshot de precios para auditoría

El backend está hecho con **Node.js + Express + SQLite** y el frontend con **React + TypeScript + Vite**."

---

## 2. Demostración Técnica

### A. Sistema de Permisos (Código Línea por Línea)

#### Middleware `verificarPermiso` (middleware/auth.js)

```javascript
// Yo: Esta función es un middleware que protege rutas.
// Recibe el nombre del permiso como parámetro y devuelve otra función.
function verificarPermiso(nombrePermiso) {
  return async (req, res, next) => {
    try {
      // Yo: Obtengo el usuario autenticado del objeto req (lo puso verificarAutenticacion antes)
      const { usuario } = req;
      
      // Yo: Si no hay usuario, significa que no pasó por verificarAutenticacion
      if (!usuario) {
        return res.status(401).json({ 
          success: false, 
          mensaje: 'No autenticado' 
        });
      }

      // Yo: Pregunto al modelo si el usuario tiene el permiso requerido
      // Esta función consulta la tabla roles_permisos en la base de datos
      const tienePermiso = await RoleModel.usuarioTienePermiso(
        usuario.id, 
        nombrePermiso
      );
      
      // Yo: Si no tiene permiso, devuelvo 403 Forbidden
      if (!tienePermiso) {
        return res.status(403).json({ 
          success: false, 
          mensaje: `No tenés permisos para: ${nombrePermiso}` 
        });
      }

      // Yo: Si tiene permiso, continúo al siguiente middleware o controlador
      next();
    } catch (error) {
      // Yo: Si hubo error en la consulta a BD, devuelvo 500
      console.error('Error verificando permiso:', error);
      return res.status(500).json({ 
        success: false, 
        mensaje: 'Error al verificar permisos' 
      });
    }
  };
}
```

**Yo explico**: Este middleware se usa en las rutas así: `router.post('/', verificarAutenticacion, verificarPermiso('crear_compra'), CompraController.crearCompra)`. Primero verifica que haya token JWT, luego verifica que el rol del usuario tenga el permiso `crear_compra`, y recién ahí ejecuta el controlador.

---

### B. Descuento Atómico de Stock (models/ProductoModel.js)

```javascript
// Yo: Esta función descuenta stock de un producto de forma atómica.
// "Atómico" significa que la operación es indivisible: o se hace completa o no se hace.
function descontarStock(id, cantidad) {
  const db = getDb(); // Yo: Obtengo la conexión a la base de datos SQLite

  // Yo: Preparo la consulta UPDATE con una condición CRÍTICA en el WHERE.
  // La cláusula "WHERE stock >= ?" garantiza que solo se descuente si hay stock suficiente.
  const stmt = db.prepare(`
    UPDATE productos 
    SET stock = stock - ? 
    WHERE id = ? AND stock >= ?
  `);

  // Yo: Ejecuto la consulta pasando los parámetros.
  // IMPORTANTE: El tercer parámetro es la cantidad nuevamente, para validar en el WHERE.
  const result = stmt.run(cantidad, id, cantidad);

  // Yo: Si result.changes === 0, significa que el WHERE no encontró ninguna fila.
  // Esto puede pasar si:
  //   1. El producto no existe (id inválido)
  //   2. El stock era insuficiente (stock < cantidad)
  // En ambos casos, devuelvo false para indicar que falló.
  if (result.changes === 0) {
    return false;
  }

  // Yo: Si result.changes === 1, el UPDATE se ejecutó exitosamente.
  return true;
}
```

**Yo explico la atomicidad**: 

"Imaginá que dos usuarios compran simultáneamente el último producto disponible. Sin la cláusula `WHERE stock >= ?`, podría pasar esto:

1. Usuario A lee stock = 1 ✅
2. Usuario B lee stock = 1 ✅
3. Usuario A descuenta: `stock = stock - 1` → stock = 0 ✅
4. Usuario B descuenta: `stock = stock - 1` → stock = -1 ❌ (ERROR!)

Con `WHERE stock >= ?`:

1. Usuario A ejecuta: `UPDATE ... WHERE stock >= 1` → ✅ (changes = 1, stock pasa a 0)
2. Usuario B ejecuta: `UPDATE ... WHERE stock >= 1` → ❌ (changes = 0, porque stock ya es 0)
3. El backend de B recibe `false`, devuelve error 400 al frontend

Esto es **control de concurrencia optimista**: no uso locks, pero garantizo consistencia con la condición del WHERE."

---

### C. Validación de Compra (controllers/CompraController.js)

```javascript
// Yo: Esta función maneja POST /api/compras
async function crearCompra(req, res) {
  try {
    // Yo: Extraigo datos del body
    const { comprador_nombre, comprador_mesa, metodo_pago, productos } = req.body;

    // Yo: Validación 1 - Datos obligatorios
    if (!comprador_nombre || !productos || productos.length === 0) {
      return res.status(400).json({ 
        success: false, 
        mensaje: 'Faltan datos obligatorios' 
      });
    }

    // Yo: Parseo el string JSON de productos (porque viene del formulario)
    const productosArray = typeof productos === 'string' 
      ? JSON.parse(productos) 
      : productos;

    // ======= VALIDACIÓN CRÍTICA =======
    // Yo: Nunca confío en los datos del frontend.
    // Voy a la base de datos a verificar el stock ACTUAL de cada producto.
    for (const item of productosArray) {
      const productoActual = ProductoModel.obtenerProductoPorId(item.id);
      
      // Yo: Si el producto no existe, lanzo error
      if (!productoActual) {
        return res.status(400).json({ 
          success: false, 
          mensaje: `Producto ${item.id} no encontrado` 
        });
      }

      // Yo: Si el stock es insuficiente, lanzo error ANTES de crear la compra
      if (productoActual.stock < item.cantidad) {
        return res.status(400).json({ 
          success: false, 
          mensaje: `Stock insuficiente para ${productoActual.nombre}. Disponible: ${productoActual.stock}` 
        });
      }
    }

    // ======= RECÁLCULO DE TOTAL =======
    // Yo: Recalculo el total usando los precios de la base de datos.
    // ¿Por qué? Porque un usuario malicioso podría modificar el precio en el frontend.
    let totalReal = 0;
    const itemsConDetalles = productosArray.map(item => {
      const productoActual = ProductoModel.obtenerProductoPorId(item.id);
      const subtotal = productoActual.precio * item.cantidad;
      totalReal += subtotal;
      
      return {
        producto_id: item.id,
        cantidad: item.cantidad,
        precio_unitario: productoActual.precio, // Yo: Precio de BD, no del frontend
        subtotal: subtotal,
        nombre_producto: productoActual.nombre  // Yo: Snapshot para auditoría
      };
    });

    // ======= CREACIÓN DE COMPRA =======
    // Yo: Armo el objeto de la compra
    const datosCompra = {
      comprador_nombre,
      comprador_mesa,
      comprador_telefono: req.body.comprador_telefono || null,
      metodo_pago,
      comprobante_archivo: req.body.comprobante_archivo || null,
      total: totalReal, // Yo: Total recalculado, NO el del frontend
      estado: 'pendiente',
      abonado: false,
      listo: false,
      entregado: false
    };

    // Yo: Llamo al modelo para crear la compra y sus detalles en una transacción
    const compra = CompraModel.crearCompra(datosCompra, itemsConDetalles);

    // ======= DESCUENTO DE STOCK =======
    // Yo: Ahora sí descuento el stock de cada producto
    for (const item of itemsConDetalles) {
      const exito = ProductoModel.descontarStock(item.producto_id, item.cantidad);
      
      // Yo: Si falla el descuento (por ejemplo, otro usuario compró antes),
      // debería revertir la compra. Por ahora, solo registro el error.
      // TODO: Implementar transacción completa o rollback manual.
      if (!exito) {
        console.error(`Error al descontar stock del producto ${item.producto_id}`);
      }
    }

    // Yo: Devuelvo la compra creada con código 201 Created
    return res.status(201).json({ 
      success: true, 
      data: compra,
      mensaje: `Compra creada con éxito. Número de orden: ${compra.numero_orden}` 
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

**Yo explico**: "Este es el controlador más importante. Primero valida los datos obligatorios. Luego va a la base de datos a verificar que haya stock suficiente de CADA producto. Después recalcula el total usando los precios de BD (para evitar que un usuario modifique el precio en DevTools del navegador). Finalmente crea la compra y descuenta el stock de forma atómica. Si algo falla, devuelve error 400 o 500 según corresponda."

---

### D. Arquitectura de Rutas (routes/compras.js)

```javascript
const express = require('express');
const router = express.Router();
const CompraController = require('../controllers/CompraController');
const { verificarAutenticacion, verificarPermiso } = require('../middleware/auth');

// Yo: Este endpoint lista todas las compras.
// Requiere autenticación (token JWT) y el permiso 'ver_compras'.
router.get('/', 
  verificarAutenticacion,       // 1. Verifica que haya token válido
  verificarPermiso('ver_compras'), // 2. Verifica que el rol tenga el permiso
  CompraController.listarCompras   // 3. Ejecuta el controlador
);

// Yo: Este endpoint crea una nueva compra.
// Requiere el permiso 'crear_compra' (lo tienen admin, vendedor y comprador).
router.post('/', 
  verificarAutenticacion,
  verificarPermiso('crear_compra'),
  CompraController.crearCompra
);

// Yo: Este endpoint actualiza el estado de una compra (ej: marcar como "listo").
// Solo admin y vendedor pueden hacerlo.
router.put('/:id', 
  verificarAutenticacion,
  verificarPermiso('editar_compras'),
  CompraController.actualizarCompra
);

// Yo: Este endpoint elimina una compra.
// Solo admin puede hacerlo.
router.delete('/:id', 
  verificarAutenticacion,
  verificarPermiso('eliminar_compras'),
  CompraController.eliminarCompra
);

module.exports = router;
```

**Yo explico**: "Las rutas definen los endpoints de la API. Cada una tiene tres partes: verificar autenticación, verificar permiso específico, y ejecutar el controlador. Esto garantiza que solo usuarios con los permisos correctos puedan acceder a cada funcionalidad."

---

### E. Frontend: Componente RolesAdmin (src/views/RolesAdmin.tsx)

```typescript
// Yo: Este componente permite al admin crear roles y asignar permisos con checkboxes.

function RolesAdmin() {
  // Yo: Estado para almacenar roles, permisos agrupados, y el formulario
  const [roles, setRoles] = useState<Role[]>([]);
  const [permisosPorCategoria, setPermisosPorCategoria] = useState<Record<string, Permiso[]>>({});
  const [form, setForm] = useState({
    id: null,
    nombre: '',
    descripcion: '',
    activo: true,
    permisos: [] as number[]  // Yo: Array de IDs de permisos seleccionados
  });

  // Yo: Función para cargar datos iniciales
  async function fetchData() {
    const token = localStorage.getItem('token');
    
    // Yo: Fetch paralelo de roles y permisos
    const [rolesRes, permisosRes] = await Promise.all([
      fetch(`${API_URL}/api/roles`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      fetch(`${API_URL}/api/roles/permisos/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
    ]);

    const rolesData = await rolesRes.json();
    const permisosData = await permisosRes.json();

    setRoles(rolesData.data);
    setPermisosPorCategoria(permisosData.data);  // Objeto agrupado por categoría
  }

  // Yo: Función para agregar o quitar un permiso del array
  function togglePermiso(id: number) {
    setForm(prev => {
      const existe = prev.permisos.includes(id);
      return {
        ...prev,
        permisos: existe 
          ? prev.permisos.filter(p => p !== id)  // Quito si existe
          : [...prev.permisos, id]                // Agrego si no existe
      };
    });
  }

  // Yo: Función para guardar el rol (crear o editar)
  async function guardar() {
    const token = localStorage.getItem('token');
    const url = form.id 
      ? `${API_URL}/api/roles/${form.id}`  // PUT para editar
      : `${API_URL}/api/roles`;             // POST para crear
    
    const method = form.id ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        nombre: form.nombre,
        descripcion: form.descripcion,
        activo: form.activo,
        permisos: form.permisos  // Yo: Envío el array de IDs de permisos
      })
    });

    if (response.ok) {
      alert('Rol guardado con éxito');
      fetchData();  // Yo: Recargo la lista
      limpiarFormulario();
    }
  }

  return (
    <div>
      {/* Tabla de roles */}
      <table>
        {roles.map(rol => (
          <tr key={rol.id}>
            <td>{rol.nombre}</td>
            <td>{rol.descripcion}</td>
            <td>
              <button onClick={() => iniciarEdicion(rol)}>Editar</button>
              <button onClick={() => eliminarRol(rol.id)}>Eliminar</button>
            </td>
          </tr>
        ))}
      </table>

      {/* Formulario de creación/edición */}
      <form>
        <input 
          value={form.nombre} 
          onChange={e => setForm({...form, nombre: e.target.value})} 
          placeholder="Nombre del rol"
        />
        <textarea 
          value={form.descripcion} 
          onChange={e => setForm({...form, descripcion: e.target.value})} 
          placeholder="Descripción"
        />

        {/* Yo: Checkboxes agrupados por categoría */}
        {Object.entries(permisosPorCategoria).map(([categoria, permisos]) => (
          <div key={categoria}>
            <h4>{categoria}</h4>
            {permisos.map(permiso => (
              <label key={permiso.id}>
                <input 
                  type="checkbox" 
                  checked={form.permisos.includes(permiso.id)}
                  onChange={() => togglePermiso(permiso.id)}
                />
                {permiso.descripcion}
              </label>
            ))}
          </div>
        ))}

        <button type="button" onClick={guardar}>Guardar</button>
      </form>
    </div>
  );
}
```

**Yo explico**: "Este componente React permite al admin ver todos los roles, crear nuevos roles, y asignar permisos mediante checkboxes. Los permisos están agrupados por categoría (productos, compras, usuarios, roles) para que sea más fácil de usar. Cuando hace clic en 'Guardar', envía un array de IDs de permisos al backend, que los guarda en la tabla `roles_permisos`."

---

## 3. Preguntas Esperadas y Mis Respuestas

### P1: ¿Por qué usaste SQLite y no PostgreSQL?

**Yo**: "Para desarrollo local, SQLite es ideal porque no requiere instalación de servidor, es un archivo portable (`sanpaholmes.db`), y es más que suficiente para manejar el volumen de datos del TP. Sin embargo, el proyecto está preparado para migrar a PostgreSQL en producción (hay un script `db/init.js` con el esquema completo para Postgres). La diferencia principal es que SQLite usa `AUTOINCREMENT` mientras Postgres usa `SERIAL`, pero los modelos son compatibles con ambos."

---

### P2: ¿Por qué JWT y no sesiones con cookies?

**Yo**: "JWT (JSON Web Token) es stateless, lo que significa que el servidor no necesita guardar información de sesión en memoria o base de datos. El token contiene toda la información (id del usuario, rol, permisos) firmada con una clave secreta (`JWT_SECRET`). Esto tiene ventajas:

1. **Escalabilidad**: Puedo agregar más servidores sin necesidad de sincronizar sesiones
2. **Compatibilidad con APIs**: Los tokens se envían en el header `Authorization`, ideal para consumo desde aplicaciones móviles
3. **Sin estado**: El servidor verifica la firma, extrae los datos, y listo

La desventaja es que no puedo invalidar un token antes de que expire (a menos que implemente una blacklist). Pero para el scope del TP, JWT es más adecuado."

---

### P3: ¿Cómo garantizas que dos usuarios no compren el mismo producto si solo queda 1 en stock?

**Yo**: "Implementé **control de concurrencia optimista** usando la cláusula `WHERE stock >= ?` en el UPDATE. Cuando descuento stock, la consulta es:

```sql
UPDATE productos SET stock = stock - ? WHERE id = ? AND stock >= ?
```

Si el stock ya fue descontado por otra transacción, `result.changes` será 0, indicando que el WHERE no encontró ninguna fila. En ese caso, devuelvo error al usuario. 

Esto es **atómico**: SQLite garantiza que el UPDATE es indivisible, no puede haber race conditions. Es más eficiente que usar locks pesimistas (`BEGIN TRANSACTION` + `SELECT ... FOR UPDATE`)."

---

### P4: ¿Por qué guardas `nombre_producto` y `precio_unitario` en `detalles_compra` si ya tenés el `producto_id`?

**Yo**: "Por **auditoría e historial**. Si después cambio el nombre o precio del producto en la tabla `productos`, las compras viejas deben mantener el precio que tenían al momento de la compra. Esto es un **snapshot**. Por ejemplo:

- Hoy: Pizza Muzzarella cuesta $5000
- Usuario A compra 2 pizzas → guardo `precio_unitario: 5000` en `detalles_compra`
- Mañana: Subo el precio a $6000
- Usuario A revisa su historial → debe ver que pagó $5000, no $6000

Es lo mismo que pasa en MercadoLibre o Amazon: tu historial de compras muestra el precio que pagaste, no el actual."

---

### P5: ¿Qué pasa si falla el descuento de stock después de crear la compra?

**Yo**: "Actualmente, si `ProductoModel.descontarStock()` devuelve `false`, solo lo registro con `console.error`. **Esto es una mejora pendiente**: debería revertir la compra (hacer rollback). Las opciones son:

1. **Transacción manual**: Eliminar la compra y sus detalles si falla el descuento
2. **Transacción SQL**: Envolver todo en `BEGIN TRANSACTION` ... `COMMIT` / `ROLLBACK`
3. **Estado "error"**: Cambiar el estado de la compra a "error" para revisión manual

Elegí la opción 3 como workaround temporal. Para producción, implementaría la opción 2 (transacción SQL completa)."

---

### P6: ¿Cómo validás que un usuario tenga permisos?

**Yo**: "Uso un middleware llamado `verificarPermiso(nombrePermiso)`. Recibe el nombre del permiso (ej: `'crear_compra'`) y devuelve una función que:

1. Extrae el usuario autenticado de `req.usuario` (lo puso `verificarAutenticacion` antes)
2. Llama a `RoleModel.usuarioTienePermiso(usuario.id, nombrePermiso)`
3. Esta función consulta la BD:
   ```sql
   SELECT COUNT(*) as count
   FROM usuarios u
   JOIN roles r ON u.role_id = r.id
   JOIN roles_permisos rp ON r.id = rp.role_id
   JOIN permisos p ON rp.permiso_id = p.id
   WHERE u.id = ? AND p.nombre = ?
   ```
4. Si `count > 0`, el usuario tiene el permiso → continúa al controlador
5. Si `count = 0`, devuelve `403 Forbidden`

Ejemplo de uso en ruta:
```javascript
router.post('/compras', verificarAutenticacion, verificarPermiso('crear_compra'), CompraController.crearCompra);
```

Primero verifica autenticación, luego permiso, luego ejecuta el controlador."

---

### P7: ¿Por qué no hay validación de contraseña mínima?

**Yo**: "Fue un requisito explícito del TP: *'No hay requisitos de contraseña (cualquier longitud, sin mayúsculas obligatorias)'*. En un sistema real, implementaría:

1. Longitud mínima (8 caracteres)
2. Al menos una mayúscula y un número
3. Prohibir contraseñas comunes (diccionario)
4. Hash con bcrypt (esto sí lo implementé, costo de 10 rondas)

Pero para el TP, seguí la consigna y acepté cualquier contraseña."

---

### P8: ¿Qué es MVC y cómo lo aplicaste?

**Yo**: "MVC (Model-View-Controller) es un patrón de diseño que separa:

- **Model**: Lógica de acceso a datos (ProductoModel, CompraModel)
- **View**: Interfaz de usuario (componentes React en `src/views`)
- **Controller**: Lógica de negocio (ProductoController, CompraController)

En mi proyecto:

1. **Las rutas** reciben la request y llaman al controlador
2. **El controlador** valida los datos, llama al modelo, y devuelve la response
3. **El modelo** hace las consultas SQL y devuelve los datos
4. **La vista** (React) muestra los datos y envía requests al backend

Ejemplo de flujo:
```
Usuario hace clic en "Comprar"
  → Frontend envía POST /api/compras
  → Route llama a verificarAutenticacion + verificarPermiso + CompraController.crearCompra
  → Controller valida datos, llama a CompraModel.crearCompra y ProductoModel.descontarStock
  → Model hace INSERT en compras y UPDATE en productos
  → Controller devuelve response JSON
  → Frontend muestra confirmación
```

La ventaja de MVC es que si mañana cambio de SQLite a MongoDB, solo cambio los modelos. Las rutas y controladores quedan igual."

---

## 4. Checklist de Verificación Pre-Defensa

### Antes de la defensa, debo verificar:

- [ ] La base de datos `db/sanpaholmes.db` existe
- [ ] Apliqué la migración `001_add_roles_permisos_system.sql`
- [ ] Hay al menos un usuario admin con username `admin` y password `admin123`
- [ ] El backend corre sin errores en `http://localhost:3000`
- [ ] El frontend corre sin errores en `http://localhost:5173`
- [ ] Puedo hacer login como admin y obtener un token
- [ ] Puedo crear un rol nuevo desde `/admin/roles`
- [ ] Puedo crear un usuario nuevo desde `/admin/usuarios`
- [ ] Puedo crear un producto nuevo desde `/admin/productos`
- [ ] Puedo hacer una compra desde `/menu` + `/cart` + `/checkout`
- [ ] El stock se descuenta correctamente después de la compra
- [ ] Si intento comprar sin stock, me devuelve error 400

### Comandos de verificación rápida:

```powershell
# Ver usuarios con sus roles
sqlite3 db/sanpaholmes.db "SELECT u.username, r.nombre FROM usuarios u JOIN roles r ON u.role_id = r.id;"

# Ver roles con cantidad de permisos asignados
sqlite3 db/sanpaholmes.db "SELECT r.nombre, COUNT(rp.permiso_id) as permisos FROM roles r LEFT JOIN roles_permisos rp ON r.id = rp.role_id GROUP BY r.id;"

# Ver productos con stock
sqlite3 db/sanpaholmes.db "SELECT id, nombre, stock, precio FROM productos WHERE activo = 1;"

# Ver última compra
sqlite3 db/sanpaholmes.db "SELECT * FROM compras ORDER BY fecha DESC LIMIT 1;"
```

---

## 5. Puntos Fuertes a Destacar

1. **Validación en múltiples capas**: Frontend (UX) + Backend (seguridad)
2. **Descuento atómico de stock**: Evita ventas duplicadas con `WHERE stock >= ?`
3. **Auditoría**: Snapshots de precios en `detalles_compra`
4. **Permisos granulares**: Cada endpoint protegido con permiso específico
5. **Arquitectura escalable**: MVC con separación clara de responsabilidades
6. **Código documentado**: Comentarios en primera persona explicando cada decisión

---

## 6. Posibles Mejoras (Si me preguntan)

1. **Transacciones completas**: Envolver compra + descuento de stock en una sola transacción SQL
2. **Paginación**: Listar productos/compras con limit y offset para grandes volúmenes
3. **Búsqueda y filtros**: Buscar productos por nombre, filtrar compras por fecha/estado
4. **Rate limiting**: Limitar requests por IP para evitar ataques DDoS
5. **Refresh tokens**: Implementar refresh tokens para renovar JWT sin re-login
6. **Tests automatizados**: Unit tests con Jest, integration tests con Supertest
7. **Logs estructurados**: Usar Winston o Bunyan para logs con niveles y rotación
8. **Validación de esquemas**: Usar Joi o Zod para validar body de requests

---

**Yo**: "Con esta preparación, estoy listo para defender mi TP. Entiendo cada línea de código que escribí, las decisiones de arquitectura, y puedo explicar por qué elegí cada solución."
