import { cn } from "@/lib/utils";
import React from "react";

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string;
    description?: string;
    children?: React.ReactNode;
}

export function PageHeader({
    title,
    description,
    children,
    className,
    ...props
}: PageHeaderProps) {
    return (
        <div className={cn("flex flex-col space-y-4 pb-4", className)} {...props}>
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
                    {description && (
                        <p className="text-muted-foreground">
                            {description}
                        </p>
                    )}
                </div>
            </div>
            {children}
            {/* If we strictly want tabs *in* the header visually, we might render them here or let the parent do it. 
                Common pattern is header + separator + content. 
                For now, children can be anything (buttons, tabs).
            */}
        </div>
    );
}
