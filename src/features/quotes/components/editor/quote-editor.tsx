"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QuoteView, QuoteItemView, QUOTE_STATUS_LABELS, QUOTE_STATUS_COLORS, QUOTE_TYPE_LABELS } from "../../types";
import { TaskView, Unit, TaskDivision } from "@/features/tasks/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    ArrowLeft,
    Plus,
    FileText,
    Building2,
    Calendar,
    MoreHorizontal,
    Trash2,
    Edit,
    Download,
    Send,
    CheckCircle,
    FolderPlus
} from "lucide-react";

import { useModal } from "@/providers/modal-store";
import { QuoteItemForm } from "./quote-item-form";
import { QuoteItemsTable } from "./quote-items-table";
import { convertQuoteToProject, approveQuote } from "../../actions";
import { toast } from "sonner";

interface QuoteEditorProps {
    quote: QuoteView;
    items: QuoteItemView[];
    tasks: TaskView[];
    units: Unit[];
    divisions: TaskDivision[];
    currencies: { id: string; name: string; symbol: string }[];
}

export function QuoteEditor({
    quote,
    items,
    tasks,
    units,
    divisions,
    currencies
}: QuoteEditorProps) {
    const router = useRouter();
    const { openModal, closeModal } = useModal();

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
            const tasksMsg = result.tasksCreated
                ? ` Se crearon ${result.tasksCreated} tareas de construcción.`
                : "";
            toast.success(`¡Presupuesto aprobado!${tasksMsg}`, { id: toastId });
            router.refresh();
        }
    };

    return (
        <div className="space-y-6">
            {/* Back button */}
            <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/organization/quotes")}
                className="gap-2"
            >
                <ArrowLeft className="h-4 w-4" />
                Volver a Presupuestos
            </Button>

            {/* Quote Header */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold">{quote.name}</h1>
                                <Badge variant="outline" className={QUOTE_STATUS_COLORS[quote.status]}>
                                    {QUOTE_STATUS_LABELS[quote.status]}
                                </Badge>
                                <Badge variant="outline">
                                    {QUOTE_TYPE_LABELS[quote.quote_type]}
                                </Badge>
                                <Badge variant="outline">
                                    v{quote.version}
                                </Badge>
                            </div>

                            {quote.description && (
                                <p className="text-sm text-muted-foreground">{quote.description}</p>
                            )}

                            <div className="flex items-center gap-6 text-sm text-muted-foreground">
                                {quote.client_name && (
                                    <span className="flex items-center gap-1">
                                        <Building2 className="h-4 w-4" />
                                        {quote.client_name}
                                    </span>
                                )}
                                {quote.project_name && (
                                    <span className="flex items-center gap-1">
                                        <FileText className="h-4 w-4" />
                                        {quote.project_name}
                                    </span>
                                )}
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    Creado: {quote.created_at?.split('T')[0]}
                                </span>
                                {quote.valid_until && (
                                    <span className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        Válido hasta: {quote.valid_until?.split('T')[0]}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-2" />
                                Exportar
                            </Button>
                            {quote.status === 'draft' && (
                                <Button variant="outline" size="sm">
                                    <Send className="h-4 w-4 mr-2" />
                                    Enviar
                                </Button>
                            )}
                            {quote.status === 'sent' && (
                                <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={handleApproveQuote}
                                >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Aprobar
                                </Button>
                            )}
                            {/* Convert to Project - only for standalone quotes */}
                            {quote.quote_type === 'quote' && !quote.project_id && (
                                <Button
                                    size="sm"
                                    variant="default"
                                    onClick={handleConvertToProject}
                                >
                                    <FolderPlus className="h-4 w-4 mr-2" />
                                    Convertir en Proyecto
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Totals Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Subtotal</p>
                        <p className="text-xl font-semibold">
                            {quote.currency_symbol} {(quote.subtotal || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Con Markup</p>
                        <p className="text-xl font-semibold">
                            {quote.currency_symbol} {(quote.subtotal_with_markup || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">
                            Descuento ({quote.discount_pct}%)
                        </p>
                        <p className="text-xl font-semibold">
                            {quote.currency_symbol} {(quote.total_after_discount || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-primary/10 border-primary/30">
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">
                            Total ({quote.tax_label || 'IVA'} {quote.tax_pct}%)
                        </p>
                        <p className="text-2xl font-bold text-primary">
                            {quote.currency_symbol} {(quote.total_with_tax || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Items Section */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Ítems del Presupuesto
                        <Badge variant="outline">{items.length} ítems</Badge>
                    </CardTitle>
                    <Button size="sm" onClick={handleAddItem}>
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Ítem
                    </Button>
                </CardHeader>
                <CardContent>
                    <QuoteItemsTable
                        items={items}
                        quote={quote}
                        tasks={tasks}
                        divisions={divisions}
                        onRefresh={() => router.refresh()}
                        onEditItem={handleEditItem}
                    />
                </CardContent>
            </Card>
        </div>
    );
}

