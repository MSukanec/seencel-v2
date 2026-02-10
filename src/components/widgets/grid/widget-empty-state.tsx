import { type LucideIcon } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

// ============================================================================
// WIDGET EMPTY STATE
// ============================================================================
// Componente compartido para todos los widgets cuando no tienen datos.
// Muestra un ícono, título, descripción y botón secundario para navegar.
// ============================================================================

interface WidgetEmptyStateProps {
    /** Ícono representativo del widget */
    icon: LucideIcon;
    /** Título corto (ej: "Sin proyectos") */
    title: string;
    /** Descripción corta (ej: "Creá tu primer proyecto para empezar") */
    description: string;
    /** Ruta a la que lleva el botón (usa i18n Link) */
    href?: string;
    /** Label del botón */
    actionLabel?: string;
}

export function WidgetEmptyState({
    icon: Icon,
    title,
    description,
    href,
    actionLabel = "Ir",
}: WidgetEmptyStateProps) {
    return (
        <div className="h-full flex flex-col items-center justify-center text-center gap-3 px-6 py-4">
            <div className="p-2.5 rounded-xl bg-muted/50">
                <Icon className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <div className="space-y-1">
                <p className="text-sm font-medium text-foreground/80">{title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
            </div>
            {href && (
                <Link href={href as any}>
                    <Button variant="outline" size="sm" className="mt-1 gap-1.5 text-xs h-7 cursor-pointer">
                        {actionLabel}
                        <ArrowRight className="h-3 w-3" />
                    </Button>
                </Link>
            )}
        </div>
    );
}
