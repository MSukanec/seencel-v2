'use server';

import { createClient } from "@/lib/supabase/server";

export interface PublicProject {
    id: string;
    name: string;
    image_url: string | null;
    lat: number;
    lng: number;
    city: string | null;
    country: string | null;
    org_name: string;
    org_logo: string | null;
    project_type_name: string | null;
}

/**
 * Get all public projects from organizations with paid plans (pro, teams, enterprise)
 * This is a public query - no user auth required
 */
export async function getPublicProjects(): Promise<PublicProject[]> {
    const supabase = await createClient();

    // Query projects with their organization and plan info
    const { data, error } = await supabase
        .from('projects')
        .select(`
            id,
            name,
            image_url,
            project_data!inner(
                lat,
                lng,
                city,
                country,
                is_public
            ),
            organization:organizations!inner(
                id,
                name,
                logo_path,
                plan_id,
                plan:plans(slug)
            ),
            project_type:project_types(name)
        `)
        .eq('project_data.is_public', true)
        .not('project_data.lat', 'is', null)
        .not('project_data.lng', 'is', null)
        .eq('is_deleted', false);

    if (error) {
        console.error('Error fetching public projects:', error);
        return [];
    }

    // Filter by paid plans and transform data
    const paidPlanSlugs = ['pro', 'teams', 'enterprise'];

    return (data || [])
        .filter((project: any) => {
            const org = Array.isArray(project.organization)
                ? project.organization[0]
                : project.organization;
            const plan = org?.plan;
            const planObj = Array.isArray(plan) ? plan[0] : plan;
            return planObj?.slug && paidPlanSlugs.includes(planObj.slug);
        })
        .map((project: any) => {
            const pd = Array.isArray(project.project_data)
                ? project.project_data[0]
                : project.project_data;
            const org = Array.isArray(project.organization)
                ? project.organization[0]
                : project.organization;
            const pt = Array.isArray(project.project_type)
                ? project.project_type[0]
                : project.project_type;

            return {
                id: project.id,
                name: project.name,
                image_url: project.image_url,
                lat: Number(pd?.lat),
                lng: Number(pd?.lng),
                city: pd?.city || null,
                country: pd?.country || null,
                org_name: org?.name || 'Unknown',
                org_logo: org?.logo_path || null,
                project_type_name: pt?.name || null,
            };
        })
        .filter((p: PublicProject) => !isNaN(p.lat) && !isNaN(p.lng));
}
