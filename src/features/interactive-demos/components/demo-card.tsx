/**
 * DemoCard - Container para demos interactivos
 * 
 * Card que envuelve cada demo con título, descripción y badge.
 */

import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface DemoCardProps {
    title: string;
    description: string;
    icon: LucideIcon;
    badge?: string;
    badgeColor?: string;
    children: React.ReactNode;
    className?: string;
}

export function DemoCard({
    title,
    description,
    icon: Icon,
    badge,
    badgeColor = 'bg-primary',
    children,
    className,
}: DemoCardProps) {
    return (
        <div
            className={cn(
                'group relative rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm',
                'p-6 transition-all duration-300',
                'hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5',
                className
            )}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg">{title}</h3>
                        <p className="text-sm text-muted-foreground">{description}</p>
                    </div>
                </div>
                {badge && (
                    <span className={cn(
                        'text-[10px] font-medium text-white px-2 py-1 rounded-full',
                        badgeColor
                    )}>
                        {badge}
                    </span>
                )}
            </div>

            {/* Demo Container */}
            <div className="relative rounded-xl border border-border/30 bg-background/50 p-4 overflow-hidden">
                {/* Gradient overlay top */}
                <div className="absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-background/50 to-transparent pointer-events-none z-10" />

                {children}

                {/* Gradient overlay bottom */}
                <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-background/50 to-transparent pointer-events-none z-10" />
            </div>
        </div>
    );
}
