# 🕵️ SanpaHolmes - Sistema de Carrito de Compras (DEMO)

> **Versión Demo** - Sistema simplificado para demostración pública del proyecto real usado en el evento Scout SanpaHolmes 2025

---

## 📋 Sobre Este Proyecto

Este es un **sistema de carrito de compras** desarrollado para el evento Scout SanpaHolmes que se realizó el **15 de noviembre de 2025**. 

### ¿Qué es esta demo?

- ✅ **Versión simplificada** del sistema real que se usó en el evento
- ✅ **Base de datos JSON** en lugar de PostgreSQL (para facilitar la demostración)
- ✅ **Operaciones de solo lectura** - Los visitantes pueden probar todas las funcionalidades sin modificar datos
- ✅ **Completamente funcional** - Puedes ver productos, agregar al carrito, simular compras y entrar al panel de administración

### ¿Por qué es solo una demo?

La versión original usaba **PostgreSQL** en la nube (Neon) y permitía modificar datos realmente. Esta versión **demo** usa **JSON** como base de datos para que:

1. Cualquiera pueda clonar y probar el proyecto sin configurar nada
2. Los visitantes no puedan corromper los datos de demostración
3. Sea más fácil deployar en servicios como Vercel

---

## 🚀 Tecnologías Utilizadas

### Backend
- **Node.js v18+** - Entorno de ejecución de JavaScript
- **Express 4.18** - Framework web para Node.js
- **JSON** - Base de datos en archivo (db/database.json)
- **JWT** - Autenticación con tokens
- **Bcrypt** - Encriptación de contraseñas

### Frontend
- **React 18** - Librería UI
- **TypeScript** - JavaScript con tipos
- **Vite 5** - Build tool moderno y rápido
- **Tailwind CSS** - Framework de estilos utility-first
- **Radix UI** - Componentes accesibles
- **Lucide Icons** - Iconos modernos

### Deployment
- **Vercel** - Hosting para frontend y backend serverless
- Compatible con **Netlify** y otros servicios similares

---

## 🎮 Credenciales de Demo

Para acceder al **Panel de Administración**:

- **Usuario:** `admin`
- **Contraseña:** `admin123`

⚠️ **Importante:** Todos los cambios que hagas en el panel admin (crear productos, actualizar compras, etc.) solo se **simulan**. No se guardan realmente en el JSON.

---

## 💻 Instalación y Uso Local

### Requisitos Previos

- **Node.js** v18 o superior
- **npm** o **yarn**
- **Git** (para clonar el repositorio)

### Paso 1: Clonar el Repositorio

```bash
# Opción 1: Si ya clonaste el repo
cd demo_sanpaholmes

# Opción 2: Si aún no lo clonaste
git clone https://github.com/marcostoledo96/demo_sanpaholmes.git
cd demo_sanpaholmes
```

### Paso 2: Instalar Dependencias

```bash
npm install
```

Esto instalará todas las dependencias necesarias tanto para el backend como para el frontend.

### Paso 3: Iniciar el Servidor de Desarrollo

Necesitas **dos terminales** abiertas:

#### Terminal 1 - Backend (API)
```bash
npm run backend
```

El servidor backend se iniciará en `http://localhost:3000`

#### Terminal 2 - Frontend (React)
```bash
npm run dev
```

El frontend se iniciará en `http://localhost:5173` (o el puerto que Vite asigne)

### Paso 4: Abrir en el Navegador

Abre tu navegador y ve a:
```
http://localhost:5173
```

---

## 📁 Estructura del Proyecto

