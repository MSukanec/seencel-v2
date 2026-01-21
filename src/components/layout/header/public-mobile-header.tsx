"use client";

import * as React from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { UserProfile } from "@/types/user";
import { PublicMobileNav } from "../navigation/public-mobile-nav";

interface PublicMobileHeaderProps {
    user?: UserProfile | null;
    className?: string;
}

export function PublicMobileHeader({ user, className }: PublicMobileHeaderProps) {
    return (
        <div
            className={cn(
                "sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border/10 md:hidden",
                // PADDING TOP for iPhone Dynamic Island / Notch
                "pt-[env(safe-area-inset-top)]",
                className
            )}
        >
            <div className="flex h-16 items-center justify-between px-4">
                {/* LOGO */}
                <Link href="/" className="flex items-center space-x-2">
                    <div className="relative h-8 w-8">
                        <Image
                            src="/logo.png"
                            alt="SEENCEL"
                            fill
                            className="object-contain"
                        />
                    </div>
                    <span className="font-bold text-xl tracking-tighter">
                        SEENCEL
                    </span>
                </Link>

                {/* MENU TRIGGER */}
                <PublicMobileNav user={user} />
            </div>
        </div>
    );
}
