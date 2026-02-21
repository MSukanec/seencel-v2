
"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { moveList } from "@/features/planner/actions";
import { createClient } from "@/lib/supabase/client";
import { KanbanBoard } from "@/features/planner/types";

const formSchema = z.object({
    target_board_id: z.string().min(1, "Selecciona un tablero"),
});

interface MoveListModalProps {
    listId: string;
    currentBoardId: string;
    organizationId: string;
    onSuccess: () => void;
}

export function MoveListModal({ listId, currentBoardId, organizationId, onSuccess }: MoveListModalProps) {
    const [isPending, startTransition] = useTransition();
    const [boards, setBoards] = useState<KanbanBoard[]>([]);
    const [loading, setLoading] = useState(true);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
    });

    useEffect(() => {
        const fetchBoards = async () => {
            const supabase = createClient();

            // We need to fetch boards for the same organization
            // Assuming currentBoardId implies which org we are in, or better, we can fetch all boards user has access to
            // But 'kanban_boards' usually has 'organization_id' and RLS restricts to user's org.
            // So simplistic fetch is fine.

            const { data, error } = await supabase
                .schema('planner').from('kanban_boards')
                .select('*')
                .eq('organization_id', organizationId)
                .neq('id', currentBoardId)
                .is('deleted_at', null)
                .order('name');

            if (data) {
                setBoards(data as KanbanBoard[]);
            }
            setLoading(false);
        };

        fetchBoards();
    }, [currentBoardId, organizationId]);

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        startTransition(async () => {
            try {
                await moveList(listId, values.target_board_id);
                toast.success("Columna movida correctamente");
                onSuccess();
            } catch (error) {
                toast.error("Error al mover la columna");
            }
        });
    };

    if (loading) return <div className="p-4 text-center text-muted-foreground">Cargando tableros...</div>;

    if (boards.length === 0) {
        return (
            <div className="p-4 text-center space-y-4">
                <p className="text-muted-foreground">No hay otros tableros disponibles para mover esta columna.</p>
                <div className="flex justify-end">
                    <Button variant="secondary" onClick={onSuccess}>Cerrar</Button>
                </div>
            </div>
        );
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="target_board_id"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Mover al tablero</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar tablero..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {boards.map((board) => (
                                        <SelectItem key={board.id} value={board.id}>
                                            {board.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={onSuccess}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isPending}>
                        {isPending ? "Moviendo..." : "Mover Columna"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

