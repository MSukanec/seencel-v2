"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useRef, useEffect } from "react";

type FooterVariant = 'default' | 'equal' | 'single';

interface FormFooterProps {
    /**
     * Cancel button handler. If not provided, cancel button is hidden.
     */
    onCancel?: () => void;
    /**
     * Submit button handler. For forms, this is optional since form submit handles it.
     */
    onSubmit?: () => void;
    /**
     * Whether the form is in a loading state
     */
    isLoading?: boolean;
    /**
     * Submit button label
     */
    submitLabel: string;
    /**
     * Cancel button label
     */
    cancelLabel?: string;
    /**
     * Whether to disable the submit button (besides loading state)
     */
    submitDisabled?: boolean;
    /**
     * Button layout variant:
     * - 'default': 25% cancel, 75% submit (standard)
     * - 'equal': 50% / 50%
     * - 'single': 100% submit only
     */
    variant?: FooterVariant;
    /**
     * Whether this is inside a form (submit button uses type="submit")
     */
    isForm?: boolean;
    /**
     * Additional className for the container
     */
    className?: string;
}

export function FormFooter({
    onCancel,
    onSubmit,
    isLoading = false,
    submitLabel,
    cancelLabel = "Cancelar",
    submitDisabled = false,
    variant = 'default',
    isForm = true,
    className
}: FormFooterProps) {
    const showCancel = variant !== 'single' && onCancel;

    const gridClasses = {
        default: "grid-cols-4",
        equal: "grid-cols-2",
        single: "grid-cols-1"
    };

    const cancelSpanClasses = {
        default: "col-span-1",
        equal: "col-span-1",
        single: ""
    };

    const submitSpanClasses = {
        default: "col-span-3",
        equal: "col-span-1",
        single: "col-span-1"
    };

    const submitBtnRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                if (!submitDisabled && !isLoading && submitBtnRef.current) {
                    // Only trigger if focus is inside the form connected to this footer
                    // or if this footer is part of the active dialog
                    const form = submitBtnRef.current.closest('form');
                    const activeElement = document.activeElement;

                    if (form && activeElement && form.contains(activeElement)) {
                        e.preventDefault();
                        submitBtnRef.current.click();
                    }
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [submitDisabled, isLoading]);

    return (
        <div className={cn(
            "flex-none p-3 border-t border-border bg-background",
            className
        )}>
            <div className={cn("grid gap-3", gridClasses[variant])}>
                {showCancel && (
                    <Button
                        variant="outline"
                        type="button"
                        onClick={onCancel}
                        disabled={isLoading}
                        className={cn("w-full", cancelSpanClasses[variant])}
                    >
                        {cancelLabel}
                    </Button>
                )}
                <Button
                    ref={submitBtnRef}
                    type={isForm ? "submit" : "button"}
                    onClick={!isForm ? onSubmit : undefined}
                    disabled={isLoading || submitDisabled}
                    aria-busy={isLoading}
                    className={cn("w-full", submitSpanClasses[variant])}
                >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {submitLabel}
                </Button>
            </div>
        </div>
    );
}
