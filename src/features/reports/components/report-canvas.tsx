"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { GripVertical, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FileChartColumn } from "lucide-react";
import { BlockRenderer } from "./block-renderer";
import type { ReportBlock } from "../views/reports-builder-view";

interface ReportCanvasProps {
    blocks: ReportBlock[];
    selectedBlockId: string | null;
    onSelectBlock: (id: string | null) => void;
    onRemoveBlock: (id: string) => void;
    isPreviewMode: boolean;
    organizationId: string;
    projects: { id: string; name: string; status: string }[];
}

export function ReportCanvas({
    blocks,
    selectedBlockId,
    onSelectBlock,
    onRemoveBlock,
    isPreviewMode,
    organizationId,
    projects,
}: ReportCanvasProps) {
    if (blocks.length === 0) {
        return (
            <div className="h-full flex items-center justify-center">
                <EmptyState
                    icon={FileChartColumn}
                    title="Informe vacío"
                    description="Agregá bloques desde el panel izquierdo para construir tu informe personalizado"
                />
            </div>
        );
    }

    return (
        <div className={cn(
            "min-h-full p-6 space-y-4",
            isPreviewMode ? "bg-white" : "bg-muted/30"
        )}>
            {/* Paper-like container for preview */}
            <div className={cn(
                "mx-auto space-y-4 transition-all",
                isPreviewMode && "max-w-[800px] bg-white shadow-lg rounded-lg p-8 border"
            )}>
                {blocks.map((block) => (
                    <SortableBlock
                        key={block.id}
                        block={block}
                        isSelected={selectedBlockId === block.id}
                        onSelect={() => onSelectBlock(block.id)}
                        onRemove={() => onRemoveBlock(block.id)}
                        isPreviewMode={isPreviewMode}
                        organizationId={organizationId}
                        projects={projects}
                    />
                ))}
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
}

function SortableBlock({
    block,
    isSelected,
    onSelect,
    onRemove,
    isPreviewMode,
    organizationId,
    projects,
}: SortableBlockProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: block.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    if (isPreviewMode) {
        return (
            <div className="w-full">
                <BlockRenderer
                    block={block}
                    organizationId={organizationId}
                    projects={projects}
                />
            </div>
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "group relative rounded-lg border bg-card transition-all",
                isSelected ? "ring-2 ring-primary border-primary" : "border-border hover:border-primary/50",
                isDragging && "opacity-50 shadow-xl z-50"
            )}
            onClick={onSelect}
        >
            {/* Drag Handle */}
            <div
                {...attributes}
                {...listeners}
                className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>

            {/* Remove Button */}
            <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                }}
            >
                <X className="h-3 w-3" />
            </Button>

            {/* Block Content */}
            <div className="p-4 pl-10">
                <BlockRenderer
                    block={block}
                    organizationId={organizationId}
                    projects={projects}
                />
            </div>
        </div>
    );
}
