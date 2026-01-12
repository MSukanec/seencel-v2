# 🚀 SEENCEL Kanban System - Enterprise Roadmap

> **Objetivo**: Crear un sistema de Kanban mejor que Linear, que funcione tanto a nivel de **Organización** como de **Proyecto**.

---

## 📋 ESTADO ACTUAL - Lo Que Tienes

### Tablas Existentes:

| Tabla | Propósito | Estado |
|-------|-----------|--------|
| `kanban_boards` | Contenedor principal de un tablero | ✅ Básico |
| `kanban_lists` | Columnas dentro de un tablero (ej: "To Do", "In Progress") | ✅ Básico |
| `kanban_cards` | Tarjetas/tareas individuales | ✅ Básico |
| `kanban_comments` | Comentarios en tarjetas | ✅ Básico |
| `kanban_attachments` | Archivos adjuntos a tarjetas | ✅ Básico |

### Estructura Actual:
```
Organization
└── Project (opcional)
    └── Board
        └── List (columnas)
            └── Card (tarjetas)
                ├── Comments
                └── Attachments
```

### ✅ Lo Que Está Bien:
1. **Jerarquía básica correcta**: Board → List → Card
2. **`project_id` ya es nullable** en `kanban_boards` → Soporta boards a nivel org
3. **Position field** en lists y cards → Permite reordenamiento drag & drop
4. **Foreign keys a organization_members** → Tracking de quién creó/asignó

---

## ⚠️ LO QUE FALTA - Problemas Críticos

### 1. **NO HAY LABELS/TAGS** 🔴
Linear tiene etiquetas de colores para categorizar. Tú no tienes nada.

### 2. **NO HAY PRIORIDAD** 🔴
No hay forma de marcar urgente, alta, media, baja.

### 3. **NO HAY SUBTAREAS/CHECKLISTS** 🔴  
Linear y Notion permiten checklists dentro de las tarjetas.

### 4. **SOLO 1 ASIGNADO** 🟡
`assigned_to` es un solo UUID. ¿Qué pasa si 2 personas trabajan en la misma tarea?

### 5. **NO HAY ESTIMACIONES** 🟡
No hay campo para story points, tiempo estimado, etc.

### 6. **NO HAY HISTORIAL DE ACTIVIDAD** 🔴
No sabes quién movió qué tarjeta, cuándo, etc.

### 7. **NO HAY VISTAS ALTERNATIVAS** 🟡
Solo hay Kanban. Linear tiene List View, Timeline, etc.

### 8. **NO HAY TEMPLATES** 🟡
No puedes crear plantillas de boards o cards recurrentes.

### 9. **NO HAY FILTROS GUARDADOS** 🟡
No hay "vistas guardadas" como en Notion.

### 10. **SIN RLS DEFINIDO** 🔴
No hay políticas de seguridad. Cualquiera podría ver todo.

---

## 💡 INNOVACIONES PROPUESTAS - Mejor que Linear

### 🏆 Nivel 1: Esenciales (MVP)

| Feature | Descripción | Tablas Nuevas |
|---------|-------------|---------------|
| **Labels/Tags** | Etiquetas de colores personalizables por org | `kanban_labels`, `kanban_card_labels` |
| **Prioridad** | Campo enum: urgent, high, medium, low, none | Columna en `kanban_cards` |
| **Checklists** | Subtareas marcables dentro de una card | `kanban_checklists`, `kanban_checklist_items` |
| **Multi-Asignados** | Múltiples personas en una tarea | `kanban_card_assignees` (tabla puente) |
| **Activity Log** | Historial de cambios automático | `kanban_activity_log` |
| **RLS Completo** | Seguridad por organización | Políticas RLS |

### 🚀 Nivel 2: Diferenciadores

| Feature | Descripción | Valor |
|---------|-------------|-------|
| **Board Templates** | Plantillas predefinidas (Scrum, Simple, etc.) | Onboarding rápido |
| **Card Templates** | Plantillas de cards recurrentes | Menos trabajo repetitivo |
| **Swimlanes** | Agrupar cards horizontalmente (por proyecto, tipo, etc.) | Visual organization |
| **Automations** | "Cuando muevas a Done → marcar completado" | Productividad |
| **Time Tracking** | Tiempo trabajado por card | Analytics |

### 🌟 Nivel 3: WOW Factor

| Feature | Descripción | Impacto |
|---------|-------------|---------|
| **AI Card Creation** | "Crea las tareas para implementar login" → genera 5 cards | Game changer |
| **Dependencies** | Card A depende de Card B | Critical path |
| **Recurring Cards** | Tareas que se repiten automáticamente | Maintenance tasks |
| **Board Analytics** | Cycle time, throughput, burndown | Data-driven |
| **Multi-Board View** | Ver todos los boards de un proyecto en una vista | Overview |

