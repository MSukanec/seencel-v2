/**
 * External Navigation Config
 * 
 * Define los items de navegación del sidebar para cada ExternalActorType.
 * Compatible con NavItem/NavGroup del sistema existente.
 * 
 * Cuando se agreguen permisos granulares (external_actor_permissions),
 * estos items se podrán filtrar por permission_key.
 */

import {
    LayoutDashboard,
    Building,
    FolderOpen,
    CreditCard,
    FileChartColumn,
    DollarSign,
    ArrowDownCircle,
    ArrowUpCircle,
    FileDown,
    ClipboardCheck,
    Clock,
    Wallet,
    Hammer,
    Award,
    FileText,
    Handshake,
} from "lucide-react";
import type { ExternalActorType } from "@/features/external-actors/types";
import type { NavGroup } from "@/hooks/use-sidebar-navigation";

// ============================================
// Navigation Config by Actor Type
// ============================================

const clientNavigation: NavGroup[] = [
    {
        id: "portal-clientes",
        label: "Portal de Clientes",
        defaultOpen: true,
        items: [
            { title: "Visión General", href: "/organization/external/client", icon: LayoutDashboard },
            // Future: Mis Proyectos, Documentos, Pagos, Reportes
        ],
    },
];

const accountantNavigation: NavGroup[] = [
    {
        id: "portal-contador",
        label: "Portal Contador",
        defaultOpen: true,
        items: [
            { title: "Dashboard Financiero", href: "/organization/external/accountant", icon: LayoutDashboard, disabled: true },
            { title: "Ingresos", href: "/organization/external/accountant/income", icon: ArrowDownCircle, disabled: true },
            { title: "Egresos", href: "/organization/external/accountant/expenses", icon: ArrowUpCircle, disabled: true },
            { title: "Reportes", href: "/organization/external/accountant/reports", icon: FileChartColumn, disabled: true },
            { title: "Exportar PDF", href: "/organization/external/accountant/export", icon: FileDown, disabled: true },
        ],
    },
];

const fieldWorkerNavigation: NavGroup[] = [
    {
        id: "portal-campo",
        label: "Portal de Campo",
        defaultOpen: true,
        items: [
            { title: "Marcar Presente", href: "/organization/external/field/attendance", icon: ClipboardCheck, disabled: true },
            { title: "Mi Asistencia", href: "/organization/external/field/history", icon: Clock, disabled: true },
            { title: "Mis Pagos", href: "/organization/external/field/payments", icon: Wallet, disabled: true },
        ],
    },
];

const externalSiteManagerNavigation: NavGroup[] = [
    {
        id: "portal-director",
        label: "Portal Director de Obra",
        defaultOpen: true,
        items: [
            { title: "Dashboard Proyecto", href: "/organization/external/site-manager", icon: LayoutDashboard, disabled: true },
            { title: "Avance de Obra", href: "/organization/external/site-manager/progress", icon: Hammer, disabled: true },
            { title: "Certificaciones", href: "/organization/external/site-manager/certifications", icon: Award, disabled: true },
            { title: "Reportes", href: "/organization/external/site-manager/reports", icon: FileChartColumn, disabled: true },
        ],
    },
];

const subcontractorNavigation: NavGroup[] = [
    {
        id: "portal-subcontratista",
        label: "Portal Subcontratista",
        defaultOpen: true,
        items: [
            { title: "Mi Contrato", href: "/organization/external/subcontractor", icon: Handshake, disabled: true },
            { title: "Certificaciones", href: "/organization/external/subcontractor/certifications", icon: Award, disabled: true },
            { title: "Pagos", href: "/organization/external/subcontractor/payments", icon: DollarSign, disabled: true },
            { title: "Documentación", href: "/organization/external/subcontractor/docs", icon: FileText, disabled: true },
        ],
    },
];

// ============================================
// Main Config Map
// ============================================

export const externalNavigationConfig: Record<ExternalActorType, NavGroup[]> = {
    client: clientNavigation,
    accountant: accountantNavigation,
    field_worker: fieldWorkerNavigation,
    external_site_manager: externalSiteManagerNavigation,
    subcontractor_portal_user: subcontractorNavigation,
};

/**
 * Get navigation groups for a specific external actor type.
 * Returns empty array if type is unknown.
 */
export function getExternalNavGroups(actorType: ExternalActorType | null): NavGroup[] {
    if (!actorType) return [];
    return externalNavigationConfig[actorType] || [];
}
