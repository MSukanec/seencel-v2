"use client";

import { CardBase } from "./card-base";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { Link } from "@/i18n/routing";

// ============================================================================
// LIST CARD — Ranked list with avatars and values
// ============================================================================
// Replaces: BentoListCard
// Usage: Top providers, recent transactions, team members, etc.
// ============================================================================

export interface ListCardItem {
    /** Unique id */
    id: string;
    /** Avatar URL (optional) */
    avatar?: string | null;
    /** Fallback initial for avatar */
    fallback?: string;
    /** Primary text */
    title: string;
    /** Secondary text */
    subtitle?: string;
    /** Right-side value (formatted string) */
    value?: string;
    /** Value color intent */
    valueIntent?: "positive" | "negative" | "neutral";
}

interface ListCardProps {
    title: string;
    description?: string;
    icon?: React.ReactNode;
    iconClassName?: string;
    items: ListCardItem[];
    /** Max items to show (default: 5) */
    maxItems?: number;
    /** "View all" link */
    viewAllHref?: string;
    /** "View all" label */
    viewAllLabel?: string;
    className?: string;
    /** If true, card won't stretch to fill grid height */
    compact?: boolean;
}

export function ListCard({
    title,
    description,
    icon,
    iconClassName,
    items,
    maxItems = 5,
    viewAllHref,
    viewAllLabel = "Ver todos",
    className,
    compact = false,
}: ListCardProps) {
    const visibleItems = items.slice(0, maxItems);

    return (
        <CardBase compact={compact} className={className}>
            <CardBase.Header
                title={title}
                description={description}
                icon={icon}
                iconClassName={iconClassName}
            />
            <CardBase.Body>
                <div className="space-y-3">
                    {visibleItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-3">
                            {/* Avatar */}
                            {item.avatar ? (
                                <img
                                    src={item.avatar}
                                    alt={item.title}
                                    className="h-9 w-9 rounded-full object-cover shrink-0"
                                />
                            ) : (
                                <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground shrink-0">
                                    {item.fallback || item.title[0]?.toUpperCase() || "?"}
                                </div>
                            )}

                            {/* Text */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{item.title}</p>
                                {item.subtitle && (
                                    <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                                )}
                            </div>

                            {/* Value */}
                            {item.value && (
                                <span className={cn(
                                    "text-sm font-semibold shrink-0",
                                    item.valueIntent === "positive" && "text-amount-positive",
                                    item.valueIntent === "negative" && "text-amount-negative",
                                    !item.valueIntent || item.valueIntent === "neutral" ? "text-foreground" : "",
                                )}>
                                    {item.value}
                                </span>
                            )}
                        </div>
                    ))}

                    {items.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">Sin datos</p>
                    )}
                </div>
            </CardBase.Body>

            {viewAllHref && items.length > maxItems && (
                <CardBase.Footer>
                    <Link
                        href={viewAllHref as any}
                        className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                    >
                        {viewAllLabel}
                        <ChevronRight className="w-3 h-3" />
                    </Link>
                </CardBase.Footer>
            )}
        </CardBase>
    );
}
