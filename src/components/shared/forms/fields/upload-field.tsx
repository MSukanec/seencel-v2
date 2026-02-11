/**
 * Upload Field Factory
 * Standard 19.14 - Unified Upload Component
 *
 * Provides a standardized file upload field with three modes:
 * - "single-image": Upload and preview a single image (replaceable)
 * - "multi-file": Upload multiple files with list display
 * - "gallery": Upload multiple images/videos in a grid
 *
 * Uses the useFileUpload hook for all upload logic.
 * Follows the FieldFactory pattern (FormGroup + FactoryLabel).
 */

"use client";

import { useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { FormGroup } from "@/components/ui/form-group";
import { FactoryLabel } from "./field-wrapper";
import { useFileUpload, type UploadedFile, type FileUploadState } from "@/hooks/use-file-upload";
import type { ImagePreset } from "@/lib/client-image-compression";
import { cn } from "@/lib/utils";
import {
    UploadCloud,
    X,
    FileText,
    Film,
    ImageIcon,
    File as FileIcon,
    Loader2,
} from "lucide-react";
import Image from "next/image";
import { Progress } from "@/components/ui/progress";

// ============================================================================
// TYPES
// ============================================================================

export interface UploadFieldProps {
    /** Field label */
    label: string;
    /** Upload mode */
    mode: "single-image" | "multi-file" | "gallery";
    /** Current value — single file or array depending on mode */
    value: UploadedFile | UploadedFile[] | null;
    /** Callback when files change */
    onChange: (files: UploadedFile | UploadedFile[] | null) => void;
    /** Supabase Storage bucket (default: "private-assets") */
    bucket?: string;
    /** Folder path within the bucket */
    folderPath: string;
    /** Max file size in MB */
    maxSizeMB?: number;
    /** Accepted MIME types */
    acceptedTypes?: Record<string, string[]>;
    /** Max number of files (multi-file and gallery only) */
    maxFiles?: number;
    /** Image compression preset */
    compressionPreset?: ImagePreset;
    /** Is field required? */
    required?: boolean;
    /** Error message */
    error?: string;
    /** Is field disabled? */
    disabled?: boolean;
    /** Additional className for FormGroup */
    className?: string;
    /** Help text below the field */
    helpText?: string;
    /** Custom dropzone label */
    dropzoneLabel?: string;
}

// Default accepted types per mode
const DEFAULT_ACCEPT: Record<UploadFieldProps["mode"], Record<string, string[]>> = {
    "single-image": { "image/*": [] },
    "multi-file": {
        "image/*": [],
        "video/*": [],
        "application/pdf": [],
        "application/msword": [],
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [],
        "application/vnd.ms-excel": [],
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [],
    },
    "gallery": { "image/*": [], "video/*": [] },
};

const DEFAULT_MAX_SIZE: Record<UploadFieldProps["mode"], number> = {
    "single-image": 10,
    "multi-file": 50,
    "gallery": 50,
};

// ============================================================================
// COMPONENT
// ============================================================================

export function UploadField({
    label,
    mode,
    value,
    onChange,
    bucket = "private-assets",
    folderPath,
    maxSizeMB,
    acceptedTypes,
    maxFiles,
    compressionPreset = "default",
    required = false,
    error,
    disabled = false,
    className,
    helpText,
    dropzoneLabel,
}: UploadFieldProps) {
    const resolvedMaxSize = maxSizeMB ?? DEFAULT_MAX_SIZE[mode];
    const resolvedAccept = acceptedTypes ?? DEFAULT_ACCEPT[mode];
    const isSingle = mode === "single-image";

    // Normalize value to array for internal use
    const currentFiles: UploadedFile[] = value
        ? Array.isArray(value) ? value : [value]
        : [];

    const handleFilesChange = useCallback((files: UploadedFile[]) => {
        if (isSingle) {
            onChange(files.length > 0 ? files[files.length - 1] : null);
        } else {
            onChange(files);
        }
    }, [isSingle, onChange]);

    const {
        activeUploads,
        completedFiles,
        addFiles,
        removeFile,
        initFiles,
        isUploading,
    } = useFileUpload({
        bucket,
        folderPath,
        maxSizeMB: resolvedMaxSize,
        compressionPreset,
        onFilesChange: handleFilesChange,
    });

    // Sync initial value with hook
    useEffect(() => {
        if (currentFiles.length > 0 && completedFiles.length === 0) {
            initFiles(currentFiles);
        }
        // Only run on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (isSingle) {
            // For single mode, replace current file
            addFiles(acceptedFiles.slice(0, 1));
        } else {
            addFiles(acceptedFiles);
        }
    }, [isSingle, addFiles]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxSize: resolvedMaxSize * 1024 * 1024,
        accept: resolvedAccept,
        multiple: !isSingle,
        maxFiles: isSingle ? 1 : maxFiles,
        disabled,
    });

    // Should we show the dropzone?
    const showDropzone = isSingle
        ? completedFiles.length === 0 && activeUploads.length === 0
        : true;

    // Dropzone label text
    const dropzoneLabelText = dropzoneLabel ?? (
        mode === "single-image"
            ? "Subir imagen"
            : mode === "gallery"
                ? "Subir imágenes"
                : "Subir archivos"
    );

    const dropzoneSubtext = mode === "single-image"
        ? "PNG, JPG, WEBP"
        : mode === "gallery"
            ? "o arrastra imágenes"
            : "o arrastra archivos";

    return (
        <FormGroup
            label={<FactoryLabel label={label} />}
            required={required}
            className={className}
            error={error}
            helpText={helpText}
        >
            <div className="space-y-3">
                {/* ============================================ */}
                {/* DROPZONE — Unified look across all modes     */}
                {/* ============================================ */}
                {showDropzone && (
                    <div
                        {...getRootProps()}
                        className={cn(
                            "flex flex-col items-center justify-center gap-1.5 px-4 py-6",
                            "border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                            "hover:border-primary/50 hover:bg-muted/50",
                            isDragActive
                                ? "border-primary bg-primary/5"
                                : "border-border",
                            disabled && "opacity-50 cursor-default pointer-events-none",
                        )}
                    >
                        <input {...getInputProps()} />
                        <UploadCloud className="h-6 w-6 text-muted-foreground" />
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">
                                {dropzoneLabelText}
                            </p>
                            <p className="text-xs text-muted-foreground/70 mt-0.5">
                                {dropzoneSubtext} (máx. {resolvedMaxSize}MB)
                            </p>
                        </div>
                    </div>
                )}

                {/* ============================================ */}
                {/* ACTIVE UPLOADS — Progress indicators         */}
                {/* ============================================ */}
                {activeUploads.length > 0 && (
                    <div className="space-y-2">
                        {activeUploads.map(upload => (
                            <UploadProgressItem key={upload.id} upload={upload} />
                        ))}
                    </div>
                )}

                {/* ============================================ */}
                {/* PREVIEW — Mode-specific display              */}
                {/* ============================================ */}
                {completedFiles.length > 0 && (
                    mode === "single-image" ? (
                        <SingleImagePreview
                            file={completedFiles[completedFiles.length - 1]}
                            onRemove={() => removeFile(completedFiles[completedFiles.length - 1].id)}
                            disabled={disabled}
                        />
                    ) : mode === "gallery" ? (
                        <GalleryPreview
                            files={completedFiles}
                            onRemove={removeFile}
                            disabled={disabled}
                        />
                    ) : (
                        <FileListPreview
                            files={completedFiles}
                            onRemove={removeFile}
                            disabled={disabled}
                        />
                    )
                )}
            </div>
        </FormGroup>
    );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Upload progress indicator for a single file
 */
