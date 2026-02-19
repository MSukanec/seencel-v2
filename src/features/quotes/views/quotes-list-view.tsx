"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "@/i18n/routing";
import { FileText, Plus, Circle, FileCheck, Send as SendIcon, XCircle as XCircleIcon, FileSpreadsheet, FileSignature, FilePlus2, Loader2 } from "lucide-react";
import { useActiveProjectId, useLayoutActions } from "@/stores/layout-store";
import { toast } from "sonner";

import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { FacetedFilter } from "@/components/layout/dashboard/shared/toolbar/toolbar-faceted-filter";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { QuoteListItem } from "@/components/shared/list-item/items/quote-list-item";
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
import { useMoney } from "@/hooks/use-money";
import { useOptimisticList } from "@/hooks/use-optimistic-action";
import { QuoteForm } from "../forms/quote-form";
import { deleteQuote } from "../actions";
import { QuoteView } from "../types";
import { OrganizationFinancialData } from "@/features/clients/types";

// ============================================================================
// QUOTES LIST VIEW
// ============================================================================
// Shared view for Quotes — works in both Organization and Project contexts.
// The PageWrapper/header lives in the server page (app/quotes/page.tsx).
// When projectId is set, filteredQuotes only shows quotes for that project.
// ============================================================================

interface QuotesListViewProps {
    organizationId: string;
    /** When set, only shows quotes for this project (project context) */
    projectId?: string | null;
    quotes: QuoteView[];
    financialData: OrganizationFinancialData;
    clients: { id: string; name: string; resolved_avatar_url?: string | null }[];
    projects: { id: string; name: string; image_url?: string | null; color?: string | null }[];
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

    // — Búsqueda con debounce de 300ms —
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

    // — Optimistic delete —
    const { optimisticItems, removeItem, isPending: isDeleting } = useOptimisticList({
        items: quotes,
        getItemId: (q) => q.id,
    });

    // — Delete dialog state —
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [quoteToDelete, setQuoteToDelete] = useState<QuoteView | null>(null);

