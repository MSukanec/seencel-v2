"use client";

import { FolderOpen } from "lucide-react";
import { PageWrapper, ContentLayout } from "@/components/layout";
import { FileGallery } from "../components/file-gallery";
import { FileItem } from "../types";

// ============================================================================
// FILES PAGE VIEW
// ============================================================================
// Shared view for Files that works in both Organization and Project contexts
// - Organization context: Shows all org files
// - Project context: Shows only project-specific files
// ============================================================================

interface FilesPageViewProps {
    organizationId: string;
    projectId?: string | null;
    files: FileItem[];
    onRefresh?: () => void;
}

export function FilesPageView({
    organizationId,
    projectId,
    files,
    onRefresh
}: FilesPageViewProps) {
    return (
        <PageWrapper
            type="page"
            title="Archivos"
            icon={<FolderOpen />}
        >
            <ContentLayout variant="wide">
                <FileGallery
                    files={files}
                    onRefresh={onRefresh}
                />
            </ContentLayout>
        </PageWrapper>
    );
}
