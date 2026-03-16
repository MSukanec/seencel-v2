# Proyectos — Gestión de Proyectos de Obra

> **Alcance**: Crear, configurar, listar y administrar proyectos de obra/construcción dentro de una organización, incluyendo identidad visual, ubicación, clasificación (tipo/modalidad), participantes (clientes y colaboradores), y límites de plan.

## ¿Qué resuelve?

**Escenario**: Constructora Patagonia maneja 5 obras simultáneas — un edificio de departamentos en Palermo, una casa en Nordelta, un local comercial en Recoleta, etc. María, la directora de obra, necesita:
1. Crear cada proyecto con nombre, código interno, tipo (residencial/comercial) y modalidad (llave en mano)
2. Asignarle un color identificativo y opcionalmente una imagen con paleta extraída
3. Registrar la ubicación exacta con geocoding y verla en un mapa global
4. Vincular clientes al proyecto para que accedan al portal del cliente
5. Ver un dashboard con todos los proyectos, filtrar por estado, y en la sidebar tener acceso directo a cada uno
6. Que el plan de la organización limite la cantidad de proyectos activos simultáneamente

Sin Projects, no existiría la estructura central sobre la que gravitan materiales, tareas, finanzas, subcontratos y presupuestos.

## Conceptos clave

| Concepto | Qué es | Tabla |
|----------|--------|-------|
| **Proyecto** | Entidad central: una obra con nombre, código, estado, color e imagen | `projects.projects` |
| **Datos del Proyecto** | Info extendida: ubicación (lat/lng/dirección), superficies, descripción | `projects.project_data` |
| **Configuración** | Personalización visual: color custom, palette theme, días laborales | `projects.project_settings` |
| **Tipo** | Clasificación por naturaleza (Residencial, Comercial, Industrial, etc.) — org-owned o system | `projects.project_types` |
| **Modalidad** | Clasificación por contrato (Llave en mano, Administración, etc.) — org-owned o system | `projects.project_modalities` |
| **Cliente** | Contacto vinculado al proyecto con rol, estado y acceso al portal | `projects.project_clients` |
| **Rol de Cliente** | Categoría del cliente dentro del proyecto (Propietario, Inversor, etc.) | `projects.client_roles` |
| **Portal Branding** | Personalización visual del portal del cliente (colores, hero, footer) | `projects.client_portal_branding` |
| **Portal Settings** | Qué secciones ve el cliente (dashboard, avance, presupuestos, pagos) | `projects.client_portal_settings` |
| **Estado** | `active`, `planning`, `inactive`, `completed` — enum `project_status` | columna `projects.status` |
| **Límite activo** | Cantidad máx de proyectos activos según plan (`billing.check_active_project_limit`) | función SQL |

## Flujo resumido

```
Crear Proyecto → Configurar Detalle → Vincular Clientes → Operar
    (form)           (detail views)        (panels)        (sidebar)
  projects       project_data          project_clients    Materiales
  project_       project_settings      client_roles       Tareas
  _types         portal_branding       portal_settings    Finanzas
  _modalities    (ubicación, color)    (invitaciones)     Subcontratos
                                                          Presupuestos
```

## Documentos en esta carpeta

| Archivo | Contenido |
|---------|-----------|
| [README.md](./README.md) | Este archivo — overview y conceptos |
| [user-journey.md](./user-journey.md) | Paso a paso del usuario con tablas y archivos |
| [technical-map.md](./technical-map.md) | Referencia técnica exhaustiva |
| [design-decisions.md](./design-decisions.md) | Decisiones, edge cases y relaciones |
| [roadmap.md](./roadmap.md) | Estado completado + pendientes accionables |
