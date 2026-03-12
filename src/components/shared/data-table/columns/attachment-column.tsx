/**
 * Attachment Column Factory
 * Reusable column for showing/managing attachments in DataTable rows.
 *
 * Shows:
 * - Muted paperclip when no attachments
 * - Active paperclip + count label when there ARE attachments (e.g. "1 archivo")
 *
 * Editable mode:
 * - Click opens popover with AttachmentPopoverContent (shared)
 * - Lazy-loads existing files on first open via fetchAttachments callback
 * - Upload/remove/view files inline
 *
 * No header title, just the icon — designed to be placed as the last column.
 */

"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Paperclip } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AttachmentPopoverContent } from "@/components/shared/popovers";
import type { UploadedFile } from "@/hooks/use-file-upload";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────

export interface AttachmentColumnOptions<TData> {
    /** Key to check for attachment existence (default: "has_attachments") */
    hasAttachmentsKey?: string;
    /** Key to get attachment count, if available (default: "attachments_count") */
    countKey?: string;
    /** Enable sorting (default: false) */
    enableSorting?: boolean;
    /** Column width in px (default: 100) */
    size?: number;
    /** Enable inline editing (default: false) */
    editable?: boolean;
    /** Supabase Storage bucket (default: "private-assets") */
    bucket?: string;
    /** Folder path within bucket for uploads */
    folderPath?: string;
    /** Max file size in MB (default: 5) */
    maxSizeMB?: number;
    /** Fetch existing files for a row (required if editable) */
    fetchAttachments?: (row: TData) => Promise<UploadedFile[]>;
    /** Called when files change (upload/remove) */
    onFilesChange?: (row: TData, files: UploadedFile[]) => void;
}

// ─── Editable Attachment Cell ────────────────────────────

function EditableAttachmentCell<TData>({
    row,
    hasAttachments,
    count,
    bucket,
    folderPath,
    maxSizeMB,
    fetchAttachments,
    onFilesChange,
}: {
    row: TData;
    hasAttachments: boolean;
    count: number | undefined;
    bucket: string;
    folderPath: string;
    maxSizeMB: number;
    fetchAttachments: (row: TData) => Promise<UploadedFile[]>;
    onFilesChange?: (row: TData, files: UploadedFile[]) => void;
}) {
    const [open, setOpen] = React.useState(false);
    const [files, setFiles] = React.useState<UploadedFile[]>([]);
    const [loaded, setLoaded] = React.useState(false);

    // Lazy-load existing files on first open
    React.useEffect(() => {
        if (open && !loaded && hasAttachments) {
            fetchAttachments(row).then((fetched) => {
                setFiles(fetched);
                setLoaded(true);
            });
        }
        if (open && !hasAttachments && !loaded) {
            setLoaded(true);
        }
    }, [open, loaded, hasAttachments, fetchAttachments, row]);

    const handleFilesChange = React.useCallback((newFiles: UploadedFile[]) => {
        setFiles(newFiles);
        onFilesChange?.(row, newFiles);
    }, [row, onFilesChange]);

    const displayCount = loaded ? files.length : (count || (hasAttachments ? 1 : 0));
    const label = displayCount > 0
        ? `${displayCount} archivo${displayCount !== 1 ? "s" : ""}`
        : null;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    className={cn(
                        "flex items-center justify-center gap-1.5 cursor-pointer rounded-md px-1.5 py-1 transition-all",
                        "border border-transparent hover:border-dashed hover:border-border hover:bg-[#2a2b2d]",
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                    <Paperclip className={cn(
                        "h-3.5 w-3.5 shrink-0",
                        hasAttachments || files.length > 0 ? "text-foreground" : "text-muted-foreground/30"
                    )} />
                    {label && (
                        <span className="text-xs font-medium text-foreground whitespace-nowrap">
                            {label}
                        </span>
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[300px]" align="end" onClick={(e) => e.stopPropagation()}>
                <AttachmentPopoverContent
                    value={files}
                    onChange={handleFilesChange}
                    bucket={bucket}
                    folderPath={folderPath}
                    maxSizeMB={maxSizeMB}
                />
            </PopoverContent>
        </Popover>
    );
}

// ─── Factory ─────────────────────────────────────────────

export function createAttachmentColumn<TData>(
    options: AttachmentColumnOptions<TData> = {}
): ColumnDef<TData, any> {
    const {
        hasAttachmentsKey = "has_attachments",
        countKey = "attachments_count",
        enableSorting = false,
        size = 100,
        editable = false,
        bucket = "private-assets",
        folderPath = "",
        maxSizeMB = 5,
        fetchAttachments,
        onFilesChange,
    } = options;

    return {
        id: "attachments",
        header: () => (
            <div className="flex justify-center">
                <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
        ),
        cell: ({ row }) => {
            const hasAttachments = (row.original as any)[hasAttachmentsKey] as boolean | undefined;
            const count = (row.original as any)[countKey] as number | undefined;

            // Editable mode — shows popover with file management
            if (editable && fetchAttachments) {
                return (
                    <EditableAttachmentCell
                        row={row.original}
                        hasAttachments={!!hasAttachments}
                        count={count}
                        bucket={bucket}
                        folderPath={folderPath}
                        maxSizeMB={maxSizeMB}
                        fetchAttachments={fetchAttachments}
                        onFilesChange={onFilesChange}
                    />
                );
            }

            // Read-only mode — just indicator
            if (!hasAttachments) {
                return (
                    <div className="flex justify-center">
                        <Paperclip className="h-3.5 w-3.5 text-muted-foreground/30" />
                    </div>
                );
            }

            const label = count
                ? `${count} archivo${count !== 1 ? "s" : ""}`
                : "1 archivo";

            return (
                <div className="flex items-center justify-center gap-1.5">
                    <Paperclip className="h-3.5 w-3.5 text-foreground shrink-0" />
                    <span className="text-xs font-medium text-foreground whitespace-nowrap">
                        {label}
                    </span>
                </div>
            );
        },
        enableSorting,
        size,
        enableHiding: false,
    };
}
