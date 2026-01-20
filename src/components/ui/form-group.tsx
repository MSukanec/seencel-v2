import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { HelpCircle } from "lucide-react";
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
     * Tooltip content shown on hover of help icon (?)
     * Can be a string or ReactNode for rich content (links, etc.)
     */
    tooltip?: React.ReactNode;
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
    tooltip,
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
                <div className="flex items-center gap-1.5">
                    <Label htmlFor={htmlFor} className="text-foreground/80">
                        {label}
                        {required && <span className="text-primary ml-1">*</span>}
                    </Label>
                    {tooltip && (
                        <TooltipProvider delayDuration={0}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span
                                        className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors cursor-help"
                                        tabIndex={-1}
                                    >
                                        <HelpCircle className="h-3.5 w-3.5" />
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent
                                    side="top"
                                    className="max-w-xs text-sm [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2"
                                >
                                    {tooltip}
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
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

