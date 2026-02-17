"use client";

import { useTranslations } from "next-intl";
import {
    LayoutDashboard,
    Building,
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
    MessageCircle,
    ScrollText,
    MessageSquareText,
    Receipt,
} from "lucide-react";
import { NavigationContext } from "@/stores/layout-store";
import { useFeatureFlags } from "@/providers/feature-flags-provider";
import { useOrganization } from "@/stores/organization-store";
import { useAccessContext, useViewingAs, useMemberModules } from "@/stores/access-context-store";
import { getExternalNavGroups } from "@/config/external-navigation-config";
import { isAccordionVisible } from "@/config/navigation-modules";
import { useMemo } from "react";

export interface NavItem {
    title: string;
    href: string;
    icon: React.ElementType;
    // Status properties
    disabled?: boolean;
    hidden?: boolean;
    status?: 'maintenance' | 'founders';
}

export interface NavGroup {
    id: string;
    label: string;
    items: NavItem[];
    defaultOpen?: boolean;
    standalone?: boolean;
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
    { id: 'organization', label: 'Espacio de Trabajo', icon: Building },
    // Portal removed — now lives as tab inside project detail page
    // Project removed from top-level sidebar as requested
    { id: 'learnings', label: 'Academia', icon: GraduationCap },
    { id: 'community', label: 'Comunidad', icon: Users },
    // Admin visible only to admins (filtered in useMemo below)
    { id: 'admin', label: 'Administración', icon: Hammer },
];

export const contextRoutes: Record<NavigationContext, string> = {
    home: '/hub',
    organization: '/organization',
    project: '/organization/projects',
    learnings: '/academy/my-courses',
    community: '/community',
    admin: '/admin'
};

