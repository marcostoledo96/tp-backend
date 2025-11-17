# RESUMEN: Problemas en Vercel y Soluciones

## 🔴 Problema 1: SQLITE_READONLY

### Error
```
SqliteError: attempt to write a readonly database
```

### Causa
Vercel tiene sistema de archivos de solo lectura. SQLite no puede escribir.

### ✅ Solución Aplicada
Modificado `models/database.js` para copiar la DB a `/tmp` en Vercel:
- `/tmp` es escribible en Vercel
- La DB se copia automáticamente al iniciar
- Usa WAL mode para mejor performance

### ⚠️ Limitación
**La DB en /tmp se resetea** en cada deploy o cold start.
- Productos: ✅ Se cargan desde la DB incluida
- Compras: ❌ Se pierden al redeplegar

### 🎯 Solución Permanente
**Migrar a PostgreSQL** (Vercel Postgres, Neon, o Supabase)

---

## 🔴 Problema 2: 401 Unauthorized

### Error
```
GET /api/compras 401 (Unauthorized)
GET /api/productos/admin/all 401 (Unauthorized)
```

### Causa Probable
1. `JWT_SECRET` no está configurado en Vercel
2. El token expira (24 horas por defecto)
3. El token no se envía correctamente

### ✅ Solución

#### Paso 1: Configurar Variables de Entorno en Vercel

Dashboard → Settings → Environment Variables → Add New

```
Name: JWT_SECRET
Value: sanpaholmes-secret-key-2025-production-secure
Environment: Production, Preview, Development
```

```
Name: NODE_ENV
Value: production
Environment: Production
```

#### Paso 2: Redeploy
```bash
git add .
git commit -m "Fix: Vercel SQLite y JWT"
git push origin master
```

O desde Vercel: **Deployments** → **Redeploy**

---

## 📝 Cambios Realizados

### 1. `models/database.js`
- Detecta entorno Vercel
- Copia DB a `/tmp/sanpaholmes.db`
- Habilita WAL mode

### 2. `server.js`
- Inicializa DB en Vercel al arrancar
- Log de confirmación

### 3. `middleware/auth.js`
- Mejorado logging de errores JWT
- Muestra mensaje de error en desarrollo

---

## 🧪 Pruebas Post-Deploy

### Test 1: Crear Compra
```bash
1. Ir a https://demo-sanpaholmes.vercel.app/checkout
2. Llenar formulario
3. Confirmar compra
```
**Esperado**: ✅ Compra creada exitosamente

### Test 2: Panel Admin
```bash
1. Ir a https://demo-sanpaholmes.vercel.app/vendor/login
2. Login: admin / admin123
3. Ver productos y ventas
```
**Esperado**: ✅ Productos visibles, ventas visibles

### Test 3: Verificar Logs
En Vercel Dashboard → Deployments → [último deploy] → Functions

**Buscar**:
- `✅ DB copiada a /tmp para Vercel`
- `✅ DB inicializada correctamente en Vercel`
- NO debe aparecer: `SQLITE_READONLY`

---

## 🚀 Próximos Pasos (Recomendado)

### Para Producción Real

**Migrar a PostgreSQL** para persistencia real:

1. **Vercel Postgres** (Recomendado)
   - Gratis hasta 256 MB
   - Integración nativa
   - Variables auto-configuradas

2. **Neon** (Serverless Postgres)
   - Gratis hasta 3 GB
   - Muy rápido
   - Connection string simple

3. **Supabase**
   - Gratis hasta 500 MB
   - Backend-as-a-Service
   - Auth incluido

---

## 📋 Checklist de Deployment

- [x] Modificar `models/database.js` para Vercel
- [x] Modificar `server.js` con inicialización
- [x] Mejorar logging en `middleware/auth.js`
- [ ] Configurar `JWT_SECRET` en Vercel
- [ ] Configurar `NODE_ENV` en Vercel
- [ ] Hacer push a GitHub
- [ ] Verificar redeploy en Vercel
- [ ] Probar crear compra
- [ ] Probar panel admin
- [ ] Revisar logs en Vercel

---

## ❓ ¿Necesitas Ayuda?

Si después de seguir estos pasos siguen los errores:

1. **Revisar logs en Vercel**: Deployments → Functions → Ver logs
2. **Verificar variables**: Settings → Environment Variables
3. **Probar localmente primero**: `npm start` y `npm run dev`
4. **Considerar migración a Postgres**: Te ayudo con el código

---

**Archivos de Referencia Creados:**
- `FIX_VERCEL_SQLITE.md` - Detalle del fix de SQLite
- `FIX_401_UNAUTHORIZED.md` - Detalle del fix de JWT
- `SOLUCION_VERCEL_SQLITE.md` - Opciones de migración
