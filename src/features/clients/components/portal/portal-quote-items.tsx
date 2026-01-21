"use client";

import { useEffect, useState } from "react";
import { getQuoteItems } from "@/features/quotes/queries";
import { Loader2, HelpCircle } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface QuoteItem {
    id: string;
    task_name: string | null;
    custom_name: string | null;
    description: string | null;
    division_name: string | null;
    unit: string | null;
    quantity: number;
    unit_price: number;
    markup_pct: number | null;
    subtotal: number;
    subtotal_with_markup: number;
}

interface PortalQuoteItemsProps {
    quoteId: string;
    currencySymbol: string;
    showAmounts: boolean;
    taxPct?: number;
    taxLabel?: string | null;
    discountPct?: number;
}

export function PortalQuoteItems({ quoteId, currencySymbol, showAmounts, taxPct = 0, taxLabel, discountPct = 0 }: PortalQuoteItemsProps) {
    const [items, setItems] = useState<QuoteItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadItems() {
            try {
                setLoading(true);
                const data = await getQuoteItems(quoteId);
                setItems(data as QuoteItem[]);
            } catch (e) {
                setError("Error al cargar los ítems");
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        loadItems();
    }, [quoteId]);

    const formatAmount = (amount: number) => {
        if (!showAmounts) return "•••••";
        return `${currencySymbol} ${amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center text-red-400 py-4 text-sm">
                {error}
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="text-center text-zinc-500 py-4 text-sm">
                No hay ítems en este presupuesto
            </div>
        );
    }

    // Group items by division
    const groupedItems = items.reduce((acc, item) => {
        const division = item.division_name || "Sin División";
        if (!acc[division]) {
            acc[division] = [];
        }
        acc[division].push(item);
        return acc;
    }, {} as Record<string, QuoteItem[]>);

    return (
        <TooltipProvider delayDuration={0}>
            <div className="space-y-4">
                {Object.entries(groupedItems).map(([division, divisionItems]) => {
                    const divisionTotal = divisionItems.reduce((sum, item) => sum + item.subtotal_with_markup, 0);

                    return (
                        <div key={division} className="space-y-2">
                            {/* Division Header */}
                            <div className="flex items-center justify-between bg-zinc-800/80 rounded-lg px-3 py-2">
                                <span className="text-sm font-medium text-zinc-300">{division}</span>
                                <span className="text-sm font-mono text-zinc-400">{formatAmount(divisionTotal)}</span>
                            </div>

                            {/* Mobile Cards View */}
                            <div className="md:hidden space-y-2">
                                {divisionItems.map((item) => (
                                    <div key={item.id} className="bg-zinc-800/30 rounded-lg p-3 space-y-2">
                                        {/* Item name + description tooltip */}
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                                <span className="text-zinc-200 font-medium text-sm">
                                                    {item.custom_name || item.task_name || "Sin nombre"}
                                                </span>
                                                {item.description && (
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <HelpCircle className="h-3.5 w-3.5 text-zinc-500 hover:text-zinc-300 cursor-help shrink-0" />
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top" className="max-w-xs">
                                                            <p className="text-sm">{item.description}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                )}
                                            </div>
                                            <span className="font-mono font-medium text-primary shrink-0">
                                                {formatAmount(item.subtotal_with_markup)}
                                            </span>
                                        </div>
                                        {/* Quantity x Unit Price */}
                                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                                            <span>{item.quantity.toLocaleString('es-AR')} {item.unit || 'ud'}</span>
                                            <span>×</span>
                                            <span>{formatAmount(item.unit_price)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-zinc-500 text-xs border-b border-zinc-700/50">
                                            <th className="text-left py-2 px-2 font-medium">Concepto</th>
                                            <th className="text-right py-2 px-2 font-medium w-20">Cant.</th>
                                            <th className="text-left py-2 px-2 font-medium w-16">Ud.</th>
                                            <th className="text-right py-2 px-2 font-medium w-28">P. Unit.</th>
                                            <th className="text-right py-2 px-2 font-medium w-28">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {divisionItems.map((item) => (
                                            <tr key={item.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                                                <td className="py-2 px-2 text-zinc-300">
                                                    <div className="flex items-center gap-1.5">
                                                        {item.custom_name || item.task_name || "Sin nombre"}
                                                        {item.description && (
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <HelpCircle className="h-3.5 w-3.5 text-zinc-500 hover:text-zinc-300 cursor-help shrink-0" />
                                                                </TooltipTrigger>
                                                                <TooltipContent side="right" className="max-w-xs">
                                                                    <p className="text-sm">{item.description}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-2 px-2 text-right font-mono text-zinc-400">
                                                    {item.quantity.toLocaleString('es-AR')}
                                                </td>
                                                <td className="py-2 px-2 text-zinc-500">
                                                    {item.unit || "-"}
                                                </td>
                                                <td className="py-2 px-2 text-right font-mono text-zinc-400">
                                                    {formatAmount(item.unit_price)}
                                                </td>
                                                <td className="py-2 px-2 text-right font-mono text-zinc-300">
                                                    {formatAmount(item.subtotal_with_markup)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                })}

                {/* Totals Breakdown */}
                {(() => {
                    const subtotal = items.reduce((sum, item) => sum + item.subtotal_with_markup, 0);
                    const discountAmount = subtotal * (discountPct / 100);
                    const subtotalAfterDiscount = subtotal - discountAmount;
                    const taxAmount = subtotalAfterDiscount * (taxPct / 100);
                    const totalWithTax = subtotalAfterDiscount + taxAmount;

                    return (
                        <div className="space-y-2 mt-4">
                            {/* Subtotal */}
                            <div className="flex items-center justify-between px-4 py-2">
                                <span className="text-zinc-400">Subtotal</span>
                                <span className="font-mono text-zinc-300">
                                    {formatAmount(subtotal)}
                                </span>
                            </div>

                            {/* Discount */}
                            {discountPct > 0 && (
                                <div className="flex items-center justify-between px-4 py-2">
                                    <span className="text-zinc-400">Descuento ({discountPct}%)</span>
                                    <span className="font-mono text-green-400">
                                        - {formatAmount(discountAmount)}
                                    </span>
                                </div>
                            )}

                            {/* Tax */}
                            {taxPct > 0 && (
                                <div className="flex items-center justify-between px-4 py-2">
                                    <span className="text-zinc-400">{taxLabel || 'Impuestos'} ({taxPct}%)</span>
                                    <span className="font-mono text-zinc-300">
                                        {formatAmount(taxAmount)}
                                    </span>
                                </div>
                            )}

                            {/* Total with Tax */}
                            <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-lg px-4 py-3">
                                <span className="font-medium text-zinc-200">Total</span>
                                <span className="font-mono font-bold text-lg text-primary">
                                    {formatAmount(totalWithTax)}
                                </span>
                            </div>
                        </div>
                    );
                })()}
            </div>
        </TooltipProvider>
    );
}
