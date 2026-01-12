"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useLayoutStore, NavigationContext } from "@/store/layout-store";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FeedbackButton } from "@/components/feedback-button";
import {
    Kanban,
    Calendar,
    MessageSquare,
    FileText,
    Clock,
    Users,
    Bell,
    Search,
    Monitor,
    Sun,
    Moon,
    Home,
    Mail,
    type LucideIcon,
} from "lucide-react";

// ============================================================================
// TOOL CONFIGURATION
// ============================================================================

interface ToolItem {
    id: string;
    title: string;
    href: string;
    icon: LucideIcon;
    // Contexts where this tool should appear
    contexts: NavigationContext[];
}

const tools: ToolItem[] = [
    {
        id: 'kanban',
        title: 'Kanban',
        href: '/organization/kanban',
        icon: Kanban,
        contexts: ['organization', 'project']
    },
    // {
    //     id: 'calendar',
    //     title: 'Calendario',
    //     href: '/organization/calendar',
    //     icon: Calendar,
    //     contexts: ['organization', 'project']
    // },
    // {
    //     id: 'documents',
    //     title: 'Documentos',
    //     href: '/organization/documents',
    //     icon: FileText,
    //     contexts: ['organization', 'project']
    // },
    // {
    //     id: 'team',
    //     title: 'Equipo',
    //     href: '/organization/team',
    //     icon: Users,
    //     contexts: ['organization']
    // },
    // {
    //     id: 'activity',
    //     title: 'Actividad',
    //     href: '/organization/activity',
    //     icon: Clock,
    //     contexts: ['organization', 'project']
    // },
];

// ============================================================================
// RIGHT TOOLS SIDEBAR
// ============================================================================

import { SidebarButton } from "./sidebar-button";

// ... (keep ToolItem interface and tools array unchanged)

export function RightToolsSidebar({ user }: { user?: any }) { // TODO: Proper UserProfile type
    const { activeContext } = useLayoutStore();
    const pathname = usePathname();
    const supabase = createClient();
    const router = useRouter();
    const tUser = useTranslations('UserMenu');
    const { setTheme } = useTheme();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    // Filter tools based on current context
    const visibleTools = tools.filter(tool =>
        tool.contexts.includes(activeContext)
    );

    return (
        <aside
            className={cn(
                "flex flex-col items-center py-2", // Removed gap-2
                "h-full z-30 shrink-0",
                "bg-sidebar border-l border-sidebar-border",
                "w-[50px]"
            )}
        >
            {/* 1. TOP SECTION: Avatar & Notifications */}
            <div className="flex flex-col gap-2 items-center w-full"> {/* Changed gap-1 to gap-2, added w-full */}
                {/* Avatar with Dropdown */}
                <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className="relative h-8 w-8 rounded-lg p-0 overflow-hidden hover:ring-2 hover:ring-primary/20 transition-all shrink-0"
                        >
                            <Avatar className="h-full w-full rounded-lg">
                                <AvatarImage src={user?.avatar_url || ""} alt={user?.full_name || "User"} />
                                <AvatarFallback className="text-xs rounded-lg">
                                    {user?.full_name
                                        ? user.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
                                        : "US"}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" side="left" align="start" forceMount sideOffset={10}>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{user?.full_name || "User"}</p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    {user?.email || ""}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/">
                                <Home className="h-4 w-4 mr-2" />
                                {tUser('home')}
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/contact">
                                <Mail className="h-4 w-4 mr-2" />
                                {tUser('contact')}
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/settings">{tUser('settings')}</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {/* Theme Toggle (Inline Style) */}
                        <div className="flex items-center justify-between px-2 py-1.5 select-none">
                            <span className="text-sm font-medium leading-none">Tema</span>
                            <div className="flex items-center rounded-full border bg-background">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setTheme("system")}
                                    className="h-6 w-6 rounded-full text-muted-foreground hover:text-foreground"
                                    title="Sistema"
                                >
                                    <Monitor className="h-3 w-3" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setTheme("light")}
                                    className="h-6 w-6 rounded-full text-muted-foreground hover:text-foreground"
                                    title="Claro"
                                >
                                    <Sun className="h-3 w-3" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setTheme("dark")}
                                    className="h-6 w-6 rounded-full text-muted-foreground hover:text-foreground"
                                    title="Oscuro"
                                >
                                    <Moon className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-foreground hover:!text-red-600 cursor-pointer" onClick={handleLogout}>
                            {tUser('logout')}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Notifications */}
                <SidebarButton
                    icon={Bell}
                    label="Notificaciones"
                    isExpanded={false}
                    tooltip="Notificaciones"
                    tooltipSide="left"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground shrink-0"
                />
            </div>

            {/* Separator */}
            <div className="w-8 h-px bg-border/50 my-1 mx-auto" /> {/* Centered separator */}

            {/* 2. MIDDLE SECTION: Tools */}
            <div className="flex flex-col gap-2 items-center flex-1 w-full overflow-y-auto no-scrollbar"> {/* Changed gap-1 to gap-2 */}
                {visibleTools.map((tool) => {
                    // Robust active check: exact match OR subpath match (but ensure we don't match partial strings loosely)
                    const isActive = pathname === tool.href || pathname?.startsWith(`${tool.href}/`);
                    return (
                        <SidebarButton
                            key={tool.id}
                            icon={tool.icon}
                            label={tool.title}
                            href={tool.href}
                            isActive={isActive}
                            isExpanded={false}
                            tooltip={tool.title}
                            tooltipSide="left"
                            size="icon"
                            activeVariant="primary"
                            className={cn(
                                "h-8 w-8 rounded-lg shrink-0", // Added shrink-0
                                !isActive && "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                            )}
                        />
                    );
                })}
            </div>

            {/* 3. BOTTOM SECTION: Feedback & Search */}
            <div className="flex flex-col gap-2 items-center mt-auto w-full"> {/* Changed gap-1 to gap-2, added w-full */}
                {/* Feedback Button - Reusing Feedback Component but triggering manually/custom style? 
                    The user said "El boton de FEEDBACK pasa a ser un botona rriba de la lupa".
                    We should probably just use our SidebarButton but trigger the standard Feedback form/popover.
                */}
                <FeedbackButton customTrigger={(
                    <SidebarButton
                        icon={MessageSquare}
                        label="Feedback"
                        isExpanded={false}
                        tooltip="Dar Feedback"
                        tooltipSide="left"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground shrink-0"
                    />
                )} side="left" align="end" />


            </div>
        </aside>
    );
}
