"use client";

import * as React from "react";
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePanel } from "@/stores/panel-store";

interface SidebarFeedbackButtonProps {
    isExpanded?: boolean;
    className?: string;
}

export function SidebarFeedbackButton({
    isExpanded = false,
    className
}: SidebarFeedbackButtonProps) {
    const { openPanel } = usePanel();

    const handleClick = () => {
        openPanel('feedback-form');
    };

    return (
        <button
            onClick={handleClick}
            className={cn(
                "group relative flex items-center w-full rounded-lg transition-all duration-200",
                "hover:bg-secondary/80 text-muted-foreground hover:text-foreground",
                "p-0 min-h-[32px]",
                className
            )}
        >
            {/* Icon */}
            <div className="w-8 h-8 flex items-center justify-center shrink-0">
                <MessageSquare className="h-4 w-4" />
            </div>

            {/* Label */}
            <span className={cn(
                "text-[13px] font-medium truncate transition-all duration-150 ease-in-out text-left",
                isExpanded ? "flex-1 opacity-100 ml-2" : "w-0 opacity-0 ml-0"
            )}>
                Feedback
            </span>
        </button>
    );
}

