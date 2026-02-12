"use client";

import { createContext, useContext, type ReactNode } from "react";

// ============================================================================
// PROJECT STATUS CONTEXT
// ============================================================================
// Propagates the current project's status to all children within the
// project layout. Used to enable read-only mode for inactive projects.
// ============================================================================

type ProjectStatus = 'active' | 'inactive' | 'planning' | 'completed';

interface ProjectStatusContextType {
    projectId: string;
    projectStatus: ProjectStatus;
    /** True when the project is NOT active — mutations should be blocked */
    isReadOnly: boolean;
}

const ProjectStatusContext = createContext<ProjectStatusContextType | null>(null);

// === Provider ===

interface ProjectStatusProviderProps {
    projectId: string;
    projectStatus: string;
    children: ReactNode;
}

export function ProjectStatusProvider({
    projectId,
    projectStatus,
    children,
}: ProjectStatusProviderProps) {
    const status = (projectStatus as ProjectStatus) || 'active';
    const isReadOnly = status !== 'active';

    return (
        <ProjectStatusContext.Provider value={{ projectId, projectStatus: status, isReadOnly }}>
            {children}
        </ProjectStatusContext.Provider>
    );
}

// === Hooks ===

/**
 * Use inside project pages — throws if used outside ProjectStatusProvider.
 */
export function useProjectStatus(): ProjectStatusContextType {
    const context = useContext(ProjectStatusContext);
    if (!context) {
        throw new Error("useProjectStatus must be used within a ProjectStatusProvider");
    }
    return context;
}

/**
 * Safe version — returns null outside project context.
 * Use in shared components (e.g., Toolbar) that render both inside and outside projects.
 */
export function useProjectStatusSafe(): ProjectStatusContextType | null {
    return useContext(ProjectStatusContext);
}
