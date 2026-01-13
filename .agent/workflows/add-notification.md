---
description: Guía paso a paso para agregar nuevas notificaciones al sistema (SQL Back + Frontend).
---

# 🔔 Workflow: Sistema de Notificaciones Enterprise

Este documento es la **fuente de verdad** para gestionar el sistema de notificaciones de SEENCEL.

## 📂 Archivos Clave

| Tipo | Archivo / Ubicación | Descripción |
| :--- | :--- | :--- |
| **Lógica SQL** | `notifications-logic.sql` (en db) | Contiene la función maestra `send_notification`. |
| **Componente UI** | `src/features/notifications/components/notifications-popover.tsx` | La "campanita". Maneja Realtime y navegación. |
| **Pagina Settings** | `src/features/notifications/components/NotificationsSettings.tsx` | Historial completo de notificaciones. |
| **Hooks/Queries** | `src/features/notifications/queries.ts` | Fetch de datos desde Supabase. |

---

## 🚀 Cómo agregar una NUEVA Notificación (Paso a Paso)

El sistema usa **Database Triggers**. No necesitas tocar el código del backend (Next.js) para disparar notificaciones, solo SQL.

### Paso 1: Definir el Evento
Ejemplo: "Quiero notificar al usuario cuando su proyecto sea aprobado".
*   **Tabla:** `projects`
*   **Columna:** `status` cambia a `'approved'`
*   **Destinatario:** Dueño del proyecto (`user_id`)
*   **Acción de clic:** Ir al detalle del proyecto (`/project/[id]`)

### Paso 2: Crear el Trigger (SQL)
Ejecuta esto en tu editor SQL (Supabase). Usa esta plantilla exacta:

```sql
-- 1. Función del Trigger
CREATE OR REPLACE FUNCTION public.trigger_notify_project_approved()
RETURNS TRIGGER AS $$
BEGIN
    -- Validar condición (ej. status cambió a approved)
    IF NEW.status = 'approved' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'approved') THEN
        
        -- Llamar a la función MAESTRA
        PERFORM public.send_notification(
            NEW.user_id,             -- 1. Destinatario (UUID)
            'success',               -- 2. Tipo: 'info', 'success', 'warning', 'error'
            'Proyecto Aprobado',     -- 3. Título
            'Tu proyecto "' || NEW.name || '" ha sido aprobado.', -- 4. Cuerpo
            jsonb_build_object(      -- 5. DATA (Importante para navegación)
                'project_id', NEW.id,
                'url', '/project/' || NEW.id -- <---  URL DE DESTINO (Deep Linking)
            ), 
            'direct'                 -- 6. Audiencia: 'direct' o 'admins'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Activar el Trigger
DROP TRIGGER IF EXISTS trg_notify_project_approved ON public.projects;
CREATE TRIGGER trg_notify_project_approved
AFTER INSERT OR UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.trigger_notify_project_approved();
```

### Paso 3: Tipos de Notificaciones
*   **Directa (Un Usuario):** Pasa el `user_id` y usa audience `'direct'`.
*   **Broadcast (Todos los Admins):** Pasa `NULL` como user_id y usa audience `'admins'`.
    *   *Ejemplo:* Pagos, Nuevos Registros.

### Paso 4: Frontend (Automático)
Una vez creado el trigger SQL:
1.  **Icono/Badge:** Se actualizará solo (Realtime) en la UI.
2.  **App PWA:** El icono de la app mostrará el numerito (Badge API).
3.  **Clic:** Al hacer clic, el componente `NotificationsPopover` buscará el campo `url` en el JSON que enviaste y redirigirá al usuario.

---

## 🛠 Mantenimiento

### Ver todas las notificaciones activas
Como son triggers, están en la base de datos.
```sql
SELECT event_object_table, trigger_name 
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND trigger_name LIKE '%notify%';
```

### Desactivar una notificación
Solo borra el trigger.
```sql
DROP TRIGGER nombre_del_trigger ON nombre_de_tabla;
```
