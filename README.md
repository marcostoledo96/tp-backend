# SanpaHolmes - Sistema de Carrito de Compras

Sistema web de e-commerce desarrollado para el evento Scout SanpaHolmes 2025.

---

## Descripción

SanpaHolmes es un sistema de carrito de compras para gestionar ventas durante eventos. Los compradores pueden hacer pedidos de comida y bebidas a través de una interfaz web, mientras los organizadores administran productos y visualizan ventas en tiempo real.

### Características

- Carrito de compras con gestión en tiempo real
- Sistema de autenticación JWT para administradores  
- Panel de administración para productos y ventas
- Proceso de checkout con validación
- Diseño responsive para móviles y tablets
- Integración con WhatsApp para notificaciones
- Exportación a Google Sheets
- Base de datos SQLite con CRUD completo

---

## Arquitectura

El proyecto usa el patrón **MVC (Modelo-Vista-Controlador)**:

- **Modelo**: Gestiona datos y operaciones de base de datos
- **Vista**: Maneja la interfaz de usuario
- **Controlador**: Procesa solicitudes y coordina modelo-vista

---

## Tecnologías

### Backend
- Node.js 18+
- Express 4.18
- SQLite (better-sqlite3)
- JWT (jsonwebtoken)
- Bcrypt

### Frontend
- React 18
- TypeScript
- Vite 5
- Tailwind CSS 3
- React Router DOM 6

---

## Estructura del Proyecto

