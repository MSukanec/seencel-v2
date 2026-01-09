"use client";

import { useModal } from "@/providers/modal-store";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { CopyPlus, X } from "lucide-react";

export const ModalProvider = () => {
    const { isOpen, closeModal, view, title, description } = useModal();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return null;

    return (
        <Dialog open={isOpen} onOpenChange={closeModal}>
            <DialogContent className="
                fixed inset-0 w-screen h-screen max-w-none rounded-none border-0 translate-x-0 translate-y-0 data-[state=open]:slide-in-from-bottom-full sm:data-[state=open]:slide-in-from-bottom-0 sm:data-[state=open]:zoom-in-95
                sm:inset-auto sm:top-[50%] sm:left-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:w-[600px] sm:max-w-[90vw] sm:h-auto sm:max-h-[90vh] sm:min-h-0 sm:rounded-lg sm:border
                !flex !flex-col p-0 !gap-0 overflow-hidden
            ">
                {/* Fixed Header */}
                {(title || description) && (
                    <div className="flex-none p-3 border-b border-border bg-background z-10">
                        <DialogHeader className="space-y-3">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <CopyPlus className="h-5 w-5 text-primary" />
                                    <div className="space-y-0.5">
                                        {title && <DialogTitle className="text-sm font-medium text-foreground leading-snug">{title}</DialogTitle>}
                                        {description && <DialogDescription className="text-xs text-muted-foreground leading-normal">{description}</DialogDescription>}
                                    </div>
                                </div>
                                <button
                                    onClick={closeModal}
                                    className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                >
                                    <X className="h-4 w-4" />
                                    <span className="sr-only">Close</span>
                                </button>
                            </div>
                        </DialogHeader>
                    </div>
                )}

                {/* Body - auto height, scrolls when needed */}
                <div className="overflow-auto">
                    {view}
                </div>
            </DialogContent>
        </Dialog>
    );
};
