"use client";

import * as React from "react";
import { useRouter } from "@/i18n/routing";
import { useSidebarNavigation } from "@/hooks/use-sidebar-navigation";
import { usePanel } from "@/stores/panel-store";
import { getQuickActionPanels } from "@/stores/panel-registry";
import { useOrganizationStore } from "@/stores/organization-store";
import { useShallow } from "zustand/react/shallow";
import {
    Search,
    ArrowRight,
    Plus,
    User,
    Settings,
    Users,
    CreditCard,
    type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { cardVariants } from "@/components/ui/card";
import {
    CommandDialog,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandSeparator,
    CommandShortcut,
} from "@/components/ui/command";

// ============================================================================
// GLOBAL COMMAND BAR
// ============================================================================
// Enterprise-grade command palette (Cmd+K).
// Provides: Navigation, Quick Actions (from panel-registry), Quick Access.
// Navigation: from use-sidebar-navigation (single source of truth).
// Quick Actions: from panel-registry quickAction metadata (single source of truth).
// ============================================================================

// ── Quick Access (static) ───────────────────────────────────────────
interface QuickAccessItem {
    id: string;
    label: string;
    icon: LucideIcon;
    keywords: string;
    href: string;
}

const QUICK_ACCESS: QuickAccessItem[] = [
    {
        id: "profile",
        label: "Mi Perfil",
        icon: User,
        keywords: "perfil cuenta usuario avatar",
        href: "/profile",
    },
    {
        id: "settings",
        label: "Configuración",
        icon: Settings,
        keywords: "configuracion ajustes opciones preferencias",
        href: "/organization/settings",
    },
    {
        id: "members",
        label: "Miembros del Equipo",
        icon: Users,
        keywords: "equipo miembros personas roles permisos",
        href: "/organization/settings/members",
    },
    {
        id: "billing",
        label: "Facturación y Plan",
        icon: CreditCard,
        keywords: "facturacion plan suscripcion pago cuenta",
        href: "/organization/settings/billing",
    },
];

// ============================================================================
// COMMAND BAR TRIGGER (Header center)
// ============================================================================

export function CommandBarTrigger() {
    const [open, setOpen] = React.useState(false);

    // ── Keyboard shortcut: Cmd+K / Ctrl+K ───────────────────────────
    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((prev) => !prev);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    return (
        <>
            {/* Trigger Button */}
            <button
                onClick={() => setOpen(true)}
                className={cn(
                    cardVariants.inset,
                    "flex items-center gap-2 h-8 px-3",
                    "text-muted-foreground hover:text-foreground",
                    "transition-all duration-150 cursor-pointer",
                    "min-w-[280px] max-w-[400px]",
                )}
            >
                <Search className="h-3.5 w-3.5 shrink-0" />
                <span className="text-xs flex-1 text-left">
                    Buscar o ejecutar...
                </span>
                <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border/50 bg-background/50 px-1.5 font-mono text-[10px] font-medium text-muted-foreground/70">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </button>

            {/* Command Dialog */}
            <CommandBarDialog open={open} onOpenChange={setOpen} />
        </>
    );
}

// ============================================================================
// SIDEBAR COMMAND BAR TRIGGER
// ============================================================================
// Compact version for sidebar placement. Full width, sidebar-matching aesthetic.
// ============================================================================

export function SidebarCommandBarTrigger({ isExpanded = true }: { isExpanded?: boolean }) {
    const [open, setOpen] = React.useState(false);

    // ── Keyboard shortcut: Cmd+K / Ctrl+K ───────────────────────────
    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((prev) => !prev);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className={cn(
                    "flex items-center gap-2 w-full rounded-lg",
                    "text-muted-foreground hover:text-foreground",
                    "bg-sidebar-accent/40 hover:bg-sidebar-accent/70",
                    "border border-sidebar-border/30",
                    "transition-all duration-150 cursor-pointer",
                    isExpanded ? "h-8 px-2.5" : "h-8 justify-center",
                )}
            >
                <Search className="h-3.5 w-3.5 shrink-0" />
                {isExpanded && (
                    <>
                        <span className="text-xs flex-1 text-left truncate">
                            Buscar...
                        </span>
                        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border border-sidebar-border/40 bg-sidebar/60 px-1 font-mono text-[10px] font-medium text-muted-foreground/50">
                            <span className="text-[10px]">⌘</span>K
                        </kbd>
                    </>
                )}
            </button>

            {/* Command Dialog */}
            <CommandBarDialog open={open} onOpenChange={setOpen} />
        </>
    );
}

// ============================================================================
// COMMAND BAR DIALOG
// ============================================================================

