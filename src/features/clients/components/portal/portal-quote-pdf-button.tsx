"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getQuoteItems } from "@/features/quotes/queries";
import { cn } from "@/lib/utils";

interface QuoteData {
    id: string;
    name: string;
    description?: string | null;
    status: string;
    created_at: string;
    total_with_tax: number;
    tax_pct?: number;
    tax_label?: string | null;
    discount_pct?: number;
    currency_symbol?: string;
    approved_by?: string | null;
    approved_at?: string | null;
}

interface PortalQuotePdfButtonProps {
    quote: QuoteData;
    organizationName?: string;
    organizationLogoUrl?: string | null;
    clientName?: string;
    className?: string;
}

export function PortalQuotePdfButton({
    quote,
    organizationName,
    organizationLogoUrl,
    clientName,
    className,
}: PortalQuotePdfButtonProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    const [items, setItems] = useState<any[]>([]);
    const [ready, setReady] = useState(false);

    const currencySymbol = quote.currency_symbol || "$";

    const formatAmount = (amount: number) => {
        return `${currencySymbol} ${amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    const generatePdf = async () => {
        setIsGenerating(true);
        try {
            // 1. Fetch items
            const fetchedItems = await getQuoteItems(quote.id);
            setItems(fetchedItems);
            setReady(true);

            // Wait for DOM to update
            await new Promise(resolve => setTimeout(resolve, 100));

            if (!contentRef.current) {
                throw new Error("Content not ready");
            }

            // 2. Generate PDF
            const html2canvas = (await import("html2canvas")).default;
            const { jsPDF } = await import("jspdf");

            const canvas = await html2canvas(contentRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: "#ffffff",
            });

            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4",
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = pdfWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;

            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
                heightLeft -= pdfHeight;
            }

            const fileName = `Presupuesto_${quote.name.replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`;
            pdf.save(fileName);

            toast.success("PDF descargado correctamente");
        } catch (error) {
            console.error("Error generating PDF:", error);
            toast.error("Error al generar el PDF");
        } finally {
            setIsGenerating(false);
            setReady(false);
        }
    };

    // Calculate totals from items
    const subtotal = items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    const discountPct = quote.discount_pct || 0;
    const taxPct = quote.tax_pct || 0;
    const discountAmount = subtotal * (discountPct / 100);
    const subtotalAfterDiscount = subtotal - discountAmount;
    const taxAmount = subtotalAfterDiscount * (taxPct / 100);
    const total = subtotalAfterDiscount + taxAmount;

    // Group items by division
    const itemsByDivision = items.reduce((acc, item) => {
        const division = item.division_name || "General";
        if (!acc[division]) acc[division] = [];
        acc[division].push(item);
        return acc;
    }, {} as Record<string, any[]>);

    return (
        <>
            <Button
                variant="ghost"
                size="sm"
                className={cn("gap-2 text-zinc-400 hover:text-white", className)}
                onClick={(e) => {
                    e.stopPropagation();
                    generatePdf();
                }}
                disabled={isGenerating}
            >
                {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Download className="h-4 w-4" />
                )}
                PDF
            </Button>

            {/* Hidden PDF Content */}
            {ready && (
                <div
                    ref={contentRef}
                    className="fixed left-[-9999px] top-0 bg-white text-black"
                    style={{ width: "210mm", padding: "15mm", fontFamily: "Inter, Arial, sans-serif" }}
                >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-8 pb-6" style={{ borderBottom: "2px solid #10b981" }}>
                        <div className="space-y-2">
                            {organizationLogoUrl && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={organizationLogoUrl}
                                    alt="Logo"
                                    className="h-16 object-contain"
                                    crossOrigin="anonymous"
                                />
                            )}
                            <div>
                                <h2 className="text-xl font-bold" style={{ color: "#111827" }}>
                                    {organizationName || "Mi Empresa"}
                                </h2>
                            </div>
                        </div>
                        <div className="text-right">
                            <h1 className="text-2xl font-bold uppercase tracking-wider" style={{ color: "#10b981" }}>
                                PRESUPUESTO
                            </h1>
                            <p className="text-sm mt-2" style={{ color: "#6b7280" }}>
                                #{quote.id.slice(0, 8).toUpperCase()}
                            </p>
                            <p className="text-sm" style={{ color: "#6b7280" }}>
                                Fecha: {formatDate(quote.created_at)}
                            </p>
                            {quote.status === "approved" && quote.approved_at && (
                                <p className="text-sm font-medium mt-1" style={{ color: "#059669" }}>
                                    ✓ Aprobado: {formatDate(quote.approved_at)}
                                </p>
                            )}
                            {quote.status === "rejected" && (
                                <p className="text-sm font-medium mt-1" style={{ color: "#dc2626" }}>
                                    ✗ Rechazado
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Client Info */}
                    {clientName && (
                        <div className="mb-6 p-4 rounded" style={{ backgroundColor: "#f9fafb" }}>
                            <p className="text-sm uppercase tracking-wide mb-1" style={{ color: "#6b7280" }}>Cliente</p>
                            <p className="font-semibold" style={{ color: "#111827" }}>{clientName}</p>
                        </div>
                    )}

                    {/* Quote Title & Description */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold" style={{ color: "#111827" }}>{quote.name}</h3>
                        {quote.description && (
                            <p className="mt-1" style={{ color: "#4b5563" }}>{quote.description}</p>
                        )}
                    </div>

                    {/* Items Table */}
                    <div className="mb-6">
                        <table className="w-full" style={{ borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ backgroundColor: "#f3f4f6" }}>
                                    <th className="text-left p-2 text-sm font-semibold" style={{ borderBottom: "1px solid #e5e7eb" }}>Descripción</th>
                                    <th className="text-center p-2 text-sm font-semibold" style={{ borderBottom: "1px solid #e5e7eb", width: "60px" }}>Cant.</th>
                                    <th className="text-center p-2 text-sm font-semibold" style={{ borderBottom: "1px solid #e5e7eb", width: "60px" }}>Ud.</th>
                                    <th className="text-right p-2 text-sm font-semibold" style={{ borderBottom: "1px solid #e5e7eb", width: "100px" }}>P. Unit.</th>
                                    <th className="text-right p-2 text-sm font-semibold" style={{ borderBottom: "1px solid #e5e7eb", width: "100px" }}>Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(itemsByDivision).map(([division, divisionItems]) => (
                                    <>
                                        <tr key={`div-${division}`} style={{ backgroundColor: "#f9fafb" }}>
                                            <td colSpan={5} className="p-2 font-semibold text-sm" style={{ borderLeft: "4px solid #10b981" }}>
                                                {division}
                                            </td>
                                        </tr>
                                        {(divisionItems as any[]).map((item: any) => (
                                            <tr key={item.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                                                <td className="p-2 text-sm">{item.task_name || item.custom_name || "Item"}</td>
                                                <td className="p-2 text-sm text-center">{item.quantity}</td>
                                                <td className="p-2 text-sm text-center">{item.unit || "-"}</td>
                                                <td className="p-2 text-sm text-right">{formatAmount(item.unit_price)}</td>
                                                <td className="p-2 text-sm text-right font-medium">{formatAmount(item.subtotal)}</td>
                                            </tr>
                                        ))}
                                    </>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals */}
                    <div className="flex justify-end mb-8">
                        <div style={{ width: "250px" }} className="space-y-1">
                            <div className="flex justify-between text-sm">
                                <span style={{ color: "#6b7280" }}>Subtotal</span>
                                <span>{formatAmount(subtotal)}</span>
                            </div>
                            {discountPct > 0 && (
                                <div className="flex justify-between text-sm" style={{ color: "#059669" }}>
                                    <span>Descuento ({discountPct}%)</span>
                                    <span>-{formatAmount(discountAmount)}</span>
                                </div>
                            )}
                            {taxPct > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span style={{ color: "#6b7280" }}>{quote.tax_label || "IVA"} ({taxPct}%)</span>
                                    <span>{formatAmount(taxAmount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-bold text-lg pt-2" style={{ borderTop: "1px solid #d1d5db" }}>
                                <span>Total</span>
                                <span style={{ color: "#10b981" }}>{formatAmount(total)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Approved By */}
                    {quote.status === "approved" && quote.approved_by && (
                        <div className="mt-8 pt-6" style={{ borderTop: "1px solid #e5e7eb" }}>
                            <p className="text-sm mb-2" style={{ color: "#6b7280" }}>Aprobado por:</p>
                            <p className="font-semibold" style={{ color: "#111827" }}>{quote.approved_by}</p>
                            {quote.approved_at && (
                                <p className="text-sm" style={{ color: "#6b7280" }}>
                                    {formatDate(quote.approved_at)}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Footer */}
                    <div className="mt-12 pt-4 text-center text-xs" style={{ borderTop: "1px solid #e5e7eb", color: "#9ca3af" }}>
                        <p>Documento generado por Seencel • {new Date().toLocaleDateString('es-AR')}</p>
                    </div>
                </div>
            )}
        </>
    );
}

