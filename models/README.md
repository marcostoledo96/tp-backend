# Models

Yo: este archivo explica los modelos clave y su propósito.

- `database.js`:
  - Provee `getDB()` para acceder a SQLite (archivo local) y manejar conexiones.
  - Yo: lo uso en todos los modelos para ejecutar consultas sincronas con `better-sqlite3`.

- `UsuarioModel.js`:
  - `obtenerUsuarioPorUsername(username)`: busca el usuario activo junto con su rol.
  - `existeUsuario`, `obtenerEstadisticasUsuarios`: utilidades para reportes y validaciones.
  - Yo: mantengo las consultas simples y cierro la conexión después de cada operación.

- `RoleModel.js`:
  - CRUD de roles y funciones para asignar permisos.
  - `obtenerPermisosUsuario(userId)`: devuelve permisos efectivos del usuario según su rol.
  - Yo: diseñé las consultas para ser determinísticas y retornar estructuras listas para el frontend.

- `ProductoModel.js`:
  - Funciones para `obtenerProductoPorId`, `crearProducto`, `actualizarProducto`, `descontarStock`.
  - La función `descontarStock` usa `UPDATE ... WHERE stock >= ?` para evitar stocks negativos.
  - Yo: dejé esa comprobación crítica para mantener integridad en concurrencia baja-mediana.

- `CompraModel.js`:
  - Guarda la compra y sus detalles, y retorna el objeto con `id` y `numero_orden`.
  - Yo: guardo snapshot de los detalles (nombre, precio) para auditoría futura.

Notas:
- Los modelos usan transacciones simples (BEGIN/COMMIT) donde es necesario.
- Si necesitás migraciones adicionales, revisá `db/migrations/` y `db/init.js`.
