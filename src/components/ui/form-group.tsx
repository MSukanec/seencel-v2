import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import React from "react";

interface FormGroupProps extends React.HTMLAttributes<HTMLDivElement> {
    label?: React.ReactNode;
    htmlFor?: string;
    children: React.ReactNode;
}

export function FormGroup({ label, htmlFor, children, className, ...props }: FormGroupProps) {
    return (
        <div className={cn("flex flex-col gap-3", className)} {...props}>
            {label && <Label htmlFor={htmlFor} className="text-foreground/80">{label}</Label>}
            {children}
        </div>
    );
}
