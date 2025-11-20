# Guía de Pruebas Manuales

> Objetivo: Validar que todos los flujos descritos en `tp.md` funcionan correctamente en el backend. Cada caso incluye: propósito, precondiciones, datos, pasos y resultados esperados. Ejecutar en orden recomendado para minimizar dependencias.
>
> Convención de respuestas esperadas JSON: `{ success: boolean, mensaje?: string, ... }`.
>
> Herramientas sugeridas: `curl` (PowerShell), `Invoke-RestMethod`, o cliente HTTP (Insomnia/Postman). Para Windows PowerShell se muestran ambos.

## 0. Preparación Inicial
1. Instalar dependencias si no se hizo:
   ```powershell
   npm install
   ```
2. Correr migraciones / inicialización (según tu proyecto):
   ```powershell
   node db/init.js; node scripts/setup-roles-permisos.js
   ```
3. Verificar conexión:
   ```powershell
   node db/test-connection.js
   ```
4. Crear / verificar usuarios base (admin, vendedor1, visitador1, comprador1) según script de prueba:
   ```powershell
   node scripts/crear-usuarios-prueba.js
   ```
5. Iniciar servidor (si se usa Vite para frontend separado, primero backend):
   ```powershell
   node server.js
   ```

## 1. Autenticación (Login / Logout)
### 1.1 Login exitoso (admin)
- Endpoint: `POST /api/auth/login`
- Datos: `{ "username": "admin", "password": "<pass_admin>" }`
- Pasos:
  ```powershell
  curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}'
  ```
- Esperado: `success:true`, token JWT, incluye role = `admin`.

### 1.2 Login fallido (password incorrecta)
- Cambiar password a errónea.
- Esperado: `success:false`, status 401 o 400 (según implementación), mensaje credenciales inválidas.

### 1.3 Login otros roles (vendedor / visitador / comprador)
- Verificar cada uno devuelve role correcto y permisos asociados si se incluyen.

### 1.4 Logout (si existe endpoint o lógica cliente)
- Si hay endpoint `/api/auth/logout` (o simplemente desechar token en cliente). Verificar invalidez de token expirado manualmente (cambiar un carácter → debe dar 401 en endpoint privado).

## 2. Roles y Permisos
### 2.1 Ver listado de roles
- Endpoint: `GET /api/roles` (según rutas reales).
- Token: vendedor vs visitador.
- Esperado: visitador con permiso de solo lectura obtiene lista; si no tiene permiso, 403.

### 2.2 Asignar nuevo permiso a un rol
- Endpoint (ejemplo): `POST /api/roles/:id/permisos`.
- Datos: `{ "permiso_id": <id_permiso_nuevo> }`.
- Verificar que después el rol puede acceder a endpoint previamente bloqueado.

### 2.3 Acceso restringido sin permiso
- Usar token de `visitador` para endpoint que requiere `gestionar_productos`.
  ```powershell
  curl http://localhost:3000/api/productos/admin/all -H "Authorization: Bearer <TOKEN_VISITADOR>"
  ```
- Esperado: 403.

## 3. CRUD Productos
### 3.1 Crear producto válido
- Endpoint: `POST /api/productos`
- Token: admin o vendedor con `gestionar_productos`.
- Datos:
  ```json
  {"nombre":"Café","categoria":"Bebidas","subcategoria":"Calientes","precio":450,"stock":20,"descripcion":"Café tostado","activo":true}
  ```
- Esperado: 201, objeto con id.

### 3.2 Validación campos obligatorios
- Omitir `nombre` o `precio`.
- Esperado: 400, mensaje de error.

### 3.3 Precio negativo
- Enviar `precio:-10`.
- Si no hay validación explícita en modelo, debería rechazarse (si se implementa). Confirmar comportamiento. Documentar real vs esperado.

### 3.4 Stock negativo
- Enviar `stock:-5`. Debe rechazarse. Si se permite, marcar incidencia.

### 3.5 Listado público
- `GET /api/productos`
- Verifica que sólo salen `activo=1` y `stock>0`.

