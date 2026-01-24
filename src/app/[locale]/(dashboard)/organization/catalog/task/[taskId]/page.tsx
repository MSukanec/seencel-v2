import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getTaskById, getTaskMaterials, getAvailableMaterials, getUnits, getTaskDivisions } from "@/features/tasks/queries";
import { TaskDetailView } from "@/features/tasks/components/detail/task-detail-view";
import { ContentLayout } from "@/components/layout/dashboard/shared/content-layout";
import { PageWrapper } from "@/components/layout/dashboard/shared/page-wrapper";
import { Button } from "@/components/ui/button";

interface TaskDetailPageProps {
    params: Promise<{
        taskId: string;
    }>;
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
    const { taskId } = await params;
    const supabase = await createClient();

    // Get current user's org
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: membership } = await supabase
        .from("members")
        .select("organization_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

    if (!membership) redirect("/onboarding");
    const orgId = membership.organization_id;

    // Fetch task data
    const task = await getTaskById(taskId);
    if (!task) notFound();

    // Fetch related data in parallel
    const [taskMaterials, availableMaterials, { data: units }, { data: divisions }] = await Promise.all([
        getTaskMaterials(taskId),
        getAvailableMaterials(task.is_system, orgId),
        getUnits(),
        getTaskDivisions(),
    ]);

    const displayName = task.name || task.custom_name || "Tarea";

    return (
        <PageWrapper
            type="page"
            title={displayName}
            backButton={
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/organization/catalog">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
            }
        >
            <ContentLayout variant="wide">
                <TaskDetailView
                    task={task}
                    taskMaterials={taskMaterials}
                    availableMaterials={availableMaterials}
                    units={units}
                    divisions={divisions}
                    isAdminMode={false}
                />
            </ContentLayout>
        </PageWrapper>
    );
}
