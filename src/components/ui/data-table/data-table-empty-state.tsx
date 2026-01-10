import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataTableEmptyStateProps {
    title: string;
    description: string;
    icon: LucideIcon;
    action?: React.ReactNode;
    className?: string;
}

export function DataTableEmptyState({
    title,
    description,
    icon: Icon,
    action,
    className,
}: DataTableEmptyStateProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
            <div className="rounded-full bg-muted p-4 mb-4">
                <Icon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-lg">{title}</h3>
            <p className="text-muted-foreground text-sm mt-1 max-w-sm">
                {description}
            </p>
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}
