/**
 * AttachmentChip — File upload chip with popover
 *
 * Compact chip that shows attachment count.
 * Popover contains AttachmentPopoverContent (file list + dropzone + progress).
 *
 * Usage in forms:
 *   <AttachmentChip
 *     value={files}
 *     onChange={setFiles}
 *     bucket="private-assets"
 *     folderPath={`organizations/${orgId}/finance`}
 *   />
 *
 * Usage in tables (read-only):
 *   <AttachmentChip value={existingFiles} readOnly />
 */

"use client";

import * as React from "react";
import { Paperclip, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AttachmentPopoverContent, AttachmentLabel } from "@/components/shared/popovers";
import { useFileUpload, type UploadedFile } from "@/hooks/use-file-upload";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────

export interface AttachmentChipProps {
    /** Current files */
    value: UploadedFile[];
    /** Callback when files change */
    onChange?: (files: UploadedFile[]) => void;
    /** Supabase Storage bucket */
    bucket?: string;
    /** Folder path within bucket */
    folderPath?: string;
    /** Max size per file in MB */
    maxSizeMB?: number;
    /** Allow multiple files (default: true) */
    multiple?: boolean;
    /** Read-only mode — just shows files, no upload */
    readOnly?: boolean;
    /** Disabled state */
    disabled?: boolean;
    /** Extra className */
    className?: string;
    /** Ref to expose cleanup function */
    cleanupRef?: React.MutableRefObject<(() => void) | null>;
}

// ─── Component ───────────────────────────────────────────

export function AttachmentChip({
    value,
    onChange,
    bucket = "private-assets",
    folderPath = "",
    maxSizeMB = 5,
    multiple = true,
    readOnly = false,
    disabled = false,
    className,
    cleanupRef,
}: AttachmentChipProps) {
    const [open, setOpen] = React.useState(false);
    const count = value.length;
    const hasFiles = count > 0;

    // Track uploading state for the trigger label
    const { isUploading } = useFileUpload({
        bucket,
        folderPath,
        maxSizeMB,
        onFilesChange: onChange,
    });

    const label = AttachmentLabel(count);

    // ─── Read-only with no files: don't render ───────────
    if (readOnly && !hasFiles) return null;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium cursor-pointer transition-all select-none",
                        "border",
                        hasFiles ? "border-border/60" : "border-dashed border-border/40",
                        "hover:border-border hover:bg-muted/50",
                        hasFiles ? "text-foreground" : "text-muted-foreground",
                        (disabled || isUploading) && "opacity-50 pointer-events-none",
                        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                        className
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                    <Paperclip className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{label}</span>
                    {isUploading && <Loader2 className="h-3 w-3 animate-spin shrink-0" />}
                </button>
            </PopoverTrigger>

            <PopoverContent
                className="p-0 w-[300px]"
                align="start"
                onClick={(e) => e.stopPropagation()}
            >
                <AttachmentPopoverContent
                    value={value}
                    onChange={onChange}
                    bucket={bucket}
                    folderPath={folderPath}
                    maxSizeMB={maxSizeMB}
                    multiple={multiple}
                    readOnly={readOnly}
                    disabled={disabled}
                    cleanupRef={cleanupRef}
                />
            </PopoverContent>
        </Popover>
    );
}
