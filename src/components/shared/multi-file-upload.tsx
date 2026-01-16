"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/client-image-compression";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { X, UploadCloud, FileIcon, ImageIcon, Film, FileText } from "lucide-react";
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

interface MultiFileUploadProps {
    bucket?: string;
    folderPath: string; // e.g. "project-id/sitelogs"
    onUploadComplete: (files: UploadedFile[]) => void;
    onRemove?: (fileId: string) => void;
    initialFiles?: UploadedFile[];
    maxSizeMB?: number; // per file
    acceptedFileTypes?: Record<string, string[]>;
    className?: string;
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

export function MultiFileUpload({
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
    className
}: MultiFileUploadProps) {
    const [activeUploads, setActiveUploads] = useState<FileState[]>([]);
    const [completedFiles, setCompletedFiles] = useState<UploadedFile[]>(initialFiles);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        // initialize uploads
        const newUploads: FileState[] = acceptedFiles.map(file => ({
            file,
            id: Math.random().toString(36).substring(7),
            progress: 0,
            status: 'pending',
            preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
        }));

        setActiveUploads(prev => [...prev, ...newUploads]);

        // Process uploads
        const supabase = createClient();

        for (const upload of newUploads) {
            uploadFile(upload, supabase);
        }
    }, [folderPath, bucket]);

    const uploadFile = async (uploadState: FileState, supabase: any) => {
        try {
            // Update status to uploading
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

            const fileExt = fileToUpload.name.split('.').pop();
            // Sanitize filename
            const cleanName = fileToUpload.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const filePath = `${folderPath}/${Date.now()}_${cleanName}`;

            // Mock progress - Supabase storage client doesn't support progress events easily 
            // without using XMLHttpRequest wrapper or assumptions. 
            // We'll simulate progress for better UX.
            const progressInterval = setInterval(() => {
                updateUploadState(uploadState.id, (prev) => ({
                    progress: Math.min((prev?.progress || 0) + 10, 90)
                }));
            }, 200);

            const { data, error } = await supabase.storage
                .from(bucket)
                .upload(filePath, fileToUpload, {
                    cacheControl: '3600',
                    upsert: false
                });

            clearInterval(progressInterval);

            if (error) throw error;

            // Finalize
            updateUploadState(uploadState.id, { status: 'completed', progress: 100 });

            // Construct result
            // For private buckets, the "url" might imply we need to sign it later
            // But we'll construct a direct URL if we can, or just store the path stuff.
            // Using getPublicUrl is standard if the policy allows.
            const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);

            const result: UploadedFile = {
                id: uploadState.id, // temporary frontend ID, backend will assign DB ID
                url: publicUrl,
                path: filePath,
                bucket: bucket,
                name: uploadState.file.name,
                type: uploadState.file.type,
                size: uploadState.file.size
            };

            setCompletedFiles(prev => {
                const newFiles = [...prev, result];
                onUploadComplete(newFiles);
                return newFiles;
            });

            // Remove from active uploads list after small delay to show completion
            setTimeout(() => {
                setActiveUploads(prev => prev.filter(u => u.id !== uploadState.id));
            }, 1000);

        } catch (error: any) {
            console.error("Upload error:", error);
            updateUploadState(uploadState.id, {
                status: 'error',
                error: error.message || "Error al subir"
            });
            toast.error(`Error subiendo ${uploadState.file.name}`);
        }
    };

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
        setCompletedFiles(prev => {
            const next = prev.filter(f => f.id !== fileId);
            onUploadComplete(next);
            return next;
        });
        onRemove?.(fileId);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxSize: maxSizeMB * 1024 * 1024,
        accept: acceptedFileTypes,
    });

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const getFileIcon = (type: string) => {
        if (type.startsWith('image/')) return <ImageIcon className="h-5 w-5 text-primary" />;
        if (type.startsWith('video/')) return <Film className="h-5 w-5 text-primary" />;
        return <FileText className="h-5 w-5 text-primary" />;
    };

    return (
        <div className={cn("space-y-3", className)}>
            {/* Dropzone - Styled to match Input standard */}
            <div
                {...getRootProps()}
                className={cn(
                    "relative flex flex-col items-center justify-center w-full rounded-md border border-input bg-background p-6 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer hover:bg-accent/50",
                    isDragActive && "border-primary bg-primary/5 ring-1 ring-primary"
                )}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-1.5 text-center">
                    <div className="p-2 bg-primary/10 rounded-full">
                        <UploadCloud className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-0.5">
                        <p className="font-medium text-foreground">
                            <span className="text-primary hover:underline">Haz clic</span> o arrastra archivos
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Imágenes y videos (máx. {maxSizeMB}MB)
                        </p>
                    </div>
                </div>
            </div>

            {/* File List */}
            {(activeUploads.length > 0 || completedFiles.length > 0) && (
                <div className="grid gap-2">
                    {/* Active Uploads */}
                    {activeUploads.map((file) => (
                        <div key={file.id} className="flex items-center gap-3 rounded-md border border-input bg-background p-3">
                            <div className="flex items-center justify-center h-10 w-10 shrink-0 rounded-md bg-muted">
                                {getFileIcon(file.file.type)}
                            </div>
                            <div className="flex-1 space-y-1 min-w-0">
                                <div className="flex justify-between text-xs">
                                    <span className="font-medium truncate">{file.file.name}</span>
                                    <span className="text-muted-foreground">{file.status === 'uploading' ? `${file.progress}%` : 'Procesando...'}</span>
                                </div>
                                <Progress value={file.progress} className="h-1.5" />
                            </div>
                        </div>
                    ))}

                    {/* Completed Files */}
                    {completedFiles.map((file, index) => (
                        <div key={file.id || index} className="group relative flex items-center gap-3 rounded-md border border-input bg-background p-2 pr-10 hover:bg-accent/40 transition-colors">
                            <div className="h-12 w-12 shrink-0 relative rounded-md overflow-hidden bg-muted border flex items-center justify-center">
                                {file.type.startsWith('image/') ? (
                                    <Image
                                        src={file.url}
                                        alt={file.name}
                                        fill
                                        className="object-cover"
                                        sizes="48px"
                                    />
                                ) : (
                                    getFileIcon(file.type)
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{file.name}</p>
                                <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleRemove(file.id);
                                }}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
