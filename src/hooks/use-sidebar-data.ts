"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { useOrganization } from "@/context/organization-context";
import { Organization, Project } from "@/components/layout/dashboard/sidebar-version/buttons";
import { fetchProjectsAction } from "@/features/projects/actions/fetch-projects";

interface SidebarData {
    currentOrg: Organization | null;
    projects: Project[];
    currentProject: Project | null;
    isLoading: boolean;
    handleProjectChange: (projectId: string) => void;
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
 */
export function useSidebarData(): SidebarData {
    const { activeOrgId } = useOrganization();

    const [currentOrg, setCurrentOrg] = React.useState<Organization | null>(null);
    const [projects, setProjects] = React.useState<Project[]>([]);
    const [currentProject, setCurrentProject] = React.useState<Project | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);

    // Memoize supabase client
    const supabase = React.useMemo(() => createClient(), []);

    // Memoize orgId to avoid dependency issues
    const orgId = activeOrgId ?? null;

    // Fetch current organization on mount
    React.useEffect(() => {
        if (!orgId) {
            setCurrentOrg(null);
            return;
        }

        async function fetchOrg() {
            try {
                const { data } = await supabase
                    .from('organizations')
                    .select('id, name, logo_path')
                    .eq('id', orgId)
                    .single();

                if (data) {
                    setCurrentOrg({
                        id: data.id,
                        name: data.name,
                        logo_path: buildLogoUrl(data.logo_path),
                    });
                }
            } catch (error) {
                console.error('Error fetching organization:', error);
            }
        }

        fetchOrg();
    }, [supabase, orgId]);

    // Fetch projects using server action (same as header project selector)
    React.useEffect(() => {
        if (!orgId) {
            setProjects([]);
            setIsLoading(false);
            return;
        }

        async function fetchProjects() {
            try {
                setIsLoading(true);
                const fetched = await fetchProjectsAction(orgId!);

                // Map to our Project type
                const mappedProjects: Project[] = fetched.map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    image_path: p.image_path || p.image_url,
                    color: p.color,
                    custom_color_hex: p.custom_color_hex,
                    use_custom_color: p.use_custom_color,
                }));

                setProjects(mappedProjects);

                // Set first project as current if none selected
                if (mappedProjects.length > 0 && !currentProject) {
                    setCurrentProject(mappedProjects[0]);
                }
            } catch (error) {
                console.error('Error fetching projects:', error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchProjects();
    }, [orgId, currentProject]);

    // Handle project change - updates state and saves preference
    // Navigation is handled by the caller
    const handleProjectChange = React.useCallback(async (projectId: string) => {
        const newProject = projects.find(p => p.id === projectId);
        if (newProject) {
            setCurrentProject(newProject);

            // Update preference in DB (fire and forget)
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user && orgId) {
                    const { data: userData } = await supabase
                        .from('users')
                        .select('id')
                        .eq('auth_id', user.id)
                        .single();

                    if (userData) {
                        await supabase
                            .from('user_organization_preferences')
                            .upsert({
                                user_id: userData.id,
                                organization_id: orgId,
                                last_project_id: projectId,
                            }, { onConflict: 'user_id,organization_id' });
                    }
                }
            } catch (error) {
                console.error('Error updating project preference:', error);
            }
        }

        return newProject; // Return the project for the caller to use
    }, [projects, supabase, orgId]);

    return {
        currentOrg,
        projects,
        currentProject,
        isLoading,
        handleProjectChange,
    };
}

