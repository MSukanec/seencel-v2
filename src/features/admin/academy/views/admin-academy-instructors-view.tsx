"use client";

import { useState } from "react";
import { Plus, Users } from "lucide-react";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/ui/empty-state";
import { InstructorsTable } from "@/features/academy/components/admin/instructors-table";
import { InstructorForm } from "@/features/academy/components/admin/instructor-form";

interface Instructor {
    id: string;
    name: string;
    title: string | null;
    bio: string | null;
    avatar_path: string | null;
    credentials: string[] | null;
    linkedin_url: string | null;
    youtube_url: string | null;
    instagram_url: string | null;
}

interface AdminAcademyInstructorsViewProps {
    instructors: Instructor[];
}

/**
 * Admin Academy Instructors View
 * Shows instructors table with Toolbar in header including search and create action.
 */
export function AdminAcademyInstructorsView({ instructors }: AdminAcademyInstructorsViewProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [formOpen, setFormOpen] = useState(false);

    const handleSuccess = () => {
        router.refresh();
        setFormOpen(false);
    };

    const handleCreate = () => {
        setFormOpen(true);
    };

    // Filter instructors by search query
    const filteredInstructors = instructors.filter((i) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            i.name?.toLowerCase().includes(query) ||
            i.title?.toLowerCase().includes(query) ||
            i.bio?.toLowerCase().includes(query)
        );
    });

    // Empty state
    if (instructors.length === 0) {
        return (
            <>
                <Toolbar
                    portalToHeader
                    actions={[
                        { label: "Nuevo Instructor", icon: Plus, onClick: handleCreate }
                    ]}
                />
                <InstructorForm open={formOpen} onOpenChange={setFormOpen} />
                <div className="h-full flex items-center justify-center">
                    <EmptyState
                        icon={Users}
                        title="No hay instructores"
                        description="Agrega tu primer instructor."
                    />
                </div>
            </>
        );
    }

    return (
        <>
            <Toolbar
                portalToHeader
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Buscar instructores..."
                actions={[
                    { label: "Nuevo Instructor", icon: Plus, onClick: handleCreate }
                ]}
            />
            <InstructorForm open={formOpen} onOpenChange={setFormOpen} />
            <InstructorsTable instructors={filteredInstructors} />
        </>
    );
}
