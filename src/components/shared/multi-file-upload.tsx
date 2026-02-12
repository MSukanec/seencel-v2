"use client";

import { useCallback, useState, forwardRef, useImperativeHandle } from "react";
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
    /** Local blob preview URL — used for display when bucket is private */
    previewUrl?: string;
}

export interface MultiFileUploadRef {
    startUpload: () => Promise<UploadedFile[]>;
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

const MultiFileUpload = forwardRef<MultiFileUploadRef, MultiFileUploadProps>(({
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
    autoUpload = false
}, ref) => {
    const [activeUploads, setActiveUploads] = useState<FileState[]>([]);
    const [completedFiles, setCompletedFiles] = useState<UploadedFile[]>(initialFiles);

    // We need a stable reference to incomplete uploads for the ref method to access functionality
    const uploadSingleFile = async (uploadState: FileState): Promise<UploadedFile | null> => {
        const supabase = createClient();

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
            const progressInterval = setInterval(() => {
                updateUploadState(uploadState.id, (prev) => {
                    if (prev?.status !== 'uploading') return {};
                    return { progress: Math.min((prev?.progress || 0) + 10, 90) };
                });
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

            const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);

            const result: UploadedFile = {
                id: uploadState.id,
                url: publicUrl,
                path: filePath,
                bucket: bucket,
                name: uploadState.file.name,
                type: uploadState.file.type,
                size: uploadState.file.size,
                previewUrl: uploadState.preview, // preserve blob URL for private buckets
            };

            // Update local completed state
            setCompletedFiles(prev => {
                const newFiles = [...prev, result];
                // Only notify if autoUpload is true, otherwise let the caller handle the final list?
                // Actually, standard behavior is to notify whenever a file is done.
                if (autoUpload) {
                    setTimeout(() => onUploadComplete(newFiles), 0);
                }
                return newFiles;
            });

            // Remove from active uploads list after small delay
            setTimeout(() => {
                setActiveUploads(prev => prev.filter(u => u.id !== uploadState.id));
            }, 1000);

            return result;

        } catch (error: any) {
            console.error("Upload error:", error);
            updateUploadState(uploadState.id, {
                status: 'error',
                error: error.message || "Error al subir"
            });
            toast.error(`Error subiendo ${uploadState.file.name}`);
            return null;
        }
    };

    useImperativeHandle(ref, () => ({
        startUpload: async () => {
            const pending = activeUploads.filter(u => u.status === 'pending' || u.status === 'error');

            // If no pending files, just return what we have
            if (pending.length === 0) return completedFiles;

            const results = await Promise.all(pending.map(u => uploadSingleFile(u)));

            // Filter successes
            const successes = results.filter((f): f is UploadedFile => f !== null);

            // StartUpload is generally called when we want the FINAL list for submission.
            // So we combine existing completed + newly uploaded
            const final = [...completedFiles, ...successes];

            // Ensure parent knows about all files now
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
            for (const upload of newUploads) {
                uploadSingleFile(upload);
            }
        }
        // If not autoUpload, they sit in activeUploads with status 'pending'
    }, [folderPath, bucket, autoUpload]); // Added dependencies

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
        // If it was pending (in activeUploads)
        setActiveUploads(prev => prev.filter(u => u.id !== fileId));

        // If it was completed
        setCompletedFiles(prev => {
            const next = prev.filter(f => f.id !== fileId);
            // Defer the callback to avoid setState during render
            setTimeout(() => onUploadComplete(next), 0);
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
            {/* Dropzone */}
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
                                {file.preview ? (
                                    <div className="relative w-full h-full rounded overflow-hidden">
                                        <Image src={file.preview} alt="" fill className="object-cover" />
                                    </div>
                                ) : (
                                    getFileIcon(file.file.type)
                                )}
                            </div>
                            <div className="flex-1 space-y-1 min-w-0">
                                <div className="flex justify-between text-xs">
                                    <span className="font-medium truncate">{file.file.name}</span>
                                    <span className="text-muted-foreground">
                                        {file.status === 'uploading' ? `${file.progress}%` :
                                            file.status === 'pending' ? 'Pendiente' :
                                                file.status === 'error' ? 'Error' : 'Completado'}
                                    </span>
                                </div>
                                {file.status === 'uploading' && <Progress value={file.progress} className="h-1.5" />}
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleRemove(file.id);
                                }}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}

                    {/* Completed Files */}
                    {completedFiles.map((file, index) => (
                        <div key={file.id || index} className="group relative flex items-center gap-3 rounded-md border border-input bg-background p-2 pr-10 hover:bg-accent/40 transition-colors">
                            <div className="h-12 w-12 shrink-0 relative rounded-md overflow-hidden bg-muted border flex items-center justify-center">
                                {file.type.startsWith('image/') ? (
                                    <Image
                                        src={file.previewUrl || file.url}
                                        alt={file.name}
                                        fill
                                        className="object-cover"
                                        sizes="48px"
                                        unoptimized={!!file.previewUrl}
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
});

MultiFileUpload.displayName = "MultiFileUpload";
export { MultiFileUpload };

