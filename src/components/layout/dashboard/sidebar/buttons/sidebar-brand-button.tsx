"use client";

import NextImage from "next/image";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

// ============================================================================
// SIDEBAR BRAND BUTTON — Solo muestra el logo de Seencel + nombre
// El selector de organización/proyecto vive en el Header
// ============================================================================

interface SidebarBrandButtonProps {
    isExpanded?: boolean;
    className?: string;
}

export function SidebarBrandButton({
    isExpanded = false,
    className
}: SidebarBrandButtonProps) {
    return (
        <Link href="/hub" className="flex items-center w-full">
            <button
                className={cn(
                    "group relative flex items-center w-full rounded-lg transition-all duration-200",
                    "hover:bg-secondary/50 text-muted-foreground hover:text-foreground cursor-pointer",
                    "p-0 h-8",
                    className
                )}
            >
                {/* Logo */}
                <div className="w-8 h-8 flex items-center justify-center shrink-0">
                    <NextImage
                        src="/logo.png"
                        alt="SEENCEL"
                        width={20}
                        height={20}
                        className="object-contain"
                    />
                </div>

                {/* Name */}
                <span className={cn(
                    "font-bold tracking-tight text-foreground/90 whitespace-nowrap overflow-hidden transition-all duration-150 ease-in-out truncate text-left text-lg",
                    isExpanded ? "flex-1 opacity-100 pl-1" : "w-0 opacity-0 pl-0"
                )}>
                    Seencel
                </span>
            </button>
        </Link>
    );
}
