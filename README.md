# HabitumCUN - Sistema de Gestión Hotelera Frontend

Interfaz completa para el sistema de gestión de reservas hoteleras. Desarrollado con React 19, Vite, Tailwind CSS 4 y Recharts.

## 🚀 Características

- **Autenticación segura** con JWT y persistencia de sesión
- **Dashboard interactivo** con gráficos de ocupación en tiempo real
- **Gestión de clientes** con búsqueda y CRUD completo
- **Sistema de reservas** con formulario dinámico
- **Modo oscuro/claro** con persistencia en localStorage
- **Micro-interacciones** suaves y responsivas
- **Paleta corporativa** Azul Marino + Verde Lima
- **Gráficos analíticos** con Recharts (Pie charts y Bar charts)

## 📋 Requisitos Previos

- Node.js 18+ 
- pnpm 10+
- Backend desplegado en: `https://hotel-backend-625r.onrender.com`

## 🔧 Instalación

```bash
# Clonar el repositorio
git clone <repository-url>
cd habitumcun-frontend

# Instalar dependencias
pnpm install

# Crear archivo .env.local (opcional, usa valores por defecto)
cp .env.example .env.local
```

## 🏃 Desarrollo

```bash
# Iniciar servidor de desarrollo
pnpm dev

# El servidor estará disponible en http://localhost:3000
```

## 📦 Construcción para Producción

```bash
# Compilar para producción
pnpm build

# Previsualizar build
pnpm preview
```

## 🌍 Variables de Entorno

| Variable | Descripción | Valor por Defecto |
|----------|-------------|-------------------|
| `VITE_API_URL` | URL del backend API | `https://hotel-backend-625r.onrender.com` |
| `VITE_THEME` | Tema inicial (light/dark) | `dark` |

## 📁 Estructura del Proyecto

```
client/src/
├── pages/              # Páginas principales
│   ├── Home.tsx        # Página de inicio
│   ├── Login.tsx       # Formulario de autenticación
│   ├── Dashboard.tsx   # Panel de control con gráficos
│   ├── Clientes.tsx    # Gestión de clientes
│   ├── Roles.tsx       # Gestión de roles
│   ├── Reservas.tsx    # Listado de reservas
│   ├── NuevaReserva.tsx # Formulario de nueva reserva
│   └── NotFound.tsx    # Página 404
├── components/         # Componentes reutilizables
│   ├── Navbar.tsx      # Barra de navegación
│   ├── ProtectedRoute.tsx # Rutas protegidas
│   ├── LoginDialog.tsx  # Diálogo de login
│   ├── Map.tsx         # Componente de mapa
│   ├── ErrorBoundary.tsx # Boundary para errores
│   ├── Footer.tsx      # Pie de página
│   └── ui/             # Componentes de shadcn/ui
├── contexts/           # React contexts
│   ├── AuthContext.tsx # Gestión de autenticación
│   └── ThemeContext.tsx # Gestión de tema
├── hooks/              # Hooks personalizados
│   ├── useComposition.ts # Hook para composición
│   ├── useMobile.tsx   # Hook para detectar dispositivo móvil
│   └── usePersistFn.ts # Hook para persistencia de funciones
├── services/           # Servicios API
│   └── api.ts         # Cliente Axios configurado
├── lib/                # Utilidades
│   └── utils.ts       # Funciones de utilidad
├── App.tsx            # Componente raíz
└── index.css          # Estilos globales
```

## 🎨 Paleta de Colores

- **Primario (Azul Marino)**: `oklch(0.35 0.15 260)` - Botones, navbar, acciones principales
- **Acento (Verde Lima)**: `oklch(0.65 0.20 140)` - Estados disponibles, confirmaciones
- **Destructivo (Rojo)**: Para estados ocupados y cancelaciones
- **Fondo (Tema Oscuro)**: `oklch(0.12 0.01 260)` - Fondo principal

## 🔐 Autenticación

El sistema utiliza JWT para autenticación. El token se almacena en `localStorage` y se inyecta automáticamente en todas las solicitudes API mediante interceptores de Axios.

### Flujo de Autenticación

1. Usuario ingresa credenciales en `/login`
2. Backend valida y retorna JWT + datos de usuario
3. Token se almacena en `localStorage`
4. AuthContext mantiene sesión activa
5. Rutas protegidas verifican autenticación
6. Al cerrar sesión, se limpian tokens

## 📊 Módulos Principales

### Dashboard
- Métricas rápidas (total, disponibles, ocupadas, mantenimiento)
- Gráfico de pastel con distribución de ocupación
- Gráfico de barras con cantidad por estado
- Grid interactivo de habitaciones con estados visuales

### Clientes
- Tabla con búsqueda por documento de identidad
- Formulario para crear nuevos clientes
- Campos: documento, nombre, email, teléfono

### Reservas
- Listado de todas las reservas
- Estados: Pendiente, Confirmada, Cancelada, Finalizada
- Modal con detalles: consumos, pagos, totales
- Botón para crear nueva reserva

### Nueva Reserva
- Selector de cliente
- Agregar múltiples habitaciones dinámicamente
- Fechas de check-in y check-out
- Notas adicionales
- Validación completa antes de enviar

## 🚀 Despliegue

### Vercel/Netlify

1. Conectar repositorio a Vercel/Netlify
2. Configurar variables de entorno:
   - `VITE_API_URL=https://hotel-backend-625r.onrender.com`
3. El archivo `vercel.json` está configurado para SPA routing
4. Deploy automático en cada push a main

## 🔄 Flujo de Datos

```
Login → AuthContext (JWT) → API Service → Backend
                                ↓
                          Interceptores Axios
                                ↓
                          Inyecta Bearer Token
                                ↓
                          Maneja errores 401
```

## 🛠️ Tecnologías

- **React 19** - Framework UI
- **Vite 7** - Build tool
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Estilos
- **shadcn/ui** - Componentes
- **Lucide React** - Iconos
- **Recharts** - Gráficos
- **Axios** - Cliente HTTP
- **Wouter** - Routing
- **Framer Motion** - Animaciones

## 📝 Notas Importantes

- El backend debe estar disponible en `https://hotel-backend-625r.onrender.com`
- Los tokens JWT se almacenan en `localStorage` (considerar usar httpOnly en producción)
- Las sesiones persisten al recargar la página
- El tema (claro/oscuro) se persiste en `localStorage`
- Todos los campos de formulario tienen validación antes de enviar
- Los gráficos se actualizan en tiempo real al cambiar datos

## 🤝 Contribuir

Para contribuir al proyecto:

1. Crear una rama para tu feature
2. Hacer commits descriptivos
3. Enviar pull request
4. Esperar revisión

## 📄 Licencia

MIT

## 📧 Soporte

Para reportar bugs o sugerencias, contactar al equipo de desarrollo.

---

**Versión**: 1.0.0  
**Última actualización**: Junio 2026
