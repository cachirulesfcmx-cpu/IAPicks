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
| Migración inicial | Aplicada · Remoto | `vanta_initial_schema` en el proyecto Supabase usado durante el desarrollo (ver `DEPLOYMENT_RUNBOOK.md` §2) | — |
| Migración de seguridad | **Aplicada y verificada · Remoto** | Aplicada por SQL Editor (2026-10-29). Estructura comprobada y **41/41 aserciones PASSED en el proyecto real** (`remote_verify.sql`); 0 residuos tras la suite | — |
| CI GitHub Actions | Completo · Verificado | Run 40730242936: 6/6 jobs success | — |
| Vercel | Pendiente | Preview histórico con smoke 22/22 (`SMOKE_TEST_RESULTS.md`) | Proyecto Vercel propio conectado a IAPicks |
| Proveedor de datos real | **Bloqueado** | Sin clave/licencia | Ver `DATA_PROVIDER_MATRIX.md` |
| Picks reales | Desactivados a propósito | Gate: 0/3 modelos aprobados | — |
| Builds EAS / tiendas | **Bloqueado** | Sin cuenta Expo/Apple/Google | — |
| MelatePro | Fuera de alcance | IAPicks no usa MelatePro (ni lectura ni escritura) | — |
