"use client";

import { ReactNode, useState } from "react";
import { Lock, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ComingSoonBlockProps {
    /**
     * The content to show when the user is allowed through (admin)
     */
    children: ReactNode;
    /**
     * Whether the current user is an admin (can bypass the block)
     */
    isAdmin?: boolean;
    /**
     * Title for the coming soon overlay
     */
    title?: string;
    /**
     * Description for the coming soon overlay
     */
    description?: string;
    /**
     * Custom class for the container
     */
    className?: string;
}

/**
 * A full-page "Coming Soon" block component.
 * Shows a beautiful overlay blocking the page content.
 * Admins can click "Enter anyway" to bypass and see the actual content.
 */
export function ComingSoonBlock({
    children,
    isAdmin = false,
    title = "Próximamente",
    description = "Esta sección estará disponible pronto. Estamos trabajando en algo increíble.",
    className
}: ComingSoonBlockProps) {
    const [showContent, setShowContent] = useState(false);

    // If admin clicked through, show the actual content
    if (showContent && isAdmin) {
        return <>{children}</>;
    }

    return (
        <div className={cn("relative w-full h-full min-h-[60vh]", className)}>
            {/* Blurred background content (if we want to show a preview) */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="opacity-10 blur-sm pointer-events-none">
                    {children}
                </div>
            </div>

            {/* Coming Soon Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-background/95 via-background/90 to-background/95 backdrop-blur-sm">
                <div className="text-center max-w-md px-6">
                    {/* Icon */}
                    <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 animate-pulse">
                        <Sparkles className="w-10 h-10 text-primary" />
                    </div>

                    {/* Badge */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                        <Lock className="w-3.5 h-3.5" />
                        Coming Soon
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl md:text-4xl font-bold mb-3">
                        {title}
                    </h1>

                    {/* Description */}
                    <p className="text-muted-foreground text-sm md:text-base mb-8 leading-relaxed">
                        {description}
                    </p>

                    {/* Admin bypass button */}
                    {isAdmin && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowContent(true)}
                            className="gap-2 opacity-60 hover:opacity-100 transition-opacity"
                        >
                            <span className="text-xs text-muted-foreground">Admin:</span>
                            Entrar de todas formas
                            <ArrowRight className="w-3 h-3" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

