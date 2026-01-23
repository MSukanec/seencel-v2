import { getTaskById, getTaskMaterials, getAvailableMaterials, getUnits, getTaskDivisions } from "@/features/tasks/queries";
import { notFound } from "next/navigation";
import { TaskDetailView } from "@/features/tasks/components/detail/task-detail-view";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface TaskDetailPageProps {
    params: Promise<{ taskId: string }>;
}

export default async function AdminTaskDetailPage({ params }: TaskDetailPageProps) {
    const { taskId } = await params;

    // Fetch task and related data in parallel
    const [task, taskMaterials, availableMaterials, unitsRes, divisionsRes] = await Promise.all([
        getTaskById(taskId),
        getTaskMaterials(taskId),
        getAvailableMaterials(true), // System tasks only
        getUnits(),
        getTaskDivisions()
    ]);

    if (!task) {
        notFound();
    }

    // Verify it's a system task for admin page
    if (!task.is_system) {
        notFound();
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex h-16 items-center px-6 gap-4">
                    <Button variant="ghost" size="icon" asChild className="shrink-0">
                        <Link href="/admin/catalog">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>

                    <div className="flex items-center gap-3 overflow-hidden">
                        {task.code && (
                            <code className="text-sm font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
                                {task.code}
                            </code>
                        )}
                        <h1 className="text-lg font-semibold truncate">
                            {task.name || task.custom_name}
                        </h1>
                    </div>

                    <div className="ml-auto flex items-center gap-2">
                        <Badge variant="destructive" className="gap-1">
                            <Shield className="h-3 w-3" />
                            Modo Admin
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-auto">
                <div className="max-w-4xl mx-auto space-y-6">
                    <TaskDetailView
                        task={task}
                        taskMaterials={taskMaterials}
                        availableMaterials={availableMaterials}
                        units={unitsRes.data}
                        divisions={divisionsRes.data}
                        isAdminMode={true}
                    />
                </div>
            </div>
        </div>
    );
}
