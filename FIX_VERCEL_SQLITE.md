# Fix Vercel - SQLite Readonly

## Cambios Realizados

### 1. Modificado `models/database.js`
- Detecta si está en Vercel con `process.env.VERCEL`
- Copia la DB a `/tmp/sanpaholmes.db` (Vercel permite escritura en /tmp)
- Usa WAL mode para mejor performance

### 2. Modificado `server.js`
- Inicializa la DB al arrancar en Vercel
- Copia automáticamente la DB a /tmp

---

## Pasos para Deployar

### 1. Commit y Push
```bash
git add .
git commit -m "Fix: SQLite readonly en Vercel - usar /tmp"
git push origin master
```

### 2. Vercel Re-deploy
Vercel detectará el cambio y redesplegará automáticamente.

### 3. Verificar Variables de Entorno en Vercel
Dashboard → Settings → Environment Variables

Agregar:
```
JWT_SECRET=sanpaholmes-secret-key-2025-production
NODE_ENV=production
```

---

## ⚠️ Limitación Importante

**La DB en /tmp se RESETEA** cada vez que Vercel redeploya o hace cold start.

Esto significa:
- ✅ Los productos se cargan desde la DB incluida en el deploy
- ❌ Las compras se PIERDEN al redeplegar
- ❌ No es una solución permanente

---

## Solución Permanente: Migrar a PostgreSQL

Para un sistema en producción real, DEBES usar una base de datos persistente:

### Opción A: Vercel Postgres (Gratis)
1. Dashboard Vercel → Storage → Create Database → Postgres
2. Instalar: `npm install @vercel/postgres`
3. Migrar modelos a usar SQL queries de Postgres

### Opción B: Neon (Serverless Postgres - Gratis)
1. Crear cuenta en https://neon.tech
2. Crear proyecto
3. Copiar connection string
4. Instalar: `npm install pg`

### Opción C: Supabase (Postgres + más features - Gratis)
1. Crear cuenta en https://supabase.com
2. Crear proyecto
3. Usar connection string
4. Instalar: `npm install pg`

---

## Para Producción REAL

**Recomendación**: Usar Vercel Postgres

Ventajas:
- ✅ Gratis hasta 256 MB
- ✅ Integración nativa con Vercel
- ✅ Backup automático
- ✅ Variables de entorno auto-configuradas

¿Quieres que te ayude a migrar a Postgres?
