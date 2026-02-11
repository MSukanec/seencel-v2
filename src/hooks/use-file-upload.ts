/**
 * useFileUpload — Motor de Upload Unificado
 * 
 * Hook reutilizable para subir archivos a Supabase Storage.
 * Soporta:
 * - Compresión automática de imágenes
 * - Tracking de progreso (simulado)
 * - Manejo de errores con rollback
 * - Modo single (reemplaza) o multi (acumula)
 */

"use client";

import { useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { compressImage, type ImagePreset } from "@/lib/client-image-compression";
import { toast } from "sonner";

// ============================================================================
// TYPES
// ============================================================================

export interface UploadedFile {
    id: string;
    url: string;
    path: string;
    name: string;
    type: string;
    size: number;
    bucket: string;
}

export interface FileUploadState {
    id: string;
    file: File;
    progress: number;
    status: "pending" | "uploading" | "completed" | "error";
    error?: string;
    preview?: string;
    result?: UploadedFile;
}

interface UseFileUploadOptions {
    /** Supabase Storage bucket (default: "private-assets") */
    bucket?: string;
    /** Folder path within the bucket */
    folderPath: string;
    /** Max file size in MB (default: 50) */
    maxSizeMB?: number;
    /** Image compression preset (default: "default") */
    compressionPreset?: ImagePreset;
    /** Callback when files change (upload complete or removed) */
    onFilesChange?: (files: UploadedFile[]) => void;
}

// ============================================================================
// HOOK
// ============================================================================

export function useFileUpload({
    bucket = "private-assets",
    folderPath,
    maxSizeMB = 50,
    compressionPreset = "default",
    onFilesChange,
}: UseFileUploadOptions) {
    const [activeUploads, setActiveUploads] = useState<FileUploadState[]>([]);
    const [completedFiles, setCompletedFiles] = useState<UploadedFile[]>([]);
    const completedFilesRef = useRef<UploadedFile[]>([]);

    // Keep ref in sync for callbacks
    const updateCompleted = useCallback((updater: (prev: UploadedFile[]) => UploadedFile[]) => {
        setCompletedFiles(prev => {
            const next = updater(prev);
            completedFilesRef.current = next;
            onFilesChange?.(next);
            return next;
        });
    }, [onFilesChange]);

    const updateUploadState = useCallback((id: string, updates: Partial<FileUploadState>) => {
        setActiveUploads(prev =>
            prev.map(u => u.id === id ? { ...u, ...updates } : u)
        );
    }, []);

    const uploadSingleFile = useCallback(async (uploadState: FileUploadState): Promise<UploadedFile | null> => {
        const supabase = createClient();

        try {
            updateUploadState(uploadState.id, { status: "uploading", progress: 0 });

            let fileToUpload = uploadState.file;

            // Compress images automatically
            if (fileToUpload.type.startsWith("image/")) {
                try {
                    fileToUpload = await compressImage(fileToUpload, compressionPreset);
                } catch (e) {
                    console.error("Compression failed, using original", e);
                }
            }

            // Sanitize filename and build path
            const cleanName = fileToUpload.name.replace(/[^a-zA-Z0-9.-]/g, "_");
            const filePath = `${folderPath}/${Date.now()}_${cleanName}`;

            // Simulate progress (Supabase doesn't support progress events)
            const progressInterval = setInterval(() => {
                setActiveUploads(prev =>
                    prev.map(u => {
                        if (u.id !== uploadState.id || u.status !== "uploading") return u;
                        return { ...u, progress: Math.min((u.progress || 0) + 10, 90) };
                    })
                );
            }, 200);

            const { data, error } = await supabase.storage
                .from(bucket)
                .upload(filePath, fileToUpload, {
                    cacheControl: "3600",
                    upsert: false,
                });

            clearInterval(progressInterval);

            if (error) throw error;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);

            const result: UploadedFile = {
                id: uploadState.id,
                url: publicUrl,
                path: filePath,
                bucket,
                name: uploadState.file.name,
                type: uploadState.file.type,
                size: uploadState.file.size,
            };

            updateUploadState(uploadState.id, { status: "completed", progress: 100, result });

            // Add to completed files
            updateCompleted(prev => [...prev, result]);

            // Remove from active uploads after brief delay
            setTimeout(() => {
                setActiveUploads(prev => prev.filter(u => u.id !== uploadState.id));
            }, 800);

            return result;
        } catch (error: any) {
            console.error("Upload error:", error);
            updateUploadState(uploadState.id, {
                status: "error",
                error: error.message || "Error al subir",
            });
            toast.error(`Error subiendo ${uploadState.file.name}`);
            return null;
        }
    }, [bucket, folderPath, compressionPreset, updateUploadState, updateCompleted]);

    /**
     * Add files to the upload queue and start uploading immediately
     */
    const addFiles = useCallback(async (files: File[]) => {
        const validFiles = files.filter(file => {
            if (file.size > maxSizeMB * 1024 * 1024) {
                toast.error(`${file.name} excede el límite de ${maxSizeMB}MB`);
                return false;
            }
            return true;
        });

        if (validFiles.length === 0) return;

        const newUploads: FileUploadState[] = validFiles.map(file => ({
            file,
            id: `upload-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            progress: 0,
            status: "pending" as const,
            preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
        }));

        setActiveUploads(prev => [...prev, ...newUploads]);

        // Start uploading all files
        for (const upload of newUploads) {
            uploadSingleFile(upload);
        }
    }, [maxSizeMB, uploadSingleFile]);

    /**
     * Remove a completed file (from storage and state)
     */
    const removeFile = useCallback(async (fileId: string) => {
        const file = completedFilesRef.current.find(f => f.id === fileId);
        if (file) {
            // Remove from storage (best-effort, don't block UI)
            const supabase = createClient();
            supabase.storage.from(file.bucket).remove([file.path]).catch(console.error);
        }
        updateCompleted(prev => prev.filter(f => f.id !== fileId));
    }, [updateCompleted]);

    /**
     * Initialize with pre-existing files (e.g., when editing)
     */
    const initFiles = useCallback((files: UploadedFile[]) => {
        setCompletedFiles(files);
        completedFilesRef.current = files;
    }, []);

    /**
     * Clear all files
     */
    const clearAll = useCallback(() => {
        setActiveUploads([]);
        updateCompleted(() => []);
    }, [updateCompleted]);

    return {
        /** Files currently being uploaded */
        activeUploads,
        /** Files that have been successfully uploaded */
        completedFiles,
        /** Add files and start uploading */
        addFiles,
        /** Remove a completed file */
        removeFile,
        /** Initialize with existing files */
        initFiles,
        /** Clear all files and uploads */
        clearAll,
        /** Whether any uploads are in progress */
        isUploading: activeUploads.some(u => u.status === "uploading"),
    };
}
