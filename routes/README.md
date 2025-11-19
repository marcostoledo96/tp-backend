# Routes

Yo: aquí explico cómo están organizadas las rutas del backend y qué verifica cada una.

- `routes/auth.js`:
  - Rutas: `/api/auth/login` y `/api/auth/me`.
  - Yo: `login` llama a `AuthController.login` y devuelve token JWT.

- `routes/productos.js`:
  - Rutas públicas: `/api/productos` para listar productos.
  - Rutas protegidas (admin/vendedor): `/api/productos` POST, PUT, DELETE para CRUD.
  - Yo: siempre incluyo el header `Authorization: Bearer <token>` para endpoints protegidos.

- `routes/compras.js`:
  - Rutas para crear y gestionar compras. Verifica `verificarAutenticacion` y permisos según acción.
  - Yo: `POST /api/compras` valida stock antes de crear registro.

- `routes/roles.js`:
  - Rutas: listar roles, obtener rol por id, crear/actualizar/eliminar rol y listar permisos agrupados.
  - Yo: la ruta `GET /api/roles/permisos/all` facilita construir la UI de asignación de permisos.

- `routes/usuarios.js`:
  - CRUD de usuarios y cambio de password.
  - Yo: las rutas están protegidas para administradores en el middleware de rutas.

Consejo para pruebas manuales:
- Uso `node scripts/check-login-roles.js` para verificar que `admin`, `vendedor1` y `visitador1` devuelvan roles/permisos esperados.
- Para endpoints protegidos, agregá el header `Authorization` con el token obtenido en `/api/auth/login`.