---

## 🗄️ PROPUESTA DE SCHEMA MEJORADO

### Nuevas Tablas Necesarias:

```sql
-- 1. Labels/Tags
kanban_labels (
  id, organization_id, name, color, is_default, position, created_at
)

kanban_card_labels (
  card_id, label_id  -- Tabla puente M:N
)

-- 2. Multi-Asignados
kanban_card_assignees (
  card_id, member_id, assigned_at, assigned_by
)

-- 3. Checklists
kanban_checklists (
  id, card_id, title, position, created_at
)

kanban_checklist_items (
  id, checklist_id, content, is_completed, completed_at, completed_by, position
)

-- 4. Activity Log
kanban_activity_log (
  id, card_id, board_id, actor_id, action_type, old_value, new_value, created_at
)
```

### Modificaciones a Tablas Existentes:

```sql
-- kanban_cards: agregar campos
ALTER TABLE kanban_cards ADD COLUMN priority text DEFAULT 'none'; -- urgent/high/medium/low/none
ALTER TABLE kanban_cards ADD COLUMN estimated_hours numeric(5,2);
ALTER TABLE kanban_cards ADD COLUMN actual_hours numeric(5,2);
ALTER TABLE kanban_cards ADD COLUMN start_date date;
ALTER TABLE kanban_cards ADD COLUMN cover_image_url text;
ALTER TABLE kanban_cards ADD COLUMN cover_color text;

-- kanban_boards: agregar campos
ALTER TABLE kanban_boards ADD COLUMN is_template boolean DEFAULT false;
ALTER TABLE kanban_boards ADD COLUMN template_id uuid; -- Si se creó desde un template
ALTER TABLE kanban_boards ADD COLUMN default_list_id uuid; -- Lista donde caen nuevas cards
ALTER TABLE kanban_boards ADD COLUMN is_archived boolean DEFAULT false;
ALTER TABLE kanban_boards ADD COLUMN color text;
ALTER TABLE kanban_boards ADD COLUMN icon text;

-- kanban_lists: agregar campos
ALTER TABLE kanban_lists ADD COLUMN color text;
ALTER TABLE kanban_lists ADD COLUMN limit_wip integer; -- Work In Progress limit
ALTER TABLE kanban_lists ADD COLUMN auto_complete boolean DEFAULT false; -- Marca cards como completadas al entrar
```

---

## 📊 ORDEN DE IMPLEMENTACIÓN RECOMENDADO

### Fase 1: Foundation (Semana 1)
1. [ ] Agregar columnas faltantes a tablas existentes
2. [ ] Crear `kanban_labels` + `kanban_card_labels`
3. [ ] Crear `kanban_card_assignees`
4. [ ] Implementar RLS completo para todas las tablas
5. [ ] Crear índices de performance

### Fase 2: Core Features (Semana 2)
1. [ ] Crear `kanban_checklists` + `kanban_checklist_items`
2. [ ] Crear `kanban_activity_log` + triggers automáticos
3. [ ] Crear views para queries optimizadas
4. [ ] Frontend: Board básico con drag & drop

### Fase 3: Polish (Semana 3)
1. [ ] Frontend: Labels UI
2. [ ] Frontend: Checklists UI
3. [ ] Frontend: Activity sidebar
4. [ ] Frontend: Filtros y búsqueda

### Fase 4: Wow Features (Futuro)
1. [ ] Templates
2. [ ] Automations
3. [ ] Analytics
4. [ ] AI features

---

## 🔐 RLS - ESTRATEGIA DE SEGURIDAD

```sql
-- Principio: Acceso basado en membership de organización

-- kanban_boards: Ver si eres member de la org
CREATE POLICY "Members can view org boards" ON kanban_boards
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- kanban_cards: Ver si tienes acceso al board (hereda de board)
-- Etc. para todas las tablas...
```

---

## ❓ PREGUNTAS PARA DEFINIR

1. **¿Quieres limitar boards por plan?** (Free: 3 boards, Pro: Unlimited)
2. **¿Cards pueden moverse entre proyectos?** O solo dentro del mismo board?
3. **¿Quieres notificaciones?** (@menciones, cambios en cards asignadas)
4. **¿Boards públicos?** (Cualquiera con el link puede ver, como Trello)
5. **¿Permisos granulares?** (Solo ver vs. editar vs. admin del board)

---

## 📁 Archivos Relacionados

- Schema actual: `prompts/tables/kanban.md`
- Projects schema: `prompts/tables/projects.md`
- Este roadmap: `.agent/workflows/kanban-roadmap.md`

---

> **Próximo paso**: Confirmar qué features del Nivel 1 quieres implementar, luego genero el SQL completo para las tablas + RLS.
