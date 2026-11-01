# Estado de implementación

Leyenda: **Verificado local** = ejecutado en el entorno de desarrollo · **Verificado CI** = GitHub Actions (repositorio anterior; se repite en IAPicks) · **Remoto** = servicio real · **Bloqueado** = falta permiso/credencial/dato.

| Área | Estado | Evidencia | Siguiente acción |
| --- | --- | --- | --- |
| Monorepo / dependencias | Completo | Un solo `package-lock.json`; `react@19.3.0` único en el árbol; `expo install --check` limpio | — |
| Build web (Next 16.4) | Completo · Verificado local + CI | `npm run build:web` exit 0 (antes FAIL por React duplicado) | — |
| Web: lint / typecheck / tests | Completo · Verificado local + CI | ESLint 0 avisos · tsc 0 · 23 tests | — |
| Web: páginas y API | Completo (modo demo) | 22/22 smoke local, en Preview y en producción | — |
| Paquete compartido | Completo | 10 tests | — |
| App Expo | Completo (modo demo) | `expo` 58.0.22 · `expo-router` 58.0.29 · `expo install --check` limpio · tsc · lint · 3 tests · expo-doctor 20/20 · export Android+iOS | Builds EAS (bloqueado: cuenta) |
| Predictor | Completo (investigación) | 43 tests; backtests reales Liga MX y NFL | Datos para UCL/LaLiga/MLB/NBA |
| Supabase | Proyecto propio `iapicks` (`riuetkgrtilwipfkjlfc`, us-east-1, PostgreSQL 17.11), creado 2026-10-30 | 11 tablas en `public`, **11 con RLS** (lectura 2026-10-31) | — |
| Migración inicial | **Aplicada · Remoto** | `202610240001_initial_schema.sql` en `iapicks`; catálogo idéntico al archivo del repositorio | — |
| Migración de seguridad | **Aplicada y verificada · Remoto** | `202610280001_hardening.sql` (sha256 `a13825ef…7386`) ejecutada por el propietario en el SQL Editor de `iapicks` (2026-10-30). Huella del catálogo `351 \| 5e0817a070033abf066aa4de69d8a235`, idéntica a la esperada. `supabase/tests/remote_verify.sql`: **41/41 PASS** (`VANTA_REMOTE_SUITE_PASSED`), sin residuos; 0 filas y 0 usuarios | — |
| Historial de migraciones | **Sincronizado · Remoto** | `supabase_migrations.schema_migrations` = `202610240001 initial_schema`, `202610280001 hardening` (verificado por lectura 2026-10-31), igual que `supabase/migrations/` | — |
| CI GitHub Actions | Completo · Verificado | 6 jobs en cada push/PR (security, shared, web, mobile, predictor, database); Node desde `.nvmrc` (22). **No es obligatorio**: `main` no tiene protección | Configurar protección de `main` (ver `DEPLOYMENT_RUNBOOK.md` §1) |
| Node.js | **Unificado en 22 (repositorio)** | `.nvmrc` = `22`; `engines.node` = `22.x` en `package.json` raíz y `apps/web`; CI usa `node-version-file: .nvmrc` | Panel de Vercel: *Node.js Version* 22.x (pendiente, manual) |
| Flujo de despliegue | **Pendiente de configuración externa** | Hoy: push a `main` ⇒ producción sin control previo; CI corre pero no bloquea | Propietario: protección de `main` en GitHub y comprobaciones en Vercel (`DEPLOYMENT_RUNBOOK.md` §1 y §3) |
| Vercel | **Desplegado en producción · Remoto** | Proyecto `iapicks-web` (Next.js, iad1), público por decisión del propietario: https://iapicks-web.vercel.app. Modo demo (`/api/health`: `dataMode: demo`, `predictionsFlag: false`); smoke **22/22 PASS** en producción (2026-10-31). Cada push a `main` despliega producción | Node del proyecto en el panel = 26.x (el repositorio fija `engines.node: 22.x`, que según la documentación de Vercel tiene prioridad); alinear el panel a 22.x |
| Proveedor de datos real | **Bloqueado** | Sin clave/licencia | Ver `DATA_PROVIDER_MATRIX.md` |
| Picks reales | **Desactivados a propósito** | `PREDICTIONS_ENABLED=false` y proveedor demo (`/api/health`: `predictionsFlag: false`, `dataMode: demo`); `/api/picks` en producción solo devuelve demo con `probability: null`; en `iapicks`: **0 modelos aprobados, 0 predicciones publicadas** (lectura 2026-10-31); la base exige modelo aprobado con evidencia para publicar | — |
| Exposición de claves | **Sin evidencia de exposición** | JavaScript servido en producción (9 archivos): solo la clave publicable `anon` de `riuetkgrtilwipfkjlfc`; ninguna `service_role`, `sb_secret_`, ni nombres `SUPABASE_SERVICE_ROLE_KEY`/`CRON_SECRET` | — |
| Builds EAS / tiendas | **Bloqueado** | Sin cuenta Expo/Apple/Google | — |
| MelatePro | Fuera de alcance | IAPicks no usa MelatePro (ni lectura ni escritura) | — |
