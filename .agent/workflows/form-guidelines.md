---
description: Form and Modal UI Guidelines - How to create consistent forms and modals
---

# Form and Modal Guidelines for SEENCEL

## 1. Modal System (Enterprise)

We use a **Stacked Modal System** with centralized state management.

### Basic Usage
Use `useModal` from `@/providers/modal-store`.

```tsx
import { useModal } from "@/providers/modal-store";

const { openModal, closeModal } = useModal();

openModal(
    <MyComponent />, 
    { 
        title: t("modal.title"),
        description: t("modal.description"),
        size: 'md' // 'sm' | 'md' | 'lg' | 'xl' | 'full'
    }
);
```
> [!IMPORTANT]
> The Modal Body has **default padding (p-4)**. 
> - Your form content should NOT have internal padding (it inherits system padding).
> - Your `FormFooter` MUST have `className="-mx-4 -mb-4 mt-6"` to break out of the padding and align flush with the bottom.
> **Spacing Standard**: Use `space-y-4` or `gap-4` (16px) for layout. Never use `space-y-6` (24px) for field separation.

> [!CAUTION]
> **HEADER DESCRIPTION IS MANDATORY**: Never forget the description in the modal header. It is crucial for user context. If a translation key isn't ready, use a hardcoded fallback, but **NEVER** leave it empty.

### Standard Form Layout
```tsx
<form className="flex flex-col h-full">
    <div className="flex-1 overflow-y-auto space-y-4"> 
        {/* Use space-y-4 for vertical rhythm */}
        
        {/* Or use Grid gap-4 */}
        <div className="grid grid-cols-2 gap-4">
             {...}
        </div>
    </div>
    <FormFooter 
        className="-mx-4 -mb-4 mt-6"
        {...props} 
    />
</form>
```

### Advanced Features

#### 1. Stacked Modals
You can call `openModal` while another modal is open. The new modal will stack on top. `closeModal` pops the top-most modal.

#### 2. URL Synchronization (Deep Linking)
To allow a modal to be opened via URL (and persist on refresh):
1. Register component in `@/providers/modal-registry.tsx`.
2. Pass `key` to `openModal`:

```tsx
openModal(<MyComponent />, {
    title: "...",
    key: "my-modal-key" // Updates URL to ?modal=my-modal-key
});
```

#### 3. Protection (Unsaved Changes)
Prevent accidental closure if form is dirty.

```tsx
const { setBeforeClose } = useModal();
const { isDirty } = useFormState();

useEffect(() => {
    setBeforeClose(async () => {
        if (!isDirty) return true;
        // User must confirm
        return confirm("Discard changes?"); // Or use custom dialog logic
    });
}, [isDirty]);
```

#### 4. Lazy Loading (Performance)
**ALWAYS** lazy load heavy form components in Manager files:

```tsx
const ProjectForm = dynamic(() => import('./ProjectForm').then(m => m.ProjectForm), {
    loading: () => <p>Loading...</p>
});
```

## 2. Form Architecture

### Form Footer
**ALWAYS** use `FormFooter`. It automatically handles **Shortcuts** (`Cmd+Enter` to submit).

```tsx
import { FormFooter } from "@/components/global/form-footer";

<FormFooter
    onCancel={closeModal}
    onSubmit={handleSubmit} // Optional if inside <form>
    isLoading={isSaving}
    submitLabel="Guardar"
    submitLabel="Guardar"
    variant="default" // 'default' | 'equal' | 'single'
    className="-mx-4 -mb-4 mt-6" // Required to break out of Modal Body padding
/>
```

### Form Fields (FormGroup)
**ALWAYS** wrap inputs in `FormGroup` for accessibility (`aria-invalid`, `aria-describedby`).

```tsx
<FormGroup 
    label="Email" 
    htmlFor="email"
    error={errors.email?.message} 
    required
>
    <Input id="email" {...register("email")} />
</FormGroup>
```

### Specialized Inputs
*   **Phone Numbers**: MUST use `<PhoneInput />`.
*   **Countries**: MUST use `<CountrySelector />` (if available).

```tsx
import { PhoneInput } from "@/components/ui/phone-input";

<FormGroup label="Phone" htmlFor="phone">
    <PhoneInput 
        id="phone" 
        value={value} 
        onChange={setValue} 
        defaultCountry="AR" 
    />
</FormGroup>
```

## 4. Image Uploads

> [!CAUTION]
> **ALWAYS USE CLIENT-SIDE COMPRESSION**: When building any form or component that uploads images (avatars, covers, photos), you **MUST** use our `compressImage` utility before uploading. This reduces bandwidth, speeds up uploads, and saves storage costs.

### Required Import
```tsx
import { compressImage } from "@/lib/client-image-compression";
```

### Available Presets
| Preset | Max Size | Max Dimension | Use Case |
|---|---|---|---|
| `'avatar'` | 0.5 MB | 512px | User/Contact profile pictures |
| `'project-cover'` | 1 MB | 1920px | Project banners, covers |
| `'sitelog-photo'` | 0.8 MB | 1280px | Site log photos |
| `'course-cover'` | 1 MB | 1920px | Course covers |
| `'document'` | 2 MB | 2048px | Document scans (preserves EXIF) |
| `'default'` | 1 MB | 1600px | General purpose |

### Example Usage
```tsx
const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ALWAYS compress before upload
    const compressedFile = await compressImage(file, 'avatar');

    const formData = new FormData();
    formData.append('file', compressedFile);

    await uploadToServer(formData);
};
```

> [!NOTE]
> GIFs are automatically skipped (to preserve animation). The utility returns the original file on error, so uploads still work even if compression fails.

## 5. Checklist for New Features
- [ ] Registered in `modal-registry.tsx`? (if sharable)
- [ ] Used `dynamic()` import?
- [ ] Used `FormGroup` with `error` prop?
- [ ] Used `FormFooter`?
- [ ] Handled `setBeforeClose` for dirty states?
- [ ] **Used `compressImage` for image uploads?**
