"use client";

import { BentoCard } from "@/components/bento/bento-card";
import { Zap, Plus, ArrowRightLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function QuickActionsWidget({ size = 'sm' }: { size?: 'sm' | 'md' }) {

    const handleAction = (action: string) => {
        toast.info(`Acción rápida: ${action}`, {
            description: "Esta funcionalidad se conectará con los formularios en el próximo sprint."
        });
    }

    return (
        <BentoCard
            size={size as any}
            title="Acciones Rápidas"
            subtitle="Operaciones frecuentes"
            icon={<Zap className="w-4 h-4" />}
        >
            <div className="flex flex-col justify-center gap-2 h-full">
                <Button
                    variant="outline"
                    className="justify-start gap-2 h-9 text-sm font-normal border-dashed hover:border-solid hover:bg-emerald-500/5 hover:text-emerald-600 hover:border-emerald-200"
                    onClick={() => handleAction("Nuevo Ingreso")}
                >
                    <div className="p-0.5 rounded bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50">
                        <Plus className="w-3 h-3" />
                    </div>
                    Registrar Ingreso
                </Button>

                <Button
                    variant="outline"
                    className="justify-start gap-2 h-9 text-sm font-normal border-dashed hover:border-solid hover:bg-red-500/5 hover:text-red-600 hover:border-red-200"
                    onClick={() => handleAction("Nuevo Egreso")}
                >
                    <div className="p-0.5 rounded bg-red-100 text-red-600 dark:bg-red-900/50">
                        <ArrowRightLeft className="w-3 h-3" />
                    </div>
                    Registrar Gasto
                </Button>

                <Button
                    variant="ghost"
                    className="justify-start gap-2 h-9 text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => handleAction("Ver Reportes")}
                >
                    <Download className="w-3.5 h-3.5" />
                    Exportar Reporte
                </Button>
            </div>
        </BentoCard>
    );
}
