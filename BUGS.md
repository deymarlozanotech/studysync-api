# BUGS Técnicos — CampusFix API

## Bug #1: Error 500 por falta de Content-Type JSON

**Síntoma:** Al hacer POST a `/api/reportes` sin el header `Content-Type: application/json`,
Express retorna `500 Internal Server Error` y `req.body` aparece como `undefined`.

**Causa raíz:** El middleware `express.json()` que parsea el body JSON debe ejecutarse antes
de las rutas. Si se monta después de las rutas, `req.body` será `undefined`.

**Solución aplicada en el proyecto:**
- `app.use(express.json())` está declarado antes de cualquier montaje de rutas.
- Para pruebas manuales con curl:
  ```bash
  curl -X POST http://localhost:3000/api/reportes \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer <token>" \
    -d '{"tipoDano":"Luminaria fundida","descripcion":"Foco fundido","ubicacion":"Aula 202"}'
  ```

---

## Bug #2: Timeout en Render por la variable PORT

**Síntoma:** El servicio se despliega en Render correctamente pero la plataforma reporta
`Server never started on port 10000` o timeouts de salud.

**Causa raíz:** Render asigna un puerto dinámico mediante la variable de entorno `PORT`.
El código debe respetar el puerto asignado por Render.

```js
// ✅ Correcto - Puerto dinámico con fallback
const PORT = process.env.PORT || 3000;
```

**Solución:** Usar `process.env.PORT || 3000` como valor dinámico, permitiendo que
Render inyecte su puerto.

---

## Bug #3: Error de autenticación P1000 / Tenant not found en Supabase Pooler

**Síntoma:** Al ejecutar `npx prisma db push`, Prisma lanza:
```
Error: P1000: Authentication failed against database server.
```

**Causa raíz:** Usar la URL del pooler (`:6543`) para migraciones en lugar de la conexión
directa (`:5432`).

```env
# ✅ Correcto
DATABASE_URL="postgresql://postgres:pass@pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:pass@db.supabase.com:5432/postgres"
```

**Solución:** Configurar `DATABASE_URL` (pooler, puerto 6543) para runtime y `DIRECT_URL`
(directo, puerto 5432) para migraciones.

---

## Bug #4: Mensajes publicitarios de dotenv en la consola

**Síntoma:** Al iniciar el servidor aparecen mensajes de promoción de `dotenv.org`.

**Solución aplicada:**
```js
dotenv.config({ quiet: true });
```
La propiedad `{ quiet: true }` suprime todos los mensajes no críticos de dotenv.
