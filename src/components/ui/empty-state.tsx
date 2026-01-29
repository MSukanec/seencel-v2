import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface EmptyStateProps {
    title: string;
    description: React.ReactNode;
    icon: LucideIcon;
    action?: React.ReactNode;
    className?: string;
    /** Show a "Coming Soon" badge above the title */
    comingSoon?: boolean;
}

export function EmptyState({
    title,
    description,
    icon: Icon,
    action,
    className,
    comingSoon = false,
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                "relative flex flex-col items-center justify-center flex-1 min-h-0 h-full p-8 text-center animate-in fade-in-50 zoom-in-95 duration-500 overflow-hidden",
                "border-2 border-dashed border-primary/25 rounded-xl",
                className
            )}
        >
            {/* Background Pattern: Diagonal Hatching */}
            <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: `repeating-linear-gradient(
                        -45deg,
                        transparent,
                        transparent 10px,
                        currentColor 10px,
                        currentColor 12px
                    )`
                }}
            />

            {/* Accent Gradient Blur (Subtle ambient light) */}
            <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent opacity-50 pointer-events-none" />

            <div className="relative mb-6 z-10">
                {/* Icon Container with Bounce/Float Animation */}
                <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-card to-muted border border-border shadow-sm animate-[bounce_3s_infinite] rotate-3 hover:rotate-6 transition-transform duration-500">
                    {/* Inner glow */}
                    <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-md" />
                    <Icon className="relative h-10 w-10 text-primary/80" />

                    {/* Decorative square element */}
                    <div className="absolute -top-2 -right-2 w-6 h-6 border-2 border-primary/20 rounded-md animate-[spin_8s_linear_infinite]" />
                </div>
            </div>

            {/* Coming Soon Badge */}
            {comingSoon && (
                <Badge
                    variant="outline"
                    className="relative z-10 mb-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 uppercase tracking-wider text-xs font-semibold px-3 py-1"
                >
                    Próximamente
                </Badge>
            )}

            <h3 className="relative z-10 text-xl font-bold tracking-tight text-foreground/90">
                {title}
            </h3>

            <p className="relative z-10 mt-2 mb-6 text-base text-muted-foreground max-w-sm leading-relaxed">
                {description}
            </p>

            {action && (
                <div className="relative z-10 mt-2 animate-in slide-in-from-bottom-2 fade-in duration-700 delay-150">
                    {action}
                </div>
            )}
        </div>
    );
}

