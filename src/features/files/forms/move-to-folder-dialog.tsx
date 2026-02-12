"use client";

import { useState, useCallback } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Folder as FolderIcon,
    FolderOpen,
    FolderX,
    Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { moveFileToFolder } from "../actions";
import type { Folder, FileItem } from "../types";

// ============================================================================
// MOVE TO FOLDER DIALOG
// ============================================================================

interface MoveToFolderDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    file: FileItem | null;
    folders: Folder[];
    onSuccess?: () => void;
}

export function MoveToFolderDialog({
    open,
    onOpenChange,
    file,
    folders,
    onSuccess,
}: MoveToFolderDialogProps) {
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [isMoving, setIsMoving] = useState(false);

    // Reset selection when dialog opens
    const handleOpenChange = useCallback((open: boolean) => {
        if (open && file) {
            setSelectedFolderId(file.folder_id ?? null);
        }
        onOpenChange(open);
    }, [file, onOpenChange]);

    const handleMove = useCallback(async () => {
        if (!file) return;
        setIsMoving(true);

        try {
            const result = await moveFileToFolder(file.id, selectedFolderId);
            if (result.success) {
                const folderName = selectedFolderId
                    ? folders.find(f => f.id === selectedFolderId)?.name
                    : null;
                toast.success(
                    folderName
                        ? `Archivo movido a "${folderName}"`
                        : "Archivo removido de la carpeta"
                );
                onOpenChange(false);
                onSuccess?.();
            } else {
                toast.error(result.error || "Error al mover archivo");
            }
        } catch {
            toast.error("Error inesperado");
        } finally {
            setIsMoving(false);
        }
    }, [file, selectedFolderId, folders, onOpenChange, onSuccess]);

    // Get root-level folders (no parent)
    const rootFolders = folders.filter(f => !f.parent_id);

    // Get children of a folder
    const getChildren = (parentId: string) =>
        folders.filter(f => f.parent_id === parentId);

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Mover a carpeta</DialogTitle>
                    <DialogDescription>
                        {file?.media_files.file_name}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-1 max-h-[300px] overflow-y-auto py-2">
                    {/* "No folder" option */}
                    <button
                        onClick={() => setSelectedFolderId(null)}
                        className={cn(
                            "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left",
                            selectedFolderId === null
                                ? "bg-primary/10 text-primary font-medium"
                                : "hover:bg-accent text-muted-foreground"
                        )}
                    >
                        <FolderX className="h-4 w-4 shrink-0" />
                        Sin carpeta
                    </button>

                    {/* Folder list */}
                    {rootFolders.map(folder => (
                        <FolderOption
                            key={folder.id}
                            folder={folder}
                            selectedId={selectedFolderId}
                            onSelect={setSelectedFolderId}
                            getChildren={getChildren}
                            depth={0}
                        />
                    ))}

                    {rootFolders.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            No hay carpetas creadas aún.
                        </p>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isMoving}
                    >
                        Cancelar
                    </Button>
                    <Button onClick={handleMove} disabled={isMoving}>
                        {isMoving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Mover
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ============================================================================
// FOLDER OPTION (recursive for children)
// ============================================================================

interface FolderOptionProps {
    folder: Folder;
    selectedId: string | null;
    onSelect: (id: string) => void;
    getChildren: (parentId: string) => Folder[];
    depth: number;
}

function FolderOption({ folder, selectedId, onSelect, getChildren, depth }: FolderOptionProps) {
    const isSelected = selectedId === folder.id;
    const children = getChildren(folder.id);

    return (
        <>
            <button
                onClick={() => onSelect(folder.id)}
                className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left",
                    isSelected
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-accent"
                )}
                style={{ paddingLeft: `${12 + depth * 20}px` }}
            >
                {isSelected ? (
                    <FolderOpen className="h-4 w-4 shrink-0" />
                ) : (
                    <FolderIcon className="h-4 w-4 shrink-0" />
                )}
                <span className="truncate">{folder.name}</span>
                {folder.file_count !== undefined && folder.file_count > 0 && (
                    <span className="text-xs text-muted-foreground ml-auto shrink-0">
                        {folder.file_count}
                    </span>
                )}
            </button>
            {children.map(child => (
                <FolderOption
                    key={child.id}
                    folder={child}
                    selectedId={selectedId}
                    onSelect={onSelect}
                    getChildren={getChildren}
                    depth={depth + 1}
                />
            ))}
        </>
    );
}
