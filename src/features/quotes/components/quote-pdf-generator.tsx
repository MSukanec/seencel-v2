"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface QuoteItem {
    id: string;
    task_name: string;
    description?: string | null;
    quantity: number;
    unit?: string | null;
    unit_price: number;
    markup_pct: number;
    tax_pct: number;
    subtotal: number;
    division_name?: string | null;
}

interface QuoteData {
    id: string;
    name: string;
    description?: string | null;
    status: string;
    created_at: string;
    total_with_tax: number;
    tax_pct: number;
    tax_label?: string | null;
    discount_pct: number;
    items: QuoteItem[];
    // From organization
    organization_name?: string;
    organization_logo_url?: string | null;
    organization_address?: string;
    organization_phone?: string;
    organization_email?: string;
    // From client
    client_name?: string;
    client_address?: string;
    // Currency
    currency_symbol: string;
    // Signature (if approved)
    signature_image?: string | null;
    signer_name?: string | null;
    approved_at?: string | null;
}

interface QuotePdfGeneratorProps {
    quote: QuoteData;
    className?: string;
}

export function QuotePdfGenerator({ quote, className }: QuotePdfGeneratorProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    const formatAmount = (amount: number) => {
        return `${quote.currency_symbol} ${amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    // Calculate totals
    const subtotal = quote.items.reduce((sum, item) => sum + item.subtotal, 0);
    const discountAmount = subtotal * (quote.discount_pct / 100);
    const subtotalAfterDiscount = subtotal - discountAmount;
    const taxAmount = subtotalAfterDiscount * (quote.tax_pct / 100);
    const total = subtotalAfterDiscount + taxAmount;

    // Group items by division
    const itemsByDivision = quote.items.reduce((acc, item) => {
        const division = item.division_name || "General";
        if (!acc[division]) acc[division] = [];
        acc[division].push(item);
        return acc;
    }, {} as Record<string, QuoteItem[]>);

    const generatePdf = async () => {
        if (!contentRef.current) return;

        setIsGenerating(true);
        try {
            // Dynamic imports for code splitting
            const html2canvas = (await import("html2canvas")).default;
            const { jsPDF } = await import("jspdf");

            // Render the hidden content to canvas
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

            // First page
            pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;

            // Add more pages if needed
            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
                heightLeft -= pdfHeight;
            }

            // Download
            const fileName = `Presupuesto_${quote.name.replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`;
            pdf.save(fileName);

            toast.success("PDF descargado correctamente");
        } catch (error) {
            console.error("Error generating PDF:", error);
            toast.error("Error al generar el PDF");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <>
            {/* Download Button */}
            <Button
                variant="outline"
                size="sm"
                className={cn("gap-2", className)}
                onClick={generatePdf}
                disabled={isGenerating}
            >
                {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Download className="h-4 w-4" />
                )}
                Descargar PDF
            </Button>

            {/* Hidden PDF Content - Rendered for html2canvas */}
            <div
                ref={contentRef}
                className="fixed left-[-9999px] top-0 bg-white text-black"
                style={{ width: "210mm", padding: "15mm", fontFamily: "Inter, sans-serif" }}
            >
                {/* Header */}
                <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-primary">
                    <div className="space-y-2">
                        {quote.organization_logo_url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={quote.organization_logo_url}
                                alt="Logo"
                                className="h-16 object-contain"
                            />
                        )}
                        <div>
                            <h2 className="text-xl font-bold">{quote.organization_name || "Mi Empresa"}</h2>
                            {quote.organization_address && (
                                <p className="text-sm text-gray-600">{quote.organization_address}</p>
                            )}
                            {(quote.organization_phone || quote.organization_email) && (
                                <p className="text-sm text-gray-600">
                                    {[quote.organization_phone, quote.organization_email].filter(Boolean).join(" • ")}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="text-right">
                        <h1 className="text-2xl font-bold text-primary uppercase tracking-wider">PRESUPUESTO</h1>
                        <p className="text-sm text-gray-500 mt-2">#{quote.id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-sm text-gray-500">Fecha: {formatDate(quote.created_at)}</p>
                        {quote.status === "approved" && quote.approved_at && (
                            <p className="text-sm text-green-600 font-medium mt-1">
                                Aprobado: {formatDate(quote.approved_at)}
                            </p>
                        )}
                    </div>
                </div>

                {/* Client Info */}
                {quote.client_name && (
                    <div className="mb-6 p-4 bg-gray-50 rounded">
                        <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Cliente</p>
                        <p className="font-semibold">{quote.client_name}</p>
                        {quote.client_address && (
                            <p className="text-sm text-gray-600">{quote.client_address}</p>
                        )}
                    </div>
                )}

                {/* Quote Title & Description */}
                <div className="mb-6">
                    <h3 className="text-lg font-semibold">{quote.name}</h3>
                    {quote.description && (
                        <p className="text-gray-600 mt-1">{quote.description}</p>
                    )}
                </div>

                {/* Items Table */}
                <div className="mb-6">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="text-left p-2 text-sm font-semibold border-b">Descripción</th>
                                <th className="text-center p-2 text-sm font-semibold border-b w-16">Cant.</th>
                                <th className="text-center p-2 text-sm font-semibold border-b w-16">Ud.</th>
                                <th className="text-right p-2 text-sm font-semibold border-b w-24">P. Unit.</th>
                                <th className="text-right p-2 text-sm font-semibold border-b w-24">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(itemsByDivision).map(([division, items]) => (
                                <>
                                    {/* Division Header */}
                                    <tr key={division} className="bg-gray-50">
                                        <td colSpan={5} className="p-2 font-semibold text-sm border-l-4 border-primary">
                                            {division}
                                        </td>
                                    </tr>
                                    {/* Items */}
                                    {items.map((item) => (
                                        <tr key={item.id} className="border-b border-gray-100">
                                            <td className="p-2 text-sm">{item.task_name}</td>
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
                    <div className="w-64 space-y-1">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Subtotal</span>
                            <span>{formatAmount(subtotal)}</span>
                        </div>
                        {quote.discount_pct > 0 && (
                            <div className="flex justify-between text-sm text-green-600">
                                <span>Descuento ({quote.discount_pct}%)</span>
                                <span>-{formatAmount(discountAmount)}</span>
                            </div>
                        )}
                        {quote.tax_pct > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">{quote.tax_label || "IVA"} ({quote.tax_pct}%)</span>
                                <span>{formatAmount(taxAmount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-300">
                            <span>Total</span>
                            <span className="text-primary">{formatAmount(total)}</span>
                        </div>
                    </div>
                </div>

                {/* Signature (if approved) */}
                {quote.status === "approved" && quote.signature_image && (
                    <div className="mt-8 pt-6 border-t">
                        <p className="text-sm text-gray-500 mb-2">Firma de Aprobación:</p>
                        <div className="flex items-end gap-8">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={quote.signature_image}
                                alt="Firma"
                                className="h-20 border-b border-gray-400"
                            />
                            <div>
                                <p className="font-semibold">{quote.signer_name}</p>
                                <p className="text-sm text-gray-500">
                                    {quote.approved_at && formatDate(quote.approved_at)}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="mt-12 pt-4 border-t border-gray-200 text-center text-xs text-gray-400">
                    <p>Documento generado por Seencel • {new Date().toLocaleDateString('es-AR')}</p>
                </div>
            </div>
        </>
    );
}
