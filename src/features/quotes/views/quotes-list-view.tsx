"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { FileText, Plus, Building2, Calendar, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { PageWrapper, ContentLayout } from "@/components/layout";
import { DataTable, DataTableColumnHeader } from "@/components/shared/data-table";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { FacetedFilter } from "@/components/layout/dashboard/shared/toolbar/toolbar-faceted-filter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
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
import { Circle, FileCheck, Send as SendIcon, XCircle as XCircleIcon, FileSpreadsheet, FileSignature, FilePlus2 } from "lucide-react";

import { useModal } from "@/providers/modal-store";
import { useMoney } from "@/hooks/use-money";
import { QuoteForm } from "../forms/quote-form";
import { deleteQuote } from "../actions";
import { QuoteView, QUOTE_STATUS_LABELS, QUOTE_STATUS_COLORS, QUOTE_TYPE_LABELS, QUOTE_TYPE_COLORS } from "../types";
import { OrganizationFinancialData } from "@/features/clients/types";

// ============================================================================
// QUOTES PAGE
// ============================================================================
// Shared page for Quotes that works in both Organization and Project contexts
// ============================================================================

interface QuotesListViewProps {
    organizationId: string;
    projectId?: string | null;
    quotes: QuoteView[];
    financialData: OrganizationFinancialData;
    clients: { id: string; name: string }[];
    projects: { id: string; name: string }[];
    defaultTab?: string;
}

