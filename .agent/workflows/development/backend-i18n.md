---
description: Backend Supabase, RLS, Storage e i18n
---

# Backend y Supabase

## RLS (Row Level Security)

Para políticas RLS detalladas, ver: `/RLS-GUIDELINES`

### Reglas Rápidas

- Usar `.update()` no `.upsert()` para perfiles existentes
- Verificar que RLS esté habilitado en nuevas tablas
- Testear queries tanto con usuario autenticado como anónimo

---

## Storage

### URLs Públicas

Usar helper `getStorageUrl` para obtener URLs públicas:

```tsx
import { getStorageUrl } from "@/lib/supabase/storage";

const publicUrl = getStorageUrl(bucket, filePath);
```

### Columnas de Imágenes

Preferir `logo_path` (path relativo) sobre `logo_url` (URL completa):

```tsx
// ✅ CORRECTO - Guardar path
logo_path: "organizations/abc123/logo.png"

// ❌ EVITAR - URL completa (puede cambiar)
logo_url: "https://supabase.co/storage/v1/..."
```

---

## Server Actions

**Ubicación:** `@/actions/[domain].ts`

```tsx
"use server";

import { createClient } from "@/lib/supabase/server";

export async function createEntity(data: EntityInput) {
    const supabase = await createClient();
    
    const { data: entity, error } = await supabase
        .from('entities')
        .insert(data)
        .select()
        .single();
    
    if (error) {
        console.error("Error creating entity:", error);
        return { success: false, error: error.message };
    }
    
    return { success: true, data: entity };
}
```

---

# Internacionalización (i18n)

## Librería

`next-intl`

## Regla Principal

> ⛔ **NO HARDCODEAR STRINGS**. Extraer a `messages/es.json`.

## Uso

```tsx
import { useTranslations } from "next-intl";

export function MyComponent() {
    const t = useTranslations("MyComponent");
    
    return (
        <div>
            <h1>{t("title")}</h1>
            <p>{t("description")}</p>
        </div>
    );
}
```

## Archivo de Mensajes

```json
// messages/es.json
{
    "MyComponent": {
        "title": "Mi Título",
        "description": "Mi descripción"
    }
}
```

## Locale Default

El locale por defecto es **español** (`es`).

---

## Checklist

- [ ] ¿RLS habilitado en nuevas tablas?
- [ ] ¿Storage usa paths, no URLs completas?
- [ ] ¿Server actions manejan errores correctamente?
- [ ] ¿NO hay strings hardcodeados en UI?
- [ ] ¿Mensajes extraídos a `messages/es.json`?
