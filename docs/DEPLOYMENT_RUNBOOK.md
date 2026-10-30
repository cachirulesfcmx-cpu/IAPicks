# Runbook de despliegue

## 1. GitHub

- Repositorio: `cachirulesfcmx-cpu/IAPicks` (rama principal `main`).
- CI (`.github/workflows/ci.yml`) en cada push/PR: security (secretos + auditoría), shared, web (lint, tsc, tests,
  build, canarios), mobile (tsc, lint, tests, expo-doctor, export Android/iOS), predictor (pytest), database
  (migraciones + RLS + rollback). Todos los jobs fallan si falla una comprobación.

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

Proyecto propio conectado a este repositorio (crearlo en el panel: *Add New → Project* → importar `cachirulesfcmx-cpu/IAPicks`, nombre `iapicks`):

1. **Root Directory**: `apps/web` · Framework: Next.js · "Include files outside the root directory": activado.
   `apps/web/vercel.json` fija `installCommand: cd ../.. && npm ci`, `buildCommand: next build`, `outputDirectory: .next`.
2. Variables: `PREDICTIONS_ENABLED=false`, `SPORTS_DATA_PROVIDER=demo`; para cuentas y equipos seguidos,
   `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (clave publicable). Secretos
   (`SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`) solo si se usan, como *Sensitive* y solo en servidor.
3. Smoke: `BASE_URL=https://<url> node apps/web/e2e/smoke.mjs` (con `VERCEL_SHARE_TOKEN` si el despliegue está
   protegido; nunca en Git).
4. La CSP permite `vercel.live` solo cuando `VERCEL_ENV=preview`.

## 4. Expo / EAS (bloqueado: sin cuenta)

`cd apps/mobile && npx eas init && npx eas build --profile preview --platform all`. Configurar
`EXPO_PUBLIC_API_BASE_URL` con la URL web. Sin ella, la app funciona en modo demo.

## 5. Variables

Ver `.env.example` (solo nombres y valores ficticios).
