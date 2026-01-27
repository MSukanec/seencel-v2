"use client";

import { useState } from "react";
import {
    FileText,
    Image,
    Video,
    File,
    Download,
    ExternalLink,
    Loader2,
    Paperclip
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AttachmentItem {
    id: string;
    file_name: string;
    file_path: string;
    file_type: 'image' | 'video' | 'pdf' | 'doc' | 'other';
    file_size: number | null;
    bucket: string;
    created_at?: string;
}

interface AttachmentListProps {
    /**
     * List of attachments to display
     */
    attachments: AttachmentItem[];
    /**
     * Handler to get signed URL for a file
     */
    onGetUrl: (bucket: string, filePath: string) => Promise<string | null>;
    /**
     * Whether attachments are loading
     */
    isLoading?: boolean;
    /**
     * Additional className
     */
    className?: string;
}

/**
 * Component to display a list of attachments with preview/download actions
 */
export function AttachmentList({
    attachments,
    onGetUrl,
    isLoading = false,
    className
}: AttachmentListProps) {
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const getFileIcon = (type: AttachmentItem['file_type']) => {
        switch (type) {
            case 'image':
                return <Image className="h-5 w-5" />;
            case 'video':
                return <Video className="h-5 w-5" />;
            case 'pdf':
                return <FileText className="h-5 w-5 text-red-500" />;
            case 'doc':
                return <FileText className="h-5 w-5 text-blue-500" />;
            default:
                return <File className="h-5 w-5" />;
        }
    };

    const formatFileSize = (bytes: number | null) => {
        if (!bytes) return "";
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const handleAction = async (attachment: AttachmentItem, action: 'preview' | 'download') => {
        setLoadingId(attachment.id);
        try {
            const url = await onGetUrl(attachment.bucket, attachment.file_path);
            if (url) {
                if (action === 'preview') {
                    window.open(url, '_blank');
                } else {
                    // Trigger download
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = attachment.file_name || 'download';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                }
            }
        } finally {
            setLoadingId(null);
        }
    };

    if (isLoading) {
        return (
            <div className={cn("flex items-center justify-center py-6", className)}>
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Cargando adjuntos...</span>
            </div>
        );
    }

    if (attachments.length === 0) {
        return (
            <div className={cn("flex items-center justify-center py-6 text-muted-foreground", className)}>
                <Paperclip className="h-4 w-4 mr-2" />
                <span className="text-sm">Sin adjuntos</span>
            </div>
        );
    }

    return (
        <div className={cn("space-y-2", className)}>
            {attachments.map((attachment) => (
                <div
                    key={attachment.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="flex-shrink-0 p-2 rounded-md bg-muted">
                            {getFileIcon(attachment.file_type)}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">
                                {attachment.file_name || "Archivo sin nombre"}
                            </p>
                            {attachment.file_size && (
                                <p className="text-xs text-muted-foreground">
                                    {formatFileSize(attachment.file_size)}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                        {loadingId === attachment.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleAction(attachment, 'preview')}
                                    title="Abrir"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleAction(attachment, 'download')}
                                    title="Descargar"
                                >
                                    <Download className="h-4 w-4" />
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
