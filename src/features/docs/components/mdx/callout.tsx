import { cn } from "@/lib/utils";
import { AlertCircle, Info, Lightbulb, AlertTriangle } from "lucide-react";

interface CalloutProps {
    type?: "info" | "warning" | "tip" | "danger" | "important";
    title?: string;
    children: React.ReactNode;
}

const iconMap: Record<string, typeof Info> = {
    info: Info,
    warning: AlertTriangle,
    tip: Lightbulb,
    danger: AlertCircle,
    important: Info,
};

const styleMap: Record<string, string> = {
    info: "bg-primary/10 border-primary/50 text-primary",
    warning: "bg-yellow-500/10 border-yellow-500/50 text-yellow-700 dark:text-yellow-300",
    tip: "bg-primary/10 border-primary/50 text-primary",
    danger: "bg-red-500/10 border-red-500/50 text-red-700 dark:text-red-300",
    important: "bg-primary/10 border-primary/50 text-primary",
};

export function Callout({ type = "info", title, children }: CalloutProps) {
    const Icon = iconMap[type] || Info;

    return (
        <div className={cn(
            "my-4 rounded-lg border p-4",
            styleMap[type]
        )}>
            <div className="flex gap-3">
                <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                    {title && (
                        <p className="font-semibold mb-1">{title}</p>
                    )}
                    <div className="text-sm [&>p]:m-0">{children}</div>
                </div>
            </div>
        </div>
    );
}
