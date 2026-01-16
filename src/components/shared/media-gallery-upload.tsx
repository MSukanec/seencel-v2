"use client";

import { useCallback, useState, forwardRef, useImperativeHandle } from "react";
import { useDropzone } from "react-dropzone";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/client-image-compression";
import { Progress } from "@/components/ui/progress";
import { UploadCloud, X, Play, Image as ImageIcon, Film, FileText, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Image from "next/image";

export interface UploadedFile {
    id: string; // generated UUID or path
    url: string;
    path: string;
    name: string;
    type: string;
    size: number;
    bucket: string;
}

export interface MediaGalleryUploadRef {
    startUpload: () => Promise<UploadedFile[]>;
}

interface MediaGalleryUploadProps {
    bucket?: string;
    folderPath: string; // e.g. "organizations/{orgId}/sitelogs"
    onUploadComplete: (files: UploadedFile[]) => void;
    onRemove?: (fileId: string) => void;
    initialFiles?: UploadedFile[];
    maxSizeMB?: number; // per file
    acceptedFileTypes?: Record<string, string[]>;
    className?: string;
    autoUpload?: boolean;
}

interface FileState {
    file: File;
    id: string; // temporary id
    progress: number;
    status: 'pending' | 'uploading' | 'completed' | 'error';
    error?: string;
    uploadedData?: UploadedFile;
    preview?: string;
}

const MediaGalleryUpload = forwardRef<MediaGalleryUploadRef, MediaGalleryUploadProps>(({
    bucket = "private-assets",
    folderPath,
    onUploadComplete,
    onRemove,
    initialFiles = [],
    maxSizeMB = 50,
    acceptedFileTypes = {
        'image/*': [],
        'video/*': [],
        'application/pdf': []
    },
    className,
    autoUpload = true
}, ref) => {
    const [activeUploads, setActiveUploads] = useState<FileState[]>([]);
    const [completedFiles, setCompletedFiles] = useState<UploadedFile[]>(initialFiles);

    // Synchronize function for imperative upload
    const uploadSingleFile = async (uploadState: FileState): Promise<UploadedFile | null> => {
        const supabase = createClient();

        try {
            updateUploadState(uploadState.id, { status: 'uploading', progress: 0 });

            let fileToUpload = uploadState.file;

            // Compress if image
            if (fileToUpload.type.startsWith('image/')) {
                try {
                    fileToUpload = await compressImage(fileToUpload, 'sitelog-photo');
                } catch (e) {
                    console.error("Compression failed, using original", e);
                }
            }

            const cleanName = fileToUpload.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const filePath = `${folderPath}/${Date.now()}_${cleanName}`;

            // Mock progress
            const progressInterval = setInterval(() => {
                updateUploadState(uploadState.id, (prev) => {
                    if (prev?.status !== 'uploading') return {};
                    return { progress: Math.min((prev?.progress || 0) + 10, 90) };
                });
            }, 200);

            const { error } = await supabase.storage
                .from(bucket)
                .upload(filePath, fileToUpload, {
                    cacheControl: '3600',
                    upsert: false
                });

            clearInterval(progressInterval);

            if (error) throw error;

            updateUploadState(uploadState.id, { status: 'completed', progress: 100 });

            const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);

            const result: UploadedFile = {
                id: uploadState.id,
                url: publicUrl,
                path: filePath,
                bucket: bucket,
                name: uploadState.file.name,
                type: uploadState.file.type,
                size: uploadState.file.size
            };

            // Don't update completedFiles here for deferred uploads, wait for all
            // But for autoUpload we do.
            setCompletedFiles(prev => {
                const newFiles = [...prev, result];
                if (autoUpload) {
                    onUploadComplete(newFiles);
                }
                return newFiles;
            });

            // Cleanup active upload after delay
            setTimeout(() => {
                setActiveUploads(prev => prev.filter(u => u.id !== uploadState.id));
            }, 500);

            return result;

        } catch (error: any) {
            console.error("Upload error:", error);
            updateUploadState(uploadState.id, { status: 'error', error: error.message });
            toast.error(`Error subiendo ${uploadState.file.name}`);
            return null;
        }
    };

    useImperativeHandle(ref, () => ({
        startUpload: async () => {
            const pending = activeUploads.filter(u => u.status === 'pending' || u.status === 'error');

            if (pending.length === 0) return completedFiles;

            const results = await Promise.all(pending.map(u => uploadSingleFile(u)));
            const successes = results.filter((f): f is UploadedFile => f !== null);
            const final = [...completedFiles, ...successes];

            onUploadComplete(final);
            return final;
        }
    }));

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const newUploads: FileState[] = acceptedFiles.map(file => ({
            file,
            id: Math.random().toString(36).substring(7),
            progress: 0,
            status: 'pending',
            preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
        }));

        setActiveUploads(prev => [...prev, ...newUploads]);

        if (autoUpload) {
            newUploads.forEach(u => uploadSingleFile(u));
        }
    }, [folderPath, bucket, autoUpload]);

    const updateUploadState = (id: string, updates: Partial<FileState> | ((prev: FileState | undefined) => Partial<FileState>)) => {
        setActiveUploads(prev => prev.map(u => {
            if (u.id === id) {
                const newValues = typeof updates === 'function' ? updates(u) : updates;
                return { ...u, ...newValues };
            }
            return u;
        }));
    };

    const handleRemove = (fileId: string) => {
        // Check active first
        if (activeUploads.find(u => u.id === fileId)) {
            setActiveUploads(prev => prev.filter(u => u.id !== fileId));
        } else {
            // Completed
            setCompletedFiles(prev => {
                const next = prev.filter(f => f.id !== fileId);
                onUploadComplete(next);
                return next;
            });
            onRemove?.(fileId);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxSize: maxSizeMB * 1024 * 1024,
        accept: acceptedFileTypes,
    });

    // Merge lists for display, keeping order: Completed first, then Active
    // Actually typically current pending are at the end.
    // We render them separately or merged? 
    // Let's render "Available" (Completed) + "Pending" (Active) in one grid.

    return (
        <div className={cn("space-y-4", className)}>
            {/* Minimal Dropzone */}
            <div
                {...getRootProps()}
                className={cn(
                    "relative flex flex-col items-center justify-center w-full rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/5 p-6 text-sm transition-colors cursor-pointer hover:bg-muted/10 hover:border-primary/50",
                    isDragActive && "border-primary bg-primary/5 ring-1 ring-primary"
                )}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
                    <div className="p-2 bg-background rounded-full shadow-sm border">
                        <UploadCloud className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <span className="font-semibold text-foreground">Haz clic para subir</span>
                        <span className="text-xs block mt-0.5">o arrastra imágenes</span>
                    </div>
                </div>
            </div>

            {/* Gallery Grid */}
            {(completedFiles.length > 0 || activeUploads.length > 0) && (
                <div className="grid grid-cols-5 gap-3">
                    {/* Render Completed Files */}
                    {completedFiles.map((file, idx) => {
                        // Fallback check for "image" type if MIME type is missing or generic (application/octet-stream etc)
                        // Checks both 'type' property AND file extension in name/url
                        const isImage = file.type.startsWith('image/') ||
                            /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(file.name || '') ||
                            /\.(jpg|jpeg|png|gif|webp|bmp|svg)\?/i.test(file.url || '') || // for signed urls with query params
                            /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(file.url || '');
                        return (
                            <div
                                key={file.id || idx}
                                className="group relative aspect-square rounded-lg overflow-hidden border border-border bg-muted cursor-pointer"
                                onClick={() => handleRemove(file.id)}
                            >
                                {isImage ? (
                                    <Image
                                        src={file.url}
                                        alt={file.name || "Imagen"}
                                        fill
                                        className="object-cover transition-transform group-hover:scale-105 opacity-0 transition-opacity duration-300"
                                        onLoadingComplete={(img) => img.classList.remove('opacity-0')}
                                        unoptimized // using unoptimized for external storage urls often avoids next/image config issues
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                        {file.type.startsWith('video/') ? <Film /> : <FileText />}
                                    </div>
                                )}

                                {/* Overlay for Actions */}
                                <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-destructive font-medium gap-1">
                                    <Trash2 className="h-6 w-6" />
                                    <span className="text-[10px] uppercase tracking-wider">Eliminar</span>
                                </div>
                            </div>
                        );
                    })}

                    {/* Render Active/Pending Uploads */}
                    {activeUploads.map((file) => (
                        <div
                            key={file.id}
                            className="group relative aspect-square rounded-lg overflow-hidden border border-border bg-background cursor-pointer"
                            onClick={() => handleRemove(file.id)}
                        >
                            {/* Preview if available */}
                            {file.preview ? (
                                <Image
                                    src={file.preview}
                                    alt="Preview"
                                    fill
                                    className={cn("object-cover opacity-60", file.status === 'error' && "grayscale")}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <ImageIcon className="text-muted-foreground" />
                                </div>
                            )}

                            {/* Status Overlay */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                                {file.status === 'uploading' && (
                                    <div className="w-full max-w-[80%] pb-4">
                                        <Progress value={file.progress} className="h-1.5 w-full bg-background/50" />
                                    </div>
                                )}
                                {file.status === 'error' && (
                                    <X className="h-6 w-6 text-destructive" />
                                )}

                                {/* Hover remove on pending? Yes */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                    <X className="h-8 w-8" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
});

MediaGalleryUpload.displayName = "MediaGalleryUpload";

export { MediaGalleryUpload };
