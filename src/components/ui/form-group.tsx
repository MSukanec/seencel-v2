import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import React from "react";

interface FormGroupProps extends React.HTMLAttributes<HTMLDivElement> {
    /**
     * Label text for the form field
     */
    label?: React.ReactNode;
    /**
     * ID of the input element for accessibility
     */
    htmlFor?: string;
    /**
     * Error message to display (also sets aria-invalid on children)
     */
    error?: string;
    /**
     * Help text to display below the input
     */
    helpText?: string;
    /**
     * Whether the field is required (shows asterisk)
     */
    required?: boolean;
    /**
     * Form field content (input, select, etc.)
     */
    children: React.ReactNode;
}

export function FormGroup({
    label,
    htmlFor,
    error,
    helpText,
    required,
    children,
    className,
    ...props
}: FormGroupProps) {
    const errorId = htmlFor ? `${htmlFor}-error` : undefined;
    const helpId = htmlFor ? `${htmlFor}-help` : undefined;

    // Build aria-describedby from error and help text
    const describedBy = [
        error && errorId,
        helpText && helpId
    ].filter(Boolean).join(' ') || undefined;

    return (
        <div className={cn("flex flex-col gap-2", className)} {...props}>
            {label && (
                <Label htmlFor={htmlFor} className="text-foreground/80">
                    {label}
                    {required && <span className="text-destructive ml-1">*</span>}
                </Label>
            )}

            {/* Clone children to add aria attributes */}
            {React.Children.map(children, child => {
                if (React.isValidElement(child)) {
                    return React.cloneElement(child as React.ReactElement<any>, {
                        'aria-invalid': error ? true : undefined,
                        'aria-describedby': describedBy,
                    });
                }
                return child;
            })}

            {/* Help text */}
            {helpText && !error && (
                <p id={helpId} className="text-xs text-muted-foreground">
                    {helpText}
                </p>
            )}

            {/* Error message */}
            {error && (
                <p id={errorId} className="text-xs text-destructive" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}
