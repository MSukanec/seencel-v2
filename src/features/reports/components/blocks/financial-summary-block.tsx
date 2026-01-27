"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, DollarSign, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BlockConfig } from "../../views/reports-builder-view";

interface FinancialSummaryBlockProps {
    config: BlockConfig;
    organizationId: string;
    projectId?: string | null;
}

// Mock financial data
const MOCK_FINANCE = {
    income: 5_450_000,
    expenses: 3_890_000,
    balance: 1_560_000,
    incomeChange: 12.5,
    expenseChange: 8.3,
};

export function FinancialSummaryBlock({ config, organizationId }: FinancialSummaryBlockProps) {
    const { title, projectIds } = config;

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("es-AR", {
            style: "currency",
            currency: "ARS",
            maximumFractionDigits: 0,
        }).format(value);
    };

    return (
        <div className="space-y-3">
            {title && (
                <h4 className="font-semibold text-sm">{title}</h4>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Income */}
                <Card className="bg-green-500/5 border-green-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="h-9 w-9 rounded-full bg-green-500/10 flex items-center justify-center">
                                <ArrowUpRight className="h-5 w-5 text-green-600" />
                            </div>
                            <span className="text-xs font-medium text-green-600 flex items-center gap-0.5">
                                <TrendingUp className="h-3 w-3" />
                                +{MOCK_FINANCE.incomeChange}%
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                            Ingresos
                        </p>
                        <p className="text-xl font-bold font-mono text-green-600">
                            {formatCurrency(MOCK_FINANCE.income)}
                        </p>
                    </CardContent>
                </Card>

                {/* Expenses */}
                <Card className="bg-red-500/5 border-red-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="h-9 w-9 rounded-full bg-red-500/10 flex items-center justify-center">
                                <ArrowDownRight className="h-5 w-5 text-red-600" />
                            </div>
                            <span className="text-xs font-medium text-red-600 flex items-center gap-0.5">
                                <TrendingUp className="h-3 w-3" />
                                +{MOCK_FINANCE.expenseChange}%
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                            Egresos
                        </p>
                        <p className="text-xl font-bold font-mono text-red-600">
                            {formatCurrency(MOCK_FINANCE.expenses)}
                        </p>
                    </CardContent>
                </Card>

                {/* Balance */}
                <Card className="bg-blue-500/5 border-blue-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="h-9 w-9 rounded-full bg-blue-500/10 flex items-center justify-center">
                                <Wallet className="h-5 w-5 text-blue-600" />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                            Balance
                        </p>
                        <p className={cn(
                            "text-xl font-bold font-mono",
                            MOCK_FINANCE.balance >= 0 ? "text-blue-600" : "text-red-600"
                        )}>
                            {formatCurrency(MOCK_FINANCE.balance)}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <p className="text-xs text-muted-foreground text-center">
                {projectIds && projectIds.length > 0
                    ? `Consolidado de ${projectIds.length} proyecto(s)`
                    : "Consolidado de toda la organización"
                }
            </p>
        </div>
    );
}
