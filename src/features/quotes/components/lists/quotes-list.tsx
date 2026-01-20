"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QuoteView, QUOTE_STATUS_LABELS, QUOTE_STATUS_COLORS, QUOTE_TYPE_LABELS, QUOTE_TYPE_COLORS } from "../../types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Plus,
    FileText,
    Building2,
    Calendar,
    MoreHorizontal,
    ExternalLink,
    Copy,
    Trash2,
    CheckCircle,
    XCircle,
    Send
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useModal } from "@/providers/modal-store";
import { QuoteForm } from "../forms/quote-form";
import { formatCurrency } from "@/lib/currency-utils";
import { deleteQuote } from "../../actions";
import { toast } from "sonner";
import { DeleteConfirmationDialog } from "@/components/shared/delete-confirmation-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Toolbar } from "@/components/ui/toolbar";
import { FacetedFilter } from "@/components/ui/faceted-filter";
import { Circle, FileCheck, Send as SendIcon, XCircle as XCircleIcon, FileSpreadsheet, FileSignature, FilePlus2 } from "lucide-react";
import { OrganizationFinancialData } from "@/features/clients/types";

interface QuotesListProps {
    quotes: QuoteView[];
    organizationId: string;
    financialData: OrganizationFinancialData;
    clients: { id: string; name: string }[];
    projects?: { id: string; name: string }[];
    projectId?: string; // If provided, we're in project context
    showProjectColumn?: boolean;
}

export function QuotesList({
    quotes,
    organizationId,
    financialData,
    clients,
    projects,
    projectId,
    showProjectColumn = true
}: QuotesListProps) {
    const router = useRouter();
    const { openModal, closeModal } = useModal();
    const [searchQuery, setSearchQuery] = useState("");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [quoteToDelete, setQuoteToDelete] = useState<QuoteView | null>(null);

    // Filter states
    const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());
    const [typeFilter, setTypeFilter] = useState<Set<string>>(new Set());

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

    // Filter quotes by search + filters
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

    const handleCreateQuote = () => {
        openModal(
            <QuoteForm
                mode="create"
                organizationId={organizationId}
                financialData={financialData}
                clients={clients}
                projects={projects}
                projectId={projectId}
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

    const handleEditQuote = (quote: QuoteView) => {
        openModal(
            <QuoteForm
                mode="edit"
                initialData={quote}
                organizationId={organizationId}
                financialData={financialData}
                clients={clients}
                projects={projects}
                projectId={projectId}
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

    const handleDeleteQuote = (quote: QuoteView) => {
        setQuoteToDelete(quote);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!quoteToDelete) return;

        setIsDeleting(true);
        const result = await deleteQuote(quoteToDelete.id);
        setIsDeleting(false);
        setDeleteDialogOpen(false);
        setQuoteToDelete(null);

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Presupuesto eliminado");
            router.refresh();
        }
    };

    // Early return: Empty State when no quotes at all
    if (quotes.length === 0) {
        return (
            <EmptyState
                icon={FileText}
                title="Sin presupuestos"
                description="Creá tu primer presupuesto para comenzar a gestionar cotizaciones y contratos."
                action={
                    <Button onClick={handleCreateQuote} size="lg">
                        <Plus className="mr-2 h-4 w-4" /> Nuevo Presupuesto
                    </Button>
                }
            />
        );
    }

    return (
        <div className="space-y-4 flex flex-col flex-1 min-h-0">
            {/* Toolbar Area */}
            <Card className="p-4 border-dashed bg-card/50">
                <Toolbar
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
                >
                    <Button size="sm" onClick={handleCreateQuote}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nuevo Presupuesto
                    </Button>
                </Toolbar>
            </Card>


            {/* Quotes List */}
            <div className="space-y-2">
                {filteredQuotes.map((quote) => (
                    <Card
                        key={quote.id}
                        className="hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => router.push(`/organization/quotes/${quote.id}`)}
                    >
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    {/* Name & Description */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium truncate">{quote.name}</p>
                                            <Badge variant="outline" className={`text-xs ${QUOTE_TYPE_COLORS[quote.quote_type]}`}>
                                                {QUOTE_TYPE_LABELS[quote.quote_type]}
                                            </Badge>
                                            <Badge variant="outline" className={`text-xs ${QUOTE_STATUS_COLORS[quote.status]}`}>
                                                {QUOTE_STATUS_LABELS[quote.status]}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                            {quote.client_name && (
                                                <span className="flex items-center gap-1">
                                                    <Building2 className="h-3 w-3" />
                                                    {quote.client_name}
                                                </span>
                                            )}
                                            {showProjectColumn && quote.project_name && (
                                                <span className="truncate">
                                                    → {quote.project_name}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {quote.created_at?.split('T')[0]}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Items count */}
                                    <div className="text-center px-4">
                                        <p className="text-lg font-semibold">{quote.item_count}</p>
                                        <p className="text-xs text-muted-foreground">ítems</p>
                                    </div>

                                    {/* Total */}
                                    <div className="text-right min-w-[120px]">
                                        <p className="text-lg font-semibold">
                                            {quote.currency_symbol} {formatCurrency(quote.total_with_tax || 0)}
                                        </p>
                                        <p className="text-xs text-muted-foreground">Total</p>
                                    </div>
                                </div>

                                {/* Actions Menu */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                        <Button variant="ghost" size="icon" className="ml-2">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={(e) => {
                                            e.stopPropagation();
                                            router.push(`/organization/quotes/${quote.id}`);
                                        }}>
                                            <ExternalLink className="h-4 w-4 mr-2" />
                                            Ver detalles
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditQuote(quote);
                                        }}>
                                            <FileText className="h-4 w-4 mr-2" />
                                            Editar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                                            <Copy className="h-4 w-4 mr-2" />
                                            Duplicar
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        {quote.status === 'draft' && (
                                            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                                                <Send className="h-4 w-4 mr-2" />
                                                Marcar como Enviado
                                            </DropdownMenuItem>
                                        )}
                                        {quote.status === 'sent' && (
                                            <>
                                                <DropdownMenuItem onClick={(e) => e.stopPropagation()} className="text-green-500">
                                                    <CheckCircle className="h-4 w-4 mr-2" />
                                                    Aprobar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={(e) => e.stopPropagation()} className="text-red-500">
                                                    <XCircle className="h-4 w-4 mr-2" />
                                                    Rechazar
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteQuote(quote);
                                            }}
                                            className="text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Eliminar
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Empty State */}
            {filteredQuotes.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No se encontraron presupuestos</p>
                    <p className="text-sm">
                        {searchQuery ? "Probá con otro término de búsqueda" : "Creá tu primer presupuesto para comenzar"}
                    </p>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={confirmDelete}
                title="Eliminar Presupuesto"
                description={
                    <>
                        ¿Estás seguro de eliminar <strong>{quoteToDelete?.name}</strong>?
                        <br />
                        Esta acción no se puede deshacer.
                    </>
                }
                confirmLabel="Eliminar"
                isDeleting={isDeleting}
            />
        </div>
    );
}
