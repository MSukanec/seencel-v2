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
    Layers,
    Zap,
    LayoutGrid,
    Tag,

    FileType,

    Ruler,
    Shield,
    Activity,
    Info,
    UserCircle,
    Sliders,
    Bell,
    BookUser,
} from "lucide-react";
import { NavigationContext } from "@/stores/layout-store";
import { useFeatureFlags } from "@/providers/feature-flags-provider";
import { useOrganization } from "@/stores/organization-store";
import { useAccessContext, useViewingAs, useMemberModules } from "@/stores/access-context-store";
import { getExternalNavGroups } from "@/config/external-navigation-config";
import { isAccordionVisible } from "@/config/navigation-modules";
import { useMemo } from "react";

export interface NavSubItem {
    title: string;
    href: string;
    icon?: React.ElementType;
}

export interface NavItem {
    title: string;
    href: string;
    icon: React.ElementType;
    // Status properties
    disabled?: boolean;
    hidden?: boolean;
    status?: 'maintenance' | 'founders' | 'coming_soon';
    // Drill-down children (sidebar sub-navigation)
    children?: NavSubItem[];
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
    status?: 'maintenance' | 'founders' | 'coming_soon';
}

const ALL_CONTEXTS: ContextItem[] = [
    { id: 'organization', label: 'Espacio de Trabajo', icon: Building },
    // Portal removed — now lives as tab inside project detail page
    // Project removed from top-level sidebar as requested
    { id: 'learnings', label: 'Academia', icon: GraduationCap },
    { id: 'founders', label: 'Fundadores', icon: Sparkles },
    { id: 'community', label: 'Comunidad', icon: Users },
    { id: 'admin', label: 'Admin', icon: Shield },
];

export const contextRoutes: Record<NavigationContext, string> = {
    home: '/hub',
    organization: '/organization',
    project: '/organization/projects',
    learnings: '/academy/overview',
    founders: '/founders/program',
    community: '/community',
    admin: '/admin',
    settings: '/settings'
};

