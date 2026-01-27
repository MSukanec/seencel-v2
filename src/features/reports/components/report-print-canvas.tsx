"use client";

import { forwardRef, ReactNode } from "react";
import type { PdfGlobalTheme } from "@/features/organization/actions/pdf-settings";
import type { CompanyInfo } from "../views/reports-builder-view";

interface ReportPrintCanvasProps {
    theme?: PdfGlobalTheme;
    logoUrl?: string | null;
    companyInfo?: CompanyInfo;
    children: ReactNode;
}

/**
 * Print-friendly canvas wrapper for reports.
 * Replicates the exact layout from the PDF Template Preview in Identity page.
 * Uses ONLY inline styles with theme values - NO CSS variables from app theme.
 */
export const ReportPrintCanvas = forwardRef<HTMLDivElement, ReportPrintCanvasProps>(
    function ReportPrintCanvas({ theme, logoUrl, companyInfo, children }, ref) {
        // Convert mm to px (same ratio used in PDF templates)
        const mmToPx = 3.78;

        // Theme values with defaults
        const pageSize = theme?.pageSize || 'A4';
        const orientation = theme?.orientation || 'portrait';
        const marginTop = theme?.marginTop || 20;
        const marginBottom = theme?.marginBottom || 20;
        const marginLeft = theme?.marginLeft || 20;
        const marginRight = theme?.marginRight || 20;
        const fontFamily = theme?.fontFamily || "Inter, sans-serif";
        const primaryColor = theme?.primaryColor || "#000000";
        const secondaryColor = theme?.secondaryColor || "#e5e5e5";
        const textColor = theme?.textColor || "#1f2937";
        const titleSize = theme?.titleSize || 18;
        const bodySize = theme?.bodySize || 12;
        const companyNameSize = theme?.companyNameSize || 24;
        const companyNameColor = theme?.companyNameColor || "#1f2937";
        const companyInfoSize = theme?.companyInfoSize || 10;
        const logoWidth = theme?.logoWidth || 80;
        const logoHeight = theme?.logoHeight || 60;
        const showFooter = theme?.showFooter ?? true;
        const footerText = theme?.footerText || "";
        const showPageNumbers = theme?.showPageNumbers ?? true;
        const showCompanyName = theme?.showCompanyName ?? true;
        const showCompanyAddress = theme?.showCompanyAddress ?? true;

        // Paper dimensions (same as PDF preview)
        let width = pageSize === 'A4' ? 210 * mmToPx : 216 * mmToPx;
        let height = pageSize === 'A4' ? 297 * mmToPx : 279 * mmToPx;

        // Handle orientation
        if (orientation === 'landscape') {
            const temp = width;
            width = height;
            height = temp;
        }

        // Build address display
        const displayAddr = companyInfo
            ? [companyInfo.address, companyInfo.city, companyInfo.state, companyInfo.country].filter(Boolean).join(", ")
            : "";
        const displayContact = [companyInfo?.phone, companyInfo?.email].filter(Boolean).join(" • ");

        return (
            <div
                ref={ref}
                style={{
                    backgroundColor: "#ffffff",
                    color: textColor,
                    fontFamily,
                    width,
                    minHeight: height,
                    paddingTop: marginTop * mmToPx,
                    paddingBottom: marginBottom * mmToPx,
                    paddingLeft: marginLeft * mmToPx,
                    paddingRight: marginRight * mmToPx,
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                }}
            >
                {/* Header - Exact same layout as PdfPreview */}
                <header
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 48,
                        paddingBottom: 24,
                        borderBottom: `2px solid ${primaryColor}`,
                    }}
                >
                    {/* Left: Logo + Company Info */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={logoUrl}
                                alt="Logo"
                                style={{
                                    objectFit: "contain",
                                    width: `${logoWidth}px`,
                                    height: `${logoHeight}px`,
                                }}
                            />
                        ) : (
                            <div
                                style={{
                                    backgroundColor: "#f3f4f6",
                                    borderRadius: 4,
                                    width: `${logoWidth}px`,
                                    height: `${logoHeight}px`,
                                }}
                            />
                        )}
                        <div>
                            {showCompanyName && (
                                <div
                                    style={{
                                        fontWeight: 700,
                                        fontSize: `${companyNameSize}pt`,
                                        color: companyNameColor,
                                        lineHeight: 1.1,
                                    }}
                                >
                                    {companyInfo?.companyName || "Mi Empresa"}
                                </div>
                            )}
                            {showCompanyAddress && displayAddr && (
                                <p style={{ fontSize: 9, color: "#9ca3af", marginTop: 4, lineHeight: 1.3 }}>
                                    {displayAddr}
                                </p>
                            )}
                            {showCompanyAddress && displayContact && (
                                <p style={{ fontSize: 9, color: "#9ca3af", marginTop: 2 }}>
                                    {displayContact}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Right: Title */}
                    <div style={{ textAlign: "right" }}>
                        <h1
                            style={{
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: "0.1em",
                                color: primaryColor,
                                fontSize: `${titleSize}pt`,
                                margin: 0,
                            }}
                        >
                            REPORTE
                        </h1>
                        <p style={{ fontSize: 10, color: "#9ca3af", marginTop: 8, fontFamily: "monospace" }}>
                            {new Date().toLocaleDateString("es-ES", { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                </header>

                {/* Body - Report Content */}
                <main
                    style={{
                        flex: 1,
                        fontSize: bodySize,
                        lineHeight: 1.6,
                        display: "flex",
                        flexDirection: "column",
                        gap: 24,
                    }}
                >
                    {children}
                </main>

                {/* Footer - Exact same layout as PdfPreview */}
                {showFooter && (
                    <footer
                        style={{
                            marginTop: "auto",
                            paddingTop: 16,
                            borderTop: `1px solid ${secondaryColor}`,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-end",
                            fontSize: companyInfoSize,
                            color: "#9ca3af",
                        }}
                    >
                        <div style={{ maxWidth: "70%" }}>
                            <p style={{ fontWeight: 600, color: "#6b7280", margin: 0 }}>{footerText}</p>
                        </div>
                        {showPageNumbers && (
                            <div
                                style={{
                                    backgroundColor: "#f3f4f6",
                                    padding: "4px 8px",
                                    borderRadius: 4,
                                    fontFamily: "monospace",
                                    fontSize: 7,
                                }}
                            >
                                Página 1 de 1
                            </div>
                        )}
                    </footer>
                )}
            </div>
        );
    }
);
