# SOLUCIÓN URGENTE: SQLite no funciona en Vercel

## Problema
```
SQLITE_READONLY - attempt to write a readonly database
```

**Causa**: Vercel tiene sistema de archivos de solo lectura. SQLite NO puede escribir en producción.

---

## Solución: Migrar a Vercel Postgres

### Opción 1: Vercel Postgres (RECOMENDADO - GRATIS)

1. **Ir a tu proyecto en Vercel Dashboard**
   - https://vercel.com/tu-usuario/demo-sanpaholmes

2. **Storage → Create Database**
   - Seleccionar "Postgres"
   - Nombre: `sanpaholmes-db`
   - Region: Washington D.C. (us-east-1)
   - Click "Create"

3. **Copiar variables de entorno**
   Vercel te dará automáticamente:
   ```
   POSTGRES_URL
   POSTGRES_PRISMA_URL
   POSTGRES_URL_NO_SSL
   POSTGRES_URL_NON_POOLING
   POSTGRES_USER
   POSTGRES_HOST
   POSTGRES_PASSWORD
   POSTGRES_DATABASE
   ```

4. **Instalar dependencia PostgreSQL**
   ```bash
   npm install pg
   ```

5. **Crear nuevo archivo de conexión**
   Archivo: `models/database-postgres.js`

---

## Alternativa Rápida: Usar JSON como DB temporal

Si no quieres migrar ahora, puedes usar un archivo JSON en `/tmp` (Vercel permite escritura en /tmp):

### Pasos:

1. Modificar `models/database.js` para detectar entorno Vercel
2. En Vercel, usar `/tmp/compras.json` para guardar compras
3. Los productos se pueden leer desde SQLite (solo lectura funciona)

---

## ¿Qué prefieres?

**A) Migrar a Vercel Postgres** (solución profesional, gratis)
**B) Usar JSON temporal en /tmp** (rápido pero limitado)
**C) Usar otro servicio: Neon, Supabase, Railway** (también gratis)

Avísame y te ayudo con el código específico.

---

## Problema 2: Error 401 Unauthorized

**Causa**: El token JWT se pierde o no se envía correctamente.

**Solución rápida**:
1. Verificar que `localStorage` persista el token
2. Revisar que el header `Authorization` se envíe en cada petición
3. Verificar variable de entorno `JWT_SECRET` en Vercel

Para revisar esto, necesito ver:
- `src/controllers/AuthContext.tsx`
- Variables de entorno en Vercel Dashboard

---

## Resumen

**Problema principal**: SQLite no funciona en Vercel (sistema de archivos read-only)

**Solución obligatoria**: Migrar a base de datos cloud (Postgres, MySQL, etc.)

¿Con cuál quieres que continuemos?
