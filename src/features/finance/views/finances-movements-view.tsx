"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "@/i18n/routing";
import { DataTable } from "@/components/shared/data-table/data-table";
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import { createDateColumn } from "@/components/shared/data-table/columns";
import { ColumnDef, FilterFn } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Banknote, Wallet } from "lucide-react";
import { format, isAfter, isBefore, isEqual, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { useMoney } from "@/hooks/use-money";
import { DashboardKpiCard } from "@/components/dashboard/dashboard-kpi-card";
import { useModal } from "@/stores/modal-store";
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
    projects?: { id: string; name: string }[];
    showProjectColumn?: boolean;
    // Form context for unified movement modal
    organizationId?: string;
    currencies?: { id: string; name: string; code: string; symbol: string }[];
    generalCostConcepts?: any[];
    // Client payment context
    clients?: any[];
    financialData?: any;
}

export function FinancesMovementsView({
    movements,
    wallets = [],
    projects = [],
    showProjectColumn = false,
    organizationId,
    currencies = [],
    generalCostConcepts = [],
    clients = [],
    financialData
}: FinancesMovementsViewProps) {
    const router = useRouter();
    const { openModal, closeModal } = useModal();

    // === Centralized money operations ===
    const money = useMoney();

    // Delete state - supports single and bulk delete
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [movementsToDelete, setMovementsToDelete] = useState<any[]>([]);
    const [resetSelectionFn, setResetSelectionFn] = useState<(() => void) | null>(null);
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

    // Calculate balances by currency and by wallet
    const kpiData = useMemo(() => {
        // Saldo por Moneda: agrupar movimientos por moneda y sumar
        const balanceByCurrency: Record<string, { code: string; symbol: string; balance: number }> = {};
        // Saldo por Billetera: agrupar por wallet_id y sumar
        const balanceByWallet: Record<string, { id: string; name: string; balance: number; currencyCode: string }> = {};

        for (const m of filteredMovements) {
            const isExchange = m.movement_type === 'currency_exchange' || m.movement_type === 'wallet_transfer';

            // Para currency_exchange: tiene dos montos (from y to)
            if (isExchange && m.to_amount !== undefined && m.to_currency_code) {
                // Movimiento de SALIDA (from): resta de la moneda origen
                const fromCurrCode = m.currency_code || 'USD';
                if (!balanceByCurrency[fromCurrCode]) {
                    const currInfo = currencies.find(c => c.code === fromCurrCode);
                    balanceByCurrency[fromCurrCode] = {
                        code: fromCurrCode,
                        symbol: currInfo?.symbol || '$',
                        balance: 0
                    };
                }
                balanceByCurrency[fromCurrCode].balance -= Math.abs(m.amount); // SIEMPRE resta

                // Movimiento de ENTRADA (to): suma a la moneda destino
                const toCurrCode = m.to_currency_code;
                if (!balanceByCurrency[toCurrCode]) {
                    const currInfo = currencies.find(c => c.code === toCurrCode);
                    balanceByCurrency[toCurrCode] = {
                        code: toCurrCode,
                        symbol: currInfo?.symbol || '$',
                        balance: 0
                    };
                }
                balanceByCurrency[toCurrCode].balance += Math.abs(m.to_amount); // SIEMPRE suma

                // Para billeteras en exchange: también manejar ambos
                // La billetera "from" pierde, la billetera "to" gana
                // Pero solo tenemos wallet_id en el movimiento consolidado
                // Asumimos que wallet_id es la billetera origen
                const walletId = m.wallet_id;
                if (walletId) {
                    if (!balanceByWallet[walletId]) {
                        const walletInfo = wallets.find(w => w.id === walletId);
                        balanceByWallet[walletId] = {
                            id: walletId,
                            name: walletInfo?.wallet_name || 'Billetera',
                            balance: 0,
                            currencyCode: fromCurrCode,
                        };
                    }
                    // Las transferencias internas no cambian el balance total de billeteras
                    // porque el dinero se mueve de una a otra
                    // Solo aplica para currency_exchange si es la misma billetera
                }
            } else {
                // Movimientos normales (cobros, gastos, etc)
                const currCode = m.currency_code || 'USD';
                if (!balanceByCurrency[currCode]) {
                    const currInfo = currencies.find(c => c.code === currCode);
                    balanceByCurrency[currCode] = {
                        code: currCode,
                        symbol: currInfo?.symbol || '$',
                        balance: 0
                    };
                }
                // amount_sign: '+' = ingreso, '-' = egreso
                const signedAmount = m.amount_sign === '-' ? -Math.abs(m.amount) : Math.abs(m.amount);
                balanceByCurrency[currCode].balance += signedAmount;

                // Saldo por billetera
                const walletId = m.wallet_id;
                if (walletId) {
                    if (!balanceByWallet[walletId]) {
                        const walletInfo = wallets.find(w => w.id === walletId);
                        balanceByWallet[walletId] = {
                            id: walletId,
                            name: walletInfo?.wallet_name || 'Billetera',
                            balance: 0,
                            currencyCode: currCode,
                        };
                    }
                    balanceByWallet[walletId].balance += signedAmount;
                }
            }
        }

        return {
            currencies: Object.values(balanceByCurrency),
            wallets: Object.values(balanceByWallet),
            totalMovimientos: filteredMovements.length,
        };
    }, [filteredMovements, currencies, wallets]);

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
                projects={projects}
                clients={clients}
                financialData={financialData}
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
                            router.refresh();
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

    // Handle delete click - opens confirmation dialog for single movement
    const handleDeleteClick = (movement: any) => {
        setMovementsToDelete([movement]);
        setResetSelectionFn(null);
        setIsDeleteDialogOpen(true);
    };

    // Handle bulk delete - opens confirmation dialog for multiple movements
    const handleBulkDelete = (rows: any[], resetSelection: () => void) => {
        setMovementsToDelete(rows);
        setResetSelectionFn(() => resetSelection);
        setIsDeleteDialogOpen(true);
    };

    // Confirm delete - handles both single and bulk
    const confirmDelete = () => {
        if (movementsToDelete.length === 0) return;

        startDeleteTransition(async () => {
            try {
                let successCount = 0;
                let failCount = 0;

                for (const movement of movementsToDelete) {
                    const result = await deleteFinanceMovement(
                        movement.id,
                        movement.movement_type
                    );
                    if (result.success) {
                        successCount++;
                    } else {
                        failCount++;
                    }
                }

                if (failCount === 0) {
                    toast.success(
                        movementsToDelete.length === 1
                            ? "Movimiento eliminado"
                            : `${successCount} movimientos eliminados`
                    );
                } else {
                    toast.warning(`${successCount} eliminados, ${failCount} con error`);
                }

                setIsDeleteDialogOpen(false);
                setMovementsToDelete([]);
                resetSelectionFn?.();
                router.refresh();
            } catch (error) {
                console.error(error);
                toast.error("Error al eliminar movimiento(s)");
            }
        });
    };

    const columns: ColumnDef<any>[] = [
        // Custom date column with sorting by payment_date + created_at (for tiebreaker)
        {
            accessorKey: "payment_date",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha" />,
            cell: ({ row }) => {
                const date = row.original.payment_date;
                const avatarUrl = row.original.creator_avatar_url;
                const avatarFallback = row.original.creator_name;

                return (
                    <div className="flex items-center gap-3">
                        <div className="relative h-8 w-8 shrink-0">
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt={avatarFallback || ""}
                                    className="h-8 w-8 rounded-full object-cover"
                                />
                            ) : (
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                                    {avatarFallback?.slice(0, 2).toUpperCase() || "??"}
                                </div>
                            )}
                        </div>
                        <span className="text-sm font-medium">
                            {date ? format(new Date(date), "d MMM", { locale: es }) : "-"}
                        </span>
                    </div>
                );
            },
            // Custom sorting: first by payment_date, then by created_at (most recent first)
            sortingFn: (rowA, rowB, columnId) => {
                const dateA = new Date(rowA.original.payment_date);
                const dateB = new Date(rowB.original.payment_date);

                // First compare by payment_date
                if (dateA.getTime() !== dateB.getTime()) {
                    return dateA.getTime() - dateB.getTime();
                }

                // If same payment_date, use created_at as tiebreaker
                const createdA = new Date(rowA.original.created_at);
                const createdB = new Date(rowB.original.created_at);
                return createdA.getTime() - createdB.getTime();
            },
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
            enableSorting: true,
        },
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
        {
            accessorKey: "amount",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Monto" />,
            cell: ({ row }) => {
                const movement = row.original;
                const isExchange = movement.movement_type === 'currency_exchange' || movement.movement_type === 'wallet_transfer';

                // Para currency_exchange/wallet_transfer: mostrar ambos montos con colores
                if (isExchange && movement.to_amount) {
                    const fromAmount = Number(movement.amount) || 0;
                    const toAmount = Number(movement.to_amount) || 0;
                    const fromCurrency = movement.currency_code || '';
                    const toCurrency = movement.to_currency_code || '';

                    return (
                        <div className="flex flex-col items-end text-right">
                            <div className="flex items-center gap-1 font-mono text-sm">
                                <span className="text-amount-negative">
                                    -{fromCurrency} {fromAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                </span>
                                <span className="text-muted-foreground mx-1">→</span>
                                <span className="text-amount-positive">
                                    +{toCurrency} {toAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            {movement.exchange_rate > 1 && (
                                <span className="text-xs text-muted-foreground font-mono">
                                    Cot: {Number(movement.exchange_rate).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                </span>
                            )}
                        </div>
                    );
                }

                // Para otros tipos: comportamiento normal
                const amount = Number(movement.amount) || 0;
                const isPositive = Number(movement.amount_sign ?? 1) > 0;
                const currencyCode = movement.currency_code || '';
                const prefix = isPositive ? '+' : '-';
                const colorClass = isPositive ? 'text-amount-positive' : 'text-amount-negative';

                return (
                    <div className="flex flex-col items-end text-right">
                        <span className={`font-mono font-medium ${colorClass}`}>
                            {prefix}{currencyCode} {Math.abs(amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </span>
                        {movement.exchange_rate > 1 && (
                            <span className="text-xs text-muted-foreground font-mono">
                                Cot: {Number(movement.exchange_rate).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </span>
                        )}
                    </div>
                );
            },
            enableSorting: true,
        },
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

    // === Empty State (Standard 45.1: Toolbar always visible) ===
    if (movements.length === 0) {
        return (
            <div className="h-full flex flex-col">
                <Toolbar
                    portalToHeader
                    actions={organizationId ? [{
                        label: "Nuevo Movimiento",
                        onClick: openNewMovementModal,
                        icon: Plus
                    }] : undefined}
                />
                <div className="flex-1 flex items-center justify-center">
                    <EmptyState
                        icon={Banknote}
                        title="Sin movimientos"
                        description="No hay movimientos registrados. Creá tu primer movimiento para comenzar."
                    />
                </div>
            </div>
        );
    }

    const statusOptions = [
        { label: "Confirmado", value: "confirmed" },
        { label: "Pendiente", value: "pending" },
        { label: "Rechazado", value: "rejected" },
        { label: "Anulado", value: "void" },
    ];

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
            {/* KPI Grid - Saldo por Moneda y por Billetera */}
            <div className="flex gap-6 flex-wrap">
                {/* Saldo por Moneda */}
                <div className="flex-1 min-w-[280px]">
                    <div className="text-sm font-medium text-muted-foreground mb-2">Saldo por Moneda</div>
                    <div className="flex flex-wrap gap-2">
                        {kpiData.currencies.length === 0 ? (
                            <div className="text-sm text-muted-foreground">Sin movimientos</div>
                        ) : (
                            kpiData.currencies.map(curr => (
                                <DashboardKpiCard
                                    key={curr.code}
                                    title={curr.code}
                                    amount={curr.balance}
                                    icon={<Banknote className="h-5 w-5" />}
                                    iconClassName={curr.balance >= 0 ? "bg-amount-positive/10 text-amount-positive" : "bg-amount-negative/10 text-amount-negative"}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Saldo por Billetera */}
                <div className="flex-1 min-w-[280px]">
                    <div className="text-sm font-medium text-muted-foreground mb-2">Saldo por Billetera</div>
                    <div className="flex flex-wrap gap-2">
                        {kpiData.wallets.length === 0 ? (
                            <div className="text-sm text-muted-foreground">Sin billeteras</div>
                        ) : (
                            kpiData.wallets.map(wallet => (
                                <DashboardKpiCard
                                    key={wallet.id}
                                    title={wallet.name}
                                    amount={wallet.balance}
                                    icon={<Wallet className="h-5 w-5" />}
                                    iconClassName={wallet.balance >= 0 ? "bg-amount-positive/10 text-amount-positive" : "bg-amount-negative/10 text-amount-negative"}
                                />
                            ))
                        )}
                    </div>
                </div>
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
                onBulkDelete={handleBulkDelete}
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
                        <AlertDialogTitle>
                            {movementsToDelete.length === 1
                                ? "¿Eliminar movimiento?"
                                : `¿Eliminar ${movementsToDelete.length} movimientos?`
                            }
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {movementsToDelete.length === 1
                                ? "Esta acción no se puede deshacer. Se eliminará el movimiento financiero."
                                : `Esta acción no se puede deshacer. Se eliminarán ${movementsToDelete.length} movimientos financieros.`
                            }
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting
                                ? "Eliminando..."
                                : movementsToDelete.length === 1
                                    ? "Eliminar"
                                    : `Eliminar ${movementsToDelete.length}`
                            }
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
