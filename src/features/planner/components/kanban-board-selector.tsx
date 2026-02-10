"use client";

import { KanbanBoard } from "@/features/planner/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ViewEmptyState } from "@/components/shared/empty-state";
import {
    LayoutGrid,
    Plus,
    FolderKanban,
    Calendar,
    MoreHorizontal,
    Trash2,
    Archive,
    Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "@/i18n/routing";
import { Badge } from "@/components/ui/badge";

interface KanbanBoardSelectorProps {
    boards: KanbanBoard[];
    onCreateBoard?: () => void;
}

export function KanbanBoardSelector({ boards, onCreateBoard }: KanbanBoardSelectorProps) {
    if (boards.length === 0) {
        return (
            <ViewEmptyState
                mode="empty"
                icon={FolderKanban}
                viewName="Panel de Tareas"
                featureDescription="El panel de tareas es tu espacio para organizar ideas, pendientes y cosas por hacer. Creá columnas que representen estados (por hacer, en progreso, listo) y arrastrá tarjetas entre ellas. Podés asignar responsables, definir fechas límite y prioridades para coordinar el trabajo con tu equipo de forma visual."
                onAction={onCreateBoard}
                actionLabel="Crear primer panel"
                docsPath="/docs/agenda/kanban"
            />
        );
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {/* Create New Board Card */}
            <Card
                className={cn(
                    "cursor-pointer border-dashed border-2 hover:border-primary/50 transition-colors",
                    "flex items-center justify-center min-h-[140px]"
                )}
                onClick={onCreateBoard}
            >
                <CardContent className="flex flex-col items-center justify-center text-center p-4">
                    <div className="rounded-full bg-muted p-2 mb-2">
                        <Plus className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                        Nuevo Panel
                    </p>
                </CardContent>
            </Card>

            {/* Board Cards */}
            {boards.map((board) => (
                <Link
                    key={board.id}
                    href={`/organization/kanban/${board.id}` as any}
                    className="block"
                >
                    <Card
                        className={cn(
                            "cursor-pointer hover:shadow-md hover:border-primary/30 transition-all",
                            "group relative overflow-hidden"
                        )}
                    >
                        {/* Color Bar */}
                        <div
                            className="absolute top-0 left-0 right-0 h-1"
                            style={{ backgroundColor: board.color || '#84cc16' }}
                        />

                        <CardHeader className="pb-2">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <CardTitle className="text-base truncate">
                                        {board.name}
                                    </CardTitle>
                                    {board.project_name && (
                                        <Badge variant="secondary" className="mt-1 text-[10px]">
                                            {board.project_name}
                                        </Badge>
                                    )}
                                </div>

                                {/* Actions */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={(e) => e.preventDefault()}
                                        >
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                                            <Pencil className="h-4 w-4 mr-2" />
                                            Editar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                                            <Archive className="h-4 w-4 mr-2" />
                                            Archivar
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={(e) => e.stopPropagation()}
                                            className="text-destructive focus:text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Eliminar
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {board.description && (
                                <CardDescription className="text-xs line-clamp-2 mt-1">
                                    {board.description}
                                </CardDescription>
                            )}
                        </CardHeader>

                        <CardContent className="pt-0">
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <LayoutGrid className="h-3 w-3" />
                                    {board.list_count || 0} columnas
                                </div>
                                <div className="flex items-center gap-1">
                                    <FolderKanban className="h-3 w-3" />
                                    {board.card_count || 0} tarjetas
                                </div>
                            </div>

                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-2">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(board.created_at), "d MMM yyyy", { locale: es })}
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            ))}
        </div>
    );
}

