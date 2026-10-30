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
| Migración inicial | **Aplicada · Remoto** | `initial_schema` en `iapicks` (9 tablas, RLS) | — |
| Migración de seguridad | **Pendiente en `iapicks`** | Verificada 41/41 en el proyecto de desarrollo anterior; en `iapicks` el aviso de confirmación de Supabase quedó sin respuesta (sin cambios parciales) | Aplicar `202610280001_hardening.sql` y ejecutar `supabase/tests/remote_verify.sql` |
| CI GitHub Actions | Completo · Verificado | IAPicks run 2 (`c6e5645`): 6/6 jobs success | — |
| Vercel | **Pendiente (permiso)** | Crear proyecto por API devuelve 403; preview histórico con smoke 22/22 | Crear el proyecto en el panel (`DEPLOYMENT_RUNBOOK.md` §3) |
| Proveedor de datos real | **Bloqueado** | Sin clave/licencia | Ver `DATA_PROVIDER_MATRIX.md` |
| Picks reales | Desactivados a propósito | Gate: 0/3 modelos aprobados | — |
| Builds EAS / tiendas | **Bloqueado** | Sin cuenta Expo/Apple/Google | — |
| MelatePro | Fuera de alcance | IAPicks no usa MelatePro (ni lectura ni escritura) | — |
