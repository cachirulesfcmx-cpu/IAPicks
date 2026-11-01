# Runbook de despliegue

## 1. GitHub

- Repositorio: `cachirulesfcmx-cpu/IAPicks` (rama principal `main`).
- CI (`.github/workflows/ci.yml`) en cada push/PR: security (secretos + auditoría), shared, web (lint, tsc, tests,
  build, canarios), mobile (tsc, lint, tests, expo-doctor, export Android/iOS), predictor (pytest), database
  (migraciones + RLS + rollback). Todos los jobs fallan si falla una comprobación.
- Node.js: **22** en todas partes. `.nvmrc` (`22`) es la fuente; CI la lee con `node-version-file`, y
  `engines.node` = `22.x` en `package.json` raíz y `apps/web` (Vercel usa `engines.node` por encima del panel).

### Flujo de cambios (objetivo)

`rama feature` → PR a `main` → CI obligatorio (6 jobs) → revisión → merge → producción (Vercel despliega `main`).
Cada PR recibe un despliegue **Preview** (no tocar). Nadie hace push directo a `main`.

Configuración manual del propietario (*Settings → Rules → Rulesets → New branch ruleset*):

1. Nombre `main-protegida`, *Enforcement status*: **Active**, *Target branches*: **Include default branch**.
2. Activar **Restrict deletions** y **Block force pushes**.
3. Activar **Require a pull request before merging**. Con un solo mantenedor, *Required approvals* = **0** (GitHub
   no permite aprobar el PR propio); con un segundo revisor, **1** y *Dismiss stale approvals*.
4. Activar **Require status checks to pass** + *Require branches to be up to date*, y añadir los 6 checks (aparecen
   tras la primera ejecución en un PR): `security (secrets + dependencies)`, `shared`, `web`, `mobile`,
   `predictor`, `database (migrations + RLS)`.
5. *Bypass list*: vacía (o solo el propietario, para emergencias, sabiendo que eso permite saltarse el flujo).

Si el plan de GitHub no permite rulesets en un repositorio privado, la alternativa es *Settings → Branches → Add
classic branch protection rule* con las mismas opciones; si tampoco está disponible, el flujo depende solo de la
disciplina y debe registrarse como riesgo.

## 2. Supabase

Proyecto: `iapicks` (ref `riuetkgrtilwipfkjlfc`, us-east-1). **MelatePro no se usa nunca para IAPicks** (ni lectura ni
escritura).

1. Migraciones en orden: `202610240001_initial_schema.sql` → `202610280001_hardening.sql`.
2. Con CLI: `supabase link --project-ref riuetkgrtilwipfkjlfc && supabase db push`, o con el SQL Editor (una ejecución por
   archivo, en orden).
3. Verificar: los 3 triggers `vanta_*`, `data_sources`, las 2 vistas; después ejecutar
   `supabase/tests/remote_verify.sql` (una sola sentencia que siempre termina en excepción y revierte todo): debe
   terminar con `VANTA_REMOTE_SUITE_PASSED: 41/41`.
4. Auth: activar confirmación de correo; longitud mínima 10; URLs de redirección de la web.
5. Tipos TypeScript: `supabase gen types typescript --project-id riuetkgrtilwipfkjlfc > packages/shared/src/database.types.ts`.

## 3. Vercel

Proyecto `iapicks-web` conectado a este repositorio (*Add New → Project* → importar `cachirulesfcmx-cpu/IAPicks`):

1. **Root Directory**: `apps/web` · Framework: Next.js · "Include files outside the root directory": activado.
   `apps/web/vercel.json` fija `installCommand: cd ../.. && npm ci`, `buildCommand: next build`, `outputDirectory: .next`.
2. Variables: `PREDICTIONS_ENABLED=false`, `SPORTS_DATA_PROVIDER=demo`; para cuentas y equipos seguidos,
   `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (clave publicable). Secretos
   (`SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`) solo si se usan, como *Sensitive* y solo en servidor.
3. Smoke: `BASE_URL=https://<url> node apps/web/e2e/smoke.mjs` (con `VERCEL_SHARE_TOKEN` si el despliegue está
   protegido; nunca en Git).
4. La CSP permite `vercel.live` solo cuando `VERCEL_ENV=preview`.
5. **Node.js**: *Settings → Build and Deployment → Node.js Version* = **22.x** (hoy el panel dice 26.x; el
   `engines.node` del repositorio tiene prioridad, pero el panel debe coincidir para evitar confusiones).
6. **Rama de producción**: *Settings → Environments → Production* = `main`. Los Preview de ramas y PR se mantienen.
7. **Producción solo tras CI** (opcional, recomendado): *Settings → Deployment Checks* → añadir los checks de
   GitHub Actions del punto 1. Así Vercel construye el despliegue de `main` pero no le asigna el dominio de
   producción hasta que los checks pasen. Verificar en el panel que la opción existe en el plan actual.

## 4. Expo / EAS (bloqueado: sin cuenta)

`cd apps/mobile && npx eas init && npx eas build --profile preview --platform all`. Configurar
`EXPO_PUBLIC_API_BASE_URL` con la URL web. Sin ella, la app funciona en modo demo.

## 5. Variables

Ver `.env.example` (solo nombres y valores ficticios).
