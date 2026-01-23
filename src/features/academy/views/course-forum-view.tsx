"use client";

import { ForumThread, ForumCategory } from "@/actions/forum";
import { ForumContainer } from "@/components/shared/forum";
import { ContentLayout } from "@/components/layout";

interface CourseForumViewProps {
    courseId: string;
    courseSlug: string;
    categories: ForumCategory[];
    threads: ForumThread[];
    currentUserId?: string;
}

export function CourseForumView({
    courseId,
    courseSlug,
    categories,
    threads,
    currentUserId,
}: CourseForumViewProps) {
    return (
        <ContentLayout variant="wide" className="pb-0">
            <ForumContainer
                courseId={courseId}
                courseSlug={courseSlug}
                categories={categories}
                threads={threads}
                currentUserId={currentUserId}
            />
        </ContentLayout>
    );
}

