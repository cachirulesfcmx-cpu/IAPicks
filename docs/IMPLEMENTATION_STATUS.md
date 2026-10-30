# Estado de implementación

Leyenda: **Verificado local** = ejecutado en el entorno de desarrollo · **Verificado CI** = GitHub Actions (repositorio anterior; se repite en IAPicks) · **Remoto** = servicio real · **Bloqueado** = falta permiso/credencial/dato.

| Área | Estado | Evidencia | Siguiente acción |
| --- | --- | --- | --- |
| Monorepo / dependencias | Completo | Un solo `package-lock.json`; `react@19.3.0` único en el árbol; `expo install --check` limpio | — |
| Build web (Next 16.4) | Completo · Verificado local + CI | `npm run build:web` exit 0 (antes FAIL por React duplicado) | — |
| Web: lint / typecheck / tests | Completo · Verificado local + CI | ESLint 0 avisos · tsc 0 · 23 tests | — |
| Web: páginas y API | Completo (modo demo) | 22/22 smoke local, en Preview y en producción | — |
| Paquete compartido | Completo | 10 tests | — |
| App Expo | Completo (modo demo) | tsc · lint · 3 tests · expo-doctor 20/20 · export Android+iOS | Builds EAS (bloqueado: cuenta) |
| Predictor | Completo (investigación) | 43 tests; backtests reales Liga MX y NFL | Datos para UCL/LaLiga/MLB/NBA |
| Supabase | Proyecto propio `iapicks` (`riuetkgrtilwipfkjlfc`, us-east-1, PostgreSQL 17.11), creado 2026-10-30 | — | — |
| Migración inicial | **Aplicada · Remoto** | `initial_schema` en `iapicks` (9 tablas, RLS); catálogo idéntico al archivo del repositorio | — |
| Migración de seguridad | **Aplicada y verificada · Remoto** | `202610280001_hardening.sql` (sha256 `a13825ef…7386`) ejecutada por el propietario en el SQL Editor de `iapicks` (2026-10-30). Huella del catálogo `351 \| 5e0817a070033abf066aa4de69d8a235`, idéntica a la esperada. `supabase/tests/remote_verify.sql`: **41/41 PASS** (`VANTA_REMOTE_SUITE_PASSED`), sin residuos; 0 filas y 0 usuarios | — |
| Historial de migraciones | **Pendiente de sincronización** | `supabase_migrations.schema_migrations` solo tiene `20261030064054 initial_schema` (el hardening se ejecutó por SQL Editor). Esa versión es **byte a byte** el archivo `202610240001_initial_schema.sql` (md5 `9eae25a37ee81844058e1325875938ea`, 7 883 caracteres) y su catálogo coincidió con el del archivo; no hay otras migraciones en el repositorio | El propietario ejecuta con la CLI: `migration repair --status applied 202610280001`, `--status reverted 20261030064054`, `--status applied 202610240001`; después se verifica por lectura |
| CI GitHub Actions | Completo · Verificado | IAPicks run 2 (`c6e5645`): 6/6 jobs success | — |
| Vercel | **Desplegado en producción · Remoto** | Proyecto `iapicks-web` (Next.js, iad1), despliegue `dpl_3E4aV1Ndaoc3dAU5dSwfEqAuo9qt` desde `main` `7a6ec91`, público por decisión del propietario: https://iapicks-web.vercel.app. Modo demo activo (`/api/health`: `dataMode: demo`, `predictionsFlag: false`); smoke **22/22 PASS** en producción | Alinear Node del proyecto (26.x) con CI (22) |
| Proveedor de datos real | **Bloqueado** | Sin clave/licencia | Ver `DATA_PROVIDER_MATRIX.md` |
| Picks reales | **Desactivados a propósito** | `PREDICTIONS_ENABLED=false`; `/api/picks` en producción solo devuelve demo con `probability: null`; en `iapicks`: 0 modelos aprobados, 0 predicciones publicadas; la base exige modelo aprobado con evidencia para publicar | — |
| Exposición de claves | **Sin evidencia de exposición** | JavaScript servido en producción (9 archivos): solo la clave publicable `anon` de `riuetkgrtilwipfkjlfc`; ninguna `service_role`, `sb_secret_`, ni nombres `SUPABASE_SERVICE_ROLE_KEY`/`CRON_SECRET` | — |
| Builds EAS / tiendas | **Bloqueado** | Sin cuenta Expo/Apple/Google | — |
| MelatePro | Fuera de alcance | IAPicks no usa MelatePro (ni lectura ni escritura) | — |