export function useSidebarNavigation() {
    const tMega = useTranslations('MegaMenu');
    const tSidebar = useTranslations('Sidebar');
    const { statuses, isAdmin, isBetaTester } = useFeatureFlags();
    const { isFounder, activeOrgId } = useOrganization();
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
            if (ctx.id === 'founders') flagKey = 'context_founders_enabled';
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

            // 3. Coming Soon
            if (status === 'coming_soon') {
                const comingSoonItem: ContextItem = { ...ctx, status: 'coming_soon' };

                if (canBypassRestrictions) {
                    return comingSoonItem;
                } else {
                    return { ...comingSoonItem, disabled: true };
                }
            }

            // 4. Founders
            if (status === 'founders') {
                const foundersItem: ContextItem = { ...ctx, status: 'founders' };

                // Allow if Admin OR Beta Tester OR Founder
                if (canBypassRestrictions || isFounder) {
                    return foundersItem; // Returns item with status badge, but NOT disabled
                } else {
                    return { ...foundersItem, disabled: true };
                }
            }

            // 5. Active
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

        if (flag === 'coming_soon') {
            const updated = { ...baseItem, status: 'coming_soon' as 'coming_soon' };
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


    const getNavGroups = (ctx: 'organization' | 'project' | 'admin' | 'settings'): NavGroup[] => {
        // Unified Settings context — independent sidebar
        if (ctx === 'settings') {
            const settingsGroups: NavGroup[] = [
                {
                    id: 'cuenta',
                    label: 'Mi Cuenta',
                    defaultOpen: true,
                    items: [
                        { title: 'Perfil', href: '/settings/profile', icon: UserCircle },
                        { title: 'Preferencias', href: '/settings/preferences', icon: Sliders },
                        { title: 'Notificaciones', href: '/settings/notifications', icon: Bell },
                        { title: 'Seguridad', href: '/settings/security', icon: Shield },
                        { title: 'Mis Organizaciones', href: '/settings/organizations', icon: Landmark },
                    ],
                },
            ];

            // Solo mostrar opciones de organización y espacio si hay una organización activa en contexto
            if (activeOrgId) {
                settingsGroups.push({
                    id: 'organizacion',
                    label: 'Organización',
                    defaultOpen: true,
                    items: [
                        { title: 'General', href: '/settings/organization', icon: Building },
                        { title: 'Miembros', href: '/settings/members', icon: Users },
                        { title: 'Roles y Permisos', href: '/settings/permissions', icon: Shield },
                        { title: 'Facturación', href: '/settings/billing', icon: CreditCard },
                        { title: 'Actividad', href: '/settings/activity', icon: Activity },
                    ],
                });

                settingsGroups.push({
                    id: 'espacio_trabajo',
                    label: 'Espacio de Trabajo',
                    defaultOpen: true,
                    items: [
                        { title: 'Proyectos', href: '/settings/projects', icon: Building },
                        { title: 'Contactos', href: '/settings/contacts', icon: BookUser },
                        { title: 'Archivos', href: '/settings/files', icon: FolderOpen },
                        { title: 'Finanzas', href: '/settings/finance', icon: DollarSign },
                        { title: 'Unidades', href: '/settings/units', icon: Ruler },
                        { title: 'Plantillas', href: '/settings/templates', icon: FileType, status: 'maintenance' as const, disabled: !canBypassRestrictions },
                    ],
                });
            }

            return settingsGroups;
        }
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
                        { title: 'Directorio', href: '/admin/directory', icon: Users },
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
                    ],
                },
                // Catálogo Técnico — Tareas y Recursos
                {
                    id: 'catalogo-tecnico',
                    label: 'Catálogo Técnico',
                    items: [
                        { title: 'Tareas', href: '/admin/catalog', icon: ClipboardList },
                        { title: 'Recursos', href: '/admin/recursos', icon: Layers },
                    ],
                },
                // Contenido
                {
                    id: 'contenido',
                    label: 'Contenido',
                    items: [
                        { 
                            title: 'Academia', 
                            href: '/admin/academy', 
                            icon: GraduationCap,
                            children: [
                                { title: 'Visión General', href: '/admin/academy', icon: LayoutDashboard },
                                { title: 'Alumnos', href: '/admin/academy/students', icon: Users },
                                { title: 'Cursos', href: '/admin/academy/courses', icon: Video },
                                { title: 'Instructores', href: '/admin/academy/instructors', icon: BookUser }
                            ]
                        },
                        { title: 'Contenido HUB', href: '/admin/hub-content', icon: Sparkles },
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
            // Organización (standalone — items sueltos, sin acordeón)
            {
                id: 'gestion',
                label: '',
                standalone: true,
                items: [
                    getItemStatus('sidebar_projects', { title: 'Proyectos', href: '/organization/projects', icon: Building }),
                    getItemStatus('sidebar_files', { title: 'Archivos', href: '/organization/files', icon: FolderOpen }),
                    getItemStatus('sidebar_contacts', { title: 'Contactos', href: '/organization/contacts', icon: BookUser }),
                    getItemStatus('sidebar_catalog', {
                        title: 'Catálogo Técnico',
                        href: '/organization/catalog',
                        icon: Wrench,
                        children: [
                            { title: 'Visión General', href: '/organization/catalog', icon: LayoutGrid },
                            { title: 'Tareas', href: '/organization/catalog/tasks', icon: ClipboardList },
                            { title: 'Materiales', href: '/organization/catalog/materials', icon: Package },
                            { title: 'Mano de Obra', href: '/organization/catalog/labor', icon: HardHat },
                        ],
                    }),
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
                    getItemStatus('sidebar_general_costs', {
                        title: 'Gastos Generales',
                        href: '/organization/general-costs',
                        icon: CreditCard,
                        children: [
                            { title: 'Visión General', href: '/organization/general-costs', icon: LayoutGrid },
                            { title: 'Pagos', href: '/organization/general-costs/payments', icon: Banknote },
                            { title: 'Conceptos', href: '/organization/general-costs/concepts', icon: Tag }
                        ],
                    }),
                    getItemStatus('sidebar_quotes', { title: 'Presupuestos', href: '/organization/quotes', icon: FileText }),
                    getItemStatus('sidebar_clients', { title: 'Cobros', href: '/organization/clients', icon: Banknote }),
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
                    { title: 'Visión General', href: '/academy/overview', icon: LayoutDashboard },
                    { title: 'Cursos', href: '/academy/my-courses', icon: Video },
                ];
            case 'founders':
                return [
                    { title: 'Programa Fundadores', href: '/founders/program', icon: Sparkles },
                ];
            case 'community':
                return [
                    { title: 'Mapa Seencel', href: '/community/map', icon: MapPin },
                ];
            case 'admin':
                return getNavGroups('admin').flatMap(g => g.items);
            case 'settings':
                return getNavGroups('settings').flatMap(g => g.items);
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