    // — Filter states —
    const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());
    const [typeFilter, setTypeFilter] = useState<Set<string>>(new Set());

    // Lee el proyecto activo del layout-store (selector de contexto del header)
    const activeProjectId = useActiveProjectId();
    const { setActiveProjectId } = useLayoutActions();
    const isProjectContext = !!activeProjectId || !!projectId;
    const effectiveProjectId = projectId || activeProjectId;

    // Nombre del proyecto activo para mostrar en el empty state
    const activeProjectName = projects.find(p => p.id === effectiveProjectId)?.name;

    const hasActiveFilters = statusFilter.size > 0 || typeFilter.size > 0 || searchQuery.length > 0;

    // — Filter options —
    const statusOptions = [
        { label: "Borrador", value: "draft", icon: Circle },
        { label: "Enviado", value: "sent", icon: SendIcon },
        { label: "Aprobado", value: "approved", icon: FileCheck },
        { label: "Rechazado", value: "rejected", icon: XCircleIcon },
    ];
    const typeOptions = [
        { label: "Cotización", value: "quote", icon: FileSpreadsheet },
        { label: "Contrato", value: "contract", icon: FileSignature },
        { label: "Adicional", value: "change_order", icon: FilePlus2 },
    ];

    // — Filter quotes (with project context) —
    const filteredQuotes = optimisticItems.filter((quote) => {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
            !query ||
            quote.name?.toLowerCase().includes(query) ||
            quote.description?.toLowerCase().includes(query) ||
            quote.client_name?.toLowerCase().includes(query) ||
            quote.project_name?.toLowerCase().includes(query);

        const matchesStatus = statusFilter.size === 0 || statusFilter.has(quote.status);
        const matchesType = typeFilter.size === 0 || typeFilter.has(quote.quote_type);

        // 🔑 Context filter: selector de contexto del header (layout-store)
        const matchesProject = !effectiveProjectId || quote.project_id === effectiveProjectId;

        return matchesSearch && matchesStatus && matchesType && matchesProject;
    });

    // — Handlers —
    const handleCreateQuote = () => {
        // Garantiza que el proyecto activo esté en la lista, aunque no sea 'activo'
        // (ej: puede estar en estado 'completed' o no estar en la lista de activos del server)
        const projectsForForm = effectiveProjectId && !projects.find(p => p.id === effectiveProjectId)
            ? [{ id: effectiveProjectId, name: activeProjectName || "Proyecto actual" }, ...projects]
            : projects;

        openModal(
            <QuoteForm
                mode="create"
                organizationId={organizationId}
                financialData={financialData}
                clients={clients}
                projects={projectsForForm}
                projectId={effectiveProjectId ?? undefined}
            />,
            {
                title: "Nuevo Presupuesto",
                description: "Completá los campos para crear un presupuesto",
                size: "md",
            }
        );
    };

    const handleEdit = (quote: QuoteView) => {
        // Mismo fix que handleCreateQuote: garantiza que el proyecto actual esté en la lista
        const projectsForForm = effectiveProjectId && !projects.find(p => p.id === effectiveProjectId)
            ? [{ id: effectiveProjectId, name: activeProjectName || "Proyecto actual" }, ...projects]
            : projects;

        openModal(
            <QuoteForm
                mode="edit"
                initialData={quote}
                organizationId={organizationId}
                financialData={financialData}
                clients={clients}
                projects={projectsForForm}
                projectId={effectiveProjectId ?? undefined}
            />,
            {
                title: "Editar Presupuesto",
                description: "Modificar nombre, proyecto o cliente del presupuesto",
                size: "md",
            }
        );
    };

    const handleDeleteClick = (quote: QuoteView) => {
        setQuoteToDelete(quote);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (!quoteToDelete) return;

        const idToDelete = quoteToDelete.id;
        const nameToShow = quoteToDelete.name;
        setIsDeleteDialogOpen(false);
        setQuoteToDelete(null);

        removeItem(idToDelete, async () => {
            const result = await deleteQuote(idToDelete);
            if (result.error) {
                toast.error(result.error);
                router.refresh();
            } else {
                toast.success(`Presupuesto "${nameToShow}" eliminado`);
            }
        });
    };

    const handleRowClick = (quote: QuoteView) => {
        router.push(`/organization/quotes/${quote.id}` as any);
    };

    const handleResetFilters = () => {
        setRawSearch("");
        setSearchQuery("");
        setStatusFilter(new Set());
        setTypeFilter(new Set());
    };

    // — Toolbar: siempre se renderiza (portal to header) —
    const toolbar = (
        <Toolbar
            portalToHeader
            searchQuery={rawSearch}
            onSearchChange={handleSearchChange}
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
    );

    // ─────────────────────────────────────────────────────────────────────────
    // RETURNS — todos los empty states son early returns con fragment.
    // ViewEmptyState como hijo directo del fragment → flex item del PageWrapper
    // content area (flex-1 overflow-hidden flex flex-col) → flex-1 expande.
    // ─────────────────────────────────────────────────────────────────────────

    // Case 1: Org completamente vacía
    if (optimisticItems.length === 0) {
        return (
            <>
                {toolbar}
                <ViewEmptyState
                    mode="empty"
                    icon={FileText}
                    viewName="Presupuestos"
                    featureDescription="Gestioná las cotizaciones y contratos de tu organización. Convertí presupuestos en contratos, agregá órdenes de cambio y hacé seguimiento del estado de cada documento comercial."
                    onAction={handleCreateQuote}
                    actionLabel="Nuevo Presupuesto"
                    docsPath="/docs/presupuestos/introduccion"
                />
            </>
        );
    }

    // Case 2: Proyecto seleccionado sin presupuestos
    if (filteredQuotes.length === 0 && isProjectContext && !hasActiveFilters) {
        return (
            <>
                {toolbar}
                <ViewEmptyState
                    mode="context-empty"
                    icon={FileText}
                    viewName="presupuestos"
                    projectName={activeProjectName}
                    onAction={handleCreateQuote}
                    actionLabel="Nuevo Presupuesto"
                    onSwitchToOrg={activeProjectId ? () => setActiveProjectId(null) : undefined}
                />
            </>
        );
    }

    // Case 3: Filtros activos sin resultados
    if (filteredQuotes.length === 0) {
        return (
            <>
                {toolbar}
                <ViewEmptyState
                    mode="no-results"
                    icon={FileText}
                    viewName="presupuestos"
                    filterContext="con esos filtros"
                    onResetFilters={handleResetFilters}
                />
            </>
        );
    }

    // Case 4: Lista con datos
    return (
        <>
            {toolbar}
            <div className="flex flex-col gap-2">
                {filteredQuotes.map((quote) => (
                    <QuoteListItem
                        key={quote.id}
                        quote={quote}
                        canEdit={true}
                        isProjectContext={isProjectContext}
                        formatMoney={money.format}
                        onEdit={handleEdit}
                        onDelete={handleDeleteClick}
                        onClick={handleRowClick}
                    />
                ))}
            </div>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará el presupuesto{" "}
                            <strong>{quoteToDelete?.name}</strong>.
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
        </>
    );
}
