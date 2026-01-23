"use client";

import { cn } from "@/lib/utils";
import React from "react";

/**
 * FormShell - Global wrapper for modal forms
 * 
 * Provides the correct layout structure:
 * - Form takes full height of modal
 * - Body (children before FormFooter) scrolls
 * - FormFooter stays fixed at bottom
 * 
 * Usage:
 * <FormShell onSubmit={handleSubmit}>
 *     {form fields...}
 *     <FormFooter ... />
 * </FormShell>
 */

interface FormShellProps extends React.FormHTMLAttributes<HTMLFormElement> {
    children: React.ReactNode;
    className?: string;
}

export function FormShell({ children, className, ...props }: FormShellProps) {
    // Separate children into body content and footer
    const childArray = React.Children.toArray(children);

    // Find FormFooter (last child with data-slot attribute)
    const lastChild = childArray[childArray.length - 1];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lastChildProps = React.isValidElement(lastChild) ? (lastChild.props as any) : null;
    const isFooter = lastChildProps?.['data-slot'] === 'form-footer';

    // Split children
    const bodyChildren = isFooter ? childArray.slice(0, -1) : childArray;
    const footerChild = isFooter ? lastChild : null;

    return (
        <form
            className={cn("flex flex-col h-full min-h-0", className)}
            {...props}
        >
            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto min-h-0 pr-1">
                <div className="space-y-4">
                    {bodyChildren}
                </div>
            </div>

            {/* Fixed footer */}
            {footerChild && (
                <div className="flex-none -mx-4 -mb-4">
                    {footerChild}
                </div>
            )}
        </form>
    );
}

