# Project Health

Sistema de indicadores de salud del proyecto para Seencel.

## Descripción

Este feature calcula y visualiza el estado de salud de un proyecto basándose en datos reales (tareas, gastos, cambios) sin utilizar IA. Todo se basa en reglas determinísticas.

## Documentación

- [FEATURE.md](./FEATURE.md) - Documentación completa, arquitectura y roadmap

## Uso Rápido

```tsx
import { useProjectHealth } from '@/features/project-health/hooks/use-project-health';
import { HealthIndicator } from '@/features/project-health/components/health-indicator';

function ProjectHeader({ projectId }: { projectId: string }) {
  const { health, isLoading } = useProjectHealth(projectId);
  
  if (isLoading) return <Skeleton />;
  
  return (
    <div className="flex items-center gap-2">
      <h1>Mi Proyecto</h1>
      <HealthIndicator health={health} />
    </div>
  );
}
```

## Estado

🟡 En desarrollo - Fase 1 (MVP)
