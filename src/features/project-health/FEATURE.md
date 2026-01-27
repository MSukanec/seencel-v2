# Project Health

**Feature**: Sistema de Estado y Salud del Proyecto  
**Status**: 🟡 En Planificación  
**Created**: 2026-01-26  

---

## 📋 Descripción

Un sistema que interpreta el estado de un proyecto a partir de eventos reales (tareas, cambios, gastos, fechas), calcula indicadores simples y los combina para mostrar:

- **Estado general de salud** (0-100)
- **Sub-estados**: tiempo, costo, estabilidad, fricción
- **Visual dinámico**: color/clima que refleja el estado

### Principios Fundamentales

```
❌ No es IA
❌ No decide nada
❌ No bloquea acciones
✅ Solo interpreta señales con reglas determinísticas
```

---

## 🏗️ Arquitectura

### Flujo de Datos

```
EVENTOS REALES  →  CÁLCULOS  →  VISUALIZACIÓN
     ↓                ↓              ↓
  (ya existen)    (funciones)    (componentes)
```

### Estructura de Carpetas

```
src/features/project-health/
├── FEATURE.md              # Este archivo
├── README.md               # Documentación técnica
├── types.ts                # Tipos e interfaces
├── constants.ts            # Pesos, thresholds, configuración
├── lib/
│   ├── calculators/
│   │   ├── health-score.ts      # Salud general
│   │   ├── time-health.ts       # Salud de tiempo
│   │   ├── cost-health.ts       # Salud de costo
│   │   ├── stability.ts         # Estabilidad
│   │   ├── friction.ts          # Fricción
│   │   ├── tension.ts           # Tensión
│   │   └── inertia.ts           # Inercia
│   ├── aggregators/
│   │   └── project-state.ts     # Combina todos los indicadores
│   └── utils/
│       └── helpers.ts           # Utilidades de cálculo
├── hooks/
│   ├── use-project-health.ts    # Hook principal
│   └── use-health-pulse.ts      # Hook para animación de pulso
├── components/
│   ├── health-indicator.tsx     # Badge de estado
│   ├── health-card.tsx          # Card con detalles
│   ├── health-chart.tsx         # Gráfico temporal
│   ├── health-blob.tsx          # Visual orgánico animado
│   └── pulse-animation.tsx      # Animación de pulso
├── actions/
│   └── snapshots.ts             # Server actions para snapshots
└── queries/
    └── get-project-metrics.ts   # Queries para obtener datos
```

---

## 📊 Indicadores

### A. Salud General (0-100)

```typescript
salud_general = promedio(salud_tiempo, salud_costo, estabilidad)
```

| Valor | Estado | Color |
|-------|--------|-------|
| ≥ 80  | SANO | 🟢 Verde |
| ≥ 60  | ATENCIÓN | 🟡 Amarillo |
| < 60  | CRÍTICO | 🔴 Rojo |

### B. Salud de Tiempo

Mide si el proyecto avanza al ritmo esperado.

```typescript
avance_real = tareas_terminadas / tareas_totales
avance_esperado = dias_transcurridos / dias_planificados
salud_tiempo = 100 - |avance_real - avance_esperado| * 100
```

### C. Salud de Costo

Mide si el gasto acompaña al avance.

```typescript
ratio_costo = costo_ejecutado / presupuesto_total
ratio_avance = avance_real
salud_costo = 100 - max(0, ratio_costo - ratio_avance) * 100
```

### D. Estabilidad

Mide qué tan predecible es el proyecto.

```typescript
eventos_inestables = cambios + reabiertas + reprogramaciones
estabilidad = 100 - eventos_inestables * FACTOR_ESTABILIDAD
```

### E. Fricción

Mide dónde y cuándo el trabajo se traba.

```typescript
friccion = cantidad_eventos_de_traba_en_periodo
// Señales: tareas pausadas, vueltas atrás, dependencias bloqueadas
```

### F. Tensión

Mide la presión acumulada del sistema.

```typescript
tension = friccion * PESO_FRICCION + (100 - estabilidad) * PESO_ESTABILIDAD
```

### G. Inercia

Mide qué tan difícil es cambiar el proyecto.

```typescript
inercia = promedio(avance_real, costo_ejecutado / presupuesto_total) * 100
```

### H. Pulso

Variación en el tiempo del estado.

```typescript
pulso = salud_general_hoy - salud_general_ayer
// > 0 = mejorando, < 0 = empeorando, = 0 = estable
```

---

