import { getBoardWithData } from "@/features/kanban/queries";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { notFound } from "next/navigation";

interface KanbanBoardPageProps {
    params: Promise<{
        boardId: string;
    }>;
}

export default async function KanbanBoardPage({ params }: KanbanBoardPageProps) {
    const { boardId } = await params;

    const data = await getBoardWithData(boardId);

    if (!data) {
        notFound();
    }

    const { board, lists, labels, members } = data;

    return (
        <div className="flex flex-col h-[calc(100vh-65px)]">
            {/* Board Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex items-center gap-3">
                    {board.color && (
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: board.color }}
                        />
                    )}
                    <h1 className="text-xl font-semibold">{board.name}</h1>
                    {board.project_name && (
                        <span className="text-sm text-muted-foreground">
                            en {board.project_name}
                        </span>
                    )}
                </div>
            </div>

            {/* Board Content */}
            <KanbanBoard
                board={board}
                lists={lists}
                labels={labels}
                members={members}
            />
        </div>
    );
}
