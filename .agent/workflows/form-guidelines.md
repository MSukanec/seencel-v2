---
description: Form and Modal UI Guidelines - How to create consistent forms and modals
---

# Form and Modal Guidelines for SEENCEL

## 1. Form Footer Component

**ALWAYS** use the `FormFooter` component for form/modal footers.

```tsx
import { FormFooter } from "@/components/global/form-footer";

<FormFooter
    onCancel={closeModal}       // Cancel button handler
    cancelLabel="Cancelar"       // Cancel button text
    submitLabel="Guardar"        // Submit button text
    isLoading={isSaving}         // Loading state
    submitDisabled={!isValid}    // Disable submit condition
    variant="default"            // Layout: 'default' | 'equal' | 'single'
/>
```

### Variants
- `default`: 25% cancel, 75% submit (standard layout)
- `equal`: 50% / 50% buttons
- `single`: Only submit button (100% width)

## 2. Form Fields (FormGroup)

**ALWAYS** wrap form fields with the `FormGroup` component for consistent spacing, labels, and accessibility:

```tsx
import { FormGroup } from "@/components/ui/form-group";
import { Input } from "@/components/ui/input";

<FormGroup 
    label="Nombre del campo" 
    htmlFor="fieldId"
    required           // Shows asterisk
    error={errors.field}  // Error message (sets aria-invalid)
    helpText="Texto de ayuda opcional"
>
    <Input id="fieldId" ... />
</FormGroup>
```

### Props
| Prop | Type | Description |
|------|------|-------------|
| `label` | `ReactNode` | Field label |
| `htmlFor` | `string` | Links label to input |
| `required` | `boolean` | Shows red asterisk |
| `error` | `string` | Error message (auto-sets `aria-invalid`) |
| `helpText` | `string` | Help text below input |

### A11y Features
- Auto-generates `aria-describedby` linking to error/help text
- Sets `aria-invalid` on child input when error exists
- Error has `role="alert"` for screen readers

## 3. Modal System

Use `useModal` from `@/providers/modal-store` to open modals:

```tsx
import { useModal } from "@/providers/modal-store";

const { openModal, closeModal } = useModal();

// Open a form in the modal - BOTH title AND description are REQUIRED
openModal(
    <MyFormComponent onSuccess={handleSuccess} />,
    { 
        title: t("modal.createTitle"),           // REQUIRED
        description: t("modal.createDescription") // REQUIRED
    }
);
```

## 4. Form Structure

Standard form structure for modals:

```tsx
<form onSubmit={handleSubmit}>
    {/* Form content with padding */}
    <div className="p-4 space-y-4">
        <FormGroup label="Campo" htmlFor="field">
            <Input id="field" ... />
        </FormGroup>
    </div>

    {/* Footer */}
    <FormFooter ... />
</form>
```

## 5. Delete Confirmation

Use `DeleteConfirmationDialog` for destructive actions:

```tsx
import { DeleteConfirmationDialog } from "@/components/global/delete-confirmation-dialog";

<DeleteConfirmationDialog
    open={isOpen}
    onOpenChange={setIsOpen}
    onConfirm={handleDelete}
    title="¿Eliminar elemento?"
    description="Esta acción no se puede deshacer."
    validationText="nombre-a-escribir"  // Optional: type-to-confirm
    isDeleting={isDeleting}
/>
```

## 6. Checklist

Before creating any form/modal:
- [ ] Use `FormGroup` for all form fields
- [ ] Use `FormFooter` component for footer
- [ ] Use `useModal` for opening modals
- [ ] Pass BOTH `title` AND `description` to openModal
- [ ] Use `DeleteConfirmationDialog` for delete actions
- [ ] Use `useTranslations` for all user-facing text
