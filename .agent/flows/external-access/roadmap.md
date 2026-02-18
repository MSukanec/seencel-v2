# External Access Flow — Roadmap

## ✅ Completado

### 1. Tablas base
- [x] `project_access` — tabla unificada de acceso
- [x] `project_clients` — relación contacto ↔ proyecto con rol
- [x] `organization_external_actors` — registro a nivel organización
- [x] RLS para `project_access`
- [x] RLS para `project_clients`

### 2. Frontend: Participantes del proyecto
- [x] Vista de participantes con secciones Clientes y Colaboradores
- [x] `ClientForm` para vincular contactos empresa como clientes del proyecto
- [x] `CollaboratorForm` refactorizado para listar contactos (no actores externos)

### 3. Flujo simplificado (Feb 2026)
- [x] Auto-creación de `organization_external_actors` al vincular colaborador
- [x] Selector de `client_id` (scoping) en `CollaboratorForm`
- [x] Invitación por email para contactos sin cuenta Seencel
- [x] `organization_invitations.project_id` y `client_id` para auto-crear `project_access` al aceptar
- [x] RPC `accept_external_invitation` actualizado para crear `project_access` automáticamente
- [x] Documentación `user-journey.md` actualizada con flujo de 4 pasos

---

## 🔲 Pendiente: Corto plazo

### 1. RLS paralelas para client scoping
Las RLS de tablas financieras (`client_commitments`, `client_payments`, etc.) necesitan políticas que permitan lectura a usuarios con `project_access.client_id` matching.

### 2. Auto-link contacto ↔ usuario por email
El pipeline `contact_auto_creation_pipeline` ya existe. Verificar que funciona correctamente cuando se crea un contacto con email de un usuario existente.

---

## 🔮 Pendiente: Largo plazo

### 3. UI para vincular contacto ↔ usuario manualmente
Agregar botón "Vincular usuario" en la ficha del contacto para vincular manualmente un contacto con un usuario de Seencel (para casos donde el email no coincide).

### 4. Routing automático para usuarios externos
Cuando un usuario externo (sin org membership) inicia sesión, detectar sus `project_access` entries y redirigir automáticamente al Portal de Cliente correspondiente.

### 5. Permisos granulares por portal
`client_portal_settings` define qué secciones son visibles. Evaluar si estos settings deben ser por `project_client` o por proyecto.

### 6. Notificaciones para clientes externos
Cuando se carga un pago, se sube un documento, o cambia el avance → notificar a los usuarios con `project_access` para ese proyecto.