function UploadProgressItem({ upload }: { upload: FileUploadState }) {
    return (
        <div className="flex items-center gap-3 p-2 rounded-lg border bg-card">
            <div className="flex-shrink-0 p-1.5 rounded bg-muted">
                {upload.preview ? (
                    <div className="w-8 h-8 relative rounded overflow-hidden">
                        <Image
                            src={upload.preview}
                            alt={upload.file.name}
                            fill
                            className="object-cover"
                        />
                    </div>
                ) : (
                    <FileTypeIcon type={upload.file.type} className="h-5 w-5" />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{upload.file.name}</p>
                {upload.status === "uploading" && (
                    <Progress value={upload.progress} className="h-1 mt-1" />
                )}
                {upload.status === "error" && (
                    <p className="text-xs text-destructive mt-0.5">{upload.error}</p>
                )}
            </div>
            {upload.status === "uploading" && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground flex-shrink-0" />
            )}
        </div>
    );
}

/**
 * Single image preview with hover overlay
 */
function SingleImagePreview({
    file,
    onRemove,
    disabled,
}: {
    file: UploadedFile;
    onRemove: () => void;
    disabled: boolean;
}) {
    return (
        <div className="relative group w-full aspect-[16/9] rounded-lg overflow-hidden border bg-muted">
            <Image
                src={file.url}
                alt={file.name}
                fill
                className="object-cover"
            />
            {!disabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        type="button"
                        onClick={onRemove}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/10 backdrop-blur-sm text-white text-sm hover:bg-white/20 transition-colors"
                    >
                        <X className="h-4 w-4" />
                        Quitar
                    </button>
                </div>
            )}
        </div>
    );
}

