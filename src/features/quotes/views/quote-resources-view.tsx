"use client";

import { Package, Hammer, Wrench, DollarSign, Layers } from "lucide-react";
import { useMoney } from "@/hooks/use-money";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { DashboardKpiCard } from "@/components/dashboard/dashboard-kpi-card";
import {
    SettingsSection,
    SettingsSectionContainer,
} from "@/components/shared/settings-section";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { QuoteResources } from "../types";

// ============================================================================
// Props
// ============================================================================

interface QuoteResourcesViewProps {
    resources: QuoteResources;
}

// ============================================================================
// Helper: Resource Table Row
// ============================================================================

function ResourceRow({
    cells,
    highlight,
}: {
    cells: React.ReactNode[];
    highlight?: boolean;
}) {
    return (
        <tr className={cn(
            "border-b last:border-b-0 transition-colors",
            highlight ? "bg-primary/5 font-semibold" : "hover:bg-muted/30"
        )}>
            {cells.map((cell, i) => (
                <td key={i} className={cn(
                    "px-3 py-2.5 text-sm",
                    i === 0 ? "text-left" : "text-right",
                    i === 0 && "font-medium"
                )}>
                    {cell}
                </td>
            ))}
        </tr>
    );
}

function TableHeader({ headers }: { headers: string[] }) {
    return (
        <thead>
            <tr className="border-b border-border/50">
                {headers.map((h, i) => (
                    <th key={i} className={cn(
                        "px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider",
                        i === 0 ? "text-left" : "text-right"
                    )}>
                        {h}
                    </th>
                ))}
            </tr>
        </thead>
    );
}

// ============================================================================
// Component
// ============================================================================