function CommandBarDialog({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const router = useRouter();
    const { openPanel } = usePanel();
    const { getNavGroups } = useSidebarNavigation();
    const organizationId = useOrganizationStore(
        useShallow((s) => s.activeOrgId)
    );

    // ── Navigation items from sidebar ──────────────────────────────
    const navGroups = getNavGroups("organization");
    const allNavItems = React.useMemo(() => {
        return navGroups.flatMap((group) =>
            group.items
                .filter((item) => !item.disabled && !item.hidden)
                .flatMap((item) => {
                    const items = [
                        {
                            id: item.href,
                            label: item.title,
                            icon: item.icon,
                            href: item.href,
                            group: group.label || "Principal",
                            keywords: item.title.toLowerCase(),
                        },
                    ];
                    // Include children as separate items (skip if same href as parent)
                    if (item.children) {
                        item.children.forEach((child) => {
                            if (child.href === item.href) return;
                            items.push({
                                id: `${item.href}/${child.href}`,
                                label: `${item.title} → ${child.title}`,
                                icon: child.icon || item.icon,
                                href: child.href,
                                group: group.label || "Principal",
                                keywords: `${item.title} ${child.title}`.toLowerCase(),
                            });
                        });
                    }
                    return items;
                })
        );
    }, [navGroups]);

    // ── Quick Actions from panel-registry ───────────────────────────
    const quickActions = React.useMemo(() => getQuickActionPanels(), []);

    // ── Handlers ────────────────────────────────────────────────────
    const handleNavigate = React.useCallback(
        (href: string) => {
            onOpenChange(false);
            router.push(href as any);
        },
        [router, onOpenChange]
    );

    const handleOpenPanel = React.useCallback(
        (panelId: string, defaultProps?: Record<string, any>) => {
            onOpenChange(false);
            openPanel(panelId, {
                ...defaultProps,
                organizationId,
            });
        },
        [openPanel, onOpenChange, organizationId]
    );

    return (
        <CommandDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Command Bar"
            description="Buscar páginas, acciones y ajustes"
            showCloseButton={false}
            className="sm:max-w-[520px] rounded-xl"
        >
            <CommandInput placeholder="Buscar páginas, acciones..." />
            <CommandList className="max-h-[400px]">
                <CommandEmpty>
                    <div className="flex flex-col items-center gap-2 py-4">
                        <Search className="h-8 w-8 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">
                            No se encontraron resultados
                        </p>
                    </div>
                </CommandEmpty>

                {/* ── Quick Actions (from panel-registry) ────────── */}
                {quickActions.length > 0 && (
                    <CommandGroup heading="Acciones Rápidas">
                        {quickActions.map(({ panelId, quickAction }) => (
                            <CommandItem
                                key={`action-${panelId}`}
                                value={`action-${quickAction.label} ${quickAction.keywords}`}
                                onSelect={() => handleOpenPanel(panelId, quickAction.defaultProps)}
                                className="gap-3 cursor-pointer"
                            >
                                <div className="h-5 w-5 rounded-md bg-primary/10 flex items-center justify-center">
                                    <Plus className="h-3 w-3 text-primary" />
                                </div>
                                <span className="flex-1">{quickAction.label}</span>
                                <quickAction.icon className="h-3.5 w-3.5 text-muted-foreground/50" />
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}

                <CommandSeparator />

                {/* ── Navigation ──────────────────────────────────── */}
                <CommandGroup heading="Navegación">
                    {allNavItems.map((item) => (
                        <CommandItem
                            key={item.id}
                            value={`nav-${item.keywords}`}
                            onSelect={() => handleNavigate(item.href)}
                            className="gap-3 cursor-pointer"
                        >
                            <item.icon className="h-4 w-4 text-muted-foreground" />
                            <span className="flex-1">{item.label}</span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground/50" />
                        </CommandItem>
                    ))}
                </CommandGroup>

                <CommandSeparator />

                {/* ── Quick Access ────────────────────────────────── */}
                <CommandGroup heading="Acceso Rápido">
                    {QUICK_ACCESS.map((item) => (
                        <CommandItem
                            key={item.id}
                            value={`access-${item.label} ${item.keywords}`}
                            onSelect={() => handleNavigate(item.href)}
                            className="gap-3 cursor-pointer"
                        >
                            <item.icon className="h-4 w-4 text-muted-foreground" />
                            <span className="flex-1">{item.label}</span>
                        </CommandItem>
                    ))}
                </CommandGroup>
            </CommandList>

            {/* ── Footer ─────────────────────────────────────────── */}
            <div className="flex items-center justify-between border-t px-3 py-2">
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground/60">
                    <span className="flex items-center gap-1">
                        <kbd className="rounded border border-border/50 bg-muted/50 px-1 py-0.5 font-mono text-[10px]">↑↓</kbd>
                        navegar
                    </span>
                    <span className="flex items-center gap-1">
                        <kbd className="rounded border border-border/50 bg-muted/50 px-1 py-0.5 font-mono text-[10px]">↵</kbd>
                        seleccionar
                    </span>
                    <span className="flex items-center gap-1">
                        <kbd className="rounded border border-border/50 bg-muted/50 px-1 py-0.5 font-mono text-[10px]">esc</kbd>
                        cerrar
                    </span>
                </div>
            </div>
        </CommandDialog>
    );
}