/**
 * Gallery grid preview for images/videos
 */
function GalleryPreview({
    files,
    onRemove,
    disabled,
}: {
    files: UploadedFile[];
    onRemove: (id: string) => void;
    disabled: boolean;
}) {
    return (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
            {files.map(file => {
                const isImage = file.type.startsWith("image/") ||
                    /\.(jpg|jpeg|png|gif|webp|bmp|svg)/i.test(file.url || "");

                return (
                    <div
                        key={file.id}
                        className="group relative aspect-square rounded-lg overflow-hidden border bg-muted"
                    >
                        {isImage ? (
                            <Image
                                src={file.url}
                                alt={file.name}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="h-full flex items-center justify-center">
                                <Film className="h-6 w-6 text-muted-foreground" />
                            </div>
                        )}
                        {!disabled && (
                            <button
                                type="button"
                                onClick={() => onRemove(file.id)}
                                className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

/**
 * File list preview for generic files
 */
function FileListPreview({
    files,
    onRemove,
    disabled,
}: {
    files: UploadedFile[];
    onRemove: (id: string) => void;
    disabled: boolean;
}) {
    return (
        <div className="space-y-1.5">
            {files.map(file => (
                <div
                    key={file.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                >
                    <div className="flex-shrink-0 p-1.5 rounded bg-muted">
                        <FileTypeIcon type={file.type} className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.size)}
                        </p>
                    </div>
                    {!disabled && (
                        <button
                            type="button"
                            onClick={() => onRemove(file.id)}
                            className="flex-shrink-0 p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
}

// ============================================================================
// UTILITIES
// ============================================================================

function FileTypeIcon({ type, className }: { type: string; className?: string }) {
    if (type.startsWith("image/")) return <ImageIcon className={cn("text-blue-500", className)} />;
    if (type.startsWith("video/")) return <Film className={cn("text-purple-500", className)} />;
    if (type === "application/pdf") return <FileText className={cn("text-red-500", className)} />;
    if (type.includes("word") || type.includes("document")) return <FileText className={cn("text-blue-500", className)} />;
    if (type.includes("sheet") || type.includes("excel")) return <FileText className={cn("text-green-500", className)} />;
    return <FileIcon className={cn("text-muted-foreground", className)} />;
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