```
demo_sanpaholmes/
│
├── 📁 api/                      # Backend - Rutas de la API
│   ├── auth.js                 # Autenticación (login)
│   ├── productos.js            # CRUD de productos
│   └── compras.js              # Registro y gestión de compras
│
├── 📁 db/                       # Base de datos JSON
│   ├── database.json           # Datos de productos, usuarios y compras
│   └── json-db.js              # Funciones para leer/simular datos
│
├── 📁 components/               # Componentes de React
│   ├── Navbar.tsx              # Barra de navegación
│   ├── Menu.tsx                # Vista del menú de productos
│   ├── Cart.tsx                # Carrito de compras
│   ├── Checkout.tsx            # Página de checkout
│   ├── VendorLogin.tsx         # Login de administradores
│   ├── AdminPanelNew.tsx       # Panel de administración
│   └── ...más componentes
│
├── 📁 src/                      # Código fuente del frontend
│   ├── App.tsx                 # Componente principal
│   ├── main.tsx                # Punto de entrada
│   ├── context/                # Context API (carrito, auth)
│   └── styles/                 # Estilos globales
│
├── 📁 middleware/               # Middlewares del backend
│   └── auth.js                 # Verificación de autenticación
│
├── server.js                    # Servidor Express principal
├── package.json                 # Dependencias del proyecto
├── vite.config.ts              # Configuración de Vite
└── vercel.json                 # Configuración para Vercel
```

---

## 🔄 Cómo Funciona la Demo

### Para Visitantes (Clientes)

1. **Ver Menú** - Explora productos organizados por categoría (merienda/cena)
2. **Agregar al Carrito** - Selecciona productos y ajusta cantidades
3. **Checkout** - Completa tus datos (nombre, mesa, método de pago)
4. **Subir Comprobante** - Si eliges transferencia, sube una imagen
5. **Confirmación** - Recibe un número de orden simulado

⚠️ **Nota:** La compra se simula correctamente pero NO se guarda en el JSON.

### Para Administradores

1. **Click en "Panel Admin"** (botón amarillo en la navbar)
2. **Login** con `admin` / `admin123`
3. **Ver Productos** - Lista completa con stock
4. **Ver Ventas** - Historial de compras con detalles
5. **Crear/Editar/Eliminar** - Todas estas acciones se simulan

⚠️ **Nota:** Los cambios en el panel admin NO se guardan realmente.

---

## 🌐 Deploy en Vercel

### Opción 1: Deploy Automático con GitHub

1. Sube tu código a GitHub
2. Conecta el repositorio con Vercel
3. Vercel detectará automáticamente la configuración

### Opción 2: Deploy Manual

```bash
# Instala Vercel CLI
npm install -g vercel

# Deploy
vercel
```

### Variables de Entorno

No necesitas configurar nada especial. El proyecto funciona out-of-the-box con JSON.

---

## 🔍 Endpoints de la API

### Productos

```
GET    /api/productos              # Listar productos activos
GET    /api/productos/admin/all    # Listar todos (requiere auth)
GET    /api/productos/:id          # Obtener un producto
POST   /api/productos              # Crear producto (simulado)
PUT    /api/productos/:id          # Actualizar producto (simulado)
DELETE /api/productos/:id          # Eliminar producto (simulado)
```

### Compras

```
GET    /api/compras                # Listar todas las compras (requiere auth)
POST   /api/compras                # Crear compra (simulado)
GET    /api/compras/:id            # Detalle de una compra (requiere auth)
PATCH  /api/compras/:id/estado     # Actualizar estado (simulado)
```

### Autenticación

```
POST   /api/auth/login             # Iniciar sesión
GET    /api/auth/me                # Obtener usuario actual
POST   /api/auth/cambiar-password  # Cambiar contraseña (simulado)
```

---

## 📦 Scripts Disponibles

```bash
# Iniciar backend (servidor API)
npm run backend

# Iniciar frontend (React con Vite)
npm run dev

# Build para producción
npm run build

# Preview de producción
npm run preview

# Iniciar ambos al mismo tiempo (si tienes concurrently)
npm start
```

---

## 🎓 Para la Defensa Oral

Este proyecto demuestra conocimientos de:

