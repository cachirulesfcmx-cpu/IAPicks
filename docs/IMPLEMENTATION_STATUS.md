# Estado de implementación

Leyenda: **Verificado local** = ejecutado en el entorno de desarrollo · **Verificado CI** = GitHub Actions (repositorio anterior; se repite en IAPicks) · **Remoto** = servicio real · **Bloqueado** = falta permiso/credencial/dato.

| Área | Estado | Evidencia | Siguiente acción |
| --- | --- | --- | --- |
| Monorepo / dependencias | Completo | Un solo `package-lock.json`; `react@19.3.0` único en el árbol; `expo install --check` limpio | — |
| Build web (Next 16.4) | Completo · Verificado local + CI | `npm run build:web` exit 0 (antes FAIL por React duplicado) | — |
| Web: lint / typecheck / tests | Completo · Verificado local + CI | ESLint 0 avisos · tsc 0 · 23 tests | — |
| Web: páginas y API | Completo (modo demo) | 22/22 smoke local y 22/22 en Preview | — |
| Paquete compartido | Completo | 10 tests | — |
| App Expo | Completo (modo demo) | tsc · lint · 3 tests · expo-doctor 20/20 · export Android+iOS | Builds EAS (bloqueado: cuenta) |
| Predictor | Completo (investigación) | 43 tests; backtests reales Liga MX y NFL | Datos para UCL/LaLiga/MLB/NBA |
| Supabase | Proyecto propio `iapicks` (`riuetkgrtilwipfkjlfc`, us-east-1, PostgreSQL 17.11), creado 2026-10-30 | — | — |
| Migración inicial | **Aplicada · Remoto** | `initial_schema` en `iapicks` (9 tablas, RLS); catálogo idéntico al archivo del repositorio | — |
| Migración de seguridad | **Aplicada y verificada · Remoto** | `202610280001_hardening.sql` (sha256 `a13825ef…7386`) ejecutada por el propietario en el SQL Editor de `iapicks` (2026-10-30). Huella del catálogo `351 \| 5e0817a070033abf066aa4de69d8a235`, idéntica a la esperada. `supabase/tests/remote_verify.sql`: **41/41 PASS** (`VANTA_REMOTE_SUITE_PASSED`), sin residuos; 0 filas y 0 usuarios | — |
| Historial de migraciones | **Pendiente (no sincronizado)** | `supabase_migrations.schema_migrations` solo tiene `20261030064054 initial_schema`: el hardening se ejecutó por SQL Editor y la versión de la inicial no coincide con el archivo (`202610240001`) | Con la CLI vinculada al proyecto: `supabase migration repair` (requiere autorización) |
| CI GitHub Actions | Completo · Verificado | IAPicks run 2 (`c6e5645`): 6/6 jobs success | — |
| Vercel | **Pendiente** | El proyecto `iapicks` se crea manualmente (la API devuelve 403); preview histórico con smoke 22/22 | Revisar configuración, desplegar Preview y smoke, con autorización |
| Proveedor de datos real | **Bloqueado** | Sin clave/licencia | Ver `DATA_PROVIDER_MATRIX.md` |
| Picks reales | **Desactivados a propósito** | `PREDICTIONS_ENABLED=false`; en `iapicks`: 0 modelos aprobados, 0 predicciones publicadas; la base exige modelo aprobado con evidencia para publicar | — |
| Builds EAS / tiendas | **Bloqueado** | Sin cuenta Expo/Apple/Google | — |
| MelatePro | Fuera de alcance | IAPicks no usa MelatePro (ni lectura ni escritura) | — |
