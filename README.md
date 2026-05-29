# CampusFix API

Sistema de Reportes de Infraestructura Universitaria en Tiempo Real.

## Descripción del Proyecto

**CampusFix** es una API REST que permite a estudiantes, personal de mantenimiento y administradores gestionar reportes de daños en instalaciones universitarias. Implementa CRUD completo con autenticación JWT, roles de usuario, caché Redis y publicación/suscripción en tiempo real.

### Entidad: Reporte

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | Integer | Identificador único |
| `tipoDano` | String | Tipo de daño reportado |
| `descripcion` | String | Descripción detallada |
| `ubicacion` | String | Lugar del daño |
| `estado` | Enum | PENDIENTE / EN_PROCESO / RESUELTO |
| `creadoEn` | DateTime | Fecha de creación |
| `autorId` | Integer | FK al usuario que reporta |

### Roles de Usuario

| Rol | Permisos |
|-----|----------|
| `ESTUDIANTE` | Crear reportes, ver listado |
| `MANTENIMIENTO` | Actualizar estado de reportes |
| `ADMIN` | Eliminar reportes |

---

## Endpoints

### Base URL

```
https://campusfix-api.onrender.com/api/reportes
```

> Local: `http://localhost:3000/api/reportes`

### Autenticación

```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh-token
```

### Reportes

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/reportes` | No | Listar reportes (paginado, filtros) |
| GET | `/api/reportes/:id` | No | Obtener reporte por ID |
| POST | `/api/reportes` | Sí | Crear reporte (cualquier rol) |
| PUT | `/api/reportes/:id` | MANTENIMIENTO | Actualizar estado |
| DELETE | `/api/reportes/:id` | ADMIN | Eliminar reporte |

> Las rutas también están disponibles en inglés: `/api/reports`

### Parámetros de Query (GET)

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `tipoDano` | String | Filtrar por tipo de daño |
| `estado` | Enum | PENDIENTE / EN_PROCESO / RESUELTO |
| `page` | Integer | Página (default: 1) |
| `limit` | Integer | Items por página (default: 5) |

---

## Arquitectura del Sistema

```
  CLIENTE (Frontend / curl / Postman / Dashboard Socket.io)
         │
         │  HTTPS
         ▼
┌──────────────────────────────────────────┐
│         API GATEWAY                       │
│   Express 4 + CORS + Helmet              │
│   + Rate Limiting + Socket.io            │
│                                           │
│   /api-docs    ── Swagger UI              │
│   /api/auth    ── Register / Login        │
│   /api/reports ── CRUD (inglés)           │
│   /api/reportes ── CRUD (español)         │
│   /             ── Dashboard en vivo      │
└────────┬──────────────┬───────────────────┘
         │              │
         ▼              ▼
┌─────────────────┐  ┌─────────────────────────┐
│   Supabase      │  │    Upstash Redis         │
│   (PostgreSQL)  │  │                         │
│                 │  │  ┌───────────────────┐  │
│  ┌───────────┐  │  │  │ ★ Caché (TTL 60s)│  │
│  │  usuario  │  │  │  │   GET /reportes   │  │
│  ├───────────┤  │  │  └───────────────────┘  │
│  │  reporte  │  │  │                         │
│  │  (FK →    │  │  │  ┌───────────────────┐  │
│  │   usuario)│  │  │  │ ★ Pub/Sub         │  │
│  └───────────┘  │  │  │   campus:* canales │  │
│                 │  │  │   → Socket.io      │  │
│  DATABASE_URL   │  │  └───────────────────┘  │
│  → puerto 6543  │  │                         │
│    (pooler)     │  │  ┌───────────────────┐  │
│  DIRECT_URL     │  │  │ ★ Blacklist JWT   │  │
│  → puerto 5432  │  │  │   logout tokens   │  │
│    (directo)    │  │  └───────────────────┘  │
└─────────────────┘  └─────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │  Socket.io     │
                    │  Dashboard     │
                    │  (Tiempo Real) │
                    └────────────────┘
```

### Canales Pub/Sub

| Canal | Evento | Disparador |
|-------|--------|------------|
| `campus:reporte:nuevo` | REPORTE_NUEVO | POST /api/reportes |
| `campus:estado:actualizado` | ESTADO_ACTUALIZADO | PUT /api/reportes/:id |

---

## Instalación y Uso

### Requisitos

- Node.js 22+
- npm
- Supabase (PostgreSQL)
- Upstash Redis

### Instalación

```bash
git clone <repo-url>
cd campusfix-api
npm install
npx prisma generate
npx prisma db push
```

### Variables de Entorno (.env)

```
DATABASE_URL=postgresql://postgres:pass@pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:pass@db.supabase.com:5432/postgres
REDIS_URL=rediss://default:pass@upstash-redis.com:6379
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
PORT=3000
```

### Iniciar

```bash
npm start          # Servidor principal
npm run subscriber # Proceso suscriptor Pub/Sub (legacy)
npm run dev        # Desarrollo con watch
npm test           # Tests de integración
```

---

## Justificación de Decisiones Técnicas

**¿Por qué usar el pooler de Supabase (puerto 6543)?**
Supabase utiliza PgBouncer en el puerto 6543 para manejar conexiones transaccionales, permitiendo multiplexar cientos de conexiones sin agotar recursos de PostgreSQL. La conexión directa (puerto 5432) se reserva exclusivamente para migraciones.

**¿Por qué Redis para caché + Pub/Sub + blacklist?**
Redis ya estaba integrado para Pub/Sub, por lo que extender su uso a caché (TTL 60s) y blacklist de tokens JWT maximiza la infraestructura existente. La caché evita consultas repetitivas a Supabase, la blacklist permite invalidación inmediata de tokens sin consultas a BD, y Pub/Sub notifica eventos en tiempo real a través de Socket.io.

**¿Por qué dos suscriptores Redis?**
El `subscriber.js` independiente funciona como proceso legacy para logging y monitoreo. El suscriptor integrado en `server.js` alimenta el bridge de Socket.io para el dashboard en tiempo real, permitiendo que ambos casos de uso operen sin interferencia.

**¿Por qué Express 4 y no Express 5?**
Express 4 es estable, ampliamente documentado y compatible con Render. Express 5 (beta) introduce breaking changes que podrían causar comportamientos imprevistos en producción.

---

## Dashboard en Tiempo Real

El dashboard se sirve en `http://localhost:3000/` y muestra alertas en vivo para:
- Nuevos reportes de daño creados
- Actualizaciones de estado de reportes

Utiliza Socket.io con cliente CDN para conectividad sin bundler.

---

## Licencia

ISC © 2026 CampusFix Team
