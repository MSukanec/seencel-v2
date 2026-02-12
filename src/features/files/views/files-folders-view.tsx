"use client";

import { useState, useCallback, useMemo } from "react";
import { useModal } from "@/stores/modal-store";
import { useOptimisticList } from "@/hooks/use-optimistic-action";
import { toast } from "sonner";
import {
    Folder as FolderIcon,
    FolderOpen,
    FolderPlus,
    ChevronRight,
    MoreHorizontal,
    Pencil,
    Trash2,
    FileText,
    Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { cn } from "@/lib/utils";
import type { Folder, FileItem } from "../types";
import { deleteFolder } from "../actions";
import { FilesFolderForm } from "../forms/files-folder-form";
import { FileListItem } from "@/components/shared/list-item";

// ============================================================================
// FOLDER CARD
// ============================================================================

interface FolderCardProps {
    folder: Folder;
    isActive?: boolean;
    onClick: () => void;
    onRename: (folder: Folder) => void;
    onDelete: (folder: Folder) => void;
}

function FolderCard({ folder, isActive, onClick, onRename, onDelete }: FolderCardProps) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "group relative flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200",
                "hover:shadow-md hover:border-primary/30 hover:bg-accent/50",
                isActive
                    ? "border-primary/50 bg-primary/5 shadow-sm"
                    : "border-border/50 bg-card"
            )}
        >
            {/* Folder icon */}
            <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                isActive
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
            )}>
                {isActive ? (
                    <FolderOpen className="h-5 w-5" />
                ) : (
                    <FolderIcon className="h-5 w-5" />
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{folder.name}</p>
                <p className="text-xs text-muted-foreground">
                    {folder.file_count ?? 0} {(folder.file_count ?? 0) === 1 ? "documento" : "documentos"}
                </p>
            </div>

            {/* Actions dropdown */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRename(folder); }}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Renombrar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={(e) => { e.stopPropagation(); onDelete(folder); }}
                        className="text-destructive focus:text-destructive"
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Chevron */}
            <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
        </div>
    );
}

// ============================================================================
// BREADCRUMBS
// ============================================================================

interface BreadcrumbItem {
    id: string | null;
    name: string;
}

interface FolderBreadcrumbsProps {
    items: BreadcrumbItem[];
    onNavigate: (folderId: string | null) => void;
}

function FolderBreadcrumbs({ items, onNavigate }: FolderBreadcrumbsProps) {
    return (
        <div className="flex items-center gap-1 text-sm mb-4 px-1 overflow-x-auto">
            {items.map((item, index) => (
                <div key={item.id ?? "root"} className="flex items-center gap-1 shrink-0">
                    {index > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/50" />}
                    <button
                        onClick={() => onNavigate(item.id)}
                        className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded-md transition-colors",
                            index === items.length - 1
                                ? "font-medium text-foreground"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent"
                        )}
                    >
                        {index === 0 && <Home className="h-3.5 w-3.5" />}
                        <span className="truncate max-w-[150px]">{item.name}</span>
                    </button>
                </div>
            ))}
        </div>
    );
}

// ============================================================================
// FILES — FOLDERS VIEW
// ============================================================================

interface FilesFoldersViewProps {
    folders: Folder[];
    files: FileItem[];
    organizationId: string;
    onOpenFile?: (item: FileItem, index: number) => void;
    onDeleteFile?: (item: FileItem) => void;
    onMoveToFolder?: (item: FileItem) => void;
    /** Multi-selection support */
    isSelected?: (id: string) => boolean;
    onToggleSelect?: (id: string) => void;
    /** Map of project_id -> project name for badges */
    projectNameMap?: Record<string, string>;
    /** Map of project_id -> project color for badge backgrounds */
    projectColorMap?: Record<string, string>;
}

