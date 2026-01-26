"use client";

import { QuoteView, QUOTE_STATUS_LABELS, QUOTE_STATUS_COLORS } from "../../types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FilePlus2, FileText, ArrowRight, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import { useModal } from "@/providers/modal-store";
import { QuoteForm } from "../forms/quote-form"; // We'll need to update QuoteForm to handle CO creation

interface ChangeOrdersListProps {
    contractId: string;
    changeOrders: QuoteView[];
    currencySymbol: string;
    onRefresh: () => void;
    organizationId: string;
    financialData: any; // Simplified for now
    contractName: string;
}

export function ChangeOrdersList({
    contractId,
    changeOrders,
    currencySymbol,
    onRefresh,
    organizationId,
    financialData,
    contractName
}: ChangeOrdersListProps) {
    const router = useRouter();
    const { openModal, closeModal } = useModal();

    const handleCreateChangeOrder = () => {
        // We open QuoteForm but pre-filled for Change Order
        openModal(
            <QuoteForm
                mode="create"
                organizationId={organizationId}
                financialData={financialData}
                clients={[]} // Not needed as we inherit
                projects={[]} // Not needed as we inherit
                onCancel={closeModal}
                parentQuoteId={contractId} // NEW PROP
                parentQuoteName={contractName} // NEW PROP
                onSuccess={(id) => {
                    closeModal();
                    router.push(`/organization/quotes/${id}`);
                }}
            />,
            {
                title: "Nuevo Adicional",
                description: `Crear orden de cambio para ${contractName}`,
                size: "lg"
            }
        );
    };

    return (
        <>
            {changeOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    <FilePlus2 className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p>No hay adicionales registrados para este contrato.</p>
                    <Button variant="link" onClick={handleCreateChangeOrder}>
                        Crear el primer adicional
                    </Button>
                </div>
            ) : (
                <div className="space-y-4">
                    {changeOrders.map((co) => (
                        <Card
                            key={co.id}
                            className="hover:bg-muted/30 transition-colors cursor-pointer"
                            onClick={() => router.push(`/organization/quotes/${co.id}`)}
                        >
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-xs">
                                        CO #{co.change_order_number}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-medium">{co.name}</h4>
                                            <Badge variant="outline" className={QUOTE_STATUS_COLORS[co.status]}>
                                                {QUOTE_STATUS_LABELS[co.status]}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {co.created_at?.split('T')[0]}
                                            </span>
                                            <span>
                                                {co.item_count} ítems
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="font-semibold text-lg">
                                            {currencySymbol} {co.total_with_tax.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                        </p>
                                        <p className="text-xs text-muted-foreground">Total</p>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </>
    );
}
