"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
    Activity,
    BarChart3,
    FileText,
    Hash,
    Image,
    LineChart,
    PieChart,
    Table2,
    Building2,
    DollarSign,
    CheckSquare,
} from "lucide-react";
import type { BlockType } from "../views/reports-builder-view";

interface BlockCatalogProps {
    onAddBlock: (type: BlockType) => void;
}

const BLOCK_CATEGORIES = [
    {
        name: "Datos",
        items: [
            { type: "kpi" as BlockType, label: "KPI", icon: Hash, description: "Valor numérico destacado" },
            { type: "table" as BlockType, label: "Tabla", icon: Table2, description: "Tabla de datos" },
        ],
    },
    {
        name: "Gráficos",
        items: [
            { type: "chart-line" as BlockType, label: "Líneas", icon: LineChart, description: "Evolución temporal" },
            { type: "chart-bar" as BlockType, label: "Barras", icon: BarChart3, description: "Comparación de valores" },
            { type: "chart-pie" as BlockType, label: "Torta", icon: PieChart, description: "Distribución porcentual" },
        ],
    },
    {
        name: "Resúmenes",
        items: [
            { type: "project-summary" as BlockType, label: "Proyecto", icon: Building2, description: "Resumen de proyecto" },
            { type: "financial-summary" as BlockType, label: "Finanzas", icon: DollarSign, description: "Estado financiero" },
            { type: "task-progress" as BlockType, label: "Tareas", icon: CheckSquare, description: "Progreso de tareas" },
        ],
    },
    {
        name: "Contenido",
        items: [
            { type: "text" as BlockType, label: "Texto", icon: FileText, description: "Texto libre o markdown" },
            { type: "image" as BlockType, label: "Imagen", icon: Image, description: "Logo o imagen" },
        ],
    },
];

export function BlockCatalog({ onAddBlock }: BlockCatalogProps) {
    return (
        <div className="h-full flex flex-col p-3">
            <ScrollArea className="flex-1">
                <div className="space-y-6">
                    {BLOCK_CATEGORIES.map((category) => (
                        <div key={category.name}>
                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                                {category.name}
                            </h4>
                            <div className="space-y-1">
                                {category.items.map((item) => (
                                    <Button
                                        key={item.type}
                                        variant="ghost"
                                        size="sm"
                                        className={cn(
                                            "w-full justify-start gap-3 h-auto py-2 px-3",
                                            "hover:bg-accent/50 transition-colors"
                                        )}
                                        onClick={() => onAddBlock(item.type)}
                                    >
                                        <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                                            <item.icon className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="text-left min-w-0">
                                            <div className="text-sm font-medium truncate">
                                                {item.label}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground truncate">
                                                {item.description}
                                            </div>
                                        </div>
                                    </Button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
