"use client";

import { useState, useEffect, useTransition } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Package, Undo2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { getImportHistory, revertImportBatch, ENTITY_TYPE_LABELS } from "@/lib/import";
import type { ImportBatch } from "@/lib/import";
import { toast } from "sonner";

interface ImportHistoryModalProps {
    organizationId: string;
    entityType?: string;
    entityTable?: string; // Table name for revert (e.g., 'materials', 'material_payments')
    onRevert?: () => void; // Callback after successful revert (to refresh data)
}

export function ImportHistoryModal({
    organizationId,
    entityType,
    entityTable = 'materials',
    onRevert
}: ImportHistoryModalProps) {
    const [batches, setBatches] = useState<ImportBatch[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    const [revertingId, setRevertingId] = useState<string | null>(null);

    useEffect(() => {
        loadHistory();
    }, [organizationId, entityType]);

    const loadHistory = async () => {
        setIsLoading(true);
        try {
            const data = await getImportHistory(organizationId, entityType);
            setBatches(data);
        } catch (error) {
            console.error("Error loading import history:", error);
            toast.error("Error al cargar el historial");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRevert = async (batchId: string) => {
        setRevertingId(batchId);
        startTransition(async () => {
            try {
                await revertImportBatch(batchId, entityTable);
                toast.success("Importación revertida correctamente");

                // Update local state
                setBatches(prev =>
                    prev.map(b => b.id === batchId ? { ...b, status: 'reverted' as const } : b)
                );

                onRevert?.();
            } catch (error) {
                console.error("Error reverting batch:", error);
                toast.error("Error al revertir la importación");
            } finally {
                setRevertingId(null);
            }
        });
    };

    if (isLoading) {
        return (
            <div className="space-y-3 p-4">
                {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))}
            </div>
        );
    }

    if (batches.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No hay importaciones registradas</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                    Las importaciones que realices aparecerán aquí
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <p className="text-xs text-muted-foreground px-1 mb-3">
                Mostrando las últimas 20 importaciones
            </p>

            <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                    {batches.map((batch) => (
                        <BatchItem
                            key={batch.id}
                            batch={batch}
                            isReverting={revertingId === batch.id}
                            onRevert={() => handleRevert(batch.id)}
                        />
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}

interface BatchItemProps {
    batch: ImportBatch;
    isReverting: boolean;
    onRevert: () => void;
}

function BatchItem({ batch, isReverting, onRevert }: BatchItemProps) {
    const isReverted = batch.status === 'reverted';
    const entityLabel = ENTITY_TYPE_LABELS[batch.entity_type] || batch.entity_type;

    const timeAgo = formatDistanceToNow(new Date(batch.created_at), {
        addSuffix: true,
        locale: es
    });

    return (
        <div className={cn(
            "flex items-center gap-3 p-3 rounded-lg border transition-colors",
            isReverted
                ? "bg-muted/30 border-muted"
                : "bg-card hover:bg-muted/30"
        )}>
            {/* Avatar */}
            <Avatar className="h-9 w-9">
                <AvatarImage src={batch.user_avatar_url} />
                <AvatarFallback className="text-xs">
                    {batch.user_full_name?.charAt(0) || 'U'}
                </AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">
                        {entityLabel}
                    </span>
                    <Badge
                        variant={isReverted ? "outline" : "secondary"}
                        className={cn(
                            "text-xs",
                            isReverted && "text-muted-foreground"
                        )}
                    >
                        {batch.record_count} registros
                    </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span>{batch.user_full_name}</span>
                    <span>·</span>
                    <span>{timeAgo}</span>
                </div>
            </div>

            {/* Status / Action */}
            {isReverted ? (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                    <XCircle className="h-4 w-4" />
                    <span className="text-xs">Revertido</span>
                </div>
            ) : (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRevert}
                    disabled={isReverting}
                    className="h-8 gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                    <Undo2 className="h-3.5 w-3.5" />
                    {isReverting ? "Revirtiendo..." : "Revertir"}
                </Button>
            )}
        </div>
    );
}
