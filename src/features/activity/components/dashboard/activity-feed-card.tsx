"use client";

import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export function ActivityFeedCard({ activity, className }: { activity: any[], className?: string }) {
    // Only show first 5 items for dashboard
    const recentActivity = activity.slice(0, 5);

    return (
        <div className={cn("relative", className)}>
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-px bg-border/50"></div>

            {recentActivity.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                    <Calendar className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">Sin actividad reciente</p>
                </div>
            ) : (
                <div className="py-4 space-y-4">
                    {recentActivity.map((log: any, i) => (
                        <div key={log.id || i} className="px-6 relative flex gap-4">
                            <div className="relative z-10 mt-1">
                                <div className="w-4 h-4 rounded-full bg-background border-2 border-primary ring-4 ring-background"></div>
                            </div>
                            <div className="flex-1 pb-4 border-b border-border/40 last:border-0">
                                <p className="text-sm font-medium text-foreground">
                                    <span className="text-primary">{log.full_name || log.details?.user_name || 'Usuario'}</span>
                                    {' '}
                                    <span className="text-muted-foreground font-normal">{log.action || log.action_description}</span>
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: es })}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
