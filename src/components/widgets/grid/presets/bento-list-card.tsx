"use client";

import { cn } from "@/lib/utils";
import { BentoCard } from "../bento-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

/** List item data structure */
export interface BentoListItem {
    id: string;
    /** Avatar image URL */
    avatar?: string;
    /** Primary text */
    title: string;
    /** Secondary text */
    subtitle?: string;
    /** Badge content (rank, count, etc) */
    badge?: string | number;
    /** Status indicator */
    status?: 'active' | 'inactive' | 'warning';
}

/** Size variants */
type BentoSize = 'sm' | 'md' | 'lg' | 'wide' | 'tall';

interface BentoListCardProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Card title */
    title: string;
    /** Card description */
    description?: string;
    /** Icon component */
    icon?: React.ReactNode;
    /** List items to display */
    items: BentoListItem[];
    /** Maximum items to show */
    maxItems?: number;
    /** Show rank numbers instead of badges */
    showRank?: boolean;
    /** Card size */
    size?: BentoSize;
    /** Callback when an item is clicked */
    onItemClick?: (item: BentoListItem) => void;
}

const statusStyles = {
    active: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    inactive: 'bg-muted text-muted-foreground',
    warning: 'bg-amber-500/10 text-amber-500 border-amber-500/20'
};

/**
 * BentoListCard - Card with ranked/listed items
 * 
 * Composes BentoCard (parent shell) with list-specific content:
 * avatar items with ranks, badges, and status indicators.
 */
export function BentoListCard({
    title,
    description,
    icon,
    items,
    maxItems = 5,
    showRank = false,
    size = 'sm',
    onItemClick,
    className,
    ...props
}: BentoListCardProps) {
    const displayItems = items.slice(0, maxItems);

    return (
        <BentoCard
            size={size}
            title={title}
            subtitle={description}
            icon={icon}
            className={className}
            {...props}
        >
            <div className="space-y-3">
                {displayItems.map((item, index) => (
                    <div
                        key={item.id}
                        className={cn(
                            "flex items-center justify-between",
                            onItemClick && "cursor-pointer rounded-md -mx-2 px-2 py-1 hover:bg-muted/50 transition-colors"
                        )}
                        onClick={onItemClick ? () => onItemClick(item) : undefined}
                        role={onItemClick ? "button" : undefined}
                        tabIndex={onItemClick ? 0 : undefined}
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <Avatar className="h-8 w-8 flex-shrink-0">
                                <AvatarImage src={item.avatar} />
                                <AvatarFallback className="text-xs">
                                    {item.title?.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                                <div className="text-sm font-medium truncate">
                                    {item.title}
                                </div>
                                {item.subtitle && (
                                    <div className="text-xs text-muted-foreground truncate">
                                        {item.subtitle}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Badge or Rank */}
                        {showRank ? (
                            <Badge
                                variant="secondary"
                                className="h-5 min-w-[20px] justify-center bg-primary/10 text-primary"
                            >
                                #{index + 1}
                            </Badge>
                        ) : item.badge !== undefined ? (
                            <Badge variant="secondary" className="h-5">
                                {item.badge}
                            </Badge>
                        ) : item.status ? (
                            <Badge
                                variant="secondary"
                                className={cn("h-5 gap-1", statusStyles[item.status])}
                            >
                                {item.status === 'active' && (
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
                                    </span>
                                )}
                                {item.status === 'active' ? 'Activo' :
                                    item.status === 'warning' ? 'Riesgo' : 'Inactivo'}
                            </Badge>
                        ) : null}
                    </div>
                ))}

                {items.length === 0 && (
                    <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
                        Sin elementos
                    </div>
                )}
            </div>
        </BentoCard>
    );
}
