"use client";

import React, { useState, useId, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExpandableCardProps {
    children: React.ReactNode;
    /**
     * Title to display in the expanded view header.
     */
    title?: string;
    /**
     * Optional class name for the card container.
     */
    className?: string;
    /**
     * Optional content to show ONLY when expanded (e.g. details, descriptions).
     */
    expandedContent?: React.ReactNode;
}

export function ExpandableCard({
    children,
    title,
    className,
    expandedContent,
}: ExpandableCardProps) {
    const [isOpen, setIsOpen] = useState(false);
    const id = useId();

    // Close on Escape key
    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.body.style.overflow = "hidden";
            window.addEventListener("keydown", onKeyDown);
        } else {
            document.body.style.overflow = "auto";
        }
        return () => {
            window.removeEventListener("keydown", onKeyDown);
            document.body.style.overflow = "auto";
        };
    }, [isOpen]);

    return (
        <>
            <motion.div
                layoutId={`card-container-${id}`}
                onClick={() => setIsOpen(true)}
                className={cn(
                    "cursor-pointer relative group",
                    className
                )}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
            >
                {children}

                {/* Hover overlay hint */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                    <span className="bg-white/90 text-black text-xs px-2 py-1 rounded-full shadow-sm">
                        Expand
                    </span>
                </div>
            </motion.div>

            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-10">
                        {/* Backdrop - blurred and darker for 'dilution' effect */}
                        <motion.div
                            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                            animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
                            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                            transition={{ duration: 0.3 }}
                            onClick={() => setIsOpen(false)}
                            className="absolute inset-0 bg-black/40"
                            aria-hidden="true"
                        />

                        {/* Expanded Card */}
                        <motion.div
                            layoutId={`card-container-${id}`}
                            className="w-full max-w-5xl max-h-[90vh] flex flex-col bg-card rounded-3xl shadow-2xl relative overflow-hidden z-20"
                            transition={{ type: "spring", stiffness: 200, damping: 25 }}
                        >
                            {/* Floating Close Button */}
                            <motion.button
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ delay: 0.1 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsOpen(false);
                                }}
                                className="absolute top-4 right-4 z-50 p-2 bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 backdrop-blur-md rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-foreground/80" />
                            </motion.button>

                            {/* Content */}
                            <div className="flex-1 overflow-auto p-6 sm:p-10">
                                {/* Optional Title in expanded view if needed, but cleaner without the bar */}
                                {title && (
                                    <motion.h3
                                        layoutId={`card-title-${id}`}
                                        className="text-3xl font-bold mb-6 text-foreground"
                                    >
                                        {title}
                                    </motion.h3>
                                )}

                                <div className="h-full">
                                    {children}
                                </div>

                                {expandedContent && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2, duration: 0.4 }}
                                        className="mt-8 pt-8 border-t border-border/10"
                                    >
                                        {expandedContent}
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