### 3.6 Actualizar producto
- `PUT /api/productos/:id` cambiando `precio` y `stock`.
- Esperado: `success:true`, nuevo objeto.

### 3.7 Soft delete producto
- `DELETE /api/productos/:id`
- Esperado: mensaje "Producto eliminado (inactivo)".
- Confirmar no aparece en `GET /api/productos` pero sí en `/admin/all`.

### 3.8 Hard delete producto
- `DELETE /api/productos/:id?permanent=true`
- Esperado: mensaje definitivo.
- Confirmar desaparición total incluso en listado admin.

### 3.9 Descuento de stock en compra
- Crear compra y luego consultar producto para ver stock reducido.

### 3.10 Imagen de producto (si endpoint implementado)
- Subir archivo vía multipart form-data (ver controlador correspondiente si existe). Validar retorno `imagen_url`.

## 4. Flujo de Compra (Efectivo)
### 4.1 Crear compra efectivo
- Endpoint: `POST /api/compras`
- Datos ejemplo productos:
  ```json
  {
    "comprador_nombre":"Juan",
    "metodo_pago":"efectivo",
    "productos":[{"producto_id":1,"cantidad":2},{"producto_id":2,"cantidad":1}],
    "detalles_pedido":"Sin azúcar"
  }
  ```
- Esperado: 201, estado inicial `pendiente`, total = suma precios actuales * cantidades.

### 4.2 Validar stock insuficiente
- Enviar cantidad mayor a stock. Esperado: 400 con mensaje claro.

### 4.3 Producto inactivo
- Usar producto soft-deleted. Esperado: 404/400 según lógica con mensaje no disponible.

### 4.4 Detalles de compra
- `GET /api/compras/:id` → Ver `detalles_compra` con `precio_unitario` y `nombre_producto` snapshot.

## 5. Flujo de Compra (Transferencia)
### 5.1 Crear compra transferencia con comprobante
- Enviar multipart con campo `comprobante` (archivo) + JSON de compra.
- Esperado: `comprobante_archivo` base64 presente.

### 5.2 Crear compra transferencia sin comprobante
- Omitir archivo. Esperado: 400 "Comprobante requerido".

## 6. Cambio de Estado Compra
### 6.1 Actualizar estado
- Endpoint (ejemplo): `PUT /api/compras/:id/estado`
- Datos: `{ "estado":"abonado" }`
- Token: rol con `editar_compras`.
- Esperado: estado cambiado.

### 6.2 Estado inválido
- Enviar estado no permitido. Esperado: 400.

## 7. Eliminación de Compra
### 7.1 Eliminar compra
- `DELETE /api/compras/:id`
- Token: permiso `eliminar_compras`.
- Esperado: éxito y no aparece en listado.

## 8. Estadísticas de Compras
### 8.1 Consultar endpoint estadísticas
- Endpoint (ejemplo): `GET /api/compras/estadisticas`
- Token: permiso `ver_compras`.
- Esperado: totales, montos agrupados, etc. (Según implementación real).

## 9. Perfil de Usuario
### 9.1 Actualizar perfil
- Endpoint: `PUT /api/usuarios/profile`
- Datos: `{ "nombre_completo":"Admin Nuevo","telefono":"123456" }`
- Token: del usuario propio.
- Esperado: mensaje éxito.

### 9.2 Cambiar contraseña
- Datos: `{ "password":"NuevaPass123" }`
- Luego intentar login con nueva contraseña (debe funcionar) y con antigua (fallar).

## 10. CRUD Usuarios (Admin)
### 10.1 Crear usuario
- `POST /api/usuarios` con datos válidos.
- Esperado: 201 con id.

### 10.2 Username duplicado
- Repetir mismo `username`. Esperado: 400.

### 10.3 Eliminar usuario no admin principal
- `DELETE /api/usuarios/:id`
- Esperado: éxito.

### 10.4 Intentar eliminar admin principal
- Esperado: 400/403 según lógica, mensaje de restricción.

