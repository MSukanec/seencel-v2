"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X, FileChartColumn } from "lucide-react";
import { BlockRenderer } from "./block-renderer";
import { ReportPrintCanvas } from "./report-print-canvas";
import type { ReportBlock, CompanyInfo } from "../views/reports-builder-view";
import type { PdfGlobalTheme } from "@/features/organization/actions/pdf-settings";


interface ReportCanvasProps {
    blocks: ReportBlock[];
    selectedBlockId: string | null;
    onSelectBlock: (id: string | null) => void;
    onRemoveBlock: (id: string) => void;
    isPreviewMode: boolean;
    organizationId: string;
    projects: { id: string; name: string; status: string }[];
    // Theme props
    pdfTheme?: PdfGlobalTheme;
    logoUrl?: string | null;
    companyInfo?: CompanyInfo;
    // Global project filter
    selectedProjectId?: string | null;
}

export function ReportCanvas({
    blocks,
    selectedBlockId,
    onSelectBlock,
    onRemoveBlock,
    isPreviewMode,
    organizationId,
    projects,
    pdfTheme,
    logoUrl,
    companyInfo,
    selectedProjectId,
}: ReportCanvasProps) {
    // ALWAYS show print canvas for realistic preview (WYSIWYG)
    // Even when empty, show header/footer for context
    return (
        <div className="min-h-full p-6" style={{ backgroundColor: "#3f3f46" }}>
            <div className="mx-auto shadow-2xl overflow-hidden" style={{ maxWidth: 900 }}>
                <ReportPrintCanvas
                    theme={pdfTheme}
                    logoUrl={logoUrl}
                    companyInfo={companyInfo}
                >
                    {blocks.length === 0 ? (
                        // Empty state inside the canvas
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "80px 40px",
                                textAlign: "center",
                            }}
                        >
                            <FileChartColumn style={{ width: 48, height: 48, color: "#d1d5db", marginBottom: 16 }} />
                            <p style={{ fontSize: 16, fontWeight: 500, color: "#6b7280", margin: 0 }}>
                                Informe vacío
                            </p>
                            <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 8, maxWidth: 280 }}>
                                Agregá bloques desde el panel derecho para construir tu informe
                            </p>
                        </div>
                    ) : isPreviewMode ? (
                        // Preview mode: just render blocks
                        blocks.map((block) => (
                            <BlockRenderer
                                key={block.id}
                                block={block}
                                organizationId={organizationId}
                                projects={projects}
                                pdfTheme={pdfTheme}
                                selectedProjectId={selectedProjectId}
                            />
                        ))
                    ) : (
                        // Edit mode: sortable blocks with drag handles
                        blocks.map((block) => (
                            <SortableBlock
                                key={block.id}
                                block={block}
                                isSelected={selectedBlockId === block.id}
                                onSelect={() => onSelectBlock(block.id)}
                                onRemove={() => onRemoveBlock(block.id)}
                                isPreviewMode={isPreviewMode}
                                organizationId={organizationId}
                                projects={projects}
                                pdfTheme={pdfTheme}
                                selectedProjectId={selectedProjectId}
                            />
                        ))
                    )}
                </ReportPrintCanvas>
            </div>
        </div>
    );
}

interface SortableBlockProps {
    block: ReportBlock;
    isSelected: boolean;
    onSelect: () => void;
    onRemove: () => void;
    isPreviewMode: boolean;
    organizationId: string;
    projects: { id: string; name: string; status: string }[];
    pdfTheme?: PdfGlobalTheme;
    selectedProjectId?: string | null;
}

function SortableBlock({
    block,
    isSelected,
    onSelect,
    onRemove,
    isPreviewMode,
    organizationId,
    projects,
    pdfTheme,
    selectedProjectId,
}: SortableBlockProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: block.id });

    const primaryColor = pdfTheme?.primaryColor || "#3b82f6";

    // Use inline styles for print-compatible appearance
    const containerStyle: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        position: "relative",
        borderRadius: 8,
        // Dotted border for edit mode - solid when selected
        border: isSelected
            ? `2px solid ${primaryColor}`
            : `2px dashed ${primaryColor}40`, // 40 = ~25% opacity in hex
        backgroundColor: "#ffffff",
        opacity: isDragging ? 0.5 : 1,
        boxShadow: isDragging ? "0 10px 25px rgba(0,0,0,0.15)" : undefined,
    };

    return (
        <div
            ref={setNodeRef}
            style={containerStyle}
            onClick={onSelect}
            className="group"
        >
            {/* Drag Handle - primary color, hidden on print */}
            <div
                {...attributes}
                {...listeners}
                style={{
                    position: "absolute",
                    left: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 20,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "grab",
                    backgroundColor: primaryColor,
                    borderRadius: 4,
                    zIndex: 10,
                }}
                className="print:hidden"
            >
                <GripVertical style={{ width: 14, height: 14, color: "#ffffff" }} />
            </div>

            {/* Remove Button - primary color, hidden on print */}
            <button
                style={{
                    position: "absolute",
                    right: 8,
                    top: 8,
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    border: "none",
                    backgroundColor: primaryColor,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 10,
                }}
                className="print:hidden hover:opacity-80 transition-opacity"
                onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                }}
            >
                <X style={{ width: 10, height: 10, color: "#ffffff" }} />
            </button>

            {/* Block Content - full width, no extra padding */}
            <div>
                <BlockRenderer
                    block={block}
                    organizationId={organizationId}
                    projects={projects}
                    pdfTheme={pdfTheme}
                    selectedProjectId={selectedProjectId}
                />
            </div>
        </div>
    );
}
