"use client";

import { useTranslations } from "next-intl";
import { useActiveProjectId } from "@/store/layout-store";
import {
    LayoutDashboard,
    Building,
    Briefcase,
    DollarSign,
    GraduationCap,
    Users,
    Settings,
    FileText,
    CreditCard,
    FileChartColumn,
    Hammer,
    HardHat,
    Video,
    Monitor,
    Info,
    Wrench,
    MapPin,
    Sparkles,
    Package,
    CalendarDays,
    FolderOpen,
    ClipboardList,
    Banknote,
    Wallet,
    HeartPulse,
    Handshake,
    Landmark,
    LayoutTemplate,
} from "lucide-react";
import { NavigationContext } from "@/store/layout-store";
import { useFeatureFlags } from "@/providers/feature-flags-provider";
import { useOrganization } from "@/context/organization-context";
import { useMemo } from "react";

export interface NavItem {
    title: string;
    href: string;
    icon: React.ElementType;
    sectionHeader?: string;
    // Status properties
    disabled?: boolean;
    hidden?: boolean;
    status?: 'maintenance' | 'founders';
}

export interface ContextItem {
    id: NavigationContext;
    label: string;
    icon: React.ElementType;
    disabled?: boolean;
    hidden?: boolean;
    status?: 'maintenance' | 'founders';
}

const ALL_CONTEXTS: ContextItem[] = [
    { id: 'organization', label: 'Organización', icon: Briefcase },
    { id: 'portal', label: 'Portal de Clientes', icon: Building },
    // Project removed from top-level sidebar as requested
    { id: 'learnings', label: 'Academia', icon: GraduationCap },
    { id: 'community', label: 'Comunidad', icon: Users },
    // Admin moved to sidebar footer (SidebarAdminButton)
];

export const contextRoutes: Record<NavigationContext, string> = {
    home: '/hub',
    organization: '/organization',
    project: '/organization/projects',
    portal: '/portal',
    learnings: '/academy/my-courses',
    community: '/community',
    admin: '/admin'
};

