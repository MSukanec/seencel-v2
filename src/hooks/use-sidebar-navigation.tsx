"use client";

import { useTranslations } from "next-intl";
import { useActiveProjectId } from "@/store/layout-store";
import {
    LayoutDashboard,
    Building,
    Briefcase,
    Wallet,
    GraduationCap,
    Users,
    Settings,
    FileText,
    CreditCard,
    Hammer,
    Video,
    MessageSquare,
    Calendar,
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
} from "lucide-react";
import { NavigationContext } from "@/store/layout-store";

export interface NavItem {
    title: string;
    href: string;
    icon: React.ElementType;
    sectionHeader?: string;
}

export interface ContextItem {
    id: NavigationContext;
    label: string;
    icon: React.ElementType;
}

const contexts: ContextItem[] = [
    { id: 'organization', label: 'Organización', icon: Building },
    { id: 'project', label: 'Proyecto', icon: Briefcase },
    { id: 'learnings', label: 'Academia', icon: GraduationCap },
    { id: 'community', label: 'Comunidad', icon: Users },
    { id: 'admin', label: 'Admin', icon: Hammer },
];

export const contextRoutes: Record<NavigationContext, string> = {
    organization: '/organization',
    project: '/organization/projects',
    learnings: '/academy/courses',
    community: '/organization',
    admin: '/admin'
};

export function useSidebarNavigation() {
    const activeProjectId = useActiveProjectId();
    const tMega = useTranslations('MegaMenu');
    const tSidebar = useTranslations('Sidebar');

    const getNavItems = (ctx: NavigationContext): NavItem[] => {
        switch (ctx) {
            case 'organization':
                return [
                    { title: tMega('Organization.items.overview'), href: '/organization', icon: LayoutDashboard },
                    { title: 'Agenda', href: '/organization/planner', icon: CalendarDays },
                    { title: 'Archivos', href: '/organization/files', icon: FolderOpen },
                    { title: 'Presupuestos', href: '/organization/quotes', icon: FileText },
                    { title: 'Finanzas', href: '/organization/finance', icon: Wallet },
                    { title: 'Proyectos', href: '/organization/projects', icon: Briefcase, sectionHeader: 'Mi Organización' },
                    { title: tMega('Organization.items.identity'), href: '/organization/identity', icon: Building },
                    { title: 'Catálogo Técnico', href: '/organization/catalog', icon: Wrench },
                    { title: 'Contactos', href: '/organization/contacts', icon: Users },
                    { title: 'Gastos Generales', href: '/organization/general-costs', icon: CreditCard },
                    { title: 'Configuración', href: '/organization/settings', icon: Settings },
                ];
            case 'project':
                const projectBase = activeProjectId
                    ? `/project/${activeProjectId}`
                    : '/organization/projects';

                return [
                    {
                        title: 'Visión General',
                        href: projectBase,
                        icon: LayoutDashboard
                    },
                    {
                        title: 'Agenda',
                        href: activeProjectId ? `${projectBase}/planner` : '/organization/projects',
                        icon: CalendarDays
                    },
                    {
                        title: 'Archivos',
                        href: activeProjectId ? `${projectBase}/files` : '/organization/projects',
                        icon: FolderOpen
                    },
                    {
                        title: 'Presupuestos',
                        href: activeProjectId ? `${projectBase}/quotes` : '/organization/projects',
                        icon: FileText
                    },
                    {
                        title: 'Información',
                        href: activeProjectId ? `${projectBase}/details` : '/organization/projects',
                        icon: Info,
                        sectionHeader: 'Gestión'
                    },
                    {
                        title: 'Tareas',
                        href: activeProjectId ? `${projectBase}/construction-tasks` : '/organization/projects',
                        icon: ClipboardList,
                        sectionHeader: tSidebar('construction')
                    },
                    {
                        title: 'Materiales',
                        href: activeProjectId ? `${projectBase}/materials` : '/organization/projects',
                        icon: Package
                    },
                    {
                        title: 'Subcontratos',
                        href: activeProjectId ? `${projectBase}/subcontracts` : '/organization/projects',
                        icon: Users // Using Users as temporary icon, typically HardHat or similar fits better if available
                    },
                    {
                        title: tSidebar('items.sitelog'),
                        href: activeProjectId ? `${projectBase}/sitelog` : '/organization/projects',
                        icon: FileText
                    },
                    {
                        title: 'Compromisos y Pagos',
                        href: activeProjectId ? `${projectBase}/clients` : '/organization/projects',
                        icon: Banknote,
                        sectionHeader: 'Clientes'
                    },
                    {
                        title: 'Portal de Clientes',
                        href: activeProjectId ? `${projectBase}/portal` : '/organization/projects',
                        icon: Monitor
                    },
                ];
            case 'learnings':
                return [
                    { title: 'Cursos', href: '/academy/courses', icon: Video },
                ];
            case 'community':
                return [
                    { title: 'Fundadores', href: '/community/founders', icon: Sparkles },
                    { title: 'Mapa Seencel', href: '/community/map', icon: MapPin },
                ];
            case 'admin':
                return [
                    { title: 'Visión General', href: '/admin', icon: LayoutDashboard },
                    { title: 'Academia', href: '/admin/academy', icon: GraduationCap },
                    { title: 'Directorio', href: '/admin/directory', icon: Users },
                    { title: 'Catálogo Técnico', href: '/admin/catalog', icon: Wrench },
                    { title: 'Finanzas', href: '/admin/finance', icon: Wallet },
                    { title: 'Actividad', href: '/admin/audit-logs', icon: FileText },
                    { title: 'Plataforma', href: '/admin/system', icon: Monitor },
                    { title: 'Configuración', href: '/admin/settings', icon: Settings },
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