```
demo_sanpaholmes/
│
├── 📂 Backend (Node.js + Express)
│   │
│   ├── models/                    # 🗄️ Capa de Datos - Interacción con SQLite
│   │   ├── database.js           # Conexión a base de datos (con soporte Vercel /tmp)
│   │   ├── ProductoModel.js      # CRUD de productos
│   │   ├── CompraModel.js        # CRUD de compras/ventas
│   │   └── UsuarioModel.js       # CRUD de usuarios y autenticación
│   │
│   ├── controllers/               # 🎮 Controladores - Lógica de negocio
│   │   ├── ProductoController.js # Gestión de productos
│   │   ├── CompraController.js   # Gestión de compras y estadísticas
│   │   └── AuthController.js     # Login, JWT y verificación de sesión
│   │
│   ├── routes/                    # 🛣️ Rutas - Endpoints de la API REST
│   │   ├── index.js              # Router principal
│   │   ├── productos.js          # /api/productos (con bloqueo DEMO en Vercel)
│   │   ├── compras.js            # /api/compras (con bloqueo DEMO en Vercel)
│   │   └── auth.js               # /api/auth (login, me)
│   │
│   ├── middleware/                # 🔐 Middlewares
│   │   └── auth.js               # Verificación JWT y permisos
│   │
│   ├── db/                        # 💾 Base de Datos
│   │   ├── sanpaholmes.db        # SQLite database (con productos y compras seed)
│   │   ├── init.js               # Script de inicialización
│   │   ├── reset.js              # Script para resetear DB
│   │   └── migrations/           # Scripts de migración de esquema
│   │
│   └── server.js                  # ⚡ Servidor Express principal
│
├── 📂 Frontend (React + TypeScript + Vite)
│   │
│   ├── src/
│   │   ├── views/                # 📱 Componentes de Páginas
│   │   │   ├── LandingPage.tsx  # Página principal con banner DEMO
│   │   │   ├── Menu.tsx         # Catálogo de productos por categoría
│   │   │   ├── Cart.tsx         # Carrito de compras (con scroll to top)
│   │   │   ├── Checkout.tsx     # Proceso de pago y confirmación
│   │   │   ├── VendorLogin.tsx  # Login de administradores
│   │   │   ├── AdminPanel.tsx   # Panel de administración
│   │   │   ├── OrderConfirmation.tsx  # Confirmación de pedido
│   │   │   ├── ProductCard.tsx  # Tarjeta individual de producto
│   │   │   ├── CategoryBadge.tsx # Badge de categoría
│   │   │   ├── Navbar.tsx       # Barra de navegación
│   │   │   ├── Footer.tsx       # Pie de página
│   │   │   ├── PoliceButton.tsx # Botón con diseño temático
│   │   │   ├── ImageWithFallback.tsx # Imagen con fallback
│   │   │   └── ui/              # Componentes UI reutilizables (shadcn/ui)
│   │   │
│   │   ├── controllers/          # 🔄 Estado Global (Context API)
│   │   │   ├── AuthContext.tsx  # Contexto de autenticación (JWT, login, logout)
│   │   │   └── CartContext.tsx  # Contexto del carrito (agregar, quitar, actualizar)
│   │   │
│   │   ├── config/               # ⚙️ Configuración
│   │   │   └── api.ts           # URLs de API (dev/prod)
│   │   │
│   │   ├── types/                # 📝 Tipos TypeScript
│   │   │   └── index.ts         # Interfaces (Producto, Compra, Usuario)
│   │   │
│   │   ├── services/             # 🌐 Servicios HTTP
│   │   │   └── api.ts           # Cliente API con fetch
│   │   │
│   │   ├── utils/                # 🛠️ Utilidades
│   │   │   └── helpers.ts       # Funciones auxiliares
│   │   │
│   │   ├── styles/               # 🎨 Estilos globales
│   │   │   └── index.css        # Tailwind CSS + estilos personalizados
│   │   │
│   │   ├── App.tsx              # Componente raíz con rutas
│   │   └── main.tsx             # Entry point de React
│   │
│   ├── public/                   # 📁 Archivos estáticos
│   │   ├── images/              # Imágenes (escudos, logos, productos)
│   │   └── uploads/             # Uploads de comprobantes (en dev)
│   │
│   ├── components/               # 🧩 Componentes legacy (deprecados)
│   │   ├── AdminPanel.tsx
│   │   ├── Cart.tsx
│   │   └── ProductCard.tsx
│   │
│   └── index.html               # HTML principal
│
├── 📂 Scripts
│   ├── scripts/                  # 🔧 Scripts de mantenimiento
│   │   ├── add-listo-field.js
│   │   ├── migrate-comprobante-to-text.js
│   │   └── update-admin-password.js
│   │
│   └── google-apps-script.js    # Script para integración con Google Sheets
│
├── 📂 Configuración
│   ├── .env.example             # Ejemplo de variables de entorno
│   ├── vercel.json              # Configuración de Vercel
│   ├── vite.config.ts           # Configuración de Vite
│   ├── tailwind.config.js       # Configuración de Tailwind CSS
│   ├── tsconfig.json            # Configuración de TypeScript
│   ├── postcss.config.cjs       # Configuración de PostCSS
│   ├── package.json             # Dependencias y scripts
│   └── .gitignore               # Archivos ignorados por Git
│
└── 📂 Documentación
    ├── README.md                # Este archivo
    ├── FIX_VERCEL_SQLITE.md     # Solución a problemas de SQLite en Vercel
    └── VERIFICACION_FINAL.md    # Checklist de verificación del proyecto
```

### 📋 Descripción de Capas

#### Backend (MVC)
- **Modelo**: Gestiona datos y operaciones de base de datos SQLite
- **Vista**: No aplica (API REST devuelve JSON)
- **Controlador**: Procesa solicitudes HTTP y coordina modelo-respuesta

#### Frontend (Component-Based)
- **Views**: Páginas completas de la aplicación
- **Controllers**: Estado global compartido (Auth, Cart)
- **Components**: Componentes reutilizables y UI primitivos

#### Características Especiales
- **Modo DEMO en Vercel**: Bloquea operaciones de escritura (POST, PUT, DELETE) en producción
- **Scroll to Top**: Navegación al carrito inicia desde arriba
- **Banner de Advertencia**: Visible en producción indicando falta de persistencia
- **JWT Auth**: Autenticación segura con tokens para panel admin
- **Responsive**: Diseño adaptativo para móviles, tablets y desktop

---

## API Endpoints

