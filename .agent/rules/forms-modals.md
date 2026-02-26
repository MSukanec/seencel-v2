---
name: Seencel Forms & Panels Rule
description: Regla OBLIGATORIA para crear formularios en Seencel V2. Los forms se abren en Panels (drawers), NO en modales.
---

# Forms & Panels

## 0. Lectura Obligatoria (🚨 ANTES DE EMPEZAR)

Antes de crear o modificar cualquier formulario, el agente **DEBE** leer completo:

```
.agent/skills/seencel-panel-forms/SKILL.md
```

No se permite crear forms sin haber leído ese archivo primero.

> ⛔ **NUNCA** usar `openModal` para formularios. Los modales son SOLO para confirmaciones y alertas.

---

## 1. Panel vs Modal

| Superficie | Uso | Ejemplo |
|-----------|-----|---------|
| **Panel** (openPanel) | Crear, editar, ver detalle | Forms, detail views |
| **Modal** (openModal) | Confirmar, alertar | Delete confirm, alerts |

---

## 2. Forms Self-Contained

Todo form define su propia presentación con `setPanelMeta`:

```tsx
const { closePanel, setPanelMeta } = usePanel();

useEffect(() => {
    setPanelMeta({
        icon: Package,
        title: isEditing ? "Editar" : "Crear",
        description: "...",
        size: "md",
        footer: { submitLabel: isEditing ? "Guardar" : "Crear" }
    });
}, [isEditing, setPanelMeta]);

return (
    <form id={formId} onSubmit={handleSubmit}>
        {/* Fields */}
    </form>
);
```

> ⛔ **NUNCA** usar `<FormFooter>` dentro del form — el container lo maneja.
> ⛔ **NUNCA** pasar title/description/footer en `openPanel()` — el form lo define.

---

## 3. Field Factories (🚨 OBLIGATORIO)

**SIEMPRE que exista un Field Factory, se DEBE usar.** Se importan desde:

```tsx
import {
    TextField, AmountField, CurrencyField, DateField, TimeField,
    ProjectField, ContactField, WalletField, NotesField,
    ReferenceField, ColorField, SwitchField, AssignedToField,
    ExchangeRateField, UploadField, SelectField,
} from "@/components/shared/forms/fields";
```

> ⛔ **NUNCA** usar `Input`, `Select`, `Textarea`, `Calendar` directamente si existe un Field Factory.
> ⛔ **NUNCA** usar `MultiFileUpload` directamente — usar `UploadField`.

---

## 4. Legacy Migration

- **Nuevo form** → Siempre Panel
- **Legacy form** (usa `openModal`) → Migrar cuando se recorre la página
- **Confirmaciones/Alertas** → Siguen siendo modales (`DeleteDialog`, `AlertDialog`)

---

## Checklist

- [ ] ¿Se leyó `seencel-panel-forms/SKILL.md` antes de implementar?
- [ ] ¿El form usa `setPanelMeta` (icon, title, description, size, footer)?
- [ ] ¿Usa `<form id={formId}>`?
- [ ] ¿NO tiene `<FormFooter>`?
- [ ] ¿Está registrado en `panel-registry.ts`?
- [ ] ¿Se usan Field Factories?
- [ ] ¿La view usa `openPanel(panelId, { datos })` sin presentación?
