"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Maximize2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface DashboardCardProps {
    title: string;
    description?: string;
    icon?: React.ReactNode;
    iconClassName?: string;
    children: React.ReactNode;
    className?: string;
    contentClassName?: string;
    action?: React.ReactNode;
    headerAction?: React.ReactNode; // For custom buttons in header
    footer?: React.ReactNode;
    // Preset actions
    onExpand?: () => void;
    onRefresh?: () => void;
}

export function DashboardCard({
    title,
    description,
    icon,
    iconClassName,
    children,
    className,
    contentClassName,
    action,
    headerAction,
    footer,
    onExpand,
    onRefresh
}: DashboardCardProps) {
    return (
        <Card className={cn("flex flex-col h-full bg-card/50 backdrop-blur-sm transition-all hover:bg-card/80 hover:shadow-md", className)}>
            <CardHeader className="pb-3 space-y-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        {icon && (
                            <div className={cn("p-2 rounded-lg bg-primary/10 text-primary", iconClassName)}>
                                {icon}
                            </div>
                        )}
                        <div>
                            <CardTitle className="text-base font-semibold leading-none">{title}</CardTitle>
                            {description && (
                                <CardDescription className="text-xs pt-1">{description}</CardDescription>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        {headerAction}

                        {/* Common Actions */}
                        {(onExpand || onRefresh) && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {onRefresh && <DropdownMenuItem onClick={onRefresh}>Actualizar</DropdownMenuItem>}
                                    {onExpand && (
                                        <DropdownMenuItem onClick={onExpand}>
                                            <Maximize2 className="mr-2 h-3 w-3" />
                                            Expandir
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className={cn("flex-1 min-h-[100px]", contentClassName)}>
                {children}
            </CardContent>
            {footer && (
                <div className="p-4 pt-0 border-t bg-muted/20">
                    {footer}
                </div>
            )}
        </Card>
    );
}

