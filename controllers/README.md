# Controllers

Yo: este archivo describe brevemente los controladores más importantes del backend.

- `AuthController.js`:
  - Función `login(req, res)`: verifica credenciales, genera JWT y devuelve token junto con permisos.
  - `obtenerUsuarioActual(req, res)`: decodifica token y devuelve datos del usuario.
  - Yo: usé JWT y dejé los claims con `roles`, `role` y `permisos` para facilitar el acceso en frontend.

- `ProductoController.js`:
  - `listarProductos`: devuelve productos activos filtrables por categoría.
  - `crearProducto`, `actualizarProducto`, `eliminarProducto`: hacen validaciones de entrada y llaman al modelo.
  - Yo: me aseguré de validar precio >= 0 y stock >= 0 antes de persistir.

- `CompraController.js`:
  - `crearCompra`: recibe el carrito, valida stock contra la base de datos, calcula el total, crea la compra y descuenta stock.
  - `listarCompras`, `obtenerCompraPorId`, `actualizarEstadoCompra`, `eliminarCompra`: operaciones estándar con validaciones.
  - Yo: mantuve la lógica de validar stock antes de crear la compra y de descontar stock después.

- `UsuarioController.js`:
  - CRUD de usuarios. Yo: adapté las validaciones para "sin requisitos de contraseña" según lo solicitado.

- `RoleController.js`:
  - Maneja CRUD de roles y listado de permisos por categoría.
  - Yo: los endpoints retornan permisos agrupados para facilitar la UI.

Comentarios generales:
- Para entender un controlador, abrí el archivo correspondiente y busqué funciones exportadas.
- Cada controlador sigue la convención: validar `req.body`/`req.params`, llamar al modelo, manejar errores y devolver JSON con `success`.
