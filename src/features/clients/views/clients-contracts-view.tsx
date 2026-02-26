"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { FileSignature, Plus, Circle, FileCheck, Send as SendIcon, XCircle as XCircleIcon, FilePlus2 } from "lucide-react";
import { useActiveProjectId, useLayoutActions } from "@/stores/layout-store";

import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { FacetedFilter } from "@/components/layout/dashboard/shared/toolbar/toolbar-faceted-filter";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { DataTable, DataTableColumnHeader } from "@/components/shared/data-table";
import { ContentLayout } from "@/components/layout/dashboard/shared/content-layout";
import { useMoney } from "@/hooks/use-money";

import {
    QUOTE_STATUS_LABELS,
    QUOTE_STATUS_COLORS,
    QUOTE_TYPE_LABELS,
    QUOTE_TYPE_COLORS,
    type QuoteView,
    type QuoteStatus,
} from "@/features/quotes/types";

// ============================================================================
// CONTRACTS VIEW — Tab "Contratos" in the Cobros page
// ============================================================================
// Shows contracts (approved quotes) and change orders for the organization.
// Click navigates to the full quote detail page.
// ============================================================================

interface ClientsContractsViewProps {
    contracts: QuoteView[];
    orgId: string;
    projects?: { id: string; name: string }[];
}

