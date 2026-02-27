"use client";

import { useState, useTransition, useMemo, useCallback } from "react";
import { useRouter } from "@/i18n/routing";
import { ColumnDef } from "@tanstack/react-table";
import {
    Plus,
    FileText,
    Download,
    Send,
    CheckCircle,
    FolderPlus,
    FileSignature,
    Edit,
    Trash2,
    Hash,
    Calculator,
    Receipt,
    DollarSign,
    Lock
} from "lucide-react";
import { toast } from "sonner";

import { DataTable, DataTableColumnHeader } from "@/components/shared/data-table";
import { createMoneyColumn, createTextColumn } from "@/components/shared/data-table/columns";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { FacetedFilter } from "@/components/layout/dashboard/shared/toolbar/toolbar-faceted-filter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { DashboardKpiCard } from "@/components/dashboard/dashboard-kpi-card";
import { DeleteConfirmationDialog } from "@/components/shared/forms/general/delete-confirmation-dialog";

import { usePanel } from "@/stores/panel-store";
import { QuoteConvertContractForm } from "../forms/quote-convert-contract-form";
import { convertQuoteToProject, approveQuote, convertQuoteToContract, deleteQuoteItem, updateQuoteItemField } from "../actions";
import { QuoteView, QuoteItemView, ContractSummary } from "../types";
import { TaskView, Unit, TaskDivision } from "@/features/tasks/types";
import { InlineEditableCell } from "@/components/shared/data-table/inline-editable-cell";
import { useOptimisticList } from "@/hooks/use-optimistic-action";

// ============================================================================
// QUOTE BASE VIEW
// ============================================================================
// Tab view for Quote/Contract items management
// ============================================================================

interface QuoteBaseViewProps {
    quote: QuoteView;
    items: QuoteItemView[];
    tasks: TaskView[];
    units: Unit[];
    divisions: TaskDivision[];
    currencies: { id: string; name: string; symbol: string }[];
    contractSummary?: ContractSummary | null;
}

