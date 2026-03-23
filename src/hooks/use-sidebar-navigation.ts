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
    HardDrive,
    CreditCard,
    Compass,

    Hammer,
    HardHat,
    Video,
    Monitor,
    Wrench,
    MapPin,
    Sparkles,
    Medal,
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
    MessageSquare,
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
import { useEntitlements, type EntitlementKey } from "@/hooks/use-entitlements";
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
    // Shadow mode bypass (determines visual dimming for admins vs founders)
    isShadowMode?: boolean;
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
    isShadowMode?: boolean;
}

const ALL_CONTEXTS: ContextItem[] = [
    { id: 'organization', label: 'Espacio de Trabajo', icon: Building },
    // Portal removed — now lives as tab inside project detail page
    // Project removed from top-level sidebar as requested
    { id: 'learnings', label: 'Academia', icon: GraduationCap },
    { id: 'founders', label: 'Fundadores', icon: Medal },
    { id: 'discover', label: 'Descubrir', icon: Compass },
    { id: 'admin', label: 'Admin', icon: Shield },
];

export const contextRoutes: Record<NavigationContext, string> = {
    home: '/hub',
    organization: '/organization',
    project: '/organization/projects',
    learnings: '/academy/overview',
    founders: '/founders/dashboard',
    discover: '/discover',
    admin: '/admin',
    settings: '/settings'
};

export function useSidebarNavigation() {
    const tMega = useTranslations('MegaMenu');
    const tSidebar = useTranslations('Sidebar');
    const { check: checkEntitlement } = useEntitlements();
    const { activeOrgId } = useOrganization();
    const { accessMode, externalActorType } = useAccessContext();
    const viewingAs = useViewingAs();
    const memberVisibleModules = useMemberModules();

    const contexts = useMemo(() => {
        return ALL_CONTEXTS.map(ctx => {
            let flagKey: string | null = null;
            if (ctx.id === 'admin') flagKey = 'flag:admin_dashboard'; // Admins actually are tracked via their own logic, but let's map it safely
            if (ctx.id === 'organization' || ctx.id === 'project') flagKey = 'context:workspace';
            if (ctx.id === 'learnings') flagKey = 'context:academy';
            if (ctx.id === 'founders') flagKey = 'context:founders';
            if (ctx.id === 'discover') flagKey = 'context:discover';

            if (!flagKey) return ctx;

            // Use entitlement engine
            // Custom admin logic: The admin dashboard itself isn't a feature flag, it's just identity.
            if (ctx.id === 'admin') {
                const adminEnt = checkEntitlement('flag:hidden'); // Dummy call just to get isAdmin
                return adminEnt.isShadowMode ? ctx : null; 
            }

            const ent = checkEntitlement(flagKey as EntitlementKey);
            const status = ent.rawStatus || 'active';

            // 1. Hidden
            if (status === 'hidden') {
                if (ent.isShadowMode) {
                    return { ...ctx, hidden: true, isShadowMode: true };
                }
                return null;
            }

            // 2. Normal execution 
            if (ent.isAllowed && !ent.isShadowMode) {
                return { ...ctx, status: status as any, isShadowMode: false };
            }

            // 3. Shadow Mode (Visually blocked, logically permitted)
            if (ent.isShadowMode) {
                return { ...ctx, status: status as any, isShadowMode: true };
            }

            // 4. Blocked
            return { ...ctx, status: status as any, disabled: true, isShadowMode: false };
        }).filter((ctx): ctx is ContextItem => ctx !== null);
    }, [checkEntitlement]);

    // Helper to compute item status
    const getItemStatus = (flagKey: string, baseItem: NavItem): NavItem | null => {
        const ent = checkEntitlement(`flag:${flagKey}` as EntitlementKey);
        const status = ent.rawStatus || 'active';

        if (status === 'hidden') {
            return ent.isShadowMode ? { ...baseItem, hidden: true, isShadowMode: true } : null;
        }

        if (ent.isAllowed && !ent.isShadowMode) {
            return { ...baseItem, status: status as any, isShadowMode: false };
        }

        if (ent.isShadowMode) {
            return { ...baseItem, status: status as any, isShadowMode: true };
        }

        return { ...baseItem, status: status as any, disabled: true, isShadowMode: false };
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
                        { title: 'Accesos Externos', href: '/settings/external-access', icon: Shield },
                        { title: 'Facturación', href: '/settings/billing', icon: CreditCard },
                        { title: 'Actividad', href: '/settings/activity', icon: Activity },
                    ],
                });

                settingsGroups.push({
                    id: 'espacio_trabajo',
                    label: 'Espacio de Trabajo',
                    defaultOpen: true,
                    items: [
                        { title: 'Finanzas', href: '/settings/finance', icon: DollarSign },
                        { title: 'Almacenamiento', href: '/settings/storage', icon: HardDrive },
                        { title: 'IA', href: '/settings/ai', icon: Sparkles },
                        { title: 'Unidades', href: '/settings/units', icon: Ruler },
                        getItemStatus('templates', { title: 'Plantillas', href: '/settings/templates', icon: FileType }),
                    ].filter((i): i is NavItem => i !== null),
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
            {
                id: 'principal',
                label: '',
                standalone: true,
                items: [
                    getItemStatus('sidebar_overview', { title: 'Visión General', href: '/organization', icon: LayoutDashboard }),
                    getItemStatus('sidebar_planner', { title: 'Planificador', href: '/organization/planner', icon: CalendarDays }),
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
                    }),
                ].filter((i): i is NavItem => i !== null),
            },
            // Construcción
            {
                id: 'construccion',
                label: 'Construcción',
                items: [
                    getItemStatus('sidebar_tasks', {
                        title: 'Tareas',
                        href: '/organization/construction-tasks',
                        icon: ClipboardList,
                    }),
                    getItemStatus('sidebar_sitelog', {
                        title: tSidebar('items.sitelog'),
                        href: '/organization/sitelog',
                        icon: FileText,
                    }),
                    getItemStatus('sidebar_materials', { title: 'Materiales', href: '/organization/materials', icon: Package }),
                    getItemStatus('sidebar_labor', { title: 'Mano de Obra', href: '/organization/labor', icon: HardHat }),
                    getItemStatus('sidebar_subcontracts', { title: 'Subcontratos', href: '/organization/subcontracts', icon: Handshake }),
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
                    }),
                    getItemStatus('sidebar_quotes', { title: 'Presupuestos', href: '/organization/quotes', icon: FileText }),
                    getItemStatus('sidebar_clients', { title: 'Cobros', href: '/organization/clients', icon: Banknote }),
                ].filter((i): i is NavItem => i !== null),
            },
            // Portales Externos (MOCKS para Testing)
            {
                id: 'portales_externos_mocks',
                label: 'Portales Externos (Mocks)',
                items: [
                    { title: 'Portal Contador', href: '/organization/external/accountant', icon: LayoutDashboard },
                    { title: 'Portal Cliente', href: '/organization/external/client', icon: LayoutDashboard },
                ],
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
                    { title: 'Visión General', href: '/founders/dashboard', icon: Medal },
                    { title: 'Foro', href: '/founders/forum', icon: MessageSquare },
                ];
            case 'discover':
                return [
                    { title: 'Mapa Seencel', href: '/discover/map', icon: MapPin },
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
