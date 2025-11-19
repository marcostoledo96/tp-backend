# Script de aplicación de migraciones para SQLite

Yo: creé este script para poder ejecutar migraciones SQL sobre la base de datos SQLite local.
Es importante para mantener el esquema actualizado sin tener que recrear toda la BD.

## Uso

```powershell
# Ejecutar migración específica
node db/apply-sqlite-migration.js 001_add_roles_permisos_system.sql

# O ejecutar todas las migraciones pendientes
node db/apply-all-sqlite-migrations.js
```

## Notas

- Las migraciones se ejecutan en orden alfabético según el prefijo numérico.
- Cada migración solo se ejecuta una vez (el script registra las aplicadas).
- Si una migración falla, el proceso se detiene y te notifica del error.
- **IMPORTANTE**: Siempre haz backup de `db/sanpaholmes.db` antes de aplicar migraciones en producción.