export function QuoteBaseView({
    quote,
    items,
    tasks,
    units,
    divisions,
    currencies,
    contractSummary
}: QuoteBaseViewProps) {
    const router = useRouter();
    const { openPanel } = usePanel();
    const isContract = quote.quote_type === 'contract';
    const isReadOnly = quote.status !== 'draft';

    // ── Optimistic Items (Según optimistic-updates.md) ──
    const { optimisticItems, updateItem, removeItem } = useOptimisticList<QuoteItemView>({
        items,
        getItemId: (item) => item.id,
    });

    // Conversion Modal State
    const [showConvertModal, setShowConvertModal] = useState(false);
    const [isConverting, setIsConverting] = useState(false);

    // Delete dialog state
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<QuoteItemView | null>(null);
    const [isDeleting, startDeleteTransition] = useTransition();
    const [searchQuery, setSearchQuery] = useState("");
    const [rubroFilter, setRubroFilter] = useState<Set<string>>(new Set());

    // Create division lookup map
    const divisionMap = useMemo(() => {
        const map = new Map<string, TaskDivision>();
        divisions.forEach(d => map.set(d.id, d));
        return map;
    }, [divisions]);

    // Calculate total amount and per-rubro totals for incidencia calculation
    // effective_unit_price is live (from recipe) in draft, or frozen (snapshot) in sent/approved
    const getItemSubtotal = useCallback((item: QuoteItemView) => {
        const base = item.quantity * (item.effective_unit_price || 0);
        return base * (1 + (item.markup_pct || 0) / 100);
    }, []);

    const totalAmount = useMemo(() => {
        return optimisticItems.reduce((sum, item) => sum + getItemSubtotal(item), 0);
    }, [optimisticItems, getItemSubtotal]);

    // KPI calculations
    const taxAmount = useMemo(() => {
        return totalAmount * (quote.tax_pct / 100);
    }, [totalAmount, quote.tax_pct]);

    const totalWithTax = useMemo(() => {
        return totalAmount + taxAmount;
    }, [totalAmount, taxAmount]);

    // Get division name from item's task
    const getDivisionName = (item: QuoteItemView): string | null => {
        const task = tasks.find(t => t.id === item.task_id);
        if (!task?.task_division_id) return null;
        const division = divisionMap.get(task.task_division_id);
        return division?.name || null;
    };

    // Calculate per-rubro totals
    const rubroTotals = useMemo(() => {
        const totals = new Map<string, number>();
        optimisticItems.forEach(item => {
            const rubro = getDivisionName(item) || "Sin rubro";
            const current = totals.get(rubro) || 0;
            totals.set(rubro, current + getItemSubtotal(item));
        });
        return totals;
    }, [optimisticItems, divisionMap, tasks]);

    // Filtered items based on search + rubro filter
    const filteredItems = useMemo(() => {
        return optimisticItems.filter(item => {
            const name = (item.task_name || item.custom_name || item.description || "").toLowerCase();
            const matchesSearch = !searchQuery || name.includes(searchQuery.toLowerCase());
            const divName = getDivisionName(item) || "Sin rubro";
            const matchesRubro = rubroFilter.size === 0 || rubroFilter.has(divName);
            return matchesSearch && matchesRubro;
        });
    }, [optimisticItems, searchQuery, rubroFilter, divisionMap, tasks]);

    // Unique rubros for filter
    const uniqueRubros = useMemo(() => {
        const set = new Set<string>();
        optimisticItems.forEach(item => set.add(getDivisionName(item) || "Sin rubro"));
        return Array.from(set).sort().map(r => ({ label: r, value: r }));
    }, [optimisticItems, divisionMap, tasks]);

    // Create rubro indices map (rubro name -> rubro index 01, 02, etc.)
    const rubroIndices = useMemo(() => {
        const indices = new Map<string, number>();
        const uniqueRubros: string[] = [];
        optimisticItems.forEach(item => {
            const rubro = getDivisionName(item) || "Sin rubro";
            if (!uniqueRubros.includes(rubro)) {
                uniqueRubros.push(rubro);
            }
        });
        uniqueRubros.forEach((rubro, idx) => {
            indices.set(rubro, idx + 1);
        });
        return indices;
    }, [optimisticItems, divisionMap, tasks]);

    // Get item number within its rubro (e.g., 01 for first item in rubro)
    const getItemNumberInRubro = useMemo(() => {
        const rubroItems = new Map<string, QuoteItemView[]>();
        optimisticItems.forEach(item => {
            const rubro = getDivisionName(item) || "Sin rubro";
            const list = rubroItems.get(rubro) || [];
            list.push(item);
            rubroItems.set(rubro, list);
        });
        return (item: QuoteItemView) => {
            const rubro = getDivisionName(item) || "Sin rubro";
            const list = rubroItems.get(rubro) || [];
            return list.findIndex(i => i.id === item.id) + 1;
        };
    }, [optimisticItems, divisionMap, tasks]);

    // Format hierarchical number (e.g., 01.02)
    const formatItemNumber = (item: QuoteItemView) => {
        const rubro = getDivisionName(item) || "Sin rubro";
        const rubroIdx = rubroIndices.get(rubro) || 0;
        const itemIdx = getItemNumberInRubro(item);
        return `${String(rubroIdx).padStart(2, '0')}.${String(itemIdx).padStart(2, '0')}`;
    };

    // Format currency helper
    const formatCurrency = (amount: number) => {
        return `${quote.currency_symbol || '$'} ${amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
    };

    // Handlers
    const handleAddItem = () => {
        openPanel('quote-item-form', {
            mode: "create",
            quoteId: quote.id,
            organizationId: quote.organization_id,
            projectId: quote.project_id,
            currencyId: quote.currency_id,
            tasks,
            onSuccess: () => {
                router.refresh();
            },
        });
    };

    const handleEditItem = (item: QuoteItemView) => {
        openPanel('quote-item-form', {
            mode: "edit",
            quoteId: quote.id,
            organizationId: quote.organization_id,
            projectId: quote.project_id,
            currencyId: quote.currency_id,
            tasks,
            initialData: item,
            onSuccess: () => {
                router.refresh();
            },
        });
    };

    const handleDeleteClick = (item: QuoteItemView) => {
        setItemToDelete(item);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (!itemToDelete) return;

        startDeleteTransition(async () => {
            const result = await deleteQuoteItem(itemToDelete.id, quote.id);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Ítem eliminado");
                router.refresh();
            }
            setIsDeleteDialogOpen(false);
            setItemToDelete(null);
        });
    };

    const handleConvertToProject = async () => {
        const toastId = toast.loading("Convirtiendo a proyecto...");
        const result = await convertQuoteToProject(quote.id);
        if (result.error) {
            toast.error(result.error, { id: toastId });
        } else {
            toast.success("¡Proyecto creado exitosamente!", { id: toastId });
            router.push(`/organization/projects` as any);
        }
    };

    const handleApproveQuote = async () => {
        const toastId = toast.loading("Aprobando presupuesto...");
        const result = await approveQuote(quote.id);
        if (!result.success) {
            toast.error(result.error || "Error al aprobar", { id: toastId });
        } else {
            const tasksMsg = result.tasksCreated ? ` Se crearon ${result.tasksCreated} tareas de construcción.` : "";
            toast.success(`¡Presupuesto aprobado!${tasksMsg}`, { id: toastId });
            router.refresh();
        }
    };

    const handleConvertToContractClick = () => {
        setShowConvertModal(true);
    };

    const confirmConversion = async () => {
        setIsConverting(true);
        const toastId = toast.loading("Convirtiendo a contrato...");
        try {
            const result = await convertQuoteToContract(quote.id);
            if (result.error) {
                toast.error(result.error, { id: toastId });
            } else {
                toast.success("¡Cotización convertida en Contrato!", { id: toastId });
                setShowConvertModal(false);
                router.refresh();
            }
        } catch (error) {
            toast.error("Error al convertir", { id: toastId });
        } finally {
            setIsConverting(false);
        }
    };

    // Inline edit handler – optimistic update (instantly updates UI)
    // Según optimistic-updates.md: updateItem() + server action en background
    const handleInlineUpdate = useCallback((itemId: string, field: string, value: string | number) => {
        // Compute the optimistic updates object
        const updates: Partial<QuoteItemView> = {};
        if (field === 'quantity') {
            updates.quantity = parseFloat(String(value)) || 0;
        } else if (field === 'markup_pct') {
            updates.markup_pct = parseFloat(String(value)) || 0;
        } else if (field === 'cost_scope') {
            updates.cost_scope = value as any;
        }

        // Instant UI update + server call in background
        updateItem(itemId, updates, async () => {
            const result = await updateQuoteItemField(itemId, field, value);
            if (result.error) {
                toast.error(result.error);
            }
        });
    }, [updateItem]);

    // Column definitions — Orden profesional de presupuesto
    // Nro → Tarea → Alcance → Cant. → Ud. → Costo Unit. → Margen → Subtotal → Inc. %
    const columns: ColumnDef<QuoteItemView>[] = [
        // 1. Número jerárquico (01.01, 01.02, etc.)
        {
            id: "item_number",
            header: () => <span className="text-muted-foreground text-xs">Nro</span>,
            cell: ({ row }) => (
                <span className="font-mono text-muted-foreground text-sm">
                    {formatItemNumber(row.original)}
                </span>
            ),
            enableSorting: false,
            size: 60,
            maxSize: 70,
        },
        // 2. Tarea (arriba) + Receta (abajo)
        createTextColumn<QuoteItemView>({
            accessorKey: "task_name",
            title: "Tarea",
            truncate: 260,
            subtitle: (row) => row.recipe_name || null,
        }),
        // 3. Alcance de Costo (inline toggle)
        {
            id: "cost_scope",
            accessorKey: "cost_scope",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Alcance" />,
            cell: ({ row }) => {
                const scope = row.original.cost_scope;
                const isEditable = quote.status === 'draft';
                const scopeLabels: Record<string, string> = {
                    'materials_and_labor': 'Mat. + M.O.',
                    'labor_only': 'M. de Obra'
                };
                const scopeLabel = scopeLabels[scope] || scope;

                if (!isEditable) {
                    return (
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                            {scopeLabel}
                        </span>
                    );
                }

                const nextScope = scope === 'materials_and_labor' ? 'labor_only' : 'materials_and_labor';
                return (
                    <button
                        type="button"
                        onClick={() => handleInlineUpdate(row.original.id, 'cost_scope', nextScope)}
                        className="inline-flex items-center px-2 h-7 rounded-md border border-dashed border-input text-sm whitespace-nowrap hover:bg-muted/50 hover:border-muted-foreground/30 transition-colors cursor-pointer select-none"
                    >
                        {scopeLabel}
                    </button>
                );
            },
        },
        // 4. Cantidad (inline editable)
        {
            accessorKey: "quantity",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Cant." className="justify-end" />,
            cell: ({ row }) => (
                <InlineEditableCell
                    value={row.original.quantity}
                    onSave={(v) => handleInlineUpdate(row.original.id, 'quantity', v)}
                    disabled={quote.status !== 'draft'}
                    min={0.001}
                    step={0.001}
                />
            ),
        },
        // 5. Unidad (símbolo)
        {
            id: "unit",
            accessorKey: "unit",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Ud." />,
            cell: ({ row }) => (
                <span className="text-xs text-muted-foreground uppercase">{row.original.unit || "-"}</span>
            ),
            size: 60,
        },
        // 6. Costo Unitario (precio vivo del catálogo o snapshot congelado)
        createMoneyColumn<QuoteItemView>({
            accessorKey: "effective_unit_price",
            title: "Costo Unit.",
            currencyKey: "currency_symbol",
        }),
        // 7. Margen % (inline editable)
        {
            id: "markup_pct",
            accessorKey: "markup_pct",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Margen" className="justify-end" />,
            cell: ({ row }) => (
                <InlineEditableCell
                    value={row.original.markup_pct}
                    onSave={(v) => handleInlineUpdate(row.original.id, 'markup_pct', v)}
                    disabled={quote.status !== 'draft'}
                    suffix="%"
                    min={0}
                    step={0.1}
                    formatValue={(v) => Number(v) > 0 ? `+${v}` : String(v)}
                />
            ),
            enableSorting: true,
        },
        // 8. Subtotal = Cantidad × Costo Unit. × (1 + Margen/100)
        {
            id: "subtotal",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Subtotal" className="justify-end" />
            ),
            accessorFn: (row) => getItemSubtotal(row),
            cell: ({ row }) => {
                const subtotal = getItemSubtotal(row.original);
                return (
                    <div className="flex justify-end">
                        <span className="font-mono font-medium tabular-nums">
                            {quote.currency_symbol || "$"} {subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>
                );
            },
        },
        // 9. Incidencia % dentro del rubro
        {
            id: "incidencia",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Inc. %" className="justify-end" />,
            accessorFn: (row) => {
                const itemSubtotal = getItemSubtotal(row);
                const rubro = getDivisionName(row) || "Sin rubro";
                const rubroTotal = rubroTotals.get(rubro) || 0;
                return rubroTotal > 0 ? (itemSubtotal / rubroTotal) * 100 : 0;
            },
            cell: ({ row }) => {
                const itemSubtotal = getItemSubtotal(row.original);
                const rubro = getDivisionName(row.original) || "Sin rubro";
                const rubroTotal = rubroTotals.get(rubro) || 0;
                const incidencia = rubroTotal > 0 ? (itemSubtotal / rubroTotal) * 100 : 0;
                return (
                    <div className="flex justify-end">
                        <span className="font-mono text-muted-foreground tabular-nums">
                            {incidencia.toFixed(1)}%
                        </span>
                    </div>
                );
            },
        },
    ];

    // Early return: Empty State
    if (items.length === 0) {
        return (
            <div className="h-full flex flex-col">
                <Toolbar
                    portalToHeader
                    actions={[
                        {
                            label: "Agregar Ítem",
                            icon: Plus,
                            onClick: handleAddItem,
                            disabled: quote.status !== 'draft'
                        },
                    ]}
                />
                <div className="flex-1 flex items-center justify-center">
                    <ViewEmptyState
                        mode="empty"
                        icon={FileText}
                        viewName="Ítems del Presupuesto"
                        featureDescription="Agregá tareas del catálogo para armar el presupuesto."
                        onAction={handleAddItem}
                        actionLabel="Agregar Ítem"
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">

            {/* Read-only banner */}
            {isReadOnly && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex items-center gap-3">
                    <div className="bg-amber-500/15 p-2 rounded-full shrink-0">
                        <Lock className="h-4 w-4 text-amber-500" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-amber-200">
                            Ítems bloqueados — Estado: {quote.status === 'sent' ? 'Enviado' : quote.status === 'approved' ? 'Aprobado' : quote.status === 'rejected' ? 'Rechazado' : quote.status}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {quote.status === 'sent' && 'Los ítems están bloqueados porque el presupuesto fue enviado al cliente. Volvé a Borrador para editarlos.'}
                            {quote.status === 'approved' && 'Los ítems están bloqueados porque el presupuesto fue aprobado. Las tareas de obra ya fueron creadas.'}
                            {quote.status === 'rejected' && 'Los ítems están bloqueados porque el presupuesto fue rechazado. Volvé a Borrador para editarlos.'}
                        </p>
                    </div>
                </div>
            )}

            <Toolbar
                portalToHeader
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Buscar ítems..."
                filterContent={
                    uniqueRubros.length > 1 ? (
                        <FacetedFilter
                            title="Rubro"
                            options={uniqueRubros}
                            selectedValues={rubroFilter}
                            onSelect={(value) => {
                                const next = new Set(rubroFilter);
                                if (next.has(value)) next.delete(value);
                                else next.add(value);
                                setRubroFilter(next);
                            }}
                            onClear={() => setRubroFilter(new Set())}
                        />
                    ) : undefined
                }
                actions={[
                    {
                        label: "Agregar Ítem",
                        icon: Plus,
                        onClick: handleAddItem,
                        disabled: quote.status !== 'draft'
                    },
                ]}
            />

            {/* KPIs Summary Row */}
            <div className="grid grid-cols-4 gap-3">
                <DashboardKpiCard
                    title="Ítems"
                    value={items.length}
                    icon={<Hash className="h-4 w-4" />}
                    description={`${new Set(items.map(i => getDivisionName(i))).size} rubros`}
                />
                <DashboardKpiCard
                    title="Subtotal"
                    amount={totalAmount}
                    icon={<Calculator className="h-4 w-4" />}
                    description="Sin impuestos"
                />
                <DashboardKpiCard
                    title={quote.tax_label || 'IVA'}
                    amount={taxAmount}
                    icon={<Receipt className="h-4 w-4" />}
                    description={`${quote.tax_pct}%`}
                />
                <DashboardKpiCard
                    title="Total"
                    amount={totalWithTax}
                    icon={<DollarSign className="h-4 w-4" />}
                    description="Con impuestos"
                />
            </div>

            <DataTable
                columns={columns}
                data={filteredItems}
                showPagination={false}
                pageSize={100}
                enableRowActions={quote.status === 'draft'}
                onEdit={handleEditItem}
                onDelete={handleDeleteClick}
                // Row Grouping by Division/Rubro
                groupBy="division"
                getGroupValue={(item) => item.division_name || "Sin rubro"}
                groupSummaryColumnId="subtotal"
                groupSummaryAccessor={(groupRows) => {
                    const groupSubtotal = groupRows.reduce((sum, item) => sum + getItemSubtotal(item), 0);
                    return formatCurrency(groupSubtotal);
                }}
                // Incidencia del rubro (% del total del presupuesto)
                groupIncidenciaColumnId="incidencia"
                groupIncidenciaAccessor={(groupRows) => {
                    const groupSubtotal = groupRows.reduce((sum, item) => sum + getItemSubtotal(item), 0);
                    const incidencia = totalAmount > 0 ? (groupSubtotal / totalAmount) * 100 : 0;
                    return `${incidencia.toFixed(1)}%`;
                }}
                // Numeración de rubros (01, 02, etc.)
                groupNumberAccessor={(groupValue, groupIndex) =>
                    String(rubroIndices.get(groupValue) || groupIndex).padStart(2, '0')
                }
                // Auto-hide columns with no data (e.g., Markup when not used)
                autoHideEmptyColumns
                autoHideExcludeColumns={["incidencia", "subtotal", "item_number", "markup_pct"]}
            />

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmationDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                onConfirm={confirmDelete}
                title="¿Eliminar ítem?"
                description={
                    <>
                        Vas a eliminar <strong>{itemToDelete?.task_name || itemToDelete?.custom_name || 'este ítem'}</strong> del presupuesto.
                    </>
                }
                isDeleting={isDeleting}
            />

            <QuoteConvertContractForm
                open={showConvertModal}
                onOpenChange={setShowConvertModal}
                onConfirm={confirmConversion}
                contractValue={quote.total_with_tax || 0}
                currencySymbol={quote.currency_symbol || '$'}
                isConverting={isConverting}
            />
        </div >
    );
}
