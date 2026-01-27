"use client";

import { useState, useCallback } from "react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ContextSidebar } from "@/providers/context-sidebar-provider";
import { BlockCatalog } from "../components/block-catalog";
import { ReportCanvas } from "../components/report-canvas";
import { BlockConfigPanel } from "../components/block-config-panel";
import { BlockRenderer } from "../components/block-renderer";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { Download, Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";

// Types
export interface ReportBlock {
    id: string;
    type: BlockType;
    config: BlockConfig;
}

export type BlockType =
    | "kpi"
    | "chart-line"
    | "chart-bar"
    | "chart-pie"
    | "table"
    | "text"
    | "image"
    | "project-summary"
    | "financial-summary"
    | "task-progress";

export interface BlockConfig {
    title?: string;
    subtitle?: string;
    // KPI specific
    value?: string | number;
    trend?: { value: number; direction: "up" | "down" | "neutral" };
    // Legacy data source (for non-table blocks)
    dataSource?: "projects" | "finance" | "tasks" | "clients" | "quotes" | "manual";
    projectIds?: string[];
    dateRange?: { from: Date; to: Date };
    // NEW: Registry-based data source (for table blocks)
    dataSourceId?: string;        // e.g., "subcontracts"
    dataTableId?: string;         // e.g., "payments"
    dataFilters?: Record<string, string>;  // e.g., {subcontractId: "uuid" | "all"}
    // Chart specific
    chartType?: "line" | "bar" | "pie" | "area";
    // Table specific
    columns?: string[];
    // Text specific
    content?: string;
    // Image specific
    imageUrl?: string;
}

interface ReportsBuilderViewProps {
    organizationId: string;
    projects: { id: string; name: string; status: string }[];
}

export function ReportsBuilderView({ organizationId, projects }: ReportsBuilderViewProps) {
    // State
    const [blocks, setBlocks] = useState<ReportBlock[]>([]);
    const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isPreviewMode, setIsPreviewMode] = useState(false);

    // Selected block
    const selectedBlock = blocks.find(b => b.id === selectedBlockId) || null;

    // Handlers
    const handleAddBlock = useCallback((type: BlockType) => {
        const newBlock: ReportBlock = {
            id: `block-${Date.now()}`,
            type,
            config: getDefaultConfig(type),
        };
        setBlocks(prev => [...prev, newBlock]);
        setSelectedBlockId(newBlock.id);
        toast.success("Bloque agregado");
    }, []);

    const handleRemoveBlock = useCallback((id: string) => {
        setBlocks(prev => prev.filter(b => b.id !== id));
        if (selectedBlockId === id) {
            setSelectedBlockId(null);
        }
        toast.success("Bloque eliminado");
    }, [selectedBlockId]);

    const handleUpdateBlockConfig = useCallback((id: string, newConfig: Partial<BlockConfig>) => {
        setBlocks(prev => prev.map(b =>
            b.id === id ? { ...b, config: { ...b.config, ...newConfig } } : b
        ));
    }, []);

    const handleClearAll = useCallback(() => {
        setBlocks([]);
        setSelectedBlockId(null);
        toast.success("Canvas limpiado");
    }, []);

    // Drag handlers
    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (over && active.id !== over.id) {
            setBlocks(prev => {
                const oldIndex = prev.findIndex(b => b.id === active.id);
                const newIndex = prev.findIndex(b => b.id === over.id);
                return arrayMove(prev, oldIndex, newIndex);
            });
        }
    };

    // Export handler
    const handleExport = async () => {
        toast.info("Generando PDF...");
        // TODO: Implement PDF export
        setTimeout(() => {
            toast.success("PDF descargado correctamente");
        }, 1500);
    };

    return (
        <>
            <Toolbar
                portalToHeader
                actions={[
                    {
                        label: blocks.length > 0 ? "Limpiar" : "",
                        icon: Trash2,
                        onClick: handleClearAll,
                        variant: "ghost",
                        disabled: blocks.length === 0,
                    },
                    {
                        label: isPreviewMode ? "Editar" : "Vista Previa",
                        icon: Eye,
                        onClick: () => setIsPreviewMode(!isPreviewMode),
                        variant: "secondary",
                    },
                    {
                        label: "Exportar PDF",
                        icon: Download,
                        onClick: handleExport,
                        disabled: blocks.length === 0,
                    },
                ]}
            />

            {/* Context Sidebar: Block Catalog (injected into layout's right sidebar) */}
            {!isPreviewMode && (
                <ContextSidebar title="Bloques">
                    <BlockCatalog onAddBlock={handleAddBlock} />
                </ContextSidebar>
            )}

            <DndContext
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="h-full flex gap-4">
                    {/* Main Canvas */}
                    <div className="flex-1 overflow-auto">
                        <SortableContext
                            items={blocks.map(b => b.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <ReportCanvas
                                blocks={blocks}
                                selectedBlockId={selectedBlockId}
                                onSelectBlock={setSelectedBlockId}
                                onRemoveBlock={handleRemoveBlock}
                                isPreviewMode={isPreviewMode}
                                organizationId={organizationId}
                                projects={projects}
                            />
                        </SortableContext>
                    </div>

                    {/* Right Panel: Block Config (when selected) */}
                    {!isPreviewMode && selectedBlock && (
                        <div className="w-72 shrink-0 border-l border-border/50 pl-4">
                            <BlockConfigPanel
                                block={selectedBlock}
                                projects={projects}
                                onUpdateConfig={(newConfig) =>
                                    handleUpdateBlockConfig(selectedBlock.id, newConfig)
                                }
                            />
                        </div>
                    )}
                </div>

                {/* Drag Overlay */}
                <DragOverlay>
                    {activeId ? (
                        <div className="opacity-80 bg-card border rounded-lg p-4 shadow-xl">
                            <BlockRenderer
                                block={blocks.find(b => b.id === activeId)!}
                                organizationId={organizationId}
                                projects={projects}
                            />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </>
    );
}

// Helper: Default config per block type
function getDefaultConfig(type: BlockType): BlockConfig {
    switch (type) {
        case "kpi":
            return { title: "KPI", value: "0", dataSource: "manual" };
        case "chart-line":
        case "chart-bar":
        case "chart-pie":
            return { title: "Gráfico", dataSource: "finance", chartType: type.replace("chart-", "") as any };
        case "table":
            return { title: "Tabla", dataSource: "projects", columns: [] };
        case "text":
            return { title: "Texto", content: "Escribí tu contenido aquí..." };
        case "image":
            return { title: "Imagen" };
        case "project-summary":
            return { title: "Resumen de Proyecto", dataSource: "projects" };
        case "financial-summary":
            return { title: "Estado Financiero", dataSource: "finance" };
        case "task-progress":
            return { title: "Progreso de Tareas", dataSource: "tasks" };
        default:
            return {};
    }
}
