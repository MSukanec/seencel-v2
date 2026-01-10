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

---

## 🟡 Fase 1: Robustez de Datos (COMPLETADO) ✅

El sistema Legacy tenía validaciones más estrictas. Necesitamos igualar esa calidad para evitar datos sucios.

- [x] **Normalizadores de Datos (`useValueNormalizer`)**
    - [x] Limpiar teléfonos (quitar espacios, guiones, formateo estándar) *Nota: No forzamos +54 por seguridad*
    - [x] Estandarizar Emails (lowercase, trim)
    - [x] Parsear Monedas "Sucias" (ej: `$ 1.500,00` -> `1500.00`) - *Ya implementado en `normalizeCurrency`*
- [ ] **Mejora en Feedback de Validación**
    - [ ] UI: Resaltar celda exacta con error en rojo
    - [ ] UI: Mensajes de error más amigables ("Falta el @ en el mail")

---

## 🔴 Fase 2: El Gran Salto - Resolución de Conflictos (CRÍTICO)

Esta es la funcionalidad "Killer Feature" que tenía el Legacy y nos falta. Es la diferencia entre un sistema frustrante y uno mágico.

- [ ] **Detección de "Datos Nuevos"**
    - [ ] Detectar valores Foreign Key que no existen (ej: El Excel dice Billetera: "Caja Chica" pero no existe en DB).
- [ ] **UI de Resolución de Conflictos (Paso Intermedio)**
    - [ ] Crear un paso nuevo en el Wizard (después de validar).
    - [ ] Permitir al usuario decidir al vuelo:
        - [ ] **Opción A:** Crear el valor nuevo (ej: Crear la billetera "Caja Chica").
        - [ ] **Opción B:** Mapear a existente (ej: Todo lo que diga "Caja Chica" va a "Efectivo").
        - [ ] **Opción C:** Ignorar fila.

---

## 🔵 Fase 3: Innovación & "Nice to Have"

Cosas para superar al sistema anterior una vez que lo básico esté sólido.

- [ ] **AI Fallback con GPT-4 (Opcional)**
    - [ ] Usar LLM solo si el *Fuzzy Match* y la *Memoria* fallan. (Actualmente la Memoria cubre el 80% de los casos).
- [ ] **Historial de Importaciones**
    - [ ] Log de "Quién importó qué y cuándo".
    - [ ] Botón **Undo/Deshacer** (Soft delete de todo un lote de importación).
- [ ] **Templates de Importación**
    - [ ] Guardar configuraciones complejas (ej: "Importación Mensual de Banco Galicia") para reutilizar con 1 click.

---

### 🧠 Conclusión Técnica
La base V2 está lista y es sólida. **No necesitamos reescribir nada**, solo *extender*.
El foco absoluto debe ser la **Fase 2 (Conflictos)**. Si logramos eso, el sistema será world-class.
