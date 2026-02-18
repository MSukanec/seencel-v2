---
description: Crear documentación completa de un Flow (funcionalidad cross-feature) en .agent/flows/
---

# /document-flow — Documentar una Funcionalidad

// turbo-all

## ¿Cuándo usar este workflow?

Cuando el usuario pide documentar una **funcionalidad, flujo o feature** que cruza múltiples partes del sistema.  
Ejemplos: "Acceso externo a proyectos", "Facturación multi-moneda", "Pipeline de onboarding", "Sistema de notificaciones".

La idea es tener un **punto de referencia permanente** que:
1. Explique para qué sirve y cómo funciona (a prueba de boludos)
2. Nombre CADA tabla, función, archivo y RLS involucrado
3. Documente decisiones de diseño y gotchas
4. Trackee el estado y roadmap (qué hay, qué falta, qué mejorar)

---

## Paso 1: Investigar antes de escribir

Antes de crear archivos, investigar todo lo necesario:

- [ ] Leer `DB/SCHEMA.md` o `DB/schema/` para entender tablas involucradas
- [ ] Leer features involucradas (`src/features/*/`)
- [ ] Leer RLS policies y funciones helper relevantes
- [ ] Identificar TODOS los archivos frontend (queries, actions, forms, views, pages)
- [ ] Entender el user journey de punta a punta

**No escribir nada hasta tener claridad total del flujo.**

---

## Paso 2: Crear la carpeta

```
.agent/flows/<nombre-del-flow>/
```

Usar kebab-case, nombre descriptivo. Ejemplos:
- `external-access`
- `multi-currency-billing`
- `notification-pipeline`
- `client-portal`

---

## Paso 3: Crear los 5 archivos estándar

### 3.1 — `README.md` (Puerta de entrada)

Contenido obligatorio:
- **Título**: Nombre de la funcionalidad
- **Alcance**: Una frase que diga qué cubre
- **¿Qué resuelve?**: Ejemplo concreto (escenario real, con nombres de personas y entidades)
- **Conceptos clave**: Tabla con cada concepto → qué es → qué tabla lo respalda
- **Flujo resumido**: Diagrama tipo `A → B → C → D`
- **Documentos en esta carpeta**: Tabla con link a cada archivo

```markdown
# [Nombre de la Funcionalidad]

> **Alcance**: [Una frase]

## ¿Qué resuelve?
[Escenario real con nombres concretos]

## Conceptos clave
| Concepto | Qué es | Tabla |
|----------|--------|-------|

## Flujo resumido
[Diagrama ASCII o descripción lineal]

## Documentos en esta carpeta
| Archivo | Contenido |
|---------|-----------|
```

---

### 3.2 — `user-journey.md` (Paso a paso del usuario)

**Tono**: Tutorial a prueba de boludos. Como si el lector nunca usó Seencel.

Cada paso debe incluir:
- **Qué hace el usuario** (acción en la UI)
- **Tabla(s) involucrada(s)** con columnas clave
- **Archivos frontend** (form, action, query)
- **Estado** (✅ funciona / ⚠️ parcial / 🚧 no existe)

Al final, incluir:
- **Diagrama completo** del flujo (ASCII art o mermaid)
- **Caso multi-actor** si aplica (ej: multi-cliente, multi-proyecto)

```markdown
# User Journey: [Nombre]

> Tutorial paso a paso.

## Escenario
[Quién es quién, qué quiere lograr]

## Paso 1: [Acción]
[Qué hace] → [qué tabla se escribe] → [qué archivo de frontend]

## Paso N: ...

## Diagrama completo
[ASCII art mostrando toda la cadena]
```

---

### 3.3 — `technical-map.md` (Referencia técnica exhaustiva)

**Tono**: Referencia seca, para consulta rápida. No tutorial.

Secciones obligatorias:

1. **Tablas involucradas** — Para cada tabla:
   - Columnas clave con tipo y FK
   - Para qué se usa en este flow

