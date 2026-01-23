"use client";

import { cn } from "@/lib/utils";
import { Monitor } from "lucide-react";

export function ThemePreview({
    label,
    value,
    current,
    onClick,
    type
}: {
    label: string;
    value: string;
    current?: string;
    onClick: () => void;
    type: 'light' | 'dark' | 'system';
}) {
    const isActive = current === value;

    return (
        <div onClick={onClick} className="cursor-pointer group">
            <div className={cn(
                "relative h-28 w-full rounded-lg border-2 overflow-hidden transition-all mb-2",
                isActive ? "border-primary ring-2 ring-primary/20 ring-offset-2" : "border-muted group-hover:border-primary/50"
            )}>
                {type === 'light' && (
                    <div className="h-full w-full bg-[#f4f4f5] p-2 flex flex-col gap-2">
                        <div className="h-2 w-full bg-white rounded-sm shadow-sm border border-black/5" />
                        <div className="flex-1 w-full bg-white rounded-sm shadow-sm border border-black/5 p-1.5 flex gap-1">
                            <div className="w-1/4 h-full bg-black/5 rounded-[2px]" />
                            <div className="flex-1 h-full flex flex-col gap-1.5">
                                <div className="h-2 w-3/4 bg-black/10 rounded-[2px]" />
                                <div className="h-1.5 w-full bg-black/5 rounded-[1px]" />
                                <div className="h-1.5 w-full bg-black/5 rounded-[1px]" />
                            </div>
                        </div>
                    </div>
                )}
                {type === 'dark' && (
                    <div className="h-full w-full bg-[#18181b] p-2 flex flex-col gap-2">
                        <div className="h-2 w-full bg-[#27272a] rounded-sm shadow-sm border border-white/5" />
                        <div className="flex-1 w-full bg-[#27272a] rounded-sm shadow-sm border border-white/5 p-1.5 flex gap-1">
                            <div className="w-1/4 h-full bg-white/5 rounded-[2px]" />
                            <div className="flex-1 h-full flex flex-col gap-1.5">
                                <div className="h-2 w-3/4 bg-white/10 rounded-[2px]" />
                                <div className="h-1.5 w-full bg-white/5 rounded-[1px]" />
                                <div className="h-1.5 w-full bg-white/5 rounded-[1px]" />
                            </div>
                        </div>
                    </div>
                )}
                {type === 'system' && (
                    <div className="h-full w-full flex">
                        <div className="w-1/2 h-full bg-[#f4f4f5] p-2 pr-0 flex flex-col gap-2 border-r border-black/5">
                            <div className="h-2 w-full bg-white rounded-l-sm shadow-sm border-y border-l border-black/5" />
                            <div className="flex-1 w-full bg-white rounded-l-sm shadow-sm border-y border-l border-black/5 p-1.5 flex gap-1">
                                <div className="w-1/4 h-full bg-black/5 rounded-[2px]" />
                                <div className="flex-1 h-full flex flex-col gap-1.5">
                                    <div className="h-2 w-3/4 bg-black/10 rounded-[2px]" />
                                    <div className="h-1.5 w-full bg-black/5 rounded-[1px]" />
                                </div>
                            </div>
                        </div>
                        <div className="w-1/2 h-full bg-[#18181b] p-2 pl-0 flex flex-col gap-2">
                            <div className="h-2 w-full bg-[#27272a] rounded-r-sm shadow-sm border-y border-r border-white/5" />
                            <div className="flex-1 w-full bg-[#27272a] rounded-r-sm shadow-sm border-y border-r border-white/5 p-1.5 flex gap-1">
                                <div className="flex-1 h-full flex flex-col gap-1.5">
                                    <div className="h-2 w-3/4 bg-white/10 rounded-[2px]" />
                                    <div className="h-1.5 w-full bg-white/5 rounded-[1px]" />
                                </div>
                            </div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-background/80 backdrop-blur-sm p-1.5 rounded-full shadow-lg border border-border">
                                <Monitor className="w-4 h-4 text-foreground" />
                            </div>
                        </div>
                    </div>
                )}
                {isActive && (
                    <div className="absolute bottom-1 right-1 h-5 w-5 bg-primary rounded-full flex items-center justify-center shadow-md">
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                )}
            </div>
            <div className="text-center font-medium text-sm text-foreground/80">
                {label}
            </div>
        </div>
    );
}

