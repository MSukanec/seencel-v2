import { requireAuthContext } from "@/lib/auth";
import { getTaskById } from "@/features/tasks/queries";
import { notFound, redirect } from "next/navigation";
import { TaskDetailShell } from "./task-detail-title";

// ============================================================================
// Server Layout — auth + data fetch, delegates rendering to client shell
// ============================================================================

export default async function TaskDetailLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ taskId: string }>;
}) {
    const { orgId } = await requireAuthContext();
    if (!orgId) redirect("/");

    const { taskId } = await params;
    const task = await getTaskById(taskId);
    if (!task) notFound();

    const displayName = task.name || task.custom_name || "Tarea";
    const truncatedName = displayName.length > 60
        ? displayName.slice(0, 57) + "..."
        : displayName;

    return (
        <TaskDetailShell taskName={truncatedName}>
            {children}
        </TaskDetailShell>
    );
}
