"use client";

import { useState, useCallback, useRef } from "react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ContextSidebar } from "@/stores/sidebar-store";
import { BlockCatalog } from "../components/block-catalog";
import { ReportCanvas } from "../components/report-canvas";
import { BlockConfigPanel } from "../components/block-config-panel";
import { BlockRenderer } from "../components/block-renderer";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { Download, Eye, Trash2, Building2 } from "lucide-react";
import { toast } from "sonner";
import type { PdfGlobalTheme } from "@/features/organization/actions/pdf-settings";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

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

export interface CompanyInfo {
    companyName?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    phone?: string;
    email?: string;
}

export interface ReportsBuilderViewProps {
    organizationId: string;
    projects: { id: string; name: string; status: string }[];
    pdfTheme?: PdfGlobalTheme;
    logoUrl?: string | null;
    companyInfo?: CompanyInfo;
}

export function ReportsBuilderView({ organizationId, projects, pdfTheme, logoUrl, companyInfo }: ReportsBuilderViewProps) {
    // State
    const [blocks, setBlocks] = useState<ReportBlock[]>([]);
    const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null); // Global project filter

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
    const canvasRef = useRef<HTMLDivElement>(null);

    const handleExport = async () => {
        if (!canvasRef.current || blocks.length === 0) {
            toast.error("No hay bloques para exportar");
            return;
        }

        toast.info("Generando PDF...");

        try {
            // Dynamic imports for code splitting
            const html2canvas = (await import("html2canvas")).default;
            const { jsPDF } = await import("jspdf");

            // Clone the element to avoid modifying the original
            const clone = canvasRef.current.cloneNode(true) as HTMLElement;

            // Position clone off-screen but visible for rendering
            clone.style.position = "absolute";
            clone.style.left = "-9999px";
            clone.style.top = "0";
            clone.style.width = `${canvasRef.current.offsetWidth}px`;
            clone.style.backgroundColor = "#ffffff";

            // Create a container with forced safe colors via inline styles
            // This bypasses the lab() color function issue in html2canvas
            const container = document.createElement("div");
            container.style.position = "absolute";
            container.style.left = "-9999px";
            container.style.top = "0";
            container.style.backgroundColor = "#ffffff";
            container.style.color = "#1a1a1a";

            // Add a style element to override CSS variables with safe colors
            const styleOverride = document.createElement("style");
            styleOverride.textContent = `
                * {
                    --background: 0 0% 100% !important;
                    --foreground: 0 0% 10% !important;
                    --card: 0 0% 100% !important;
                    --card-foreground: 0 0% 10% !important;
                    --primary: 221 83% 53% !important;
                    --primary-foreground: 0 0% 100% !important;
                    --secondary: 0 0% 96% !important;
                    --secondary-foreground: 0 0% 10% !important;
                    --muted: 0 0% 96% !important;
                    --muted-foreground: 0 0% 45% !important;
                    --accent: 0 0% 96% !important;
                    --accent-foreground: 0 0% 10% !important;
                    --destructive: 0 84% 60% !important;
                    --destructive-foreground: 0 0% 100% !important;
                    --border: 0 0% 90% !important;
                    --input: 0 0% 90% !important;
                    --ring: 221 83% 53% !important;
                }
            `;
            container.appendChild(styleOverride);
            container.appendChild(clone);
            document.body.appendChild(container);

            // Wait a frame for styles to apply
            await new Promise(resolve => requestAnimationFrame(resolve));

            // Render the clone to canvas
            const canvas = await html2canvas(clone, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: "#ffffff",
            });

            // Clean up
            document.body.removeChild(container);

            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4",
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = pdfWidth - 20; // 10mm margins
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            let heightLeft = imgHeight;
            let position = 10; // Top margin

            // First page
            pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
            heightLeft -= (pdfHeight - 20); // Account for margins

            // Add more pages if needed
            while (heightLeft > 0) {
                position = heightLeft - imgHeight + 10;
                pdf.addPage();
                pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
                heightLeft -= (pdfHeight - 20);
            }

            // Download
            const fileName = `Reporte_${new Date().toISOString().slice(0, 10)}.pdf`;
            pdf.save(fileName);

            toast.success("PDF descargado correctamente");
        } catch (error) {
            console.error("Error generating PDF:", error);
            toast.error("Error al generar el PDF");
        }
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
                    {/* Global Project Selector */}
                    <div className="mb-4 pb-4 border-b border-border/50">
                        <Label className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5" />
                            Filtro de Proyecto
                        </Label>
                        <Select
                            value={selectedProjectId || "all"}
                            onValueChange={(v) => setSelectedProjectId(v === "all" ? null : v)}
                        >
                            <SelectTrigger className="w-full h-9">
                                <SelectValue placeholder="Todos los proyectos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los proyectos</SelectItem>
                                {projects.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>
                                        {p.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
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
                    <div ref={canvasRef} className="flex-1 overflow-auto bg-white">
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
                                pdfTheme={pdfTheme}
                                logoUrl={logoUrl}
                                companyInfo={companyInfo}
                                selectedProjectId={selectedProjectId}
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