### Productos
```
GET    /api/productos          # Listar productos activos
GET    /api/productos/:id      # Obtener producto por ID
POST   /api/productos          # Crear producto (auth)
PUT    /api/productos/:id      # Actualizar producto (auth)
DELETE /api/productos/:id      # Eliminar producto (auth)
```

### Compras
```
POST   /api/compras                     # Crear compra (público)
GET    /api/compras                     # Listar compras (auth)
GET    /api/compras/estadisticas/ventas # Estadísticas (auth)
GET    /api/compras/:id                 # Obtener compra (auth)
PATCH  /api/compras/:id/estado          # Actualizar estado (auth)
DELETE /api/compras/:id                 # Eliminar compra (auth)
```

### Autenticación
```
POST   /api/auth/login          # Login de administrador
GET    /api/auth/me             # Verificar sesión actual (requiere auth)
```

**Nota DEMO**: En Vercel, las rutas POST/PUT/DELETE de productos y POST de compras están bloqueadas y devuelven `403 Forbidden`.

---

## Base de Datos

### Esquema principal

**Tabla productos**
```sql
CREATE TABLE productos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio REAL NOT NULL,
  categoria TEXT NOT NULL,
  imagen TEXT,
  activo INTEGER DEFAULT 1,
  creado_en TEXT DEFAULT CURRENT_TIMESTAMP
);
```

**Tabla compras**
```sql
CREATE TABLE compras (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  numero_orden TEXT UNIQUE NOT NULL,
  comprador_nombre TEXT NOT NULL,
  comprador_telefono TEXT NOT NULL,
  comprador_mesa TEXT,
  items TEXT NOT NULL,
  total REAL NOT NULL,
  metodo_pago TEXT NOT NULL,
  comprobante_archivo TEXT,
  estado TEXT DEFAULT 'pendiente',
  abonado INTEGER DEFAULT 0,
  listo INTEGER DEFAULT 0,
  entregado INTEGER DEFAULT 0,
  fecha TEXT DEFAULT CURRENT_TIMESTAMP
);
```

**Tabla usuarios**
```sql
CREATE TABLE usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nombre_completo TEXT,
  email TEXT,
  role TEXT DEFAULT 'vendor',
  activo INTEGER DEFAULT 1,
  creado_en TEXT DEFAULT CURRENT_TIMESTAMP
);
```

---

## Deployment

### Vercel (Actual)

El proyecto está desplegado en **Vercel** con configuración serverless:

```json
// vercel.json
{
  "functions": {
    "server.js": {
      "maxDuration": 10
    }
  }
}
```

**⚠️ Limitaciones en Vercel:**
- SQLite usa `/tmp` (se resetea en cada deploy o cold start)
- Operaciones de escritura bloqueadas en modo DEMO
- Banner de advertencia visible en producción
- Los datos no persisten entre deploys

**🔧 Variables de Entorno requeridas:**
```bash
JWT_SECRET=sanpaholmes-secret-key-2025
NODE_ENV=production
VERCEL=1
```

### Migración Recomendada

Para producción real, se recomienda migrar a base de datos persistente:

**Opciones:**
1. **Vercel Postgres** (Recomendado)
   - Integración nativa
   - Free tier: 256 MB
   - Auto-configuración

2. **Neon** (Serverless Postgres)
   - Free tier: 3 GB
   - Excelente rendimiento
   - Connection string simple

3. **Supabase**
   - Free tier: 500 MB
   - Backend-as-a-Service
   - Auth incluido

Ver `FIX_VERCEL_SQLITE.md` para más detalles sobre la migración.

---

## Uso del Sistema

### Para compradores
1. Navegar al catálogo
2. Agregar productos al carrito
3. Revisar el carrito
4. Completar checkout con datos personales
5. Confirmar pedido

### Para administradores
1. Login en `/vendor/login`
   - Usuario: `admin`
   - Contraseña: `admin123`
2. Visualizar productos y ventas en tiempo real
3. Filtrar compras por nombre, teléfono o mesa
4. Marcar pedidos como listos
5. Enviar notificaciones por WhatsApp
6. Exportar datos a Google Sheets