## 11. Permisos Dinámicos en Token
### 11.1 Endpoint protegido con nuevo permiso
- Añadir permiso nuevo vía script o inserción manual.
- Asignarlo a rol.
- Login nuevamente → token actualizado (si token incluye permisos).
- Probar endpoint dependiente.

## 12. Concurrencia de Stock (Prueba Manual Simulada)
### 12.1 Simular dos compras simultáneas del último ítem
- Reducir stock de producto a 1.
- Preparar dos requests casi simultáneos (ejecutar rápidamente en dos ventanas). Uno debería resultar en éxito, el otro en error por stock insuficiente o no descontar (changes=0).
- Esperado: nunca stock negativo.

## 13. Migraciones / Verificación de Esquema
### 13.1 Ejecutar script de verificación
- `node scripts/verify-migration.js` (o similar disponible).
- Esperado: confirma columnas y tablas.

### 13.2 Script de setup idempotente
- Correr nuevamente `node scripts/setup-roles-permisos.js`.
- Esperado: no duplica roles/permisos.

## 14. Carrito (Validaciones Previas a Compra)
### 14.1 Cantidad mayor al stock
- Armar payload con cantidad > stock.
- Esperado: 400.

### 14.2 Producto inactivo en carrito
- Incluir producto previamente soft-deleted.
- Esperado: error indicando no disponible.

## 15. Archivo Comprobante (Transferencia)
### 15.1 Validar Base64
- En compra transferencia exitosa, verificar que `comprobante_archivo` empieza con `data:`.

## 16. Logs y Manejo de Errores
### 16.1 Forzar error inesperado
- Editar temporalmente (local) un producto id inexistente en compra.
- Esperado: 404 claro.

## 17. Hard Delete vs Soft Delete Productos
### 17.1 Confirmar integridad
- Crear producto, generar compra que lo referencia.
- Intentar hard delete producto usado (dependiendo de constraints). Documentar resultado real y decisión (ideal: bloquear hard delete si FK).

## 18. Formato Respuestas Consistente
### 18.1 Verificar que todos endpoints devuelven `success`.
- Recorrer los endpoints críticos y validar propiedad.

## 19. Checklist Final de Validación
- [ ] Login múltiple roles ok
- [ ] Permisos restringen acceso correctamente (403)
- [ ] Crear/actualizar/eliminar producto (soft/hard)
- [ ] Filtrado público excluye inactivos y stock 0
- [ ] Compra efectivo registra y descuenta stock
- [ ] Compra transferencia exige comprobante base64
- [ ] Estadísticas responden datos agregados
- [ ] Perfil actualiza con nuevos datos y password
- [ ] Usuario nuevo creado y login funciona
- [ ] Stock nunca negativo en simulación concurrencia
- [ ] Script roles/permisos idempotente
- [ ] Detalles compra guardan snapshot precios
- [ ] Soft delete conserva historial de compra

## 20. Ejemplos de Comandos (PowerShell Invoke-RestMethod)
```powershell
$headers = @{"Authorization"="Bearer <TOKEN>"}
Invoke-RestMethod -Method GET -Uri http://localhost:3000/api/productos -Headers $headers
Invoke-RestMethod -Method POST -Uri http://localhost:3000/api/productos -Headers $headers -Body '{"nombre":"Té","categoria":"Bebidas","precio":300,"stock":10}' -ContentType 'application/json'
```

## 21. Notas y Observaciones
- Si alguna validación (precio negativo / stock negativo) no responde con 400 y permite la creación, registrar incidencia y decidir si se corrige antes de la defensa.
- Para pruebas de concurrencia reales podría usarse un script que dispare múltiples requests en paralelo (no incluido aquí por ser manual).
- Guardar capturas de: login roles distintos, producto antes y después de compra, estado compra cambiado, comprobante base64.

## 22. Próximas Mejoras para Test Automatizado (Referencia)
- Integrar Jest + Supertest para endpoints frecuentes.
- Mock de JWT para pruebas unitarias de permisos.
- Fixtures para generar y limpiar datos entre tests.

---
> Fin de la guía de pruebas manuales. Ejecutar y tildar cada item del checklist antes de la defensa.