export function useSidebarNavigation() {
    const tMega = useTranslations('MegaMenu');
    const tSidebar = useTranslations('Sidebar');
    const { statuses, isAdmin, isBetaTester } = useFeatureFlags();
    const { isFounder } = useOrganization();
    const { accessMode, externalActorType } = useAccessContext();
    const viewingAs = useViewingAs();
    const memberVisibleModules = useMemberModules();

    // Combined flag for users who can bypass restrictions (but not see admin panel)
    const canBypassRestrictions = isAdmin || isBetaTester;

    const contexts = useMemo(() => {
        return ALL_CONTEXTS.map(ctx => {
            // Admin context: Only visible to admins (NOT beta testers)
            if (ctx.id === 'admin') {
                return isAdmin ? ctx : null;
            }

            // Mapping: Context ID -> Feature Flag Key
            let flagKey = null;
            if (ctx.id === 'organization' || ctx.id === 'project') flagKey = 'context_workspace_enabled';
            if (ctx.id === 'learnings') flagKey = 'context_academy_enabled';
            if (ctx.id === 'community') flagKey = 'context_community_enabled';

            if (!flagKey) return ctx;

            // Get Status (default to active)
            const status = statuses[flagKey] || 'active';

            // Logic:
            // 1. Hidden — only admins can see hidden items (NOT beta testers)
            if (status === 'hidden') {
                if (isAdmin) {
                    return { ...ctx, hidden: true };
                }
                return null;
            }

            // 2. Maintenance
            if (status === 'maintenance') {
                // Visually maintenance for everyone (admin/beta sees it too)
                const maintenanceItem: ContextItem = { ...ctx, status: 'maintenance' };

                if (canBypassRestrictions) {
                    // Admin/Beta: Clickable (not disabled)
                    return maintenanceItem;
                } else {
                    // User: Blocked
                    return { ...maintenanceItem, disabled: true };
                }
            }

            // 3. Founders
            if (status === 'founders') {
                const foundersItem: ContextItem = { ...ctx, status: 'founders' };

                // Allow if Admin OR Beta Tester OR Founder
                if (canBypassRestrictions || isFounder) {
                    return foundersItem; // Returns item with status badge, but NOT disabled
                } else {
                    return { ...foundersItem, disabled: true };
                }
            }

            // 4. Active
            return ctx;
        }).filter((ctx): ctx is ContextItem => ctx !== null);
    }, [statuses, isAdmin, isBetaTester, isFounder, canBypassRestrictions]);

    // Helper to compute item status
    const getItemStatus = (flagKey: string, baseItem: NavItem): NavItem | null => {
        const flag = statuses[flagKey] || 'active';

        if (flag === 'hidden') {
            // Only admins can see hidden items (NOT beta testers)
            return isAdmin ? { ...baseItem, hidden: true } : null;
        }

        if (flag === 'maintenance') {
            const updated = { ...baseItem, status: 'maintenance' as 'maintenance' };
            return canBypassRestrictions ? updated : { ...updated, disabled: true };
        }

        if (flag === 'founders') {
            const updated = { ...baseItem, status: 'founders' as 'founders' };
            // Allow Admin OR Beta Tester OR Founder
            if (canBypassRestrictions || isFounder) {
                return updated;
            } else {
                return { ...updated, disabled: true };
            }
        }

        return baseItem;
    };


    const getNavGroups = (ctx: 'organization' | 'project' | 'admin'): NavGroup[] => {
        // "Viewing As" mode: show external actor's own nav groups
        if (ctx === 'organization' && viewingAs) {
            return getExternalNavGroups(viewingAs.actorType);
        }

        // External mode: return external actor's own navigation config
        if (ctx === 'organization' && accessMode === 'external') {
            return getExternalNavGroups(externalActorType);
        }

        if (ctx === 'admin') {
            return [
                // Visión General (standalone)
                {
                    id: 'principal',
                    label: '',
                    standalone: true,
                    items: [
                        { title: 'Visión General', href: '/admin', icon: LayoutDashboard },
                    ],
                },
                // Directorio — personas, actividad y soporte
                {
                    id: 'directorio',
                    label: 'Directorio',
                    defaultOpen: true,
                    items: [
                        { title: 'Usuarios', href: '/admin/directory', icon: Users },
                        { title: 'Actividad', href: '/admin/audit-logs', icon: ScrollText },
                        { title: 'Soporte', href: '/admin/support', icon: MessageCircle },
                    ],
                },
                // Comercial
                {
                    id: 'comercial',
                    label: 'Comercial',
                    items: [
                        { title: 'Finanzas', href: '/admin/finance', icon: Wallet },
                        { title: 'Facturación', href: '/admin/billing', icon: Receipt },
                    ],
                },
                // Contenido
                {
                    id: 'contenido',
                    label: 'Contenido',
                    items: [
                        { title: 'Academia', href: '/admin/academy', icon: GraduationCap },
                        { title: 'Contenido HUB', href: '/admin/hub-content', icon: Sparkles },
                        { title: 'Catálogo Técnico', href: '/admin/catalog', icon: Package },
                        { title: 'Changelog', href: '/admin/changelog', icon: FileText },
                    ],
                },
                // Plataforma
                {
                    id: 'plataforma',
                    label: 'Plataforma',
                    items: [
                        { title: 'Sistema', href: '/admin/system', icon: Monitor },
                        { title: 'Plantillas', href: '/admin/settings', icon: LayoutTemplate },
                        { title: 'Emails', href: '/admin/emails', icon: LayoutTemplate },
                    ],
                },
            ];
        }

        // Unified sidebar — all routes under /organization
        // Filtered by memberVisibleModules (from preferences / onboarding)
        const allGroups: NavGroup[] = [
            // Visión General (standalone)
            {
                id: 'principal',
                label: '',
                standalone: true,
                items: [
                    getItemStatus('sidebar_overview', { title: 'Visión General', href: '/organization', icon: LayoutDashboard }),
                ].filter((i): i is NavItem => i !== null),
            },
            // Gestión
            {
                id: 'gestion',
                label: 'Gestión',
                defaultOpen: true,
                items: [
                    getItemStatus('sidebar_projects', { title: 'Proyectos', href: '/organization/projects', icon: Building }),
                    getItemStatus('sidebar_files', { title: 'Documentación', href: '/organization/files', icon: FolderOpen }),
                    getItemStatus('sidebar_contacts', { title: 'Contactos', href: '/organization/contacts', icon: Users }),
                    getItemStatus('sidebar_catalog', { title: 'Catálogo Técnico', href: '/organization/catalog', icon: Wrench }),
                    getItemStatus('sidebar_settings', { title: 'Configuración', href: '/organization/settings', icon: Settings }),
                    getItemStatus('sidebar_quotes', { title: 'Presupuestos', href: '/organization/quotes', icon: FileText }),
                    getItemStatus('sidebar_reports', { title: 'Informes', href: '/organization/reports', icon: FileChartColumn }),
                ].filter((i): i is NavItem => i !== null),
            },
            // Construcción
            {
                id: 'construccion',
                label: 'Construcción',
                items: [
                    getItemStatus('sidebar_tasks', { title: 'Tareas', href: '/organization/construction-tasks', icon: ClipboardList }),
                    getItemStatus('sidebar_materials', { title: 'Materiales', href: '/organization/materials', icon: Package }),
                    getItemStatus('sidebar_labor', { title: 'Mano de Obra', href: '/organization/labor', icon: HardHat }),
                    getItemStatus('sidebar_subcontracts', { title: 'Subcontratos', href: '/organization/subcontracts', icon: Handshake }),
                    getItemStatus('sidebar_sitelog', { title: tSidebar('items.sitelog'), href: '/organization/sitelog', icon: FileText }),
                    getItemStatus('sidebar_health', { title: 'Salud', href: '/organization/health', icon: HeartPulse }),
                ].filter((i): i is NavItem => i !== null),
            },
            // Finanzas
            {
                id: 'finanzas',
                label: 'Finanzas',
                items: [
                    getItemStatus('sidebar_finance', { title: 'Finanzas', href: '/organization/finance', icon: DollarSign }),
                    getItemStatus('sidebar_capital', { title: 'Capital', href: '/organization/capital', icon: Landmark }),
                    getItemStatus('sidebar_general_costs', { title: 'Gastos Generales', href: '/organization/general-costs', icon: CreditCard }),
                    getItemStatus('sidebar_clients', { title: 'Clientes', href: '/organization/clients', icon: Banknote }),
                ].filter((i): i is NavItem => i !== null),
            },
        ];

        // Filter by member's visible modules (from onboarding / preferences)
        return allGroups.filter(group => isAccordionVisible(group.id, memberVisibleModules));
    };

    const getNavItems = (ctx: NavigationContext): NavItem[] => {
        switch (ctx) {
            case 'organization':
            case 'project':
                return getNavGroups(ctx).flatMap(g => g.items);

            case 'learnings':
                return [
                    { title: 'Mis Cursos', href: '/academy/my-courses', icon: Video },
                ];
            case 'community':
                const foundersItem = getItemStatus('context_community_founders_enabled', { title: 'Fundadores', href: '/community/founders', icon: Sparkles });
                const mapItem = getItemStatus('context_community_map_enabled', { title: 'Mapa Seencel', href: '/community/map', icon: MapPin });

                return [foundersItem, mapItem].filter((i): i is NavItem => i !== null);
            case 'admin':
                return getNavGroups('admin').flatMap(g => g.items);
            default:
                return [];
        }
    };

    return {
        contexts,
        contextRoutes,
        getNavItems,
        getNavGroups,
    };
}