**Nota**: En versión DEMO (Vercel), las operaciones de crear/editar/eliminar productos están bloqueadas.

---

## Scripts Disponibles

### Desarrollo
```bash
# Frontend (Vite dev server)
npm run dev              # http://localhost:5173

# Backend (Express server)
node server.js           # http://localhost:3000

# Build para producción
npm run build            # Genera carpeta dist/

# Preview del build
npm run preview          # Previsualiza build de producción
```

### Base de Datos
```bash
# Inicializar DB desde cero
node db/init.js

# Resetear DB (elimina y recrea)
node db/reset.js

# Verificar conexión
node db/test-connection.js

# Verificar usuario admin
node db/verificar-admin.js
```

### Migraciones
```bash
# Agregar campo "listo" a compras
node scripts/add-listo-field.js

# Migrar comprobante de BLOB a TEXT
node scripts/migrate-comprobante-to-text.js

# Actualizar contraseña de admin
node scripts/update-admin-password.js
```

---

## Credenciales de Acceso

### Administrador
- **URL**: https://demo-sanpaholmes.vercel.app/vendor/login
- **Usuario**: `admin`
- **Contraseña**: `admin123`

### Demo Pública
- **URL**: https://demo-sanpaholmes.vercel.app
- **Acceso**: Sin login requerido
- **Limitaciones**: No se pueden crear compras reales (modo DEMO)

---

## Tecnologías y Dependencias

### Backend
```json
{
  "express": "^4.18.2",
  "better-sqlite3": "^9.2.2",
  "jsonwebtoken": "^9.0.2",
  "bcrypt": "^5.1.1",
  "multer": "^1.4.5-lts.1",
  "cors": "^2.8.5"
}
```

### Frontend
```json
{
  "react": "^18.2.0",
  "react-router-dom": "^6.21.1",
  "typescript": "^5.3.3",
  "vite": "^5.0.11",
  "tailwindcss": "^3.4.1",
  "lucide-react": "^0.309.0"
}
```

---

## Características Implementadas

✅ **Sistema de Carrito**
- Agregar/quitar productos
- Actualizar cantidades
- Calcular total automático
- Persistencia en localStorage

✅ **Autenticación JWT**
- Login seguro con bcrypt
- Tokens con expiración
- Refresh automático
- Logout con limpieza de sesión

✅ **Panel de Administración**
- Vista de productos (solo lectura en DEMO)
- Lista de ventas en tiempo real
- Filtrado por nombre/teléfono/mesa
- Estadísticas de ventas
- Exportación a Google Sheets

✅ **Modo DEMO en Vercel**
- Bloqueo de operaciones de escritura
- Banner de advertencia visible
- Base de datos en /tmp (temporal)
- Solo lectura de productos y ventas

✅ **Diseño Responsive**
- Mobile-first approach
- Adaptado a tablets y desktop
- Navegación táctil optimizada
- Scroll to top en carrito

✅ **Integraciones**
- WhatsApp para notificaciones
- Google Sheets para exportación
- Imágenes con fallback automático

---

## Documentación Adicional

- **[FIX_VERCEL_SQLITE.md](./FIX_VERCEL_SQLITE.md)** - Solución a problemas de SQLite en Vercel y guía de migración a PostgreSQL
- **[VERIFICACION_FINAL.md](./VERIFICACION_FINAL.md)** - Checklist de verificación del proyecto completo
- **[google-apps-script.js](./google-apps-script.js)** - Script para integración con Google Sheets

---

## Contacto y Soporte

**Desarrollado para**: Grupo Scout San Patricio - Evento SanpaHolmes 2025

**Demo en Vivo**: https://demo-sanpaholmes.vercel.app

**Repositorio**: https://github.com/marcostoledo96/demo_sanpaholmes

---

## Licencia

Proyecto desarrollado para el evento Scout SanpaHolmes 2025.
Todos los derechos reservados - Grupo Scout San Patricio.
