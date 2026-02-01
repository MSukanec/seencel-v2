"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { useOrganization } from "@/context/organization-context";
import { Project } from "@/components/layout/dashboard/sidebar-version/buttons";

// Extended Organization type with founder info
interface Organization {
    id: string;
    name: string;
    logo_path?: string | null;
    isFounder?: boolean;
}
import { fetchProjectsAction } from "@/features/projects/actions/fetch-projects";
import { saveLastActiveProject, fetchLastActiveProject } from "@/features/projects/actions";

interface SidebarData {
    currentOrg: Organization | null;
    projects: Project[];
    currentProject: Project | null;
    isLoading: boolean;
    handleProjectChange: (projectId: string) => void;
    saveProjectPreference: (projectId: string) => void;
}

// Helper to build the full logo URL from logo_path
function buildLogoUrl(logoPath: string | null | undefined): string | null {
    if (!logoPath) return null;

    // If it already starts with http, return as is
    if (logoPath.startsWith('http')) return logoPath;

    // Build the full URL from storage
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const path = logoPath.startsWith('organizations/')
        ? logoPath
        : `organizations/${logoPath}`;

    return `${supabaseUrl}/storage/v1/object/public/public-assets/${path}`;
}

/**
 * Hook to get current organization and projects for the sidebar
 * Uses server action for projects (same as header selector)
 * Loads and saves last_project_id from user preferences
 */
export function useSidebarData(): SidebarData {
    const { activeOrgId } = useOrganization();

    const [currentOrg, setCurrentOrg] = React.useState<Organization | null>(null);
    const [projects, setProjects] = React.useState<Project[]>([]);
    const [currentProject, setCurrentProject] = React.useState<Project | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [lastProjectIdLoaded, setLastProjectIdLoaded] = React.useState(false);

    // Memoize supabase client
    const supabase = React.useMemo(() => createClient(), []);

    // Memoize orgId to avoid dependency issues
    const orgId = activeOrgId ?? null;

    // Fetch current organization on mount and subscribe to changes
    React.useEffect(() => {
        if (!orgId) {
            setCurrentOrg(null);
            return;
        }

        async function fetchOrg() {
            try {
                const { data } = await supabase
                    .from('organizations')
                    .select('id, name, logo_path, settings')
                    .eq('id', orgId)
                    .single();

                if (data) {
                    setCurrentOrg({
                        id: data.id,
                        name: data.name,
                        logo_path: buildLogoUrl(data.logo_path),
                        isFounder: (data.settings as any)?.is_founder === true,
                    });
                }
            } catch (error) {
                console.error('Error fetching organization:', error);
            }
        }

        fetchOrg();

        // Realtime Subscription
        const channel = supabase
            .channel(`org-sidebar-${orgId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'organizations',
                    filter: `id=eq.${orgId}`,
                },
                (payload) => {
                    // Update local state when organization changes
                    const newData = payload.new as any;
                    setCurrentOrg((prev) => ({
                        ...prev!,
                        name: newData.name,
                        logo_path: buildLogoUrl(newData.logo_path),
                        isFounder: newData.settings?.is_founder === true,
                    }));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, orgId]);

    // Fetch projects and load last active project from preferences
    React.useEffect(() => {
        if (!orgId) {
            setProjects([]);
            setCurrentProject(null);
            setIsLoading(false);
            return;
        }

        async function fetchProjectsAndPreferences() {
            try {
                setIsLoading(true);

                // Fetch projects and last active project ID in parallel
                const [fetched, lastProjectId] = await Promise.all([
                    fetchProjectsAction(orgId!),
                    fetchLastActiveProject(orgId!)
                ]);

                // Map to our Project type
                let mappedProjects: Project[] = fetched.map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    image_path: p.image_path || p.image_url,
                    color: p.color,
                    custom_color_hex: p.custom_color_hex,
                    use_custom_color: p.use_custom_color,
                }));

                // Find the last active project
                let activeProject: Project | null = null;
                if (lastProjectId) {
                    activeProject = mappedProjects.find(p => p.id === lastProjectId) || null;
                }

                // If we have an active project, move it to the first position
                if (activeProject) {
                    mappedProjects = [
                        activeProject,
                        ...mappedProjects.filter(p => p.id !== activeProject!.id)
                    ];
                }

                setProjects(mappedProjects);

                // Set current project: either the last active one or the first one
                if (activeProject) {
                    setCurrentProject(activeProject);
                } else if (mappedProjects.length > 0) {
                    setCurrentProject(mappedProjects[0]);
                }

                setLastProjectIdLoaded(true);
            } catch (error) {
                console.error('Error fetching projects:', error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchProjectsAndPreferences();

        // Realtime subscription for project changes (image, name, color updates)
        const channel = supabase
            .channel(`projects-sidebar-${orgId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'projects',
                    filter: `organization_id=eq.${orgId}`,
                },
                (payload) => {
                    const updatedProject = payload.new as any;

                    // Update projects list with new data
                    setProjects(prev => prev.map(p =>
                        p.id === updatedProject.id
                            ? {
                                ...p,
                                name: updatedProject.name,
                                image_path: updatedProject.image_path || updatedProject.image_url,
                                color: updatedProject.color,
                                custom_color_hex: updatedProject.custom_color_hex,
                                use_custom_color: updatedProject.use_custom_color,
                            }
                            : p
                    ));

                    // Also update current project if it's the one that changed
                    setCurrentProject(prev => {
                        if (prev && prev.id === updatedProject.id) {
                            return {
                                id: prev.id,
                                name: updatedProject.name,
                                image_path: updatedProject.image_path || updatedProject.image_url,
                                color: updatedProject.color,
                                custom_color_hex: updatedProject.custom_color_hex,
                                use_custom_color: updatedProject.use_custom_color,
                            };
                        }
                        return prev;
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [orgId, supabase]);

    // Handle project change - updates state, saves preference, and reorders list
    const handleProjectChange = React.useCallback((projectId: string) => {
        const newProject = projects.find(p => p.id === projectId);
        if (newProject) {
            setCurrentProject(newProject);

            // Reorder projects: move selected to first position
            setProjects(prev => [
                newProject,
                ...prev.filter(p => p.id !== projectId)
            ]);

            // Save to database using server action (fire and forget)
            saveLastActiveProject(projectId).catch(error => {
                console.error('Error saving project preference:', error);
            });
        }
    }, [projects]);

    const saveProjectPreference = React.useCallback((projectId: string) => {
        saveLastActiveProject(projectId).catch(error => {
            console.error('Error saving project preference:', error);
        });
    }, []);

    return {
        currentOrg,
        projects,
        currentProject,
        isLoading,
        handleProjectChange,
        saveProjectPreference
    };
}

