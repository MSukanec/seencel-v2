# Auditoría: Tablas y Funciones en Uso

> Generado: 2026-02-19 | Scope: src/**/*.ts, *.tsx vs DB/schema

---

## ❌ TABLAS SIN REFERENCIAS EN EL CÓDIGO FRONTEND

### Sistema de Parametrización de Tareas (COMPLETO — nunca implementado)
Estas tablas existen como infraestructura futura para tareas "paramétricas" (con fórmulas y elementos constructivos), pero ningún componente del frontend las usa:

| Tabla | Columnas | Estado |
|-------|----------|--------|
| `task_actions` | 6 | ❌ Sin uso |
| `task_construction_systems` | 11 | ❌ Sin uso |
| `task_division_actions` | 3 | ❌ Sin uso |
| `task_division_elements` | 3 | ❌ Sin uso |
| `task_element_actions` | 3 | ❌ Sin uso |
| `task_element_parameters` | 5 | ❌ Sin uso |
| `task_element_systems` | 3 | ❌ Sin uso |
| `task_elements` | 12 | ❌ Sin uso |
| `task_parameter_options` | 14 | ❌ Sin uso |
| `task_parameters` | 14 | ❌ Sin uso |
| `task_task_parameters` | 10 | ❌ Sin uso |

### Pins y Tableros visuales (no implementado)
| Tabla | Columnas | Estado |
|-------|----------|--------|
| `pins` | 8 | ❌ Sin uso |
| `pin_boards` | 8 | ❌ Sin uso |
| `pin_board_items` | 5 | ❌ Sin uso |

### Capital y Socios (parcialmente sin uso)
| Tabla | Columnas | Estado |
|-------|----------|--------|
| `capital_adjustments` | 17 | ❌ Sin uso |
| `capital_participants` | 11 | ❌ Sin uso |
| `partner_capital_balance` | 9 | ❌ Sin uso |

### Costos Indirectos por Proyecto
| Tabla | Columnas | Estado |
|-------|----------|--------|
| `indirect_costs` | 7 | ❌ Sin uso |
| `indirect_cost_values` | 7 | ❌ Sin uso |
| `indirect_costs_payments` | 16 | ❌ Sin uso |
| `movement_indirects` | 4 | ❌ Sin uso |

### Recetas: Rating y Preferencias (creadas pero no usadas)
| Tabla | Columnas | Estado |
|-------|----------|--------|
| `task_recipe_ratings` | 10 | ❌ Sin uso |
| `organization_recipe_preferences` | 5 | ❌ Sin uso |

### Productos / Catálogo de proveedores
| Tabla | Columnas | Estado |
|-------|----------|--------|
| `brands` | 4 | ❌ Sin uso |
| `products` | 15 | ❌ Sin uso (solo admin) |
| `product_prices` | 6 | ❌ Sin uso |
| `provider_products` | 7 | ❌ Sin uso |

### Calendario
| Tabla | Columnas | Estado |
|-------|----------|--------|
| `calendar_events` | 22 | ❌ Sin uso |
| `calendar_event_attendees` | 5 | ❌ Sin uso |
| `calendar_event_reminders` | 6 | ❌ Sin uso |

### Licitaciones (bids de subcontratos)
| Tabla | Columnas | Estado |
|-------|----------|--------|
| `subcontract_bids` | 12 | ❌ Sin uso |
| `subcontract_bid_tasks` | 10 | ❌ Sin uso |

### Datos debug y admin interno (ignorar — son para operaciones)
| Tabla | Columnas | Estado |
|-------|----------|--------|
| `debug_signup_log` | 4 | ❌ Sin uso en frontend |
| `support_messages` | 7 | ❌ Sin uso en frontend |
| `feedback` | 5 | ❌ Sin uso en frontend |
| `global_announcements` | 16 | ❌ Sin uso |
| `hero_sections` | 17 | ❌ Sin uso |
| `changelog_entries` | 9 | ❌ Sin uso |