export function QuotesListView({
    organizationId,
    projectId,
    quotes,
    financialData,
    clients,
    projects,
}: QuotesListViewProps) {
    const router = useRouter();
    const { openModal, closeModal } = useModal();
    const money = useMoney();
    const [searchQuery, setSearchQuery] = useState("");

    // Delete dialog state
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [quoteToDelete, setQuoteToDelete] = useState<QuoteView | null>(null);
    const [isDeleting, startDeleteTransition] = useTransition();

    // Filter states
    const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());
    const [typeFilter, setTypeFilter] = useState<Set<string>>(new Set());

    const isProjectContext = !!projectId;
    const showProjectColumn = !isProjectContext;

    // Filter options
    const statusOptions = [
        { label: 'Borrador', value: 'draft', icon: Circle },
        { label: 'Enviado', value: 'sent', icon: SendIcon },
        { label: 'Aprobado', value: 'approved', icon: FileCheck },
        { label: 'Rechazado', value: 'rejected', icon: XCircleIcon },
    ];

    const typeOptions = [
        { label: 'Cotización', value: 'quote', icon: FileSpreadsheet },
        { label: 'Contrato', value: 'contract', icon: FileSignature },
        { label: 'Adicional', value: 'change_order', icon: FilePlus2 },
    ];

    // Filter quotes
    const filteredQuotes = quotes.filter(quote => {
        const query = searchQuery.toLowerCase();
        const matchesSearch = (
            quote.name?.toLowerCase().includes(query) ||
            quote.description?.toLowerCase().includes(query) ||
            quote.client_name?.toLowerCase().includes(query) ||
            quote.project_name?.toLowerCase().includes(query)
        );

        const matchesStatus = statusFilter.size === 0 || statusFilter.has(quote.status);
        const matchesType = typeFilter.size === 0 || typeFilter.has(quote.quote_type);

        return matchesSearch && matchesStatus && matchesType;
    });

    // Handlers
    const handleCreateQuote = () => {
        openModal(
            <QuoteForm
                mode="create"
                organizationId={organizationId}
                financialData={financialData}
                clients={clients}
                projects={projects}
                projectId={projectId ?? undefined}
                onCancel={closeModal}
                onSuccess={(quoteId) => {
                    closeModal();
                    if (projectId) {
                        router.refresh();
                    } else {
                        router.push(`/organization/quotes/${quoteId}`);
                    }
                }}
            />,
            {
                title: "Nuevo Presupuesto",
                description: "Crear un nuevo presupuesto o cotización",
                size: "lg"
            }
        );
    };

    const handleEdit = (quote: QuoteView) => {
        openModal(
            <QuoteForm
                mode="edit"
                initialData={quote}
                organizationId={organizationId}
                financialData={financialData}
                clients={clients}
                projects={projects}
                projectId={projectId ?? undefined}
                onCancel={closeModal}
                onSuccess={() => {
                    closeModal();
                    router.refresh();
                }}
            />,
            {
                title: "Editar Presupuesto",
                description: "Modificar información del presupuesto",
                size: "lg"
            }
        );
    };

    const handleDeleteClick = (quote: QuoteView) => {
        setQuoteToDelete(quote);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (!quoteToDelete) return;

        startDeleteTransition(async () => {
            const result = await deleteQuote(quoteToDelete.id);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Presupuesto eliminado");
                router.refresh();
            }
            setIsDeleteDialogOpen(false);
            setQuoteToDelete(null);
        });
    };

    const handleRowClick = (quote: QuoteView) => {
        router.push(`/organization/quotes/${quote.id}`);
    };

    // Column definitions
    const columns: ColumnDef<QuoteView>[] = [
        {
            accessorKey: "name",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Nombre" />,
            cell: ({ row }) => (
                <div className="min-w-[200px]">
                    <p className="font-medium truncate">{row.original.name}</p>
                    {row.original.description && (
                        <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                            {row.original.description}
                        </p>
                    )}
                </div>
            ),
        },
        {
            id: "quote_type",
            accessorKey: "quote_type",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Tipo" />,
            cell: ({ row }) => (
                <Badge variant="outline" className={`text-xs ${QUOTE_TYPE_COLORS[row.original.quote_type]}`}>
                    {QUOTE_TYPE_LABELS[row.original.quote_type]}
                </Badge>
            ),
            filterFn: (row, id, value) => value.includes(row.getValue(id)),
        },
        {
            id: "status",
            accessorKey: "status",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
            cell: ({ row }) => (
                <Badge variant="outline" className={`text-xs ${QUOTE_STATUS_COLORS[row.original.status]}`}>
                    {QUOTE_STATUS_LABELS[row.original.status]}
                </Badge>
            ),
            filterFn: (row, id, value) => value.includes(row.getValue(id)),
        },
        {
            id: "client",
            accessorFn: (row) => row.client_name,
            header: ({ column }) => <DataTableColumnHeader column={column} title="Cliente" />,
            cell: ({ row }) => row.original.client_name ? (
                <span className="flex items-center gap-1 text-sm">
                    <Building2 className="h-3 w-3 text-muted-foreground" />
                    {row.original.client_name}
                </span>
            ) : (
                <span className="text-muted-foreground">-</span>
            ),
        },
        ...(showProjectColumn ? [{
            id: "project",
            accessorFn: (row: QuoteView) => row.project_name,
            header: ({ column }: any) => <DataTableColumnHeader column={column} title="Proyecto" />,
            cell: ({ row }: any) => row.original.project_name ? (
                <span className="text-sm truncate max-w-[150px] block">{row.original.project_name}</span>
            ) : (
                <span className="text-muted-foreground">-</span>
            ),
        }] : []) as ColumnDef<QuoteView>[],
        {
            id: "item_count",
            accessorKey: "item_count",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Ítems" />,
            cell: ({ row }) => (
                <span className="font-mono text-center">{row.original.item_count}</span>
            ),
        },
        {
            id: "total",
            accessorKey: "total_with_tax",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Total" />,
            cell: ({ row }) => (
                <span className="font-mono font-medium">
                    {money.format(row.original.total_with_tax || 0)}
                </span>
            ),
        },
        {
            id: "date",
            accessorKey: "created_at",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha" />,
            cell: ({ row }) => (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {row.original.created_at?.split('T')[0]}
                </span>
            ),
        },
    ];

    // Early return: Empty State
    if (quotes.length === 0) {
        return (
            <PageWrapper type="page" title="Presupuestos" icon={<FileText />}>
                <Toolbar
                    portalToHeader
                    actions={[{ label: "Nuevo Presupuesto", icon: Plus, onClick: handleCreateQuote }]}
                />
                <div className="flex-1 flex items-center justify-center">
                    <EmptyState
                        icon={FileText}
                        title="Sin presupuestos"
                        description="Creá tu primer presupuesto para comenzar a gestionar cotizaciones y contratos."
                    />
                </div>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper type="page" title="Presupuestos" icon={<FileText />}>
            <ContentLayout variant="wide">
                <Toolbar
                    portalToHeader
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    searchPlaceholder="Buscar por nombre, cliente o proyecto..."
                    filterContent={
                        <>
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
                            <FacetedFilter
                                title="Tipo"
                                options={typeOptions}
                                selectedValues={typeFilter}
                                onSelect={(value) => {
                                    const next = new Set(typeFilter);
                                    if (next.has(value)) next.delete(value);
                                    else next.add(value);
                                    setTypeFilter(next);
                                }}
                                onClear={() => setTypeFilter(new Set())}
                            />
                        </>
                    }
                    actions={[{ label: "Nuevo Presupuesto", icon: Plus, onClick: handleCreateQuote }]}
                />

                <DataTable
                    columns={columns}
                    data={filteredQuotes}
                    showPagination={true}
                    pageSize={15}
                    enableRowActions={true}
                    onEdit={handleEdit}
                    onDelete={handleDeleteClick}
                    onRowClick={handleRowClick}
                />

                {/* Delete Confirmation Dialog */}
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta acción no se puede deshacer. Se eliminará el presupuesto
                                <strong> {quoteToDelete?.name}</strong>.
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
            </ContentLayout>
        </PageWrapper>
    );
}