export function QuoteResourcesView({ resources }: QuoteResourcesViewProps) {
    const money = useMoney();

    const hasAnyResources =
        resources.materials.length > 0 ||
        resources.labor.length > 0 ||
        resources.externalServices.length > 0;

    // ── Empty state ──────────────────────────────────────────────────────────
    if (!hasAnyResources) {
        return (
            <div className="h-full flex items-center justify-center">
                <ViewEmptyState
                    mode="empty"
                    icon={Layers}
                    viewName="Recursos del Presupuesto"
                    featureDescription="Los recursos se calculan automáticamente a partir de las recetas asignadas a cada ítem del presupuesto. Agregá ítems con recetas para ver el desglose de materiales, mano de obra y servicios externos."
                />
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* ── KPI Cards ───────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <DashboardKpiCard
                    title="Materiales"
                    amount={resources.totals.materials}
                    icon={<Package className="h-4 w-4" />}
                    description={`${resources.materials.length} tipo${resources.materials.length !== 1 ? "s" : ""}`}
                />
                <DashboardKpiCard
                    title="Mano de Obra"
                    amount={resources.totals.labor}
                    icon={<Hammer className="h-4 w-4" />}
                    description={`${resources.labor.length} tipo${resources.labor.length !== 1 ? "s" : ""}`}
                />
                <DashboardKpiCard
                    title="Servicios Ext."
                    amount={resources.totals.externalServices}
                    icon={<Wrench className="h-4 w-4" />}
                    description={`${resources.externalServices.length} servicio${resources.externalServices.length !== 1 ? "s" : ""}`}
                />
                <DashboardKpiCard
                    title="Costo Total"
                    amount={resources.totals.grand_total}
                    icon={<DollarSign className="h-4 w-4" />}
                    description="Recursos totales"
                />
            </div>

            <SettingsSectionContainer>
                {/* ═══════════════════════════════════════════════════════ */}
                {/* SECCIÓN 1: Materiales                                 */}
                {/* ═══════════════════════════════════════════════════════ */}
                {resources.materials.length > 0 && (
                    <SettingsSection
                        icon={Package}
                        title="Materiales"
                        description={`${resources.materials.length} materiales diferentes — Total: ${money.format(resources.totals.materials)}`}
                    >
                        <div className="overflow-x-auto -mx-1">
                            <table className="w-full">
                                <TableHeader headers={["Material", "Unidad", "Cantidad", "Desp. %", "Precio Unit.", "Costo Total"]} />
                                <tbody>
                                    {resources.materials.map((mat) => (
                                        <ResourceRow
                                            key={mat.material_id}
                                            cells={[
                                                <div>
                                                    <span>{mat.material_name}</span>
                                                    {mat.task_names.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {mat.task_names.map((tn, i) => (
                                                                <Badge key={i} variant="outline" className="text-[10px] py-0 px-1.5 font-normal text-muted-foreground">
                                                                    {tn}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>,
                                                <span className="text-muted-foreground">{mat.unit_symbol || mat.unit_name || "—"}</span>,
                                                <span className="font-mono tabular-nums">{mat.total_quantity.toLocaleString("es-AR", { maximumFractionDigits: 2 })}</span>,
                                                <span className="text-muted-foreground">{mat.waste_percentage > 0 ? `${mat.waste_percentage}%` : "—"}</span>,
                                                <span className="font-mono tabular-nums">{mat.unit_price ? money.format(mat.unit_price) : "Sin precio"}</span>,
                                                <span className="font-mono tabular-nums font-medium">{money.format(mat.total_cost)}</span>,
                                            ]}
                                        />
                                    ))}
                                    {/* Total row */}
                                    <ResourceRow
                                        highlight
                                        cells={[
                                            "Total Materiales",
                                            "", "", "", "",
                                            <span className="font-mono tabular-nums">{money.format(resources.totals.materials)}</span>,
                                        ]}
                                    />
                                </tbody>
                            </table>
                        </div>
                    </SettingsSection>
                )}

                {/* ═══════════════════════════════════════════════════════ */}
                {/* SECCIÓN 2: Mano de Obra                               */}
                {/* ═══════════════════════════════════════════════════════ */}
                {resources.labor.length > 0 && (
                    <SettingsSection
                        icon={Hammer}
                        title="Mano de Obra"
                        description={`${resources.labor.length} tipos de mano de obra — Total: ${money.format(resources.totals.labor)}`}
                    >
                        <div className="overflow-x-auto -mx-1">
                            <table className="w-full">
                                <TableHeader headers={["Tipo de M.O.", "Unidad", "Cantidad", "Precio Unit.", "Costo Total"]} />
                                <tbody>
                                    {resources.labor.map((lab) => (
                                        <ResourceRow
                                            key={lab.labor_type_id}
                                            cells={[
                                                <div>
                                                    <span>{lab.labor_name}</span>
                                                    {lab.task_names.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {lab.task_names.map((tn, i) => (
                                                                <Badge key={i} variant="outline" className="text-[10px] py-0 px-1.5 font-normal text-muted-foreground">
                                                                    {tn}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>,
                                                <span className="text-muted-foreground">{lab.unit_symbol || lab.unit_name || "—"}</span>,
                                                <span className="font-mono tabular-nums">{lab.total_quantity.toLocaleString("es-AR", { maximumFractionDigits: 2 })}</span>,
                                                <span className="font-mono tabular-nums">{lab.unit_price ? money.format(lab.unit_price) : "Sin precio"}</span>,
                                                <span className="font-mono tabular-nums font-medium">{money.format(lab.total_cost)}</span>,
                                            ]}
                                        />
                                    ))}
                                    <ResourceRow
                                        highlight
                                        cells={[
                                            "Total Mano de Obra",
                                            "", "", "",
                                            <span className="font-mono tabular-nums">{money.format(resources.totals.labor)}</span>,
                                        ]}
                                    />
                                </tbody>
                            </table>
                        </div>
                    </SettingsSection>
                )}

                {/* ═══════════════════════════════════════════════════════ */}
                {/* SECCIÓN 3: Servicios Externos                         */}
                {/* ═══════════════════════════════════════════════════════ */}
                {resources.externalServices.length > 0 && (
                    <SettingsSection
                        icon={Wrench}
                        title="Servicios Externos"
                        description={`${resources.externalServices.length} servicios — Total: ${money.format(resources.totals.externalServices)}`}
                    >
                        <div className="overflow-x-auto -mx-1">
                            <table className="w-full">
                                <TableHeader headers={["Servicio", "Proveedor", "Precio Unit.", "Costo Total"]} />
                                <tbody>
                                    {resources.externalServices.map((svc) => (
                                        <ResourceRow
                                            key={svc.service_id}
                                            cells={[
                                                <div>
                                                    <span>{svc.service_name}</span>
                                                    {svc.task_names.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {svc.task_names.map((tn, i) => (
                                                                <Badge key={i} variant="outline" className="text-[10px] py-0 px-1.5 font-normal text-muted-foreground">
                                                                    {tn}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>,
                                                <span className="text-muted-foreground">{svc.contact_name || "—"}</span>,
                                                <span className="font-mono tabular-nums">{money.format(svc.unit_price)}</span>,
                                                <span className="font-mono tabular-nums font-medium">{money.format(svc.total_cost)}</span>,
                                            ]}
                                        />
                                    ))}
                                    <ResourceRow
                                        highlight
                                        cells={[
                                            "Total Servicios Externos",
                                            "", "",
                                            <span className="font-mono tabular-nums">{money.format(resources.totals.externalServices)}</span>,
                                        ]}
                                    />
                                </tbody>
                            </table>
                        </div>
                    </SettingsSection>
                )}
            </SettingsSectionContainer>
        </div>
    );
}
