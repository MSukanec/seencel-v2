/**
 * AttachmentPopoverContent — Shared popover content for file attachments
 *
 * Used by: attachment-chip (forms), attachment-column (tables)
 * Single source of truth for file list + upload button UI.
 * Fully self-contained — uses useFileUpload internally.
 */

"use client";

import * as React from "react";
import { useCallback, useRef, useEffect } from "react";
import { Plus, X, FileText, ImageIcon, Film, File as FileIcon, Loader2, ExternalLink } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useFileUpload, type UploadedFile } from "@/hooks/use-file-upload";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────

export interface AttachmentPopoverContentProps {
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
    /** Ref to expose cleanup function */
    cleanupRef?: React.MutableRefObject<(() => void) | null>;
}

// ─── Component ───────────────────────────────────────────

export function AttachmentPopoverContent({
    value,
    onChange,
    bucket = "private-assets",
    folderPath = "",
    maxSizeMB = 5,
    multiple = true,
    readOnly = false,
    disabled = false,
    cleanupRef,
}: AttachmentPopoverContentProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ─── Upload engine ───────────────────────────────────
    const {
        activeUploads,
        completedFiles,
        addFiles,
        removeFile,
        initFiles,
        clearAll,
        isUploading,
    } = useFileUpload({
        bucket,
        folderPath,
        maxSizeMB,
        onFilesChange: onChange,
    });

    // Sync initial files
    const didInit = useRef(false);
    useEffect(() => {
        if (value.length > 0 && !didInit.current) {
            initFiles(value);
            didInit.current = true;
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Expose cleanup
    useEffect(() => {
        if (cleanupRef) cleanupRef.current = clearAll;
        return () => { if (cleanupRef) cleanupRef.current = null; };
    }, [cleanupRef, clearAll]);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        if (selectedFiles.length > 0) {
            if (!multiple) {
                addFiles(selectedFiles.slice(0, 1));
            } else {
                addFiles(selectedFiles);
            }
        }
        // Reset input so same file can be selected again
        if (fileInputRef.current) fileInputRef.current.value = "";
    }, [multiple, addFiles]);

    const displayFiles = completedFiles.length > 0 ? completedFiles : value;

    return (
        <div className="max-h-[320px] overflow-y-auto">
            {/* ── File list ─────────────────────────── */}
            {displayFiles.length > 0 && (
                <div className="p-2 space-y-1">
                    {displayFiles.map((file) => (
                        <FileItem
                            key={file.id}
                            file={file}
                            onRemove={readOnly ? undefined : () => removeFile(file.id)}
                        />
                    ))}
                </div>
            )}

            {/* ── Active uploads (progress) ────────── */}
            {activeUploads.length > 0 && (
                <div className="p-2 space-y-1 border-t border-border/20">
                    {activeUploads.map((upload) => (
                        <div key={upload.id} className="flex items-center gap-2 p-2 rounded-md">
                            <div className="shrink-0">
                                <FileTypeIcon type={upload.file.type} className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs truncate text-muted-foreground">{upload.file.name}</p>
                                <Progress value={upload.progress} className="h-0.5 mt-1" />
                            </div>
                            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground shrink-0" />
                        </div>
                    ))}
                </div>
            )}

            {/* ── Upload button (editable only) ──────── */}
            {!readOnly && (
                <>
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        multiple={multiple}
                        accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
                        onChange={handleFileChange}
                        disabled={disabled || isUploading}
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={disabled || isUploading}
                        className={cn(
                            "flex items-center gap-2 w-full px-3 py-2.5 cursor-pointer transition-colors",
                            "text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30",
                            displayFiles.length > 0 && "border-t border-border/20",
                            (disabled || isUploading) && "opacity-50 pointer-events-none",
                        )}
                    >
                        <Plus className="h-3.5 w-3.5 shrink-0" />
                        <span>Agregar archivo</span>
                        <span className="ml-auto text-[10px] text-muted-foreground/50">máx. {maxSizeMB}MB</span>
                    </button>
                </>
            )}
        </div>
    );
}

// ─── Helpers (exported for reuse) ────────────────────────

export function AttachmentLabel(count: number): string {
    if (count === 0) return "Adjuntar";
    return `${count} archivo${count !== 1 ? "s" : ""}`;
}

// ─── File Item ───────────────────────────────────────────

function FileItem({
    file,
    onRemove,
}: {
    file: UploadedFile;
    onRemove?: () => void;
}) {
    const isImage = file.type?.startsWith("image/") ||
        /\.(jpg|jpeg|png|gif|webp|bmp|svg)/i.test(file.url || "");

    return (
        <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/30 transition-colors group">
            {/* Icon */}
            <div className="shrink-0">
                <div className="w-8 h-8 flex items-center justify-center rounded bg-muted/50">
                    <FileTypeIcon type={file.type} className="h-4 w-4" />
                </div>
            </div>

            {/* File info */}
            <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate text-foreground">{file.name}</p>
                <p className="text-[10px] text-muted-foreground">{formatFileSize(file.size)}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Open in new tab */}
                <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                    onClick={(e) => e.stopPropagation()}
                >
                    <ExternalLink className="h-3 w-3" />
                </a>

                {/* Remove */}
                {onRemove && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove();
                        }}
                        className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
                    >
                        <X className="h-3 w-3" />
                    </button>
                )}
            </div>
        </div>
    );
}

// ─── Utilities ───────────────────────────────────────────

function FileTypeIcon({ type, className }: { type: string; className?: string }) {
    if (type?.startsWith("image/")) return <ImageIcon className={cn("text-blue-500", className)} />;
    if (type?.startsWith("video/")) return <Film className={cn("text-purple-500", className)} />;
    if (type === "application/pdf" || type === "pdf") return <FileText className={cn("text-red-500", className)} />;
    return <FileIcon className={cn("text-muted-foreground", className)} />;
}

function formatFileSize(bytes: number): string {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
