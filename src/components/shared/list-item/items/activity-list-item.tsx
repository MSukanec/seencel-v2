"use client";

import { memo } from "react";
import { ListItem } from "../list-item-base";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// ============================================================================
// ACTIVITY LIST ITEM — Feed-style row with creator avatar
// ============================================================================
// Usage: Dashboard activity cards, recent operations, audit feeds.
// Designed for compact display inside ChartCard / dashboard cards.
// ============================================================================

export interface ActivityListItemData {
    /** Unique id */
    id: string;
    /** Primary text (e.g., concept name) */
    title: string;
    /** Secondary text (e.g., "Categoría · 5 mar") */
    subtitle?: string;
    /** Right-side formatted value (e.g., "-$12,500") */
    value?: string;
    /** Value color intent */
    valueIntent?: "positive" | "negative" | "neutral";
    /** Creator display name */
    creatorName?: string;
    /** Creator avatar URL */
    creatorAvatarUrl?: string | null;
}

interface ActivityListItemProps {
    item: ActivityListItemData;
}

export const ActivityListItem = memo(function ActivityListItem({
    item,
}: ActivityListItemProps) {
    const initials = (item.creatorName || "?")
        .split(" ")
        .map((s) => s[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    return (
        <ListItem variant="flat">
            {/* Avatar with tooltip */}
            <ListItem.Leading>
                <TooltipProvider delayDuration={200}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={item.creatorAvatarUrl || undefined} />
                                <AvatarFallback className="text-[10px] bg-muted">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="text-xs">
                            {item.creatorName || "Sistema"}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </ListItem.Leading>

            <ListItem.Content>
                <ListItem.Title>{item.title}</ListItem.Title>
                {item.subtitle && (
                    <ListItem.Description>{item.subtitle}</ListItem.Description>
                )}
            </ListItem.Content>

            {item.value && (
                <ListItem.Trailing>
                    <ListItem.Value
                        className={cn(
                            item.valueIntent === "positive" && "text-amount-positive",
                            item.valueIntent === "negative" && "text-amount-negative",
                            (!item.valueIntent || item.valueIntent === "neutral") && "text-foreground",
                        )}
                    >
                        {item.value}
                    </ListItem.Value>
                </ListItem.Trailing>
            )}
        </ListItem>
    );
});
