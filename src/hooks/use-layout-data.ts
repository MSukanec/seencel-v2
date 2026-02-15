"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { useOrganization } from "@/stores/organization-store";

// Project type used by the org/project selector
interface Project {
    id: string;
    name: string;
    image_path?: string | null;
    color?: string | null;
    custom_color_hex?: string | null;
    use_custom_color?: boolean;
    status?: string | null;
    // Theme fields (from projects_view via getSidebarProjects)
    image_palette?: {
        primary?: string;
        secondary?: string;
        accent?: string;
        background?: string;
    } | null;
    use_palette_theme?: boolean;
}

// Extended Organization type with founder info
interface Organization {
    id: string;
    name: string;
    logo_url?: string | null;
    isFounder?: boolean;
}
import { fetchProjectsAction } from "@/features/projects/actions";
import { saveLastActiveProject, fetchLastActiveProject } from "@/features/projects/actions";

interface LayoutData {
    currentOrg: Organization | null;
    projects: Project[];
    currentProject: Project | null;
    isLoading: boolean;
    handleProjectChange: (projectId: string) => void;
    saveProjectPreference: (projectId: string) => void;
}



/**
 * Hook to get current organization and projects for the sidebar
 * Uses server action for projects (same as header selector)
 * Loads and saves last_project_id from user preferences
 */
export function useLayoutData(): LayoutData {
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
                    .select('id, name, logo_url, settings')
                    .eq('id', orgId)
                    .single();

                if (data) {
                    setCurrentOrg({
                        id: data.id,
                        name: data.name,
                        logo_url: data.logo_url || null,
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
                    // Add cache-buster to force image reload
                    const logoUrl = newData.logo_url || null;
                    const cacheBustedLogo = logoUrl ? `${logoUrl}?t=${Date.now()}` : null;
                    setCurrentOrg((prev) => ({
                        ...prev!,
                        name: newData.name,
                        logo_url: cacheBustedLogo,
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
                    status: p.status,
                    image_palette: p.image_palette,
                    use_palette_theme: p.use_palette_theme,
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

        // Realtime subscription for project changes (INSERT, UPDATE, DELETE)
        const channel = supabase
            .channel(`projects-sidebar-${orgId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'projects',
                    filter: `organization_id=eq.${orgId}`,
                },
                (payload) => {
                    const eventType = payload.eventType;

                    if (eventType === 'INSERT') {
                        const newProject = payload.new as any;
                        const mapped: Project = {
                            id: newProject.id,
                            name: newProject.name,
                            image_path: newProject.image_path || newProject.image_url,
                            color: newProject.color,
                            custom_color_hex: newProject.custom_color_hex,
                            use_custom_color: newProject.use_custom_color,
                            status: newProject.status,
                            image_palette: newProject.image_palette,
                            use_palette_theme: newProject.use_palette_theme,
                        };
                        // Add to the end of the list
                        setProjects(prev => [...prev, mapped]);
                    }

                    if (eventType === 'DELETE') {
                        const deletedId = (payload.old as any)?.id;
                        if (deletedId) {
                            setProjects(prev => prev.filter(p => p.id !== deletedId));
                            // Clear current project if it was deleted
                            setCurrentProject(prev =>
                                prev?.id === deletedId ? null : prev
                            );
                        }
                    }

                    if (eventType === 'UPDATE') {
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
                                    status: updatedProject.status,
                                    image_palette: updatedProject.image_palette,
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
                                    status: updatedProject.status,
                                    image_palette: updatedProject.image_palette,
                                    // Keep existing use_palette_theme (realtime on projects table doesn't include it)
                                    use_palette_theme: prev.use_palette_theme,
                                };
                            }
                            return prev;
                        });
                    }
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

