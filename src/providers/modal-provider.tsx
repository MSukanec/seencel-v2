"use client";

import { useModal } from "@/providers/modal-store";
import { cn } from "@/lib/utils";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import { CopyPlus, X } from "lucide-react";
import { ModalUrlSynchronizer } from "./modal-url-sync";
import { motion } from "framer-motion";

// Independent Overlay for Global System
const GlobalDialogOverlay = ({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) => (
    <DialogPrimitive.Overlay
        className={cn(
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50 backdrop-blur-[3px]",
            className
        )}
        {...props}
    />
);

// Independent Content for Global System
const GlobalDialogContent = ({ className, children, ...props }: React.ComponentProps<typeof DialogPrimitive.Content>) => (
    <DialogPrimitive.Portal>
        <GlobalDialogOverlay />
        <DialogPrimitive.Content
            className={cn(
                "bg-background fixed z-50 outline-none duration-200",
                "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                "flex flex-col",
                // Mobile fullscreen styles (Global System Default)
                "inset-0 w-screen h-screen max-w-none max-h-none rounded-none border-0 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]",
                "data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full",
                // Desktop centered styles
                "sm:inset-auto sm:top-[50%] sm:left-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%]",
                "sm:w-full sm:h-auto sm:max-h-[85vh] sm:rounded-lg sm:border sm:shadow-lg",
                "sm:data-[state=open]:slide-in-from-bottom-0 sm:data-[state=open]:zoom-in-95",
                "sm:data-[state=closed]:zoom-out-95 sm:data-[state=closed]:slide-out-to-bottom-0",
                className
            )}
            {...props}
        >
            {children}
        </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
);

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
                <DialogPrimitive.Root key={modal.id} open={true} onOpenChange={() => closeModal()}>
                    {modal.morphLayoutId ? (
                        <DialogPrimitive.Portal>
                            <GlobalDialogOverlay />
                            <DialogPrimitive.Content
                                onOpenAutoFocus={(e) => e.preventDefault()}
                                className={cn(
                                    "fixed inset-0 z-50 flex items-center justify-center pointer-events-none", // Container mode
                                    "!top-0 !left-0 !translate-x-0 !translate-y-0",
                                    "data-[state=open]:animate-none data-[state=closed]:animate-none",
                                    "!p-0 !border-0 bg-transparent shadow-none"
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
                                        <div className="flex-none flex flex-col gap-2 p-3 border-b text-left space-y-1.5">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <CopyPlus className="h-5 w-5 text-primary" />
                                                    <div className="space-y-0.5">
                                                        {modal.title && <h2 className="text-sm font-medium text-foreground leading-snug">{modal.title}</h2>}
                                                        {modal.description && <p className="text-xs text-muted-foreground leading-normal">{modal.description}</p>}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => closeModal()}
                                                    aria-label="Cerrar modal"
                                                    className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Body */}
                                    <div className="flex-1 flex flex-col relative min-h-0 overflow-y-auto p-4">
                                        {modal.view}
                                    </div>
                                </motion.div>
                            </DialogPrimitive.Content>
                        </DialogPrimitive.Portal>
                    ) : (
                        <GlobalDialogContent
                            onOpenAutoFocus={(e) => e.preventDefault()}
                            className={cn(
                                "p-0 overflow-hidden",
                                sizeClasses[modal.size || 'md']
                            )}
                        >
                            {/* Fixed Header */}
                            {(modal.title || modal.description) && (
                                <div className="flex-none flex flex-col gap-2 p-3 border-b text-left space-y-1.5">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <CopyPlus className="h-5 w-5 text-primary" />
                                            <div className="space-y-0.5">
                                                {modal.title && <DialogPrimitive.Title className="text-sm font-medium text-foreground leading-snug">{modal.title}</DialogPrimitive.Title>}
                                                {modal.description && <DialogPrimitive.Description className="text-xs text-muted-foreground leading-normal">{modal.description}</DialogPrimitive.Description>}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => closeModal()}
                                            aria-label="Cerrar modal"
                                            className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Body */}
                            <div className="flex-1 flex flex-col relative w-full min-h-0 overflow-y-auto p-4">
                                {modal.view}
                            </div>
                        </GlobalDialogContent>
                    )}
                </DialogPrimitive.Root>
            ))}
        </>
    );
};


