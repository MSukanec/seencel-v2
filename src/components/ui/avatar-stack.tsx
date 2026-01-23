"use client"

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export interface AvatarStackMember {
    name?: string;
    image?: string | null;
    email?: string;
}

interface AvatarStackProps {
    members: AvatarStackMember[];
    max?: number;
    size?: number; // pixel size for width/height
    className?: string;
}

export function AvatarStack({
    members,
    max = 4,
    size = 8, // tailwind w-8 h-8 (32px)
    className
}: AvatarStackProps) {
    const total = members.length;
    const visibleMembers = members.slice(0, max);
    const remaining = total - max;

    // Map size number to tailwind classes if needed, or use inline styles.
    // For simplicity, we'll assume standard sizes or pass className overrides.
    // But to match the "h-8 w-8" standard, let's keep it simple.

    return (
        <div className={cn("flex items-center", className)}>
            <div className="flex -space-x-3 hover:space-x-1 transition-all duration-300">
                <TooltipProvider delayDuration={0}>
                    {visibleMembers.map((member, i) => {
                        const initials = member.name
                            ? member.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                            : 'U';

                        return (
                            <Tooltip key={i}>
                                <TooltipTrigger asChild>
                                    <Avatar className={cn(
                                        "border-2 border-background ring-2 ring-background transition-transform hover:scale-110 hover:z-10 relative",
                                        "w-8 h-8" // Default size
                                    )}>
                                        <AvatarImage src={member.image || ""} alt={member.name || "Member"} />
                                        <AvatarFallback className="bg-muted text-[10px] font-medium">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{member.name || "Unknown User"}</p>
                                    {member.email && <p className="text-xs text-muted-foreground">{member.email}</p>}
                                </TooltipContent>
                            </Tooltip>
                        );
                    })}
                </TooltipProvider>

                {remaining > 0 && (
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted border-2 border-background ring-2 ring-background text-[10px] font-medium text-muted-foreground z-0">
                        +{remaining}
                    </div>
                )}
            </div>
        </div>
    );
}