export function useSidebarNavigation() {
    const activeProjectId = useActiveProjectId();
    const tMega = useTranslations('MegaMenu');
    const tSidebar = useTranslations('Sidebar');
    const { statuses, isAdmin } = useFeatureFlags();
    const { isFounder } = useOrganization();

    const contexts = useMemo(() => {
        return ALL_CONTEXTS.map(ctx => {
            // Mapping: Context ID -> Feature Flag Key
            let flagKey = null;
            if (ctx.id === 'organization' || ctx.id === 'project') flagKey = 'context_workspace_enabled';
            if (ctx.id === 'portal') flagKey = 'context_portal_enabled';
            if (ctx.id === 'learnings') flagKey = 'context_academy_enabled';
            if (ctx.id === 'community') flagKey = 'context_community_enabled';

            // Admin is handled separately via SidebarAdminButton

            if (!flagKey) return ctx;

            // Get Status (default to active)
            const status = statuses[flagKey] || 'active';

            // Logic:
            // 1. Hidden
            if (status === 'hidden') {
                if (isAdmin) {
                    return { ...ctx, hidden: true };
                }
                return null;
            }

            // 2. Maintenance
            if (status === 'maintenance') {
                // Visually maintenance for everyone (admin sees it too)
                const maintenanceItem: ContextItem = { ...ctx, status: 'maintenance' };

                if (isAdmin) {
                    // Admin: Clickable (not disabled)
                    return maintenanceItem;
                } else {
                    // User: Blocked
                    return { ...maintenanceItem, disabled: true };
                }
            }

            // 3. Founders
            if (status === 'founders') {
                const foundersItem: ContextItem = { ...ctx, status: 'founders' };

                // Allow if Admin OR Founder
                if (isAdmin || isFounder) {
                    return foundersItem; // Returns item with status badge, but NOT disabled
                } else {
                    return { ...foundersItem, disabled: true };
                }
            }

            // 4. Active
            return ctx;
        }).filter((ctx): ctx is ContextItem => ctx !== null);
    }, [statuses, isAdmin, isFounder]);

    // Helper to compute item status
    const getItemStatus = (flagKey: string, baseItem: NavItem): NavItem | null => {
        const flag = statuses[flagKey] || 'active';

        if (flag === 'hidden') {
            return isAdmin ? { ...baseItem, hidden: true } : null;
        }

        if (flag === 'maintenance') {
            const updated = { ...baseItem, status: 'maintenance' as 'maintenance' };
            return isAdmin ? updated : { ...updated, disabled: true };
        }

        if (flag === 'founders') {
            const updated = { ...baseItem, status: 'founders' as 'founders' };
            // Allow Admin OR Founder
            if (isAdmin || isFounder) {
                return updated;
            } else {
                return { ...updated, disabled: true };
            }
        }

        return baseItem;
    };

    const getNavItems = (ctx: NavigationContext): NavItem[] => {
        switch (ctx) {
            case 'organization':
                const orgItems = [
                    getItemStatus('sidebar_org_overview', { title: tMega('Organization.items.overview'), href: '/organization', icon: LayoutDashboard }),
                    getItemStatus('sidebar_org_planner', { title: 'Agenda', href: '/organization/planner', icon: CalendarDays }),
                    getItemStatus('sidebar_org_files', { title: 'Archivos', href: '/organization/files', icon: FolderOpen }),
                    getItemStatus('sidebar_org_quotes', { title: 'Presupuestos', href: '/organization/quotes', icon: FileText }),
                    getItemStatus('sidebar_org_finance', { title: 'Finanzas', href: '/organization/finance', icon: DollarSign }),
                    getItemStatus('sidebar_org_projects', { title: 'Proyectos', href: '/organization/projects', icon: Briefcase, sectionHeader: 'Mi Organización' }),
                    getItemStatus('sidebar_org_identity', { title: tMega('Organization.items.identity'), href: '/organization/identity', icon: Building }),
                    getItemStatus('sidebar_org_catalog', { title: 'Catálogo Técnico', href: '/organization/catalog', icon: Wrench }),
                    getItemStatus('sidebar_org_contacts', { title: 'Contactos', href: '/organization/contacts', icon: Users }),
                    getItemStatus('sidebar_org_capital', { title: 'Capital', href: '/organization/capital', icon: Landmark }),
                    getItemStatus('sidebar_org_general_costs', { title: 'Gastos Generales', href: '/organization/general-costs', icon: CreditCard }),
                    getItemStatus('sidebar_org_reports', { title: 'Informes', href: '/organization/reports', icon: FileChartColumn }),
                    getItemStatus('sidebar_org_advanced', { title: 'Avanzado', href: '/organization/advanced', icon: Sparkles }),
                    getItemStatus('sidebar_org_settings', { title: 'Configuración', href: '/organization/settings', icon: Settings }),
                ];
                return orgItems.filter((i): i is NavItem => i !== null);
            case 'project':
                const projectBase = activeProjectId
                    ? `/project/${activeProjectId}`
                    : '/organization/projects';

                const projectItems = [
                    getItemStatus('sidebar_project_overview', {
                        title: 'Visión General',
                        href: projectBase,
                        icon: LayoutDashboard
                    }),
                    getItemStatus('sidebar_project_planner', {
                        title: 'Agenda',
                        href: activeProjectId ? `${projectBase}/planner` : '/organization/projects',
                        icon: CalendarDays
                    }),
                    getItemStatus('sidebar_project_files', {
                        title: 'Archivos',
                        href: activeProjectId ? `${projectBase}/files` : '/organization/projects',
                        icon: FolderOpen
                    }),
                    getItemStatus('sidebar_project_quotes', {
                        title: 'Presupuestos',
                        href: activeProjectId ? `${projectBase}/quotes` : '/organization/projects',
                        icon: FileText
                    }),
                    getItemStatus('sidebar_project_finance', {
                        title: 'Finanzas',
                        href: activeProjectId ? `${projectBase}/finance` : '/organization/projects',
                        icon: DollarSign
                    }),
                    getItemStatus('sidebar_project_details', {
                        title: 'Información',
                        href: activeProjectId ? `${projectBase}/details` : '/organization/projects',
                        icon: Info,
                        sectionHeader: 'Gestión'
                    }),
                    getItemStatus('sidebar_project_health', {
                        title: 'Salud',
                        href: activeProjectId ? `${projectBase}/health` : '/organization/projects',
                        icon: HeartPulse,
                        sectionHeader: tSidebar('construction')
                    }),
                    getItemStatus('sidebar_project_tasks', {
                        title: 'Tareas',
                        href: activeProjectId ? `${projectBase}/construction-tasks` : '/organization/projects',
                        icon: ClipboardList
                    }),
                    getItemStatus('sidebar_project_materials', {
                        title: 'Materiales',
                        href: activeProjectId ? `${projectBase}/materials` : '/organization/projects',
                        icon: Package
                    }),
                    getItemStatus('sidebar_project_labor', {
                        title: 'Mano de Obra',
                        href: activeProjectId ? `${projectBase}/labor` : '/organization/projects',
                        icon: HardHat
                    }),
                    getItemStatus('sidebar_project_subcontracts', {
                        title: 'Subcontratos',
                        href: activeProjectId ? `${projectBase}/subcontracts` : '/organization/projects',
                        icon: Handshake
                    }),
                    getItemStatus('sidebar_project_sitelog', {
                        title: tSidebar('items.sitelog'),
                        href: activeProjectId ? `${projectBase}/sitelog` : '/organization/projects',
                        icon: FileText
                    }),
                    getItemStatus('sidebar_project_clients', {
                        title: 'Compromisos y Pagos',
                        href: activeProjectId ? `${projectBase}/clients` : '/organization/projects',
                        icon: Banknote,
                        sectionHeader: 'Clientes'
                    }),
                    getItemStatus('sidebar_project_portal', {
                        title: 'Portal de Clientes',
                        href: activeProjectId ? `${projectBase}/portal` : '/organization/projects',
                        icon: Monitor
                    }),
                ];
                return projectItems.filter((i): i is NavItem => i !== null);
            case 'portal':
                // Portal is a direct link, no subitems
                return [];
            case 'learnings':
                return [
                    { title: 'Mis Cursos', href: '/academy/my-courses', icon: Video },
                ];
            case 'community':
                const foundersItem = getItemStatus('context_community_founders_enabled', { title: 'Fundadores', href: '/community/founders', icon: Sparkles });
                const mapItem = getItemStatus('context_community_map_enabled', { title: 'Mapa Seencel', href: '/community/map', icon: MapPin });

                return [foundersItem, mapItem].filter((i): i is NavItem => i !== null);
            case 'admin':
                return [
                    { title: 'Visión General', href: '/admin', icon: LayoutDashboard },
                    { title: 'Directorio', href: '/admin/directory', icon: Users },
                    { title: 'Academia', href: '/admin/academy', icon: GraduationCap },
                    { title: 'Finanzas', href: '/admin/finance', icon: Wallet },
                    { title: 'Plataforma', href: '/admin/system', icon: Monitor },
                    { title: 'Contenido HUB', href: '/admin/hub-content', icon: Sparkles },
                    { title: 'Plantillas', href: '/admin/emails', icon: LayoutTemplate },
                    { title: 'Changelog', href: '/admin/changelog', icon: FileText },
                    { title: 'Soporte', href: '/admin/support', icon: Wrench },
                    { title: 'Catálogo Técnico', href: '/admin/catalog', icon: Package },
                ];
            default:
                return [];
        }
    };

    return {
        contexts,
        contextRoutes,
        getNavItems
    };
}
