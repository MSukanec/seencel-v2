"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    FileText,
    Image as ImageIcon,
    MoreVertical,
    Download,
    ExternalLink,
    Film,
    File,
    Grid,
    List
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FileItem } from "../types";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { ToolbarTabs } from "@/components/layout/dashboard/shared/toolbar/toolbar-tabs";

// ============================================================================
// FILE GALLERY COMPONENT
// ============================================================================

interface FileGalleryProps {
    files: FileItem[];
    onRefresh?: () => void;
}

export function FileGallery({ files, onRefresh }: FileGalleryProps) {
    const [filter, setFilter] = useState("all");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [searchQuery, setSearchQuery] = useState("");

    const filteredFiles = files.filter((item) => {
        // Text search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            if (!item.media_files.file_name.toLowerCase().includes(query)) {
                return false;
            }
        }

        // Type filter
        if (filter === "all") return true;
        if (filter === "images") return item.media_files.file_type === 'image';
        if (filter === "docs") return item.media_files.file_type !== 'image' && item.media_files.file_type !== 'video';
        return true;
    });

    const getFileIcon = (type: string) => {
        if (type === 'image') return <ImageIcon className="h-8 w-8 text-blue-500" />;
        if (type === 'video') return <Film className="h-8 w-8 text-pink-500" />;
        if (type === 'pdf') return <FileText className="h-8 w-8 text-red-500" />;
        return <File className="h-8 w-8 text-gray-500" />;
    };

    const formatSize = (bytes: number | undefined | null) => {
        if (!bytes || bytes === 0) return '';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const getFileUrl = (file: any) => {
        if (file.signed_url) return file.signed_url;
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        return `${supabaseUrl}/storage/v1/object/public/${file.bucket}/${file.file_path}`;
    };

    const filterOptions = [
        { label: "Todos", value: "all", icon: File },
        { label: "Imágenes", value: "images", icon: ImageIcon },
        { label: "Documentos", value: "docs", icon: FileText },
    ];

    return (
        <div className="h-full flex flex-col">
            {/* Toolbar - Portaled to Header */}
            <Toolbar
                portalToHeader
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Buscar archivos..."
                leftActions={
                    <div className="flex items-center gap-2">
                        <ToolbarTabs
                            value={filter}
                            onValueChange={setFilter}
                            options={filterOptions}
                        />
                        <div className="flex items-center gap-1 bg-muted/50 rounded-md p-0.5 ml-2">
                            <Button
                                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setViewMode('grid')}
                            >
                                <Grid className="h-4 w-4" />
                            </Button>
                            <Button
                                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setViewMode('list')}
                            >
                                <List className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                }
            />

            {/* Content */}
            <ScrollArea className="flex-1">
                {filteredFiles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground border-2 border-dashed rounded-xl bg-muted/5 mx-4 my-6">
                        <ImageIcon className="h-12 w-12 mb-4 opacity-50" />
                        <p className="text-lg font-medium">No hay archivos en esta categoría</p>
                        <p className="text-sm">Sube archivos para empezar a construir tu galería.</p>
                    </div>
                ) : (
                    <div className={viewMode === 'grid'
                        ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 p-6 pb-20"
                        : "space-y-2 p-6 pb-20"
                    }>
                        {filteredFiles.map((item) => {
                            const file = item.media_files;
                            const isImage = file.file_type === 'image';
                            const url = getFileUrl(file);

                            if (viewMode === 'list') {
                                return (
                                    <div key={item.id} className="group flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                                        <div className="h-10 w-10 flex items-center justify-center rounded bg-muted">
                                            {isImage ? (
                                                <img src={url} alt={file.file_name} className="h-full w-full object-cover rounded" />
                                            ) : (
                                                getFileIcon(file.file_type)
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{file.file_name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {[formatSize(file.file_size), file.created_at && new Date(file.created_at).toLocaleDateString()].filter(Boolean).join(' • ')}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" asChild>
                                                <a href={url} target="_blank" rel="noopener noreferrer" download>
                                                    <Download className="h-4 w-4" />
                                                </a>
                                            </Button>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <Card key={item.id} className="group overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300 bg-card/50 hover:bg-card">
                                    <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                                        {isImage ? (
                                            <img
                                                src={url}
                                                alt={file.file_name}
                                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center bg-secondary/20 group-hover:bg-secondary/30 transition-colors">
                                                {getFileIcon(file.file_type)}
                                            </div>
                                        )}

                                        {/* Overlay Actions */}
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2 backdrop-blur-[2px]">
                                            <Button variant="secondary" size="icon" className="rounded-full h-10 w-10" asChild>
                                                <a href={url} target="_blank" rel="noopener noreferrer">
                                                    <ExternalLink className="h-5 w-5" />
                                                </a>
                                            </Button>
                                            <Button variant="secondary" size="icon" className="rounded-full h-10 w-10" asChild>
                                                <a href={url} download>
                                                    <Download className="h-5 w-5" />
                                                </a>
                                            </Button>
                                        </div>

                                        {item.category && (
                                            <div className="absolute top-2 right-2">
                                                <Badge variant="secondary" className="backdrop-blur-md bg-black/40 text-white border-0">
                                                    {item.category}
                                                </Badge>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <h3 className="font-medium text-sm truncate" title={file.file_name}>
                                                    {file.file_name}
                                                </h3>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {[formatSize(file.file_size), file.created_at && new Date(file.created_at).toLocaleDateString()].filter(Boolean).join(' • ')}
                                                </p>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem>Ver detalles</DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive">Eliminar</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