export function FilesFoldersView({
    folders: initialFolders,
    files,
    organizationId,
    onOpenFile,
    onDeleteFile,
    onMoveToFolder,
    isSelected,
    onToggleSelect,
    projectNameMap = {},
    projectColorMap = {},
}: FilesFoldersViewProps) {
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Folder | null>(null);
    const { openModal } = useModal();

    // Optimistic list for folders — instant UI feedback
    const {
        optimisticItems: folders,
        addItem,
        removeItem,
        updateItem,
    } = useOptimisticList<Folder>({
        items: initialFolders,
        getItemId: (f) => f.id,
    });

    // Build breadcrumb path
    const breadcrumbs = useMemo(() => {
        const items: BreadcrumbItem[] = [{ id: null, name: "Todas las carpetas" }];

        if (currentFolderId) {
            const buildPath = (folderId: string): BreadcrumbItem[] => {
                const folder = folders.find(f => f.id === folderId);
                if (!folder) return [];
                const parentPath = folder.parent_id ? buildPath(folder.parent_id) : [];
                return [...parentPath, { id: folder.id, name: folder.name }];
            };
            items.push(...buildPath(currentFolderId));
        }

        return items;
    }, [currentFolderId, folders]);

    // Current level: subfolders of currentFolderId
    const currentFolders = useMemo(() =>
        folders.filter(f => f.parent_id === currentFolderId),
        [folders, currentFolderId]
    );

    // Files in current folder (or unorganized at root)
    const currentFiles = useMemo(() => {
        if (currentFolderId) {
            return files.filter(f => f.folder_id === currentFolderId);
        }
        return files.filter(f => !f.folder_id);
    }, [files, currentFolderId]);

    // Create folder — optimistic
    const handleCreateFolder = useCallback(() => {
        openModal(
            <FilesFolderForm
                organizationId={organizationId}
                parentId={currentFolderId}
                onOptimisticCreate={(folder) => {
                    addItem(folder);
                }}
            />,
            {
                title: "Nueva Carpeta",
                description: "Creá una carpeta para organizar tus documentos.",
                size: "sm",
            }
        );
    }, [openModal, organizationId, currentFolderId, addItem]);

    // Rename folder — optimistic
    const handleRenameFolder = useCallback((folder: Folder) => {
        openModal(
            <FilesFolderForm
                organizationId={organizationId}
                editFolder={folder}
                onOptimisticRename={(folderId, newName) => {
                    updateItem(folderId, { name: newName });
                }}
            />,
            {
                title: "Renombrar Carpeta",
                description: `Cambiá el nombre de "${folder.name}".`,
                size: "sm",
            }
        );
    }, [openModal, organizationId, updateItem]);

    // Delete folder — optimistic
    const handleDeleteConfirm = useCallback(async () => {
        if (!deleteTarget) return;

        const folderId = deleteTarget.id;
        const folderName = deleteTarget.name;

        // 1. Optimistic: remove from UI immediately
        removeItem(folderId, async () => {
            const result = await deleteFolder(folderId);
            if (!result.success) {
                toast.error(result.error || "Error al eliminar carpeta");
                // React automatically reverts on error
                return;
            }
        });

        // 2. Navigate up if we were inside
        if (currentFolderId === folderId) {
            setCurrentFolderId(deleteTarget.parent_id);
        }

        // 3. Close dialog & toast
        setDeleteTarget(null);
        toast.success(`Carpeta "${folderName}" eliminada`);
    }, [deleteTarget, currentFolderId, removeItem]);

    // Navigate into folder
    const handleNavigateToFolder = useCallback((folderId: string | null) => {
        setCurrentFolderId(folderId);
    }, []);

    return (
        <div className="space-y-4">
            {/* Header: always show breadcrumbs + create button */}
            <div className="flex items-center justify-between px-1">
                {currentFolderId ? (
                    <FolderBreadcrumbs items={breadcrumbs} onNavigate={handleNavigateToFolder} />
                ) : (
                    <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                        <FolderIcon className="h-4 w-4" />
                        Carpetas
                    </h3>
                )}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCreateFolder}
                    className="gap-1.5 shrink-0"
                >
                    <FolderPlus className="h-4 w-4" />
                    Nueva Carpeta
                </Button>
            </div>

            {/* Subfolders */}
            {currentFolders.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {currentFolders.map((folder) => (
                        <FolderCard
                            key={folder.id}
                            folder={folder}
                            onClick={() => handleNavigateToFolder(folder.id)}
                            onRename={handleRenameFolder}
                            onDelete={setDeleteTarget}
                        />
                    ))}
                </div>
            )}

            {/* No folders hint (only at root, when no folders exist anywhere) */}
            {!currentFolderId && folders.length === 0 && (
                <div className="border border-dashed border-border/60 rounded-xl p-6 text-center">
                    <FolderOpen className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                        Creá carpetas como <strong>Contratos</strong>, <strong>Planos</strong>, <strong>BIM</strong> o <strong>Regulaciones</strong> para organizar tus documentos.
                    </p>
                </div>
            )}

            {/* Files in this folder */}
            {currentFiles.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-3 px-1">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-sm font-semibold text-muted-foreground">
                            {currentFolderId ? "Archivos" : "Sin organizar"}
                        </h3>
                        <span className="text-xs text-muted-foreground/60">
                            ({currentFiles.length})
                        </span>
                    </div>
                    <div className="space-y-2">
                        {currentFiles.map((item, index) => (
                            <FileListItem
                                key={item.id}
                                item={item}
                                selected={isSelected?.(item.id)}
                                onToggleSelect={onToggleSelect}
                                onClick={() => onOpenFile?.(item, index)}
                                onDelete={() => onDeleteFile?.(item)}
                                onMoveToFolder={onMoveToFolder}
                                projectName={item.project_id ? projectNameMap[item.project_id] : null}
                                projectColor={item.project_id ? projectColorMap[item.project_id] : null}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar carpeta?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Se eliminará la carpeta <span className="font-medium text-foreground">{deleteTarget?.name}</span>.
                            Los documentos dentro no se eliminarán, quedarán sin carpeta.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