2. **Funciones SQL (RLS Helpers)** — Para cada función:
   - Nombre
   - Lógica en pseudocódigo
   - Archivo donde está definida

3. **Archivos Frontend** — Agrupados por tipo:
   - Queries (archivos + funciones exportadas)
   - Actions (archivos + funciones exportadas)
   - Forms (archivos + qué hacen)
   - Views (archivos + qué muestran)
   - Pages (archivos + qué fetchean)

4. **SQL Scripts** — En orden de ejecución:
   - Archivo, qué hace, estado (ejecutado/pendiente)

5. **Cadena de datos completa** — Desde auth.uid() hasta el dato final

---

### 3.4 — `design-decisions.md` (Por qué se hizo así)

**Tono**: Explicativo, con alternativas descartadas.

Secciones obligatorias:

1. **Decisiones de Diseño** — Para cada decisión:
   - D[N]: Título de la decisión
   - **Elegimos**: qué se hizo
   - **Alternativa descartada**: qué no se hizo
   - **Razón**: por qué

2. **Edge Cases y Gotchas** — Para cada caso:
   - E[N]: Escenario
   - **Impacto**: qué pasa hoy
   - **Solución futura**: cómo se resolvería

3. **Relación con otros Flows** — Tabla:
   - Flow relacionado → cómo se conecta

---

### 3.5 — `roadmap.md` (Estado y pendientes)

**Tono**: Checklist operativo.

Secciones obligatorias:

1. **✅ Completado** — Tabla con qué + detalles
2. **⏳ Pendiente: Corto plazo** — Items numerados con prioridad, descripción, y archivos a modificar
3. **🔮 Pendiente: Largo plazo** — Items de evolución futura

Cada item pendiente debe ser **accionable**: no "mejorar la performance" sino "crear índice compuesto en project_access(project_id, user_id) WHERE is_active = true".

---

## Paso 4: Validar completitud

Checklist final antes de entregar:

- [ ] ¿El README explica qué resuelve con un ejemplo real?
- [ ] ¿El user-journey nombra CADA tabla, función y archivo en cada paso?
- [ ] ¿El technical-map tiene TODAS las tablas, funciones y archivos?
- [ ] ¿Las design-decisions explican POR QUÉ se tomó cada decisión?
- [ ] ¿Los edge cases cubren escenarios de borde reales?
- [ ] ¿El roadmap tiene items accionables con prioridad?
- [ ] ¿Todos los estados son correctos (✅/⚠️/🚧)?
- [ ] ¿Se verificó contra el código real (no de memoria)?

---

## Paso 5: Mantener vivo (OBLIGATORIO)

> ⛔ **Docs desactualizados son PEOR que no tener docs.** Si se hace un cambio y no se actualiza el flow, es un bug.

**REGLA**: Cada vez que se toque CUALQUIER cosa relacionada con un flow documentado (tabla, función SQL, archivo frontend, RLS, etc.), se DEBEN actualizar TODOS los archivos del flow que se vean afectados. **No es optativo.**

| Si hiciste... | Actualizá... |
|---------------|--------------|
| Crear/modificar tabla o función SQL | `technical-map.md` |
| Crear/modificar archivo frontend | `technical-map.md` |
| Cambiar lógica de negocio | `user-journey.md` + `design-decisions.md` |
| Completar un pendiente | `roadmap.md` → mover de ⏳ a ✅ |
| Descubrir un gotcha o edge case | `design-decisions.md` |
| Tomar una decisión de diseño | `design-decisions.md` |
| Cambiar un paso del flujo del usuario | `user-journey.md` |
| Agregar nueva relación con otro flow | `design-decisions.md` → sección Relaciones |

---

## Referencia: Flow de ejemplo

```
.agent/flows/external-access/
├── README.md            → Overview + conceptos + links
├── user-journey.md      → Paso a paso con tablas y archivos
├── technical-map.md     → Referencia técnica exhaustiva
├── design-decisions.md  → Decisiones, edge cases, relaciones
└── roadmap.md           → Estado completado + pendientes
```
