"use client";

import { GeneralCostPaymentView } from "@/types/general-costs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface PaymentsTableProps {
    data: GeneralCostPaymentView[];
}

export function PaymentsTable({ data }: PaymentsTableProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD' }).format(amount);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('es-ES');
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Historial de Pagos</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Concepto</TableHead>
                            <TableHead>Categoría</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Monto</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No hay pagos registrados.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((payment) => (
                                <TableRow key={payment.id}>
                                    <TableCell>{formatDate(payment.payment_date)}</TableCell>
                                    <TableCell className="font-medium">
                                        {payment.general_cost_name || "Gasto sin concepto"}
                                    </TableCell>
                                    <TableCell>
                                        {payment.category_name && (
                                            <Badge variant="outline" className="text-xs">
                                                {payment.category_name}
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={payment.status === 'confirmed' ? 'default' : 'secondary'}>
                                            {payment.status === 'confirmed' ? 'Confirmado' : payment.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-mono">
                                        {formatCurrency(payment.amount)}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
