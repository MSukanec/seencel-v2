"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
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
    Loader2,
    Hash,
    Calculator,
    Receipt,
    DollarSign
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { useModal } from "@/stores/modal-store";
import { QuoteItemForm } from "../forms/quote-item-form";
import { QuoteConvertContractForm } from "../forms/quote-convert-contract-form";
import { convertQuoteToProject, approveQuote, convertQuoteToContract, deleteQuoteItem } from "../actions";
import { QuoteView, QuoteItemView, ContractSummary } from "../types";
import { TaskView, Unit, TaskDivision } from "@/features/tasks/types";

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
    const { openModal, closeModal } = useModal();
    const isContract = quote.quote_type === 'contract';

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
    const totalAmount = useMemo(() => {
        return items.reduce((sum, item) => sum + (item.subtotal_with_markup || item.subtotal || 0), 0);
    }, [items]);

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
        items.forEach(item => {
            const rubro = getDivisionName(item) || "Sin rubro";
            const current = totals.get(rubro) || 0;
            totals.set(rubro, current + (item.subtotal_with_markup || item.subtotal || 0));
        });
        return totals;
    }, [items, divisionMap, tasks]);

    // Filtered items based on search + rubro filter
    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const name = (item.task_name || item.custom_name || item.description || "").toLowerCase();
            const matchesSearch = !searchQuery || name.includes(searchQuery.toLowerCase());
            const divName = getDivisionName(item) || "Sin rubro";
            const matchesRubro = rubroFilter.size === 0 || rubroFilter.has(divName);
            return matchesSearch && matchesRubro;
        });
    }, [items, searchQuery, rubroFilter, divisionMap, tasks]);

    // Unique rubros for filter
    const uniqueRubros = useMemo(() => {
        const set = new Set<string>();
        items.forEach(item => set.add(getDivisionName(item) || "Sin rubro"));
        return Array.from(set).sort().map(r => ({ label: r, value: r }));
    }, [items, divisionMap, tasks]);

    // Create rubro indices map (rubro name -> rubro index 01, 02, etc.)
    const rubroIndices = useMemo(() => {
        const indices = new Map<string, number>();
        const uniqueRubros: string[] = [];
        items.forEach(item => {
            const rubro = getDivisionName(item) || "Sin rubro";
            if (!uniqueRubros.includes(rubro)) {
                uniqueRubros.push(rubro);
            }
        });
        uniqueRubros.forEach((rubro, idx) => {
            indices.set(rubro, idx + 1);
        });
        return indices;
    }, [items, divisionMap, tasks]);

    // Get item number within its rubro (e.g., 01 for first item in rubro)
    const getItemNumberInRubro = useMemo(() => {
        const rubroItems = new Map<string, QuoteItemView[]>();
        items.forEach(item => {
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
    }, [items, divisionMap, tasks]);

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
        openModal(
            <QuoteItemForm
                mode="create"
                quoteId={quote.id}
                organizationId={quote.organization_id}
                projectId={quote.project_id}
                currencyId={quote.currency_id}
                tasks={tasks}
                onCancel={closeModal}
                onSuccess={() => {
                    closeModal();
                    router.refresh();
                }}
            />,
            {
                title: "Agregar Ítem",
                description: "Selecciona una tarea del catálogo y define cantidad y precio",
                size: "lg"
            }
        );
    };

    const handleEditItem = (item: QuoteItemView) => {
        openModal(
            <QuoteItemForm
                mode="edit"
                quoteId={quote.id}
                organizationId={quote.organization_id}
                projectId={quote.project_id}
                currencyId={quote.currency_id}
                tasks={tasks}
                initialData={item}
                onCancel={closeModal}
                onSuccess={() => {
                    closeModal();
                    router.refresh();
                }}
            />,
            {
                title: "Editar Ítem",
                description: "Modifica los datos del ítem",
                size: "lg"
            }
        );
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
            router.push(`/project/${result.data?.project.id}`);
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

    // Column definitions
    const columns: ColumnDef<QuoteItemView>[] = [
        // Columna de numeración jerárquica (01.01, 01.02, etc.)
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
        {
            id: "division",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Rubro" />,
            accessorFn: (row) => getDivisionName(row),
            cell: ({ row }) => {
                const divisionName = getDivisionName(row.original);
                return divisionName ? (
                    <Badge variant="secondary" className="text-xs">{divisionName}</Badge>
                ) : (
                    <span className="text-muted-foreground">-</span>
                );
            },
        },
        createTextColumn<QuoteItemView>({
            accessorKey: "task_name",
            title: "Tarea",
            truncate: 260,
            subtitle: (row) => (row.description && row.task_name ? row.description : null) ?? null,
        }),
        {
            id: "cost_scope",
            accessorKey: "cost_scope",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Alcance" />,
            cell: ({ row }) => {
                const scope = row.original.cost_scope;
                const scopeLabels: Record<string, string> = {
                    'materials_and_labor': 'Mat. + M.O.',
                    'materials_only': 'Materiales',
                    'labor_only': 'M. de Obra'
                };
                const scopeLabel = scopeLabels[scope] || scope;
                return (
                    <Badge variant="outline" className="text-xs whitespace-nowrap">
                        {scopeLabel}
                    </Badge>
                );
            },
        },
        {
            accessorKey: "quantity",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Cant." />,
            cell: ({ row }) => (
                <span className="font-mono text-right">{row.original.quantity}</span>
            ),
        },
        {
            id: "unit",
            accessorKey: "unit",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Unidad" />,
            cell: ({ row }) => (
                <Badge variant="secondary">{row.original.unit || "-"}</Badge>
            ),
        },
        // Use column factory for unit_price - properly aligned
        createMoneyColumn<QuoteItemView>({
            accessorKey: "unit_price",
            title: "Precio Unit.",
            currencyKey: "currency_symbol",
        }),
        {
            accessorKey: "markup_pct",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Markup %" />,
            cell: ({ row }) => (
                <span className="font-mono text-right">
                    {row.original.markup_pct > 0 ? `+${row.original.markup_pct}%` : "-"}
                </span>
            ),
        },
        // Use column factory for subtotal - properly aligned
        {
            ...createMoneyColumn<QuoteItemView>({
                accessorKey: "subtotal_with_markup",
                title: "Subtotal",
                currencyKey: "currency_symbol",
            }),
            id: "subtotal",
            accessorFn: (row) => row.subtotal_with_markup || row.subtotal || 0,
        },
        {
            id: "incidencia",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Inc. %" className="justify-end" />,
            accessorFn: (row) => {
                // Calculate incidencia as % of rubro total
                const itemSubtotal = row.subtotal_with_markup || row.subtotal || 0;
                const rubro = getDivisionName(row) || "Sin rubro";
                const rubroTotal = rubroTotals.get(rubro) || 0;
                return rubroTotal > 0 ? (itemSubtotal / rubroTotal) * 100 : 0;
            },
            cell: ({ row }) => {
                const itemSubtotal = row.original.subtotal_with_markup || row.original.subtotal || 0;
                const rubro = getDivisionName(row.original) || "Sin rubro";
                const rubroTotal = rubroTotals.get(rubro) || 0;
                const incidencia = rubroTotal > 0 ? (itemSubtotal / rubroTotal) * 100 : 0;
                return (
                    <div className="flex justify-end">
                        <span className="font-mono text-muted-foreground">
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
                        // Acción principal: Agregar Ítem (disabled si es contrato)
                        {
                            label: "Agregar Ítem",
                            icon: Plus,
                            onClick: handleAddItem,
                            disabled: isContract || quote.status === 'approved'
                        },
                        // Secundarias en dropdown
                        {
                            label: "Exportar PDF",
                            icon: Download,
                            onClick: () => { /* TODO: implementar export PDF */ }
                        }
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
                    // Acción principal: Agregar Ítem (siempre visible, disabled si es contrato)
                    {
                        label: "Agregar Ítem",
                        icon: Plus,
                        onClick: handleAddItem,
                        disabled: isContract || quote.status === 'approved'
                    },
                    // Acciones secundarias (en el dropdown "...")
                    {
                        label: "Exportar PDF",
                        icon: Download,
                        onClick: () => { /* TODO: implementar export PDF */ }
                    },
                    ...(quote.status === 'draft' ? [{
                        label: "Enviar",
                        icon: Send,
                        onClick: () => { }
                    }] : []),
                    ...(quote.status === 'sent' ? [{
                        label: "Aprobar",
                        icon: CheckCircle,
                        onClick: handleApproveQuote
                    }] : []),
                    ...(quote.quote_type === 'quote' && !quote.project_id ? [{
                        label: "Convertir en Proyecto",
                        icon: FolderPlus,
                        onClick: handleConvertToProject
                    }] : []),
                    ...(quote.quote_type === 'quote' && quote.project_id && quote.status === 'approved' ? [{
                        label: "Convertir en Contrato",
                        icon: FileSignature,
                        onClick: handleConvertToContractClick
                    }] : [])
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
                enableRowActions={quote.status !== 'approved'}
                onEdit={handleEditItem}
                onDelete={handleDeleteClick}
                // Row Grouping by Division/Rubro
                groupBy="division"
                getGroupValue={(item) => item.division_name || "Sin rubro"}
                groupSummaryColumnId="subtotal"
                groupSummaryAccessor={(groupRows) => {
                    const groupSubtotal = groupRows.reduce((sum, item) => {
                        return sum + (item.subtotal_with_markup || item.subtotal || 0);
                    }, 0);
                    return formatCurrency(groupSubtotal);
                }}
                // Incidencia del rubro (% del total del presupuesto)
                groupIncidenciaColumnId="incidencia"
                groupIncidenciaAccessor={(groupRows) => {
                    const groupSubtotal = groupRows.reduce((sum, item) => {
                        return sum + (item.subtotal_with_markup || item.subtotal || 0);
                    }, 0);
                    const incidencia = totalAmount > 0 ? (groupSubtotal / totalAmount) * 100 : 0;
                    return `${incidencia.toFixed(1)}%`;
                }}
                // Numeración de rubros (01, 02, etc.)
                groupNumberAccessor={(groupValue, groupIndex) =>
                    String(rubroIndices.get(groupValue) || groupIndex).padStart(2, '0')
                }
                // Auto-hide columns with no data (e.g., Markup when not used)
                autoHideEmptyColumns
                autoHideExcludeColumns={["incidencia", "subtotal", "item_number"]}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar ítem?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Vas a eliminar "{itemToDelete?.task_name || itemToDelete?.custom_name || 'este ítem'}" del presupuesto.
                            Esta acción se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                confirmDelete();
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isDeleting}
                        >
                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

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
