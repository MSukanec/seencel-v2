"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QuoteView, QuoteItemView, ContractSummary, QUOTE_STATUS_LABELS, QUOTE_STATUS_COLORS, QUOTE_TYPE_LABELS } from "../types";
import { TaskView, Unit, TaskDivision } from "@/features/tasks/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Plus,
    FileText,
    Building2,
    Calendar,
    Download,
    Send,
    CheckCircle,
    FolderPlus,
    FileSignature,
    PenLine
} from "lucide-react";

import { useModal } from "@/providers/modal-store";
import { QuoteItemForm } from "../components/editor/quote-item-form";
import { QuoteItemsTable } from "../components/editor/quote-items-table";
import { convertQuoteToProject, approveQuote, convertQuoteToContract } from "../actions";
import { toast } from "sonner";
import { ConvertToContractModal } from "../components/modals/convert-to-contract-modal";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";

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

    return (
        <div className="h-full flex flex-col space-y-4">
            <Toolbar
                portalToHeader
                actions={[
                    {
                        label: "Exportar",
                        icon: Download,
                        variant: "outline",
                        onClick: () => { } // TODO: Export function
                    },
                    ...(quote.status === 'draft' ? [{
                        label: "Enviar",
                        icon: Send,
                        variant: "outline" as const,
                        onClick: () => { } // TODO: Send function
                    }] : []),
                    // Actions for Draft
                    ...(quote.status === 'sent' ? [{
                        label: "Aprobar",
                        icon: CheckCircle,
                        // @ts-ignore - Toolbar types fix needed
                        className: "bg-green-600 hover:bg-green-700 text-white",
                        onClick: handleApproveQuote
                    }] : []),
                    // Actions for Quote -> Project
                    ...(quote.quote_type === 'quote' && !quote.project_id ? [{
                        label: "Convertir en Proyecto",
                        icon: FolderPlus,
                        onClick: handleConvertToProject
                    }] : []),
                    // Actions for Quote -> Contract
                    ...(quote.quote_type === 'quote' && quote.project_id && quote.status === 'approved' ? [{
                        label: "Convertir en Contrato",
                        icon: FileSignature,
                        onClick: handleConvertToContractClick
                    }] : [])
                ]}
            />

            <Card className="flex-1 flex flex-col min-h-0">
                <CardHeader className="flex flex-row items-center justify-between py-4 px-6 border-b shrink-0">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {isContract ? 'Ítems del Contrato Base' : 'Ítems del Presupuesto'}
                        <Badge variant="outline" className="ml-2">{items.length} ítems</Badge>
                    </CardTitle>
                    {quote.status !== 'approved' && (
                        <Button size="sm" onClick={handleAddItem} className="h-8">
                            <Plus className="h-3.5 w-3.5 mr-1.5" />
                            Agregar Ítem
                        </Button>
                    )}
                </CardHeader>
                <div className="flex-1 overflow-y-auto">
                    <CardContent className="min-h-full p-0">
                        <QuoteItemsTable
                            items={items}
                            quote={quote}
                            tasks={tasks}
                            divisions={divisions}
                            onRefresh={() => router.refresh()}
                            onEditItem={handleEditItem}
                        />
                    </CardContent>
                </div>
            </Card>

            <ConvertToContractModal
                open={showConvertModal}
                onOpenChange={setShowConvertModal}
                onConfirm={confirmConversion}
                contractValue={quote.total_with_tax || 0}
                currencySymbol={quote.currency_symbol || '$'}
                isConverting={isConverting}
            />
        </div>
    );
}
