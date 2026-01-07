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
