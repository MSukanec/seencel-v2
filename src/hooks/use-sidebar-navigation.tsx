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
} from "lucide-react";
import { NavigationContext } from "@/store/layout-store";

export interface NavItem {
    title: string;
    href: string;
    icon: React.ElementType;
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
    learnings: '/learnings',
    community: '/organization',
    admin: '/admin'
};

export function useSidebarNavigation() {
    const activeProjectId = useActiveProjectId();
    const tMega = useTranslations('MegaMenu');

    const getNavItems = (ctx: NavigationContext): NavItem[] => {
        switch (ctx) {
            case 'organization':
                return [
                    { title: tMega('Organization.items.overview'), href: '/organization', icon: LayoutDashboard },
                    { title: tMega('Organization.items.identity'), href: '/organization/identity', icon: Building },
                    { title: 'Proyectos', href: '/organization/projects', icon: Briefcase },
                    { title: 'Contactos', href: '/organization/contacts', icon: Users },
                    { title: 'Finanzas', href: '/organization/finance', icon: Wallet },
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
                        title: 'Información',
                        href: activeProjectId ? `${projectBase}/details` : '/organization/projects',
                        icon: Info
                    },
                    {
                        title: 'Clientes',
                        href: activeProjectId ? `${projectBase}/clients` : '/organization/projects',
                        icon: Users
                    },
                ];
            case 'learnings':
                return [
                    { title: 'Visión General', href: '/learnings', icon: LayoutDashboard },
                    { title: 'Cursos', href: '/learnings/courses', icon: Video },
                ];
            case 'community':
                return [
                    { title: 'Foros', href: '/community/forums', icon: MessageSquare },
                    { title: 'Eventos', href: '/community/events', icon: Calendar },
                ];
            case 'admin':
                return [
                    { title: 'Visión General', href: '/admin', icon: LayoutDashboard },
                    { title: 'Academia', href: '/admin/courses', icon: GraduationCap },
                    { title: 'Directorio', href: '/admin/directory', icon: Users },
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
