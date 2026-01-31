"use client";

import { useMemo, useState, useTransition } from "react";
import { DataTable } from "@/components/shared/data-table/data-table";
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import { createDateColumn, createMoneyColumn } from "@/components/shared/data-table/columns";
import { ColumnDef, FilterFn } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Banknote, Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { format, isAfter, isBefore, isEqual, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { useMoney } from "@/hooks/use-money";
import { DashboardKpiCard } from "@/components/dashboard/dashboard-kpi-card";
import { useModal } from "@/providers/modal-store";
import { MovementDetailModal } from "../components/movement-detail-modal";
import { DateRangeFilter, DateRangeFilterValue } from "@/components/layout/dashboard/shared/toolbar/toolbar-date-range-filter";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { FinanceMovementForm } from "../forms/finance-movement-form";
import { PaymentForm as GeneralCostsPaymentForm } from "@/features/general-costs/forms/general-costs-payment-form";
import { deleteFinanceMovement } from "../actions";
import { toast } from "sonner";
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

interface FinancesMovementsViewProps {
    movements: any[];
    wallets?: any[];
    projects?: any[];
    showProjectColumn?: boolean;
    // Form context for unified movement modal
    organizationId?: string;
    currencies?: { id: string; name: string; code: string; symbol: string }[];
    generalCostConcepts?: any[];
    onRefresh?: () => void;
}

export function FinancesMovementsView({
    movements,
    wallets = [],
    projects = [],
    showProjectColumn = false,
    organizationId,
    currencies = [],
    generalCostConcepts = [],
    onRefresh
}: FinancesMovementsViewProps) {
    const { openModal, closeModal } = useModal();

    // === Centralized money operations ===
    const money = useMoney();

    // Delete state
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [movementToDelete, setMovementToDelete] = useState<any>(null);
    const [isDeleting, startDeleteTransition] = useTransition();

    // Date range filter state
    const [dateRange, setDateRange] = useState<DateRangeFilterValue | undefined>(undefined);
    // Search state for toolbar
    const [searchQuery, setSearchQuery] = useState("");

    // Filter movements by date range
    const filteredMovements = useMemo(() => {
        if (!dateRange || (!dateRange.from && !dateRange.to)) {
            return movements;
        }
        return movements.filter(m => {
            const date = startOfDay(new Date(m.payment_date));
            const from = dateRange.from ? startOfDay(dateRange.from) : null;
            const to = dateRange.to ? endOfDay(dateRange.to) : null;
            if (from && to) {
                return (isAfter(date, from) || isEqual(date, from)) &&
                    (isBefore(date, to) || isEqual(date, to));
            }
            if (from) return isAfter(date, from) || isEqual(date, from);
            if (to) return isBefore(date, to) || isEqual(date, to);
            return true;
        });
    }, [movements, dateRange]);

    // Use centralized formatting from useMoney()
    const formatCurrency = (amount: number, currencyCode?: string) => {
        return money.format(amount, currencyCode);
    };

    // Open unified movement modal
    const openNewMovementModal = () => {
        if (!organizationId) {
            console.warn('No organizationId provided for new movement');
            return;
        }
        openModal(
            <FinanceMovementForm
                organizationId={organizationId}
                concepts={generalCostConcepts}
                wallets={wallets}
                currencies={currencies}
                onSuccess={() => {
                    closeModal();
                    onRefresh?.();
                }}
                onCancel={closeModal}
            />,
            {
                title: "Nuevo Movimiento",
                description: "Seleccioná el tipo de movimiento y completá los datos.",
                size: "lg"
            }
        );
    };

    const getWalletName = (walletId: string) => {
        if (!walletId) return "-";
        return wallets.find(w => w.id === walletId)?.wallet_name || "-";
    };

    const getProjectName = (projectId: string) => {
        if (!projectId) return "-";
        return projects.find(p => p.id === projectId)?.name || "-";
    };

    // Handle row click to open detail modal
    const handleRowClick = (movement: any) => {
        openModal(
            <MovementDetailModal
                movement={movement}
                walletName={getWalletName(movement.wallet_id)}
                projectName={getProjectName(movement.project_id)}
                onEdit={() => {
                    closeModal();
                    handleEdit(movement);
                }}
                onClose={closeModal}
            />,
            {
                title: "Detalle del Movimiento",
                description: "Información completa del movimiento financiero.",
                size: "md"
            }
        );
    };

    // Handle edit - opens the form in edit mode based on movement type
    const handleEdit = (movement: any) => {
        const movementType = movement.movement_type;

        // Map movement types to their form actions
        switch (movementType) {
            case 'general_cost':
                openModal(
                    <GeneralCostsPaymentForm
                        initialData={movement}
                        concepts={generalCostConcepts}
                        wallets={wallets}
                        currencies={currencies}
                        organizationId={organizationId || ''}
                        onSuccess={() => {
                            closeModal();
                            onRefresh?.();
                        }}
                        onCancel={closeModal}
                    />,
                    {
                        title: "Editar Pago de Gasto General",
                        description: "Modificá los datos del pago.",
                        size: "md"
                    }
                );
                break;
            case 'client_payment':
                toast.info("Para editar cobros de clientes, andá a la sección de Clientes");
                break;
            case 'material_payment':
                toast.info("Para editar pagos de materiales, andá a la sección de Materiales");
                break;
            case 'labor_payment':
                toast.info("Para editar pagos de mano de obra, andá a la sección de Mano de Obra");
                break;
            case 'subcontract_payment':
                toast.info("Para editar pagos de subcontratos, andá a la sección de Subcontratos");
                break;
            case 'partner_contribution':
            case 'partner_withdrawal':
                toast.info("Para editar movimientos de socios, andá a la sección de Capital");
                break;
            default:
                toast.info("Edición no disponible para este tipo de movimiento");
        }
    };

    // Handle delete click - opens confirmation dialog
    const handleDeleteClick = (movement: any) => {
        setMovementToDelete(movement);
        setIsDeleteDialogOpen(true);
    };

    // Confirm delete
    const confirmDelete = () => {
        if (!movementToDelete) return;

        startDeleteTransition(async () => {
            try {
                const result = await deleteFinanceMovement(
                    movementToDelete.id,
                    movementToDelete.movement_type
                );
                if (result.success) {
                    toast.success("Movimiento eliminado");
                    setIsDeleteDialogOpen(false);
                    setMovementToDelete(null);
                    onRefresh?.();
                } else {
                    toast.error(result.error || "Error al eliminar");
                }
            } catch (error) {
                console.error(error);
                toast.error("Error al eliminar el movimiento");
            }
        });
    };

    const columns: ColumnDef<any>[] = [
        createDateColumn<any>({
            accessorKey: "payment_date",
            avatarUrlKey: "creator_avatar_url",
            avatarFallbackKey: "creator_full_name",
            filterFn: (row: any, columnId: string, filterValue: DateRangeFilterValue | undefined) => {
                if (!filterValue || (!filterValue.from && !filterValue.to)) return true;
                const cellValue = row.getValue(columnId);
                if (!cellValue) return false;
                const date = startOfDay(new Date(cellValue as string));
                const from = filterValue.from ? startOfDay(filterValue.from) : null;
                const to = filterValue.to ? endOfDay(filterValue.to) : null;
                if (from && to) {
                    return (isAfter(date, from) || isEqual(date, from)) && (isBefore(date, to) || isEqual(date, to));
                }
                if (from) return isAfter(date, from) || isEqual(date, from);
                if (to) return isBefore(date, to) || isEqual(date, to);
                return true;
            },
        }),
        {
            accessorKey: "movement_type",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Tipo" />,
            cell: ({ row }) => {
                // Map movement_type to friendly label
                const typeLabels: Record<string, string> = {
                    'client_payment': 'Cobro Cliente',
                    'material_payment': 'Materiales',
                    'labor_payment': 'Mano de Obra',
                    'subcontract_payment': 'Subcontrato',
                    'general_cost': 'Gasto General',
                    'partner_contribution': 'Aporte Socio',
                    'partner_withdrawal': 'Retiro Socio',
                    'wallet_transfer': 'Transferencia',
                    'currency_exchange': 'Cambio Moneda',
                };
                const typeLabel = typeLabels[row.original.movement_type] || row.original.movement_type;

                return (
                    <div className="flex flex-col">
                        <span className="text-sm font-medium">{typeLabel}</span>
                        <span className="text-xs text-muted-foreground">{row.original.concept_name || "-"}</span>
                    </div>
                );
            },
            enableSorting: true,
            enableHiding: false,
        },
        // Project column - only shown in organization mode
        ...(showProjectColumn ? [{
            accessorKey: "project_id",
            header: ({ column }: any) => <DataTableColumnHeader column={column} title="Proyecto" />,
            cell: ({ row }: any) => (
                <span className="text-sm font-medium">{getProjectName(row.original.project_id)}</span>
            ),
        }] : []),
        {
            accessorKey: "description",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Descripción" />,
            cell: ({ row }) => (
                <div className="max-w-[180px] truncate" title={row.original.description || ""}>
                    <span className="text-sm">{row.original.description || "-"}</span>
                </div>
            ),
        },
        {
            accessorKey: "wallet_id",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Billetera" />,
            cell: ({ row }) => (
                <span className="text-sm text-foreground/80">{getWalletName(row.original.wallet_id)}</span>
            ),
        },
        createMoneyColumn<any>({
            accessorKey: "amount",
            prefix: "auto",
            colorMode: "auto",
            signKey: "amount_sign",
            currencyKey: "currency_code",
        }),
        {
            accessorKey: "status",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
            cell: ({ row }) => {
                const status = row.original.status;
                let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
                let className = "";

                switch (status) {
                    case "confirmed":
                    case "completed":
                    case "paid":
                        variant = "outline";
                        className = "bg-amount-positive/10 text-amount-positive border-amount-positive/20";
                        break;
                    case "pending":
                        variant = "outline";
                        className = "bg-amber-500/10 text-amber-600 border-amber-500/20";
                        break;
                    case "rejected":
                    case "cancelled":
                        variant = "destructive";
                        break;
                    case "void":
                        variant = "secondary";
                        break;
                    default:
                        variant = "secondary";
                }

                const label =
                    (status === "confirmed" || status === "completed" || status === "paid") ? "Confirmado" :
                        status === "pending" ? "Pendiente" :
                            (status === "rejected" || status === "cancelled") ? "Rechazado" :
                                status === "void" ? "Anulado" : status;

                return (
                    <Badge variant={variant} className={className}>
                        {label}
                    </Badge>
                );
            },
            filterFn: (row, id, value) => {
                return value.includes(row.getValue(id));
            },
        }
    ];

    if (movements.length === 0) {
        return (
            <div className="h-full flex items-center justify-center">
                <EmptyState
                    icon={Banknote}
                    title="Sin movimientos"
                    description="No hay movimientos registrados en este período."
                    action={
                        <Button onClick={() => console.log("New Movement")} size="lg">
                            <Plus className="mr-2 h-4 w-4" /> Nuevo Movimiento
                        </Button>
                    }
                />
            </div>
        );
    }

    const statusOptions = [
        { label: "Confirmado", value: "confirmed" },
        { label: "Pendiente", value: "pending" },
        { label: "Rechazado", value: "rejected" },
        { label: "Anulado", value: "void" },
    ];

    // Calculate KPI values using centralized MoneyService
    const kpiData = useMemo(() => {
        const kpiMovements = filteredMovements.map(m => ({
            amount: m.amount,
            currency_code: m.currency_code,
            exchange_rate: m.exchange_rate,
            amount_sign: m.amount_sign,
        }));

        const result = money.calculateKPIs(kpiMovements);

        return {
            ingresos: result.totalIngresos,
            egresos: result.totalEgresos,
            balance: result.balance,
            totalMovimientos: result.totalMovements
        };
    }, [filteredMovements, money.displayMode, money.config.currentExchangeRate, money.calculateKPIs]);

    return (
        <div className="space-y-6">
            {/* Toolbar - Portal to Header */}
            <Toolbar
                portalToHeader
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Buscar movimientos..."
                filterContent={
                    <DateRangeFilter
                        value={dateRange}
                        onChange={setDateRange}
                    />
                }
                actions={organizationId ? [{
                    label: "Nuevo Movimiento",
                    onClick: openNewMovementModal,
                    icon: Plus
                }] : undefined}
            />
            {/* KPI Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <DashboardKpiCard
                    title="Ingresos"
                    amount={kpiData.ingresos}
                    icon={<TrendingUp className="h-5 w-5" />}
                    iconClassName="bg-amount-positive/10 text-amount-positive"
                />
                <DashboardKpiCard
                    title="Egresos"
                    amount={kpiData.egresos}
                    icon={<TrendingDown className="h-5 w-5" />}
                    iconClassName="bg-amount-negative/10 text-amount-negative"
                />
                <DashboardKpiCard
                    title="Balance"
                    amount={kpiData.balance}
                    icon={<Wallet className="h-5 w-5" />}
                    iconClassName={kpiData.balance >= 0 ? "bg-amount-positive/10 text-amount-positive" : "bg-amount-negative/10 text-amount-negative"}
                />
                <DashboardKpiCard
                    title="Total Movimientos"
                    value={kpiData.totalMovimientos.toString()}
                    icon={<Banknote className="h-5 w-5" />}
                />
            </div>

            {/* Movements Table */}
            <DataTable
                columns={columns}
                data={filteredMovements}
                enableRowSelection={true}
                enableRowActions={true}
                onRowClick={handleRowClick}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                initialSorting={[{ id: "payment_date", desc: true }]}
                globalFilter={searchQuery}
                onGlobalFilterChange={setSearchQuery}
                onClearFilters={() => {
                    setDateRange(undefined);
                    setSearchQuery("");
                }}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará el movimiento financiero.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? "Eliminando..." : "Eliminar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