export function ClientsContractsView({
    contracts,
    orgId,
    projects = [],
}: ClientsContractsViewProps) {
    const router = useRouter();
    const money = useMoney();
    const { setActiveProjectId } = useLayoutActions();
    const activeProjectId = useActiveProjectId();

    // — Search with 300ms debounce —
    const [rawSearch, setRawSearch] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleSearchChange = (value: string) => {
        setRawSearch(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => setSearchQuery(value), 300);
    };

    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    // — Filter states —
    const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());

    const isProjectContext = !!activeProjectId;
    const activeProjectName = projects.find(p => p.id === activeProjectId)?.name;
    const hasActiveFilters = statusFilter.size > 0 || searchQuery.length > 0;

    // — Filter options —
    const statusOptions = [
        { label: "Borrador", value: "draft", icon: Circle },
        { label: "Enviado", value: "sent", icon: SendIcon },
        { label: "Aprobado", value: "approved", icon: FileCheck },
        { label: "Rechazado", value: "rejected", icon: XCircleIcon },
    ];

    // — Filtered data —
    const filteredContracts = useMemo(() => {
        return contracts.filter((contract) => {
            const query = searchQuery.toLowerCase();
            const matchesSearch =
                !query ||
                contract.name?.toLowerCase().includes(query) ||
                contract.client_name?.toLowerCase().includes(query) ||
                contract.project_name?.toLowerCase().includes(query);

            const matchesStatus = statusFilter.size === 0 || statusFilter.has(contract.status);
            const matchesProject = !activeProjectId || contract.project_id === activeProjectId;

            return matchesSearch && matchesStatus && matchesProject;
        });
    }, [contracts, searchQuery, statusFilter, activeProjectId]);

    // — Handlers —
    const handleRowClick = (row: QuoteView) => {
        router.push(`/organization/quotes/${row.id}` as any);
    };

    const handleCreateContract = () => {
        router.push(`/organization/quotes` as any);
    };

    const handleResetFilters = () => {
        setRawSearch("");
        setSearchQuery("");
        setStatusFilter(new Set());
    };

    // — Columns —
    const columns: ColumnDef<QuoteView>[] = [
        {
            accessorKey: "name",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Nombre" />,
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    {row.original.quote_type === "change_order" ? (
                        <FilePlus2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    ) : (
                        <FileSignature className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <div className="min-w-0">
                        <p className="font-medium truncate">{row.original.name}</p>
                        {row.original.parent_contract_name && (
                            <p className="text-xs text-muted-foreground truncate">
                                CO de: {row.original.parent_contract_name}
                            </p>
                        )}
                    </div>
                </div>
            ),
        },
        {
            accessorKey: "quote_type",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Tipo" />,
            cell: ({ row }) => {
                const type = row.original.quote_type;
                return (
                    <Badge variant="outline" className={QUOTE_TYPE_COLORS[type]}>
                        {QUOTE_TYPE_LABELS[type]}
                    </Badge>
                );
            },
        },
        {
            accessorKey: "project_name",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Proyecto" />,
            cell: ({ row }) => (
                <span className="text-muted-foreground">{row.original.project_name || "—"}</span>
            ),
        },
        {
            accessorKey: "client_name",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Cliente" />,
            cell: ({ row }) => (
                <span className="text-muted-foreground">{row.original.client_name || "—"}</span>
            ),
        },
        {
            accessorKey: "status",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
            cell: ({ row }) => {
                const status = row.original.status as QuoteStatus;
                return (
                    <Badge variant="outline" className={QUOTE_STATUS_COLORS[status]}>
                        {QUOTE_STATUS_LABELS[status]}
                    </Badge>
                );
            },
        },
        {
            accessorKey: "total_with_tax",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Valor Total" />,
            cell: ({ row }) => {
                const value = row.original.total_with_tax;
                const symbol = row.original.currency_symbol || "$";
                return (
                    <span className="font-mono font-medium">
                        {symbol} {Number(value).toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    </span>
                );
            },
        },
    ];

    // — Toolbar —
    const toolbar = (
        <Toolbar
            portalToHeader
            searchQuery={rawSearch}
            onSearchChange={handleSearchChange}
            searchPlaceholder="Buscar por nombre, cliente o proyecto..."
            filterContent={
                <FacetedFilter
                    title="Estado"
                    options={statusOptions}
                    selectedValues={statusFilter}
                    onSelect={(value) => {
                        const next = new Set(statusFilter);
                        if (next.has(value)) next.delete(value);
                        else next.add(value);
                        setStatusFilter(next);
                    }}
                    onClear={() => setStatusFilter(new Set())}
                />
            }
            actions={[
                {
                    label: "Ir a Presupuestos",
                    icon: Plus,
                    onClick: handleCreateContract,
                },
            ]}
        />
    );

    // — Empty state: no contracts at all (org-wide) —
    if (contracts.length === 0) {
        return (
            <>
                {toolbar}
                <ContentLayout variant="wide">
                    <div className="h-full flex items-center justify-center">
                        <ViewEmptyState
                            mode="empty"
                            icon={FileSignature}
                            viewName="Contratos"
                            featureDescription="Los contratos son presupuestos aprobados que definen el valor de la obra y los compromisos con el cliente. Creá un presupuesto y aprobalo para que aparezca aquí como contrato."
                            onAction={handleCreateContract}
                            actionLabel="Ir a Presupuestos"
                        />
                    </div>
                </ContentLayout>
            </>
        );
    }

    // — Empty state: project selected but no contracts for it —
    if (filteredContracts.length === 0 && isProjectContext && !hasActiveFilters) {
        return (
            <>
                {toolbar}
                <ContentLayout variant="wide">
                    <div className="h-full flex items-center justify-center">
                        <ViewEmptyState
                            mode="context-empty"
                            icon={FileSignature}
                            viewName="contratos"
                            projectName={activeProjectName}
                            onAction={handleCreateContract}
                            actionLabel="Ir a Presupuestos"
                            onSwitchToOrg={() => setActiveProjectId(null)}
                        />
                    </div>
                </ContentLayout>
            </>
        );
    }

    // — Empty state: filters active but no results —
    if (filteredContracts.length === 0) {
        return (
            <>
                {toolbar}
                <ContentLayout variant="wide">
                    <div className="h-full flex items-center justify-center">
                        <ViewEmptyState
                            mode="no-results"
                            icon={FileSignature}
                            viewName="contratos"
                            filterContext="con esos filtros"
                            onResetFilters={handleResetFilters}
                        />
                    </div>
                </ContentLayout>
            </>
        );
    }

    // — Content: DataTable —
    return (
        <>
            {toolbar}
            <ContentLayout variant="wide">
                <DataTable
                    columns={columns}
                    data={filteredContracts}
                    enableRowSelection={false}
                    onRowClick={handleRowClick}
                    pageSize={50}
                    initialSorting={[{ id: "name", desc: false }]}
                />
            </ContentLayout>
        </>
    );
}