## 🗄️ Modelo de Datos

### Datos Existentes (Input)

| Tabla | Campos Relevantes |
|-------|-------------------|
| `projects` | `start_date`, `end_date`, `budget` |
| `project_tasks` | `status`, `start_date`, `due_date`, `reopened` |
| `client_payments` | `amount`, `currency_id`, `payment_date`, `status` |
| `project_changes` | `type`, `created_at` |
| `activity_logs` | `action`, `entity_type`, `created_at` |

### Datos Nuevos (Snapshots)

```sql
CREATE TABLE project_health_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  snapshot_date DATE NOT NULL,
  
  -- Métricas básicas
  tasks_total INTEGER,
  tasks_completed INTEGER,
  tasks_in_progress INTEGER,
  tasks_reopened INTEGER,
  
  -- Financiero
  budget_total DECIMAL,
  cost_executed DECIMAL,
  
  -- Eventos del período
  changes_count INTEGER,
  date_changes_count INTEGER,
  
  -- Indicadores calculados (para histórico)
  health_score DECIMAL,
  time_health DECIMAL,
  cost_health DECIMAL,
  stability_score DECIMAL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(project_id, snapshot_date)
);
```

---

## 🎨 Visual Inspiración

Referencia: App de emociones con slider

| Estado | Color de Fondo | Forma del Blob | Animación |
|--------|----------------|----------------|-----------|
| Sano | Verde suave | Circular, suave | Lenta, fluida |
| Atención | Amarillo dorado | Estrella suave | Media |
| Crítico | Azul/Violeta | Puntas múltiples | Rápida, agitada |

---

## 🗺️ Roadmap

### Fase 1: MVP Técnico (1-2 semanas)
- [ ] Estructura de carpetas
- [ ] Tipos e interfaces base
- [ ] `time-health.ts` - Calculadora de salud de tiempo
- [ ] `cost-health.ts` - Calculadora de salud de costo
- [ ] `stability.ts` - Calculadora de estabilidad
- [ ] `health-score.ts` - Agregador de salud general
- [ ] `use-project-health.ts` - Hook principal
- [ ] `health-indicator.tsx` - Badge simple (número + color)
- [ ] Integrar en header de proyecto

### Fase 2: Snapshots y Tendencias (1 semana)
- [ ] Migración SQL para `project_health_snapshots`
- [ ] Cron job / Edge function para snapshots diarios
- [ ] `health-chart.tsx` - Gráfico de evolución temporal
- [ ] Calcular y mostrar "pulso" (delta vs ayer)

### Fase 3: Visual WOW (2+ semanas)
- [ ] `health-blob.tsx` - SVG animado orgánico
- [ ] Transiciones de color de página según estado
- [ ] `pulse-animation.tsx` - Animación de latido
- [ ] Slider de exploración temporal
- [ ] Dashboard dedicado de salud

### Fase 4: Insights Avanzados (futuro)
- [ ] Fricción por fase/zona
- [ ] Predicción de riesgo (basada en patrones)
- [ ] Alertas automáticas
- [ ] Comparativa entre proyectos

---

## 🔧 Configuración

```typescript
// constants.ts
export const HEALTH_CONFIG = {
  // Pesos para salud general
  weights: {
    time: 0.35,
    cost: 0.35,
    stability: 0.30,
  },
  
  // Thresholds de estado
  thresholds: {
    healthy: 80,
    warning: 60,
  },
  
  // Factor de penalización por evento inestable
  stabilityFactor: 5,
  
  // Pesos para tensión
  tensionWeights: {
    friction: 0.6,
    instability: 0.4,
  },
};
```

---

## 📝 Notas Técnicas

### Qué NO guardamos
- ❌ "salud = 72" como verdad eterna
- ❌ "estado = rojo" persistido
- ❌ Gráficos renderizados
- ❌ Animaciones

### Por qué
- Las reglas pueden cambiar
- Los pesos pueden ajustarse
- El producto evoluciona
- Si persistimos estados, nos atamos de manos

### Qué SÍ guardamos
- ✅ Eventos (ya existen)
- ✅ Métricas base en snapshots diarios
- ✅ Todo lo demás se calcula on-demand

---

## 🚀 Próximos Pasos

1. **Revisar este documento** - ¿Falta algo?
2. **Definir prioridad** - ¿Empezamos con Fase 1?
3. **Validar datos existentes** - ¿Tenemos todo lo necesario en DB?
4. **Crear estructura de archivos** - Scaffolding inicial