### Identidad / Cuentas vinculadas
| Tabla | Columnas | Estado |
|-------|----------|--------|
| `linked_accounts` | 5 | ❌ Sin uso |
| `signatures` | 15 | ❌ Sin uso |
| `pdf` | 7 | ❌ Sin uso |
| `pdf_templates` | 29 | ❌ Sin uso |
| `tax_labels` | 5 | ❌ Sin uso directo |

### Labor: Niveles, Roles y Seguros
| Tabla | Columnas | Estado |
|-------|----------|--------|
| `labor_levels` | 6 | ❌ Sin uso |
| `labor_roles` | 10 | ❌ Sin uso |
| `labor_insurances` | 16 | ❌ Sin uso |
| `personnel_attendees` | 13 | ❌ Sin uso |
| `personnel_rates` | 15 | ❌ Sin uso |

### Índices Económicos (solo en feature `advanced`)
| Tabla | Columnas | Estado |
|-------|----------|--------|
| `economic_index_types` | 11 | ⚠️ Solo en `features/advanced` |
| `economic_index_components` | 8 | ⚠️ Solo en `features/advanced` |
| `economic_index_values` | 10 | ⚠️ Solo en `features/advanced` |

---

## ✅ TABLAS ACTIVAS (en uso confirmado)

**Core:**
`users`, `organizations`, `organization_members`, `roles`, `permissions`, `role_permissions`, `user_data`, `user_preferences`, `user_organization_preferences`, `organization_preferences`, `organization_data`, `currencies`, `units`, `organization_currencies`, `organization_wallets`, `wallets`

**Finanzas:**
`movements`, `movement_concepts`, `financial_operations`, `financial_operation_movements`, `general_costs`, `general_costs_payments`, `general_cost_categories`, `general_cost_payment_allocations`

**Materiales:**
`materials`, `material_types`, `material_prices`, `material_purchase_orders`, `material_invoices`, `material_payments`, `material_invoice_items`, `material_purchase_order_items`

**Mano de Obra:**
`labor_types`, `labor_categories`, `labor_prices`, `labor_payments`, `project_labor`

**Tareas y Recetas:**
`tasks`, `task_divisions`, `task_recipes`, `task_recipe_materials`, `task_recipe_labor`, `task_recipe_external_services`, `external_service_prices`, `organization_task_prices`

**Proyectos:**
`projects`, `project_data`, `project_settings`, `project_types`, `project_modalities`, `project_clients`, `project_access`, `client_commitments`, `client_payment_schedule`, `client_payments`

**Subcontratos:**
`subcontracts`, `subcontract_tasks`, `subcontract_payments`

**Contactos:**
`contacts`, `contact_categories`, `contact_category_links`

**Kanban:**
`kanban_boards`, `kanban_lists`, `kanban_cards`, `kanban_labels`, `kanban_card_labels`, `kanban_comments`, `kanban_checklists`, `kanban_checklist_items`, `kanban_card_watchers`, `kanban_mentions`

**Bitácora:**
`site_logs`, `site_log_types`

**IA:**
`ai.ai_messages`, `ai.ai_usage_logs` *(pendiente de conectar al código)*

**Academia (landing):**
`courses`, `course_modules`, `course_lessons`, `course_enrollments`, `course_lesson_progress`, `course_lesson_notes`, `course_instructors`

**Commerce:**
`plans`, `organization_subscriptions`, `payments`, `coupons`, `mp_preferences`, `paypal_preferences`, `organization_billing_cycles`

---

## 📊 Resumen

| Categoría | Tablas | Sin uso |
|-----------|--------|---------|
| public | 196 | ~55 (~28%) |
| iam | 2 | 0 |
| construction | 8 | 0 |
| ai | 8 | 8 (aún no conectadas) |
| **Total** | **214** | **~63** |

---

## 🎯 Recomendación

Las tablas sin uso se dividen en 3 grupos:

1. **🗓️ Features planeados, no implementados** — Parametrización de tareas, Pins, Calendario, Licitaciones de subcontratos
2. **📦 Infraestructura sin activar** — task_recipe_ratings, organization_recipe_preferences, Capital
3. **🧹 Candidatas a limpieza** — debug_signup_log, labor_roles/levels/insurances (si no se planean), product catalog

**No se recomienda eliminar nada todavía** — son datos de diseño y muchas son parte de roadmap activo.
