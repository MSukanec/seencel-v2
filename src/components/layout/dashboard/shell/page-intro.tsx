/**
 * PageIntro — Encabezado visual de contexto para páginas
 *
 * Muestra ícono, título y descripción al inicio de una vista.
 * Ideal para páginas de configuración u otras que necesiten
 * dar contexto antes de las secciones de contenido.
 *
 * Uso:
 *   <PageIntro
 *       icon={Sparkles}
 *       title="Inteligencia Artificial"
 *       description="Configurá el consumo y acceso a funciones de IA."
 *   />
 */

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface PageIntroProps {
    /** Icon representing the page/feature */
    icon: LucideIcon;
    /** Page title */
    title: string;
    /** Brief description of what the page is for */
    description: string;
    /** Optional className for the container */
    className?: string;
}

export function PageIntro({ icon: Icon, title, description, className }: PageIntroProps) {
    return (
        <div className={cn("mb-8", className)}>
            <div className="flex items-start gap-4 pb-6">
                <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10"
                    style={{
                        boxShadow: "inset 0 1px 2px rgba(0,0,0,0.2), 0 1px 0 rgba(255,255,255,0.04)",
                    }}
                >
                    <Icon
                        className="h-5 w-5 text-primary/70"
                        style={{
                            filter: "drop-shadow(0 1px 0 rgba(255,255,255,0.08))",
                        }}
                    />
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                    <h2 className="text-lg font-semibold tracking-tight text-foreground">
                        {title}
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {description}
                    </p>
                </div>
            </div>
            <Separator />
        </div>
    );
}
