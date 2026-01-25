"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface SubcontractDetailOverviewViewProps {
    subcontract: any;
    payments: any[];
}

export function SubcontractDetailOverviewView({ subcontract, payments }: SubcontractDetailOverviewViewProps) {
    const totalPaid = payments.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    // This is a naive total paid calculation mixing currencies if not careful. 
    // Ideally we should sum by currency or use functional amount.
    // For prototype, we display raw sum or placeholder.

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Monto Contrato</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {subcontract.currency?.currencies?.symbol} {Number(subcontract.amount_total || 0).toLocaleString('es-AR')}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Pagado</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {/* Assuming same currency for simplicity or taking main currency symbol */}
                            {subcontract.currency?.currencies?.symbol} {totalPaid.toLocaleString('es-AR')}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {payments.length} pagos registrados
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Estado</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold capitalize">
                            {subcontract.status || 'Borrador'}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Inicio: {subcontract.date ? format(new Date(subcontract.date), "dd MMM yyyy", { locale: es }) : '-'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Descripción</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {subcontract.notes || "Sin descripción detallada."}
                    </p>
                </CardContent>
            </Card>

            {/* Placeholder for charts/analytics */}
            <div className="min-h-[300px] border-2 border-dashed rounded-lg flex items-center justify-center">
                <EmptyState
                    icon={BarChart3}
                    title="Métricas en desarrollo"
                    description="Próximamente verás gráficos de avance financiero y de obra."
                    className="border-none"
                />
            </div>
        </div>
    );
}
