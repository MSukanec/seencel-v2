"use client";

import { useModal } from "@/providers/modal-store";
import { cn } from "@/lib/utils";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogOverlay,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { CopyPlus, X } from "lucide-react";
import { ModalUrlSynchronizer } from "./modal-url-sync";
import { motion } from "framer-motion";

export const ModalProvider = () => {
    const { stack, closeModal } = useModal();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const sizeClasses = {
        sm: "sm:w-[400px]",
        md: "sm:w-[600px]",
        lg: "sm:w-[800px]",
        xl: "sm:w-[1000px]",
        "2xl": "sm:w-[1200px]",
        full: "sm:w-[calc(100vw-40px)] sm:max-w-none"
    };

    if (!isMounted) return null;

    return (
        <>
            <ModalUrlSynchronizer />
            {stack.map((modal, index) => (
                <Dialog key={modal.id} open={true} onOpenChange={() => closeModal()}>
                    {modal.morphLayoutId ? (
                        <DialogPrimitive.Portal>
                            <DialogOverlay />
                            <DialogPrimitive.Content
                                onOpenAutoFocus={(e) => e.preventDefault()}
                                className={cn(
                                    "fixed inset-0 z-50 flex items-center justify-center pointer-events-none", // Container mode
                                    // Reset conflicting positioning
                                    "!top-0 !left-0 !translate-x-0 !translate-y-0",
                                    // Remove native animations
                                    "data-[state=open]:animate-none data-[state=closed]:animate-none",
                                    "!p-0 !border-0 bg-transparent shadow-none" // Remove box styles from wrapper
                                )}
                            >
                                <motion.div
                                    layoutId={modal.morphLayoutId}
                                    transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                                    className={cn(
                                        "pointer-events-auto bg-background rounded-lg border shadow-lg w-full flex flex-col max-h-[90vh] overflow-hidden",
                                        sizeClasses[modal.size || 'md']
                                    )}
                                >
                                    {/* Fixed Header */}
                                    {(modal.title || modal.description) && (
                                        <div className="flex-none p-3 border-b border-border bg-background z-10">
                                            <DialogHeader className="space-y-3">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-3">
                                                        <CopyPlus className="h-5 w-5 text-primary" />
                                                        <div className="space-y-0.5">
                                                            {modal.title && <DialogTitle className="text-sm font-medium text-foreground leading-snug">{modal.title}</DialogTitle>}
                                                            {modal.description && <DialogDescription className="text-xs text-muted-foreground leading-normal">{modal.description}</DialogDescription>}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => closeModal()}
                                                        aria-label="Cerrar modal"
                                                        className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                                    >
                                                        <X className="h-4 w-4" />
                                                        <span className="sr-only">Close</span>
                                                    </button>
                                                </div>
                                            </DialogHeader>
                                        </div>
                                    )}

                                    {/* Body */}
                                    <div className="flex-1 overflow-hidden p-4 flex flex-col relative">
                                        {modal.view}
                                    </div>
                                </motion.div>
                            </DialogPrimitive.Content>
                        </DialogPrimitive.Portal>
                    ) : (
                        <DialogContent
                            onOpenAutoFocus={(e) => e.preventDefault()}
                            showCloseButton={false}
                            className={cn(
                                "fixed inset-0 w-screen h-screen max-w-none rounded-none border-0 translate-x-0 translate-y-0 data-[state=open]:slide-in-from-bottom-full sm:data-[state=open]:slide-in-from-bottom-0 sm:data-[state=open]:zoom-in-95",
                                "sm:inset-auto sm:top-[50%] sm:left-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%]",
                                "sm:max-w-[90vw] sm:h-auto sm:max-h-[90vh] sm:min-h-0 sm:rounded-lg sm:border",
                                "!flex !flex-col p-0 !gap-0 overflow-hidden",
                                sizeClasses[modal.size || 'md']
                            )}              >
                            {/* Fixed Header */}
                            {(modal.title || modal.description) && (
                                <div className="flex-none p-3 border-b border-border bg-background z-10">
                                    <DialogHeader className="space-y-3">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <CopyPlus className="h-5 w-5 text-primary" />
                                                <div className="space-y-0.5">
                                                    {modal.title && <DialogTitle className="text-sm font-medium text-foreground leading-snug">{modal.title}</DialogTitle>}
                                                    {modal.description && <DialogDescription className="text-xs text-muted-foreground leading-normal">{modal.description}</DialogDescription>}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => closeModal()}
                                                aria-label="Cerrar modal"
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
                            <div className="flex-1 overflow-hidden p-4 flex flex-col relative w-full h-full">
                                {modal.view}
                            </div>
                        </DialogContent>
                    )}
                </Dialog>
            ))}
        </>
    );
};
