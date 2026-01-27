"use client";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import type { ReportBlock, BlockConfig } from "../views/reports-builder-view";
import { DATA_SOURCE_REGISTRY, getDataSource, getDataTable } from "../lib/data-source-registry";
import { getSubcontractsForProject } from "../lib/data-fetchers";

interface BlockConfigPanelProps {
    block: ReportBlock;
    projects: { id: string; name: string; status: string }[];
    projectId?: string; // Current project context
    onUpdateConfig: (config: Partial<BlockConfig>) => void;
}

export function BlockConfigPanel({
    block,
    projects,
    projectId,
    onUpdateConfig
}: BlockConfigPanelProps) {
    const { config } = block;

    // Entity options for filters (e.g., list of subcontracts)
    const [entityOptions, setEntityOptions] = useState<{ id: string; name: string }[]>([]);
    const [loadingEntities, setLoadingEntities] = useState(false);

    // Load entity options when source/table changes
    useEffect(() => {
        async function loadEntities() {
            const selectedProjectId = config.dataFilters?.projectId;
            if (!selectedProjectId || !config.dataSourceId || !config.dataTableId) {
                setEntityOptions([]);
                return;
            }

            // Load filter options based on source
            if (config.dataSourceId === "subcontracts") {
                setLoadingEntities(true);
                try {
                    const subs = await getSubcontractsForProject(selectedProjectId);
                    setEntityOptions(subs);
                } catch (e) {
                    console.error("Error loading subcontracts:", e);
                    setEntityOptions([]);
                } finally {
                    setLoadingEntities(false);
                }
            }
        }
        loadEntities();
    }, [config.dataFilters?.projectId, config.dataSourceId, config.dataTableId]);

    const BLOCK_TYPE_LABELS: Record<string, string> = {
        "kpi": "KPI",
        "chart-line": "Gráfico de Líneas",
        "chart-bar": "Gráfico de Barras",
        "chart-pie": "Gráfico de Torta",
        "table": "Tabla de Datos",
        "text": "Texto Libre",
        "image": "Imagen",
        "project-summary": "Resumen de Proyecto",
        "financial-summary": "Estado Financiero",
        "task-progress": "Progreso de Tareas",
    };

    // Get current source and table definitions
    const currentSource = config.dataSourceId ? getDataSource(config.dataSourceId) : null;
    const currentTable = config.dataSourceId && config.dataTableId
        ? getDataTable(config.dataSourceId, config.dataTableId)
        : null;

    return (
        <div className="h-full flex flex-col">
            <div className="pb-3 border-b border-border/50">
                <h3 className="font-semibold text-sm">Configuración</h3>
                <p className="text-xs text-muted-foreground mt-1">
                    {BLOCK_TYPE_LABELS[block.type] || block.type}
                </p>
            </div>

            <ScrollArea className="flex-1 pt-4">
                <div className="space-y-6 pr-2">
                    {/* Common: Title */}
                    <div className="space-y-2">
                        <Label className="text-xs">Título</Label>
                        <Input
                            value={config.title || ""}
                            onChange={(e) => onUpdateConfig({ title: e.target.value })}
                            placeholder="Título del bloque"
                            className="h-8 text-sm"
                        />
                    </div>

                    {/* Text Block: Content */}
                    {block.type === "text" && (
                        <div className="space-y-2">
                            <Label className="text-xs">Contenido</Label>
                            <Textarea
                                value={config.content || ""}
                                onChange={(e) => onUpdateConfig({ content: e.target.value })}
                                placeholder="Escribí tu contenido aquí..."
                                rows={6}
                                className="text-sm resize-none"
                            />
                        </div>
                    )}

                    {/* KPI Block: Value */}
                    {block.type === "kpi" && (
                        <>
                            <div className="space-y-2">
                                <Label className="text-xs">Valor</Label>
                                <Input
                                    value={config.value?.toString() || ""}
                                    onChange={(e) => onUpdateConfig({ value: e.target.value })}
                                    placeholder="Ej: $1,234,567"
                                    className="h-8 text-sm font-mono"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs">Subtítulo</Label>
                                <Input
                                    value={config.subtitle || ""}
                                    onChange={(e) => onUpdateConfig({ subtitle: e.target.value })}
                                    placeholder="Descripción adicional"
                                    className="h-8 text-sm"
                                />
                            </div>
                        </>
                    )}

                    {/* Image Block: URL */}
                    {block.type === "image" && (
                        <div className="space-y-2">
                            <Label className="text-xs">URL de la imagen</Label>
                            <Input
                                value={config.imageUrl || ""}
                                onChange={(e) => onUpdateConfig({ imageUrl: e.target.value })}
                                placeholder="https://..."
                                className="h-8 text-sm"
                            />
                        </div>
                    )}

                    {/* TABLE BLOCK: Registry-based data source config */}
                    {block.type === "table" && (
                        <>
                            <Separator />

                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                        Datos en Vivo
                                    </Badge>
                                </div>

                                {/* Data Source Selector */}
                                <div className="space-y-2">
                                    <Label className="text-xs">Fuente de Datos</Label>
                                    <Select
                                        value={config.dataSourceId || ""}
                                        onValueChange={(v) => onUpdateConfig({
                                            dataSourceId: v,
                                            dataTableId: undefined, // Reset table when source changes
                                            dataFilters: {}
                                        })}
                                    >
                                        <SelectTrigger className="h-8 text-sm">
                                            <SelectValue placeholder="Seleccionar fuente..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {DATA_SOURCE_REGISTRY.map((source) => (
                                                <SelectItem key={source.id} value={source.id}>
                                                    <div className="flex items-center gap-2">
                                                        <source.icon className="h-3.5 w-3.5" />
                                                        {source.name}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Table Selector (shows after source is selected) */}
                                {currentSource && (
                                    <div className="space-y-2">
                                        <Label className="text-xs">Tabla</Label>
                                        <Select
                                            value={config.dataTableId || ""}
                                            onValueChange={(v) => onUpdateConfig({
                                                dataTableId: v,
                                                dataFilters: {} // Reset filters when table changes
                                            })}
                                        >
                                            <SelectTrigger className="h-8 text-sm">
                                                <SelectValue placeholder="Seleccionar tabla..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {currentSource.tables.map((table) => (
                                                    <SelectItem key={table.id} value={table.id}>
                                                        <div>
                                                            <div>{table.name}</div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {table.description}
                                                            </div>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {/* Dynamic Filters (shows after table is selected) */}
                                {currentTable && currentTable.filters.map((filter) => {
                                    // Project filter uses the projects array passed as prop
                                    if (filter.key === "projectId") {
                                        return (
                                            <div key={filter.key} className="space-y-2">
                                                <Label className="text-xs">{filter.label}</Label>
                                                <Select
                                                    value={config.dataFilters?.[filter.key] || ""}
                                                    onValueChange={(v) => onUpdateConfig({
                                                        dataFilters: {
                                                            projectId: v,
                                                            // Reset subcontract when project changes
                                                            subcontractId: "all"
                                                        }
                                                    })}
                                                >
                                                    <SelectTrigger className="h-8 text-sm">
                                                        <SelectValue placeholder="Seleccionar proyecto..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {projects.map((project) => (
                                                            <SelectItem key={project.id} value={project.id}>
                                                                {project.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        );
                                    }

                                    // Other filters (like subcontractId) use dynamically loaded entityOptions
                                    // Only show if project is already selected
                                    if (!config.dataFilters?.projectId) return null;

                                    return (
                                        <div key={filter.key} className="space-y-2">
                                            <Label className="text-xs">{filter.label}</Label>
                                            <Select
                                                value={config.dataFilters?.[filter.key] || "all"}
                                                onValueChange={(v) => onUpdateConfig({
                                                    dataFilters: {
                                                        ...config.dataFilters,
                                                        [filter.key]: v
                                                    }
                                                })}
                                                disabled={loadingEntities}
                                            >
                                                <SelectTrigger className="h-8 text-sm">
                                                    <SelectValue placeholder={loadingEntities ? "Cargando..." : "Seleccionar..."} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {filter.allowAll && (
                                                        <SelectItem value="all">
                                                            Todos
                                                        </SelectItem>
                                                    )}
                                                    {entityOptions.map((entity) => (
                                                        <SelectItem key={entity.id} value={entity.id}>
                                                            {entity.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {/* Other data-driven blocks: Legacy config */}
                    {["chart-line", "chart-bar", "chart-pie", "project-summary", "financial-summary", "task-progress"].includes(block.type) && (
                        <>
                            <Separator />

                            <div className="space-y-2">
                                <Label className="text-xs">Fuente de Datos</Label>
                                <Select
                                    value={config.dataSource || "finance"}
                                    onValueChange={(v) => onUpdateConfig({ dataSource: v as any })}
                                >
                                    <SelectTrigger className="h-8 text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="finance">Finanzas</SelectItem>
                                        <SelectItem value="projects">Proyectos</SelectItem>
                                        <SelectItem value="tasks">Tareas</SelectItem>
                                        <SelectItem value="clients">Clientes</SelectItem>
                                        <SelectItem value="quotes">Presupuestos</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Project Filter */}
                            <div className="space-y-3">
                                <Label className="text-xs">Proyectos a Incluir</Label>
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {projects.length === 0 ? (
                                        <p className="text-xs text-muted-foreground">
                                            No hay proyectos disponibles
                                        </p>
                                    ) : (
                                        projects.map((project) => {
                                            const isChecked = config.projectIds?.includes(project.id) ?? false;
                                            return (
                                                <div
                                                    key={project.id}
                                                    className="flex items-center gap-2"
                                                >
                                                    <Checkbox
                                                        id={`project-${project.id}`}
                                                        checked={isChecked}
                                                        onCheckedChange={(checked) => {
                                                            const currentIds = config.projectIds || [];
                                                            const newIds = checked
                                                                ? [...currentIds, project.id]
                                                                : currentIds.filter(id => id !== project.id);
                                                            onUpdateConfig({ projectIds: newIds });
                                                        }}
                                                    />
                                                    <label
                                                        htmlFor={`project-${project.id}`}
                                                        className="text-xs cursor-pointer truncate"
                                                    >
                                                        {project.name}
                                                    </label>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}