✅ **Backend con Node.js y Express**
- Creación de APIs RESTful
- Manejo de rutas y middlewares
- Autenticación con JWT
- Gestión de archivos (upload de comprobantes)

✅ **Frontend con React y TypeScript**
- Componentes funcionales y hooks
- Context API para estado global
- Routing con React Router
- Integración con APIs

✅ **Base de Datos**
- Originalmente PostgreSQL (Neon)
- Adaptado a JSON para demo
- Queries y operaciones CRUD

✅ **Deployment y DevOps**
- Deploy en Vercel
- Variables de entorno
- Build y optimización

✅ **Buenas Prácticas**
- Código comentado y documentado
- Separación de responsabilidades
- Manejo de errores
- Seguridad (bcrypt, JWT)

---

## 📝 Notas Importantes

### Sobre la Versión Real

La versión que se usó el **15/11/2025 en el evento real** tenía:

- ✅ PostgreSQL en Neon (base de datos real en la nube)
- ✅ Operaciones de escritura reales
- ✅ Upload de comprobantes guardados
- ✅ Stock que se descontaba realmente
- ✅ Más de 50 compras registradas durante el evento

### Sobre Esta Demo

Esta versión demo:

- ✅ Usa JSON local (más fácil de probar)
- ✅ Simula operaciones de escritura
- ✅ Mantiene toda la lógica y UI original
- ✅ Perfecta para demostración y aprendizaje

---

## 🔧 Solución de Problemas

### El backend no inicia

```bash
# Verifica que tengas Node.js instalado
node --version

# Reinstala dependencias
rm -rf node_modules
npm install
```

### El frontend no carga

```bash
# Verifica que el backend esté corriendo en :3000
# Limpia caché de Vite
rm -rf node_modules/.vite
npm run dev
```

### Error de CORS

El backend ya tiene CORS habilitado. Si tienes problemas:

1. Verifica que el backend esté en `http://localhost:3000`
2. Verifica que el frontend esté en `http://localhost:5173`
3. Revisa `src/config/api.ts` para configurar la URL

---

## 📬 Contacto y Repositorio

- **Autor:** Marcos Toledo
- **GitHub:** [marcostoledo96](https://github.com/marcostoledo96)
- **Repositorio:** [demo_sanpaholmes](https://github.com/marcostoledo96/demo_sanpaholmes)
- **Evento Original:** San Patricio Holmes - 15/11/2025

---

## 📜 Licencia

MIT License - Libre para usar, modificar y distribuir.

---

## 🙏 Agradecimientos

Este proyecto fue desarrollado para el **Grupo Scout San Patricio** y su evento **SanpaHolmes 2025**. Gracias a todos los que participaron y probaron el sistema durante el evento real.

---

## 🚀 Primeros Pasos con Git

Si querés subir este proyecto a tu propio repositorio de GitHub:

### 1. Crear Repositorio en GitHub

Ve a GitHub y crea un nuevo repositorio vacío (sin README, sin .gitignore, completamente vacío).

### 2. Inicializar Git en el Proyecto (si no está inicializado)

```bash
# Solo si aún no tienes git iniciado
git init
```

### 3. Agregar Origen Remoto

```bash
# Reemplaza TU-USUARIO por tu usuario de GitHub
git remote add origin https://github.com/TU-USUARIO/demo_sanpaholmes.git
```

### 4. Agregar Todos los Archivos

```bash
git add .
```

### 5. Primer Commit

```bash
git commit -m "versión demo sanpaholmes - sistema completo"
```

### 6. Subir a GitHub

```bash
# Primera vez (crear la rama main y subir)
git push -u origin main
```

### 7. Siguientes Cambios

```bash
git add .
git commit -m "descripción de tus cambios"
git push
```

---

**¡Listo! Tu demo de SanpaHolmes está funcionando. 🎉**

Si tenés alguna pregunta o problema, revisá la sección de **Solución de Problemas** o abrí un issue en GitHub.
