"use client";

import { GeneralCost, GeneralCostCategory } from "@/types/general-costs";
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

interface ConceptsTableProps {
    data: GeneralCost[];
    categories: GeneralCostCategory[];
}

export function ConceptsTable({ data }: ConceptsTableProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Conceptos de Gasto</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Categoría</TableHead>
                            <TableHead>Recurrencia</TableHead>
                            <TableHead>Descripción</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    No hay conceptos registrados.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((cost) => (
                                <TableRow key={cost.id}>
                                    <TableCell className="font-medium">{cost.name}</TableCell>
                                    <TableCell>
                                        {cost.category ? (
                                            <Badge variant="outline">{cost.category.name}</Badge>
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {cost.is_recurring ? (
                                            <Badge variant="secondary">Recurrente: {cost.recurrence_interval}</Badge>
                                        ) : (
                                            <span className="text-muted-foreground">Único</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground truncate max-w-[200px]">
                                        {cost.description || "-"}
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
