# 📋 Roadmap & Auditoría: Sistema de Importación Seencel V2

Este documento sirve como guía maestra para el desarrollo del "Universal Import System", comparando nuestro progreso actual (V2) con la auditoría del sistema Legacy.

## 🟢 Estado Actual: Lo que YA funciona (V2)

### Infraestructura Modernizada
- [x] **Arquitectura Next.js + Server Actions** (Más robusto que el sistema React-only anterior)
- [x] **Soporte Nativo Excel (.xlsx) y CSV** (Legacy usaba librerías separadas/complejas)
- [x] **Modal "Wizard" Fluido** (Upload -> Map -> Validate -> Import)

### UX Improvements (✅ Recientemente Completado)
- [x] **Layout Consistente y Responsive**:
    - [x] **Altura Fija en Escritorio**: `80vh` para evitar overflow y mantener controles visibles.
    - [x] **Smart Footer**: Botones de navegación siempre visibles (z-index + sticky behavior), no se ocultan con el contenido.
    - [x] **Scroll Interno Independiente**: El contenido scrollea mientras header y footer permanecen fijos.
- [x] **Header Dinámico**: La cabecera del modal se adapta contextualmente a cada paso (Upload, Mapping, Validation), eliminando títulos redundantes.
- [x] **Feedback Visual Optimizado**:
    - [x] **Preview Inmediato**: Muestra las primeras filas para confirmar que el archivo se leyó bien.
    - [x] **Persistencia de Estado**: Al volver atrás desde el paso 2, el archivo y preview se mantienen (no hay que volver a subir).
    - [x] **Mapeo Intuitivo**:
        - Etiquetas claras ("Columna en tu archivo" vs "Campo en sistema Seencel").
        - **Highlight de Obligatorios**: Campos requeridos marcados con color de acento y texto explícito.
        - Estado del sistema de mapeo visible (x campos requeridos faltantes / todo ok).

### Inteligencia & Aprendizaje
- [x] **Integración `ia_import_mapping_patterns`** (El "Cerebro" del sistema)
- [x] **Smart Mapping Automático** (Sugiere columnas basado en uso histórico)
- [x] **Fuzzy Matching** (Algoritmo de similitud de texto para sugerencias iniciales)

### Auditoría y Seguridad del Dato (✅ NUEVO)
- [x] **Activity Log Robusto**: Sistema de logging basado en triggers de base de datos (infalible).
- [x] **Historial de Importaciones**:
    - [x] Log de "Quién importó qué, cuándo y cuántos registros".
    - [x] **Botón Undo/Deshacer**: Capacidad de revertir (Soft delete) todo un lote de importación con un click.
    - [x] **UI Profesional**: Tabla de auditoría con filtros, badges semánticos y metadata detallada.
- [x] **Normalizadores de Datos (`useValueNormalizer`)**
    - [x] Limpiar teléfonos (quitar espacios, guiones, formateo estándar)
    - [x] Estandarizar Emails (lowercase, trim)
    - [x] Parsear Monedas "Sucias" (ej: `$ 1.500,00` -> `1500.00`)

---

## 🟢 Fase 2: El Gran Salto - Resolución de Conflictos (✅ COMPLETADO)

Esta es la funcionalidad "Killer Feature" que tenía el Legacy y nos falta. Es la diferencia entre un sistema frustrante y uno mágico.

- [x] **Detección de "Datos Nuevos"**
    - [x] Detectar valores Foreign Key que no existen (ej: El Excel dice Billetera: "Caja Chica" pero no existe en DB).
- [x] **UI de Resolución de Conflictos (Paso Intermedio)**
    - [x] Crear un paso nuevo en el Wizard (después de validar).
    - [x] Permitir al usuario decidir al vuelo:
        - [x] **Opción A:** Crear el valor nuevo (ej: Crear la billetera "Caja Chica").
        - [x] **Opción B:** Mapear a existente (ej: Todo lo que diga "Caja Chica" va a "Efectivo").
        - [x] **Opción C:** Ignorar fila.

---

## 🔵 Fase 3: Innovación & "Nice to Have" (Futuro)

Cosas para superar al sistema anterior una vez que lo básico esté sólido.

- [ ] **AI Fallback con GPT-4 (Opcional)**
    - [ ] Usar LLM solo si el *Fuzzy Match* y la *Memoria* fallan. (Actualmente la Memoria cubre el 80% de los casos).
- [ ] **Templates de Importación**
    - [ ] Guardar configuraciones complejas (ej: "Importación Mensual de Banco Galicia") para reutilizar con 1 click.
- [ ] **Mejora en Feedback de Validación (UI)**
    - [ ] Resaltar celda exacta con error en rojo en la tabla de preview.
    - [ ] UI: Mensajes de error más amigables ("Falta el @ en el mail").

---

### 🧠 Conclusión Técnica
La base V2 está **muy sólida**. Ya tenemos Auditoría, Undo, Mapping Inteligente y una UI estable.
El foco absoluto ahora debe ser la **Fase 2 (Conflictos)**.
