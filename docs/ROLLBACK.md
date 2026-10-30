# Recuperación ante fallos

| Componente | Cómo revertir |
|---|---|
| Web (Vercel) | "Instant Rollback" al despliegue anterior del proyecto de IAPicks. |
| Rama Git | Commits nuevos de reversión (`git revert`); nunca force-push. |
| Migración de seguridad | Preferir corrección hacia adelante. Si hay que revertir: `supabase/rollback/202610280001_hardening_down.sql` (probado: `npm run test:rollback`; conserva columnas añadidas y no borra tablas con datos). |
| Migración inicial | Con tablas vacías se puede eliminar el esquema VANTA; con datos, solo con respaldo y aprobación. |
| Publicación de picks | `PREDICTIONS_ENABLED=false` y/o `update model_versions set approved_for_publication = false` → la RLS oculta sus predicciones al instante (probado). |
| App móvil | Publicar build anterior / OTA anterior; la app sin API vuelve sola a modo demo. |
| Ingesta | Retirar `CRON_SECRET` o `SPORTS_DATA_PROVIDER=demo`: la ruta falla cerrada. |

Antes de cualquier operación destructiva: consultar estado (`supabase_migrations.schema_migrations`, conteos), exportar respaldo y obtener autorización explícita.
