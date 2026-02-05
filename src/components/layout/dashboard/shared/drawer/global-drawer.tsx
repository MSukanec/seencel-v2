"use client";

import { useDrawer } from "@/stores/drawer-store";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

export function GlobalDrawer() {
    const { isOpen, closeDrawer, title, description, children } = useDrawer();

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && closeDrawer()}>
            <SheetContent
                side="right"
                className="w-full sm:max-w-xl border-l shadow-xl p-0 h-full"
            // Remove generic overlay if we want to interact with nav? 
            // However, usually drawers are modal. 
            // If we want "agnostic drawer below trigger", keeping overlay is safer for focus management.
            // We'll trust the user wants standard drawer behavior but visually offset.
            >
                <div className="flex flex-col h-full">
                    {(title || description) && (
                        <SheetHeader className="px-6 py-4 border-b">
                            {title && <SheetTitle>{title}</SheetTitle>}
                            {description && <SheetDescription>{description}</SheetDescription>}
                        </SheetHeader>
                    )}
                    <ScrollArea className="flex-1 p-6">
                        {children}
                    </ScrollArea>
                </div>
            </SheetContent>
        </Sheet>
    );
}

