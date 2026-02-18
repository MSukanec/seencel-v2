"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Building2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface CommitmentCardData {
    id: string;
    client_id: string;
    clientName: string;
    clientAvatar?: string | null;
    clientRole?: string;
    unitName?: string | null;
    concept?: string | null;
    totalAmount: number;
    paidAmount: number;
    balance: number;
    currencySymbol: string;
    currencyCode: string;
}

interface CommitmentCardProps {
    data: CommitmentCardData;
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
}

type CommitmentStatus = "paid" | "in_progress" | "no_payments";

function getCommitmentStatus(paid: number, total: number): CommitmentStatus {
    if (paid >= total) return "paid";
    if (paid > 0) return "in_progress";
    return "no_payments";
}

function getStatusConfig(status: CommitmentStatus) {
    switch (status) {
        case "paid":
            return {
                label: "Pagado",
                badgeClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                progressClass: "bg-emerald-500",
            };
        case "in_progress":
            return {
                label: "En proceso",
                badgeClass: "bg-amber-500/10 text-amber-600 border-amber-500/20",
                progressClass: "bg-amber-500",
            };
        case "no_payments":
            return {
                label: "Sin pagos",
                badgeClass: "bg-destructive/10 text-destructive border-destructive/20",
                progressClass: "bg-destructive",
            };
    }
}

export function CommitmentCard({ data, onEdit, onDelete }: CommitmentCardProps) {
    const {
        id,
        clientName,
        clientAvatar,
        clientRole,
        unitName,
        concept,
        totalAmount,
        paidAmount,
        balance,
        currencySymbol,
        currencyCode,
    } = data;

    const status = getCommitmentStatus(paidAmount, totalAmount);
    const statusConfig = getStatusConfig(status);
    const progressPercent = totalAmount > 0 ? Math.min((paidAmount / totalAmount) * 100, 100) : 0;

    return (
        <Card className="group hover:shadow-md transition-shadow">
            <CardContent className="p-4">
                {/* Header: Unit + Actions */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                        {unitName ? (
                            <div className="flex items-center gap-1.5 text-sm font-medium">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <span>{unitName}</span>
                            </div>
                        ) : (
                            <span className="text-xs text-muted-foreground italic">Sin unidad</span>
                        )}
                        {concept && (
                            <Badge variant="outline" className="text-xs font-normal">
                                {concept}
                            </Badge>
                        )}
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit?.(id)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => onDelete?.(id)}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Client Info */}
                <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={clientAvatar || undefined} />
                        <AvatarFallback className="text-sm">
                            {clientName?.[0] || "?"}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{clientName}</p>
                        {clientRole && (
                            <p className="text-xs text-muted-foreground">{clientRole}</p>
                        )}
                    </div>
                    <Badge className={cn("text-xs", statusConfig.badgeClass)}>
                        {statusConfig.label}
                    </Badge>
                </div>

                {/* Amount */}
                <div className="mb-3">
                    <div className="flex items-baseline justify-between mb-1">
                        <span className="text-2xl font-bold tracking-tight">
                            {currencySymbol} {totalAmount.toLocaleString("es-AR")}
                        </span>
                        <span className="text-sm text-muted-foreground">
                            comprometido
                        </span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                            className={cn("h-full transition-all", statusConfig.progressClass)}
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">
                            {progressPercent.toFixed(0)}% pagado
                        </span>
                        <span className={cn(
                            "font-medium",
                            balance > 0 ? "text-amount-negative" : "text-amount-positive"
                        )}>
                            Saldo: {currencySymbol} {Math.abs(balance).toLocaleString("es-AR")}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

