import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface DataTableAvatarCellProps {
    /** Main text to display (e.g. Name) */
    title: string;
    /** Secondary text (e.g. Email, Role) */
    subtitle?: string | null;
    /** Avatar URL */
    src?: string | null;
    /** Fallback text (Initials) if image fails or is missing */
    fallback?: string;
    /** Optional custom class */
    className?: string;
}

export function DataTableAvatarCell({
    title,
    subtitle,
    src,
    fallback,
    className
}: DataTableAvatarCellProps) {
    const initials = fallback || title.substring(0, 2).toUpperCase();

    return (
        <div className={cn("flex items-center gap-3", className)}>
            <Avatar className="h-9 w-9 border border-border/50">
                <AvatarImage src={src || undefined} alt={title} />
                <AvatarFallback className="text-[10px] font-bold bg-primary/5 text-primary">
                    {initials}
                </AvatarFallback>
            </Avatar>
            <div className="flex flex-col max-w-[180px]">
                <span className="font-medium text-sm truncate" title={title}>
                    {title}
                </span>
                {subtitle && (
                    <span className="text-xs text-muted-foreground truncate" title={subtitle}>
                        {subtitle}
                    </span>
                )}
            </div>
        </div>
    );
}

