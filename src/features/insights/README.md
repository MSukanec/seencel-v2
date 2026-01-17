# Insights System Audit & Roadmap

Este documento detalla el estado actual del sistema de Insights (`src/features/insights`), sus fortalezas, debilidades y el plan de evolución.

## 1. Estado Actual

El sistema de insights opera bajo un patrón de **Rules Engine (Motor de Reglas)**. 
Cada "Insight" no es una consulta a base de datos ad-hoc, sino el resultado de aplicar una **Regla Lógica** sobre un **Contexto de Datos** normalizado.

### Arquitectura
1.  **Contexto Genérico (`InsightContext`)**: Una interfaz unificada que abstrae los datos (series de tiempo, categorías, totales) sin importar su origen (Gastos, Ingresos, Proyectos).
2.  **Reglas Genéricas (`rules.ts`)**: Funciones puras que reciben el contexto y retornan un `Insight` o `null`. Ej: "Detectar tendencia sostenida", "Detectar concentración de Pareto".
3.  **Adaptadores de Dominio (`clients.ts`)**: Funciones que transforman datos crudos de una feature específica (ej: `ClientPaymentView[]`) al `InsightContext`. También pueden inyectar reglas manuales específicas del dominio.
4.  **UI (`InsightCard`)**: Componente rico que renderiza el insight con iconografía, severidad y acciones ejecutables.

## 2. Auditoría

### ✅ Lo que se hace bien (Strengths)
*   **Desacoplamiento Lógico**: Las reglas matemáticas (detectar tendencias, proyecciones) están 100% separadas del dominio de datos. Esto permite reutilizar la lógica de "Tendencia de Gasto" para "Tendencia de Ingresos" casi sin costo.
*   **Sistema de Acciones Abstractas**: Los insights no tienen callbacks hardcodeados. Retornan objetos `InsightAction` (`navigate`, `filter`, `open`) que la UI interpreta. Esto es vital para escalar y soportar deeplinks.
*   **Jerarquía de Severidad**: El uso semántico de `info`, `warning`, `critical` y `positive` permite a la UI adaptarse visualmente sin lógica condicional dispersa.
*   **Adaptadores Flexibles**: El archivo `clients.ts` demuestra cómo mezclar reglas genéricas con reglas de negocio muy específicas ("Clientes con deuda > $1").

### ❌ Lo que se hace mal (Weaknesses)
*   **Reemplazo de Texto Frágil**: Actualmente, para reutilizar reglas de gastos en ingresos, se usa `.replace(/gasto/gi, 'ingreso')`. Esto es propenso a errores gramaticales y dificulta la internacionalización.
*   **Contexto Limitado**: El `InsightContext` está muy sesgado hacia series mensuales y categorías. Faltan dimensiones como "Día de la semana", "Métodos de pago" o "Usuarios".
*   **Umbrales Hardcodeados**: Los disparadores (ej: "cambio > 15%") están fijos en el código. No se adaptan a la volatilidad natural de cada cliente.
*   **Falta de Memoria**: El sistema es "stateless". Si el usuario cierra un insight, este reaparecerá en la siguiente recarga porque no hay persistencia de "Insights descartados".

## 3. Innovación y Oportunidades

### Corto Plazo: Refinamiento
*   **Contexto de Dominio**: Eliminar el `replace` de texto. Las reglas deben aceptar un parámetro `domain: 'expense' | 'income' | 'neutral'` y devolver textos apropiados usando claves de traducción o templates.
*   **Nuevas Reglas de Cartera**:
    *   *Cliente en Riesgo*: Detectar clientes que bajaron su frecuencia de pago (Churn risk).
    *   *Estacionalidad*: Detectar si un cliente siempre paga tarde.

### Mediano Plazo: Interactividad
*   **Acciones Correctivas**: Permitir que un insight ejecute mutaciones. Ej: "Tipo de cambio faltante" -> Botón "Asignar último conocido".
*   **Persistencia de Estado**: Guardar en `localStorage` o DB qué insights fueron cerrados por el usuario para no spamear.

### Largo Plazo (Moonshots)
*   **AI Synthesis**: En lugar de una lista de 5 tarjetas, enviar el contexto a un LLM pequeño para generar un "Resumen Ejecutivo" en un solo párrafo de texto natural.
*   **Detección de Anomalías Estadística**: Usar algoritmos como Holt-Winters (ya hay un inicio con la proyección lineal) para detectar anomalías reales basadas en la varianza histórica, no solo en % fijos.

## 4. Roadmap Técnico

1.  **Fase 1: Cleanup (Inmediato)**
    *   Refactorizar `growthExplainedInsight` y otras reglas para aceptar `domainLabel` ('gasto', 'ingreso', 'costo') como argumento, eliminando el `.replace`.

2.  **Fase 2: Expansión**
    *   Implementar `ChurnRiskRule` en el adaptador de clientes.
    *   Agregar `volatility` al `InsightContext` para hacer dinámicos los umbrales de alerta.

3.  **Fase 3: Smart Actions**
    *   Convertir el sistema de acciones para soportar `type: 'mutation'` y conectar con Server Actions.
