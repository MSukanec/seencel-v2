# Concepto: Tarea de Construcción — Los 3 Pilares

> Última actualización: 2026-02-09

---

## 🎯 ¿Qué es una Tarea de Construcción?

Una **tarea de construcción** es la unidad mínima de trabajo que se puede presupuestar, planificar y ejecutar en una obra. Toda tarea se define por la intersección de exactamente **3 pilares**:

```
                    ┌─────────────┐
                    │   ELEMENTO   │
                    │ (¿Qué es?)  │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
       ┌──────┴──────┐    │    ┌───────┴───────┐
       │   ACCIÓN    │    │    │    SISTEMA    │
       │ (¿Qué se   │    │    │ CONSTRUCTIVO  │
       │   hace?)    │    │    │ (¿Cómo se    │
       └─────────────┘    │    │  construye?)  │
                          │    └───────────────┘
                          ▼
                   ┌─────────────┐
                   │    TAREA    │
                   │  CONCRETA   │
                   └─────────────┘
```

### Ejemplo concreto

| Pilar | Valor | Ejemplo |
|-------|-------|---------|
| **Elemento** | Muro | La cosa física que se interviene |
| **Acción** | Ejecución | Lo que se hace sobre el elemento |
| **Sistema Constructivo** | Mampostería Tradicional | La técnica con la que se hace |

**Tarea resultante**: *"Ejecución de Muro en Mampostería Tradicional"*

---

## 📐 Pilar 1: Elemento

> **¿Sobre qué se actúa?**

Un **elemento constructivo** es la entidad física o funcional sobre la que se realiza trabajo. Son universales y no pertenecen a ninguna organización.

### Ejemplos
- Contrapiso, Muro, Viga, Columna, Losa, Cimiento, Carpeta
- Puerta, Ventana, Baranda
- Cañería, Tendido eléctrico

### Características
- Tabla: `task_elements`
- Son de **sistema** (administrados centralmente)
- Tienen unidad de medida asociada (m², ml, u)
- Tienen **parámetros** configurables (espesor, largo, superficie)
- Se agrupan en **rubros** (divisions) por afinidad

### Relaciones
- `task_division_elements`: Qué elementos pertenecen a qué rubros
- `task_element_parameters`: Qué parámetros aplican a cada elemento
- `task_element_actions`: Qué acciones son compatibles con cada elemento
- `task_element_systems` *(nuevo)*: Qué sistemas constructivos aplican a cada elemento

---

## ⚡ Pilar 2: Acción

> **¿Qué se hace?**

Una **acción** define la actividad que se realiza sobre un elemento. Son finitas y universales.

### Ejemplos
- Ejecución, Demolición, Reparación
- Instalación, Desinstalación
- Limpieza, Preparación
- Impermeabilización, Aislación

### Características
- Tabla: `task_actions` (ex `task_kind`)
- Son de **sistema** (set fijo, no editable por organizaciones)
- Tienen `short_code` para generación de códigos (EJE, DEM, REP, etc.)
- No tienen campos de soft-delete ni ordering (set inmutable)

### Relaciones
- `task_element_actions`: Qué acciones son compatibles con qué elementos
- `task_division_actions`: Qué acciones son compatibles con qué rubros

---

## 🏗️ Pilar 3: Sistema Constructivo *(NUEVO)*

> **¿Cómo se construye?**

Un **sistema constructivo** describe la técnica, metodología o tecnología con la que se ejecuta una tarea. Es el diferenciador clave: el mismo elemento con la misma acción puede tener recetas, costos y duraciones radicalmente distintas según el sistema.

### Ejemplos
- Mampostería Tradicional
- Steel Frame (Construcción en Seco)
- Hormigón Armado In Situ
- Hormigón Premoldeado
- Madera
- Drywall (Placas de Yeso)

### Características
- Tabla: `task_construction_systems`
- Son de **sistema** (administrados centralmente)
- Tienen `slug` para referencias programáticas
- Orden configurable para mostrar en UI
- Soft delete estándar

### Relaciones
- `task_element_systems`: Qué sistemas constructivos son compatibles con qué elementos

---

## 🔗 Grafo de Compatibilidad

Las tablas de compatibilidad forman un **grafo** que permite filtrar opciones de forma inteligente en el wizard paramétrico:

```
task_divisions
    ├── ↔ task_elements      (via task_division_elements)
    └── ↔ task_actions       (via task_division_actions)

task_elements
    ├── ↔ task_actions       (via task_element_actions)
    ├── ↔ task_parameters    (via task_element_parameters)
    └── ↔ task_construction_systems  (via task_element_systems)
```

### Flujo del Wizard Paramétrico

```
1. Seleccionar ELEMENTO
   └─→ Filtrar acciones compatibles (task_element_actions)
   └─→ Filtrar sistemas compatibles (task_element_systems)

2. Seleccionar ACCIÓN
   └─→ Ya filtrada por elemento

3. Seleccionar SISTEMA CONSTRUCTIVO (futuro)
   └─→ Ya filtrado por elemento

4. Completar PARÁMETROS
   └─→ Automáticos según elemento (task_element_parameters)

5. Confirmar → Genera tarea con nombre:
   "[Acción] de [Elemento] en [Sistema]"
   Ejemplo: "Ejecución de Muro en Mampostería Tradicional"
```

---

## 📦 Receta

Una **receta** es la lista de recursos necesarios para ejecutar una tarea específica. La receta puede variar según los parámetros del elemento Y según el sistema constructivo:

| Recurso | Ejemplo |
|---------|---------|
| **Materiales** | Cemento, Arena, Ladrillos, Hierro |
| **Mano de obra** | Oficial albañil, Ayudante |
| **Equipos** *(futuro)* | Hormigonera, Andamio |

### Receta + Parámetros
Los parámetros del elemento (espesor, superficie, etc.) determinan las **cantidades** de la receta. En el futuro, un motor de fórmulas permitirá calcular cantidades automáticamente:

```
Cemento (kg) = superficie × espesor × 0.35
Arena (m³)   = superficie × espesor × 0.5
```

### Receta + Sistema Constructivo
El sistema constructivo cambia radicalmente la receta. Ejemplo para "Ejecución de Muro":

| Material | Mampostería Tradicional | Steel Frame |
|----------|------------------------|-------------|
| Ladrillos | ✅ 60 por m² | ❌ |
| Cemento | ✅ 20 kg por m² | ❌ |
| Perfiles metálicos | ❌ | ✅ 5 ml por m² |
| Placas de OSB | ❌ | ✅ 1.1 por m² |
| Aislación | ❌ | ✅ 1.1 por m² |

---

## ⚖️ Principios de Diseño

1. **Los pilares son universales** — No pertenecen a ninguna organización. Son vocabulario compartido del sistema.

2. **Las recetas son por organización** — Cada empresa define su propia forma de ejecutar una tarea (sus proveedores, sus precios, sus rendimientos).

3. **El grafo de compatibilidad guía al usuario** — Nunca se muestra una opción inválida. Si un elemento no es compatible con un sistema constructivo, no aparece.

4. **El nombre de la tarea se genera automáticamente** — A partir de los 3 pilares: `[Acción] de [Elemento] en [Sistema]`.

5. **El sistema constructivo es gradual** — Se puede crear una tarea sin sistema constructivo (como se hace hoy). El sistema constructivo es un enriquecimiento futuro.
