# Fix 401 Unauthorized en Vercel

## Problema
El token JWT funciona en login pero falla en requests subsecuentes con 401.

## Causa Probable
El `JWT_SECRET` no está configurado en Vercel, o es diferente entre deploys.

---

## Solución

### 1. Configurar JWT_SECRET en Vercel

Ve a tu proyecto en Vercel Dashboard:

1. **Settings** → **Environment Variables**
2. Agregar nueva variable:
   ```
   Name: JWT_SECRET
   Value: sanpaholmes-secret-key-2025-production-secure
   ```
3. Seleccionar: Production, Preview, Development
4. Guardar

### 2. Redeploy

Después de agregar la variable, hacer redeploy:
```bash
git commit --allow-empty -m "Trigger redeploy"
git push origin master
```

O desde Vercel Dashboard: **Deployments** → **...** → **Redeploy**

---

## Verificar JWT_SECRET

El middleware usa:
```javascript
const JWT_SECRET = process.env.JWT_SECRET || 'sanpaholmes-secret-key-2025';
```

Si `JWT_SECRET` cambia entre deploys, los tokens antiguos dejarán de funcionar.

---

## Variables de Entorno Requeridas en Vercel

```
JWT_SECRET=sanpaholmes-secret-key-2025-production-secure
NODE_ENV=production
```

---

## Probar Localmente

1. Hacer login
2. Copiar el token del localStorage
3. Probar en Postman/Thunder:
   ```
   GET https://demo-sanpaholmes.vercel.app/api/compras
   Headers:
     Authorization: Bearer [TOKEN_COPIADO]
   ```

Debería devolver 200 OK con las compras.
