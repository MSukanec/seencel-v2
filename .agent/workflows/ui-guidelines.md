---
description: UI best practices and component guidelines for SEENCEL
---

# UI Component Guidelines

## Dialogs and Confirmations

**IMPORTANT:** Never use native browser dialogs like `window.confirm()`, `window.alert()`, or `window.prompt()`. 

Always use the custom AlertDialog component from `@/components/ui/alert-dialog`:

```tsx
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Usage with controlled state
const [showDialog, setShowDialog] = useState(false);

<AlertDialog open={showDialog} onOpenChange={setShowDialog}>
    <AlertDialogContent>
        <AlertDialogHeader>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogDescription>Description</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>Confirmar</AlertDialogAction>
        </AlertDialogFooter>
    </AlertDialogContent>
</AlertDialog>
```

## Toasts and Notifications

For success/error messages, use toast notifications instead of `alert()`.

## Form Inputs

Use components from `@/components/ui/` (Input, Button, Switch, etc.) instead of native HTML elements when available.

---

## 📊 Data Tables

**REGLA OBLIGATORIA**: Siempre usar `DataTable` para tablas de datos.

```tsx
import { DataTable, DataTableColumnHeader, DataTableRowActions } from "@/components/ui/data-table";
```

### Cuándo usar

| ✅ Usar DataTable | ❌ No usar |
|-------------------|-----------|
| Listas de entidades | Tablas < 5 filas |
| Datos ordenables/filtrables | Dentro de modals |
| Tablas que crecen | Config estática |

### Patrón de acciones

```tsx
{
  id: "actions",
  header: () => <span className="sr-only">Acciones</span>,
  cell: ({ row }) => (
    <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
      <DataTableRowActions row={row} onEdit={...} onDelete={...} />
    </div>
  ),
  size: 50,
  enableHiding: false,
}
```

---

## 📐 Layouts & Scrolling

### Páginas con Tabs (Full Height)

Para evitar el problema de "Doble Scrollbar" en páginas de Dashboard que usan Tabs, es **OBLIGATORIO** seguir esta estructura:

1.  **Contenedor Principal:** `flex flex-col h-full relative`
2.  **Tabs:** `w-full flex-1 flex flex-col overflow-hidden` (Crucial: `flex-1` y `overflow-hidden` aquí)
3.  **TabsContent:** `flex-1 focus-visible:outline-none relative min-h-0 overflow-auto`

Esto asegura que el scroll sea manejado **internamente** por cada tab, manteniendo el header y tabs fijos.

**Ejemplo Correcto:**

```tsx
<div className="flex flex-col h-full relative">
    <HeaderTitleUpdater title="Pagina" />

    <Tabs defaultValue="tab1" className="w-full flex-1 flex flex-col overflow-hidden">
        <HeaderPortal>
            <TabsList>...</TabsList>
        </HeaderPortal>

        <TabsContent value="tab1" className="mt-6 flex-1 focus-visible:outline-none relative min-h-0 overflow-auto">
             <div className="space-y-6 pb-6">
                {/* Contenido scrolleable aquí */}
             </div>
        </TabsContent>
    </Tabs>
</div>
```

**❌ NUNCA:**
*   Poner `overflow-auto` en el contenedor padre de `Tabs`.
*   Olvidar `flex-1 overflow-hidden` en el componente `Tabs`.
