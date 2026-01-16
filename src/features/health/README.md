# Health Data System (Observabilidad de Datos)

Este módulo (`src/features/health`) es un sistema agnóstico para monitorear la calidad e integridad de los datos en toda la aplicación.
Su objetivo es **alertar proactivamente** al usuario sobre datos faltantes, inconsistentes o erróneos directamente en el contexto donde trabaja.

## Arquitectura

El sistema se basa en 3 pilares:

1.  **Tipos Agnósticos (`types.ts`)**:
    *   `EntityHealth`: El reporte de salud de una entidad (ej. un Pago o un Proyecto).
    *   `HealthRule`: La definición de una validación.
    *   `HealthMetric`: El resultado de una validación (Score, Status, Mensaje).

2.  **Reglas Comunes (`rules/common.ts`)**:
    *   Factorías de reglas reutilizables.
    *   NO escribir lógica de validación (ej. "es mayor que cero", "no es fecha futura") en los módulos. Escribirla aquí y reutilizarla.
    *   Ejemplos: `ruleRequired('campo')`, `rulePositiveAmount('monto')`.

3.  **Módulos Específicos (`modules/`)**:
    *   Archivos donde se **configuran** las reglas para una entidad de negocio particular.
    *   Ejemplo `modules/payments.ts`: Importa `ruleRequired` y la aplica a `payment_date`.
    *   Aquí es donde se define QUÉ es saludable para PROYECTOS, PAGOS, CLIENTES, etc.

## Componentes UI

*   **`HealthMonitorBanner`**: Banner/Alerta colapsable diseñado para ponerse en el encabezado de Listas o Tablas. Recibe un reporte y muestra errores si los hay.
*   **`HealthCard`**: Tarjeta detallada para dashboards o paneles laterales.
*   **`HealthBadge`**: Indicador pequeño (Pill) para celdas de tabla o headers.

## Cómo agregar un nuevo módulo (Ej: Proyectos)

1.  Crear `src/features/health/modules/projects.ts`.
2.  Definir las reglas usando las factorías comunes:
    ```typescript
    const projectRules = [
        ruleRequired('name', 'Nombre del Proyecto'),
        ruleRequired('start_date', 'Fecha de Inicio'),
        // ...
    ];
    ```
3.  Crear una función de análisis (ej. `analyzeProjectsHealth`) que itere los datos y use `calculateEntityHealth`.
4.  Integrar el `HealthMonitorBanner` en la página de listado de proyectos.

## Filosofía

*   **Contextual**: Mostrar el error donde se puede arreglar.
*   **Silencio Positivo**: Si todo está bien (Score 100), no mostrar nada. No molestar al usuario.
*   **Data Quality vs Insights**: Esto mide la *calidad del dato* (integridad), no el KPI de negocio.
