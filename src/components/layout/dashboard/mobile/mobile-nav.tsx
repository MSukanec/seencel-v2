"use client";

import * as React from "react";
import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Menu, X, Lock, Home, Settings, LogOut, Sun, Moon, Monitor, ChevronRight, ChevronDown, ArrowLeft, Sparkles, Mail, Bell, Check, MailOpen } from "lucide-react";
import { useSidebarNavigation, NavItem, NavGroup } from "@/hooks/use-sidebar-navigation";
import { useLayoutStore } from "@/stores/layout-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "@/i18n/routing";
import { useTheme } from "next-themes";
import { useUser } from "@/stores/user-store";
import { useOrganization } from "@/stores/organization-store";
import { useLocale, useTranslations } from "next-intl";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { UserNotification } from "@/features/notifications/queries";
import { fetchUserNotifications, markAllNotificationsAsRead, markNotificationAsRead } from "@/features/notifications/actions";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────
type NavigationLevel = 'main' | 'context';
type ContextId = string | null;

export function MobileNav() {
    const [open, setOpen] = React.useState(false);
    const [profileOpen, setProfileOpen] = React.useState(false);
    const [notificationsOpen, setNotificationsOpen] = React.useState(false);
    const [level, setLevel] = React.useState<NavigationLevel>('main');
    const [activeContextId, setActiveContextId] = React.useState<ContextId>(null);
    const [isAnimating, setIsAnimating] = React.useState(false);
    // Which accordion section is open (by header name), null = all closed
    const [openAccordion, setOpenAccordion] = React.useState<string | null>(null);

    // Notifications state
    const [notifications, setNotifications] = React.useState<UserNotification[]>([]);
    const [unreadCount, setUnreadCount] = React.useState(0);
    const [isNotifPending, startNotifTransition] = React.useTransition();
    const t = useTranslations('Settings.Notifications');
    const locale = useLocale();
    const dateLocale = locale === 'es' ? es : enUS;

    const user = useUser();
    const { activeOrgId } = useOrganization();
    const pathname = usePathname();
    const router = useRouter();
    const { contexts, getNavItems, getNavGroups } = useSidebarNavigation();
    const { actions } = useLayoutStore();

    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    // Notifications: lazy fetch only when sheet opens
    React.useEffect(() => {
        const count = notifications.filter(n => !n.read_at).length;
        setUnreadCount(count);
    }, [notifications]);

    React.useEffect(() => {
        if (!notificationsOpen || !user) return;
        const refresh = async () => {
            try {
                const { notifications: fresh } = await fetchUserNotifications();
                setNotifications(fresh);
            } catch (e) {
                console.error("Error fetching notifications:", e);
            }
        };
        refresh();
    }, [notificationsOpen, user]);

    const handleMarkRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
        startNotifTransition(async () => { await markNotificationAsRead(id); });
    };

    const handleMarkAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
        startNotifTransition(async () => { await markAllNotificationsAsRead(); toast.success(t('successAllRead')); });
    };


    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.replace('/login');
    };

    // Navigate to context level with animation
    const navigateToContext = (contextId: string) => {
        setIsAnimating(true);
        setActiveContextId(contextId);
        setLevel('context');
        setOpenAccordion(null);
        setTimeout(() => setIsAnimating(false), 300);
    };

    // Navigate back to main level
    const navigateBack = () => {
        setIsAnimating(true);
        setLevel('main');
        setTimeout(() => {
            setActiveContextId(null);
            setIsAnimating(false);
            setOpenAccordion(null);
        }, 300);
    };

    // Toggle accordion — close current if clicking the same, else open new one
    const toggleAccordion = (header: string) => {
        setOpenAccordion(prev => prev === header ? null : header);
    };

    // Build context list including project if active
    const allContexts = React.useMemo(() => {
        const list: Array<{
            id: string;
            label: string;
            icon: React.ElementType;
            disabled?: boolean;
            hidden?: boolean;
            status?: string;
        }> = [];

        const orgContext = contexts.find(c => c.id === 'organization');
        if (orgContext) list.push(orgContext);

        contexts.forEach(ctx => {
            if (ctx.id !== 'organization') {
                list.push(ctx);
            }
        });

        return list;
    }, [contexts]);

    // When sheet opens: detect current context from pathname and auto-navigate
    // When sheet closes: reset after animation
    React.useEffect(() => {
        if (open) {
            // Detect which context the user is currently in
            const matchedContext = allContexts.find(ctx => pathname?.includes(`/${ctx.id}`));
            if (matchedContext) {
                // Jump directly to context level (no slide animation)
                setActiveContextId(matchedContext.id);
                setLevel('context');
                // Auto-open the accordion group containing the active page
                const groups = getNavGroups(matchedContext.id as any);
                for (const group of groups) {
                    if (!group.standalone && group.label && group.items.some(item => pathname === item.href)) {
                        setOpenAccordion(group.id);
                        break;
                    }
                }
            } else {
                setLevel('main');
                setActiveContextId(null);
                setOpenAccordion(null);
            }
        } else {
            const timer = setTimeout(() => {
                setLevel('main');
                setActiveContextId(null);
                setOpenAccordion(null);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

    // Get current context data
    const currentContext = allContexts.find(c => c.id === activeContextId);
    const currentItems = activeContextId ? getNavItems(activeContextId as any) : [];
    const currentGroups: NavGroup[] = React.useMemo(() => {
        if (activeContextId === 'organization' || activeContextId === 'project' || activeContextId === 'admin') {
            return getNavGroups(activeContextId as any);
        }
        // For other contexts, wrap all items in a single standalone group
        return [{ id: 'all', label: '', items: currentItems, standalone: true }];
    }, [activeContextId, currentItems, getNavGroups]);

    // Auto-open accordion if user is currently on a page within that section
    React.useEffect(() => {
        if (level === 'context' && currentGroups.length > 0) {
            for (const group of currentGroups) {
                if (group.label && !group.standalone && group.items.some(item => pathname === item.href)) {
                    setOpenAccordion(group.id);
                    return;
                }
            }
        }
    }, [level, activeContextId]); // eslint-disable-line react-hooks/exhaustive-deps

    // ─── Render item link ────────────────────────────────────────────────────
    const renderNavLink = (item: NavItem, idx: number) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
            <Link
                key={idx}
                href={item.href as any}
                onClick={() => {
                    setOpen(false);
                    actions.setActiveContext(activeContextId as any);
                }}
                className="w-full block"
            >
                <div
                    className={cn(
                        "group relative flex items-center w-full rounded-lg transition-colors",
                        "hover:bg-muted text-muted-foreground hover:text-foreground",
                        "p-0 min-h-[44px]",
                        isActive && "text-foreground"
                    )}
                    style={isActive ? {
                        borderLeft: "2px solid var(--plan-border, rgba(255,255,255,0.1))",
                        boxShadow: "var(--plan-glow, none)",
                        background: `linear-gradient(90deg, var(--plan-accent, rgba(255,255,255,0.06)), transparent 70%), hsl(var(--secondary))`,
                    } : undefined}
                >
                    <div className={cn(
                        "w-8 h-8 flex items-center justify-center shrink-0",
                        isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                    )}>
                        <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-lg font-medium truncate flex-1 ml-2">
                        {item.title}
                    </span>
                </div>
            </Link>
        );
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[100vw] sm:w-[100vw] p-0 flex flex-col border-none overflow-hidden">
                {/* Header - changes based on level */}
                <SheetHeader className="p-3 pt-[max(0.75rem,env(safe-area-inset-top))] border-b bg-background/80 backdrop-blur-xl sticky top-0 z-10 flex flex-row items-center justify-between gap-3">
                    {level === 'main' ? (
                        <SheetTitle className="text-lg font-semibold">Menú</SheetTitle>
                    ) : (
                        <>
                            <button
                                onClick={navigateBack}
                                className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </button>
                            {currentContext && (
                                <SheetTitle className="font-semibold text-foreground flex-1 text-base">{currentContext.label}</SheetTitle>
                            )}
                        </>
                    )}
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full ml-auto">
                            <X className="h-4 w-4" />
                        </Button>
                    </SheetTrigger>
                </SheetHeader>

                {/* Navigation container with slide animation */}
                <div className="flex-1 relative overflow-hidden">
                    {/* ═══ Main Level - Context List ═══ */}
                    <div
                        className={cn(
                            "absolute inset-0 bg-background transition-transform duration-300 ease-out",
                            level === 'context' ? "-translate-x-full" : "translate-x-0"
                        )}
                    >
                        <div className="h-full overflow-y-auto py-2">
                            <nav className="p-2 flex flex-col gap-0.5">
                                {/* Hub - Direct navigation */}
                                <Link
                                    href="/hub"
                                    onClick={() => setOpen(false)}
                                    className="w-full block"
                                >
                                    <div
                                        className={cn(
                                            "group relative flex items-center w-full rounded-lg transition-colors",
                                            "hover:bg-muted text-muted-foreground hover:text-foreground",
                                            "p-0 min-h-[44px]",
                                            pathname?.includes('/hub') && "text-foreground"
                                        )}
                                        style={pathname?.includes('/hub') ? {
                                            borderLeft: "2px solid var(--plan-border, rgba(255,255,255,0.1))",
                                            boxShadow: "var(--plan-glow, none)",
                                            background: `linear-gradient(90deg, var(--plan-accent, rgba(255,255,255,0.06)), transparent 70%), hsl(var(--secondary))`,
                                        } : undefined}
                                    >
                                        <div className={cn(
                                            "w-8 h-8 flex items-center justify-center shrink-0",
                                            pathname?.includes('/hub') ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                                        )}>
                                            <Home className="h-4 w-4" />
                                        </div>
                                        <span className="text-lg font-medium truncate flex-1 ml-2">
                                            Hub
                                        </span>
                                    </div>
                                </Link>

                                <div className="h-px bg-border/50 my-1.5 mx-2" />

                                {/* Contexts - Drill down navigation */}
                                {allContexts.map((ctx) => {
                                    const isCurrentContext = pathname?.includes(`/${ctx.id}`);
                                    const Icon = ctx.icon;

                                    return (
                                        <button
                                            key={ctx.id}
                                            onClick={() => !ctx.disabled && navigateToContext(ctx.id)}
                                            disabled={ctx.disabled}
                                            className="w-full block text-left"
                                        >
                                            <div
                                                className={cn(
                                                    "group relative flex items-center w-full rounded-lg transition-colors",
                                                    "hover:bg-muted text-muted-foreground hover:text-foreground",
                                                    "p-0 min-h-[44px]",
                                                    ctx.disabled && "opacity-50 cursor-not-allowed",
                                                    ctx.hidden && "opacity-60",
                                                    isCurrentContext && "text-foreground"
                                                )}
                                                style={isCurrentContext ? {
                                                    borderLeft: "2px solid var(--plan-border, rgba(255,255,255,0.1))",
                                                    boxShadow: "var(--plan-glow, none)",
                                                    background: `linear-gradient(90deg, var(--plan-accent, rgba(255,255,255,0.06)), transparent 70%) hsl(var(--secondary))`,
                                                } : undefined}
                                            >
                                                <div className={cn(
                                                    "w-8 h-8 flex items-center justify-center shrink-0",
                                                    isCurrentContext ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                                                )}>
                                                    <Icon className="h-4 w-4" />
                                                </div>
                                                <span className="text-lg font-medium truncate flex-1 ml-2">
                                                    {ctx.label}
                                                    {ctx.hidden && " (Oculto)"}
                                                </span>
                                                {ctx.disabled ? (
                                                    <Lock className="h-4 w-4 text-muted-foreground mr-2" />
                                                ) : ctx.status === 'maintenance' ? (
                                                    <Lock className="h-4 w-4 text-orange-500 mr-2" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors mr-2" />
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>
                    </div>

                    {/* ═══ Context Level - Grouped Navigation Items with Accordions ═══ */}
                    <div
                        className={cn(
                            "absolute inset-0 bg-background transition-transform duration-300 ease-out",
                            level === 'context' ? "translate-x-0" : "translate-x-full"
                        )}
                    >
                        <div className="h-full overflow-y-auto">
                            {currentContext && (
                                <nav className="p-2 flex flex-col gap-1.5">
                                    {currentGroups.map((group, groupIdx) => {
                                        // Standalone items (no section header) → render as direct links
                                        if (group.standalone || !group.label) {
                                            return (
                                                <div key={`group-${groupIdx}`} className="flex flex-col gap-0.5">
                                                    {group.items.map((item, idx) => renderNavLink(item, idx))}
                                                </div>
                                            );
                                        }

                                        // Named section → render as collapsible accordion card (matches desktop)
                                        const isOpen = openAccordion === group.id;

                                        return (
                                            <div
                                                key={`group-${groupIdx}`}
                                                className="rounded-lg bg-sidebar-accent/50 border border-sidebar-border/40"
                                                style={{
                                                    boxShadow: "0 1px 3px 0 rgba(0,0,0,0.12), inset 0 1px 0 0 rgba(255,255,255,0.06)",
                                                    borderLeftColor: "var(--plan-border, rgba(255,255,255,0.06))",
                                                    borderLeftWidth: "2px",
                                                }}
                                            >
                                                {/* Accordion trigger */}
                                                <button
                                                    onClick={() => toggleAccordion(group.id)}
                                                    className={cn(
                                                        "flex items-center justify-between w-full",
                                                        "px-2.5 py-2.5 rounded-lg",
                                                        "text-[16px] font-bold text-sidebar-foreground/70",
                                                        "hover:text-sidebar-foreground/90 transition-all cursor-pointer",
                                                        isOpen && "[&>svg]:rotate-180"
                                                    )}
                                                >
                                                    <span>{group.label}</span>
                                                    <ChevronDown className="h-3.5 w-3.5 shrink-0 text-sidebar-foreground/40 transition-transform duration-200" />
                                                </button>

                                                {/* Accordion content with smooth height animation */}
                                                <div
                                                    className={cn(
                                                        "overflow-hidden transition-all duration-200 ease-out",
                                                        isOpen
                                                            ? "max-h-[500px] opacity-100"
                                                            : "max-h-0 opacity-0"
                                                    )}
                                                >
                                                    <div className="flex flex-col gap-0.5 px-0.5 pb-1">
                                                        {group.items.map((item, idx) => renderNavLink(item, idx))}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </nav>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer: Profile Bar + Notifications */}
                <div className="border-t p-3 mt-auto bg-background/80 backdrop-blur-xl pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                    {user ? (
                        <div className="flex items-center gap-2.5">
                            {/* User info — left side */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium leading-none truncate">{user.full_name || "User"}</p>
                                <p className="text-xs text-muted-foreground mt-1 truncate">{user.email}</p>
                            </div>

                            {/* ── Notifications Bell → Bottom Sheet ── */}
                            <Sheet open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                                <SheetTrigger asChild>
                                    <button className="relative shrink-0 flex items-center justify-center h-11 w-11 rounded-xl bg-muted/50 hover:bg-muted transition-colors active:scale-95">
                                        <Bell className="h-5 w-5 text-muted-foreground" />
                                        {unreadCount > 0 && (
                                            <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-background animate-pulse" />
                                        )}
                                    </button>
                                </SheetTrigger>
                                <SheetContent side="bottom" className="rounded-t-2xl px-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
                                    <SheetHeader className="px-5 pb-3 border-b">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                                    <Bell className="h-5 w-5 text-primary" />
                                                </div>
                                                <div>
                                                    <SheetTitle className="text-base font-semibold text-left">{t('title')}</SheetTitle>
                                                    {unreadCount > 0 && (
                                                        <p className="text-xs text-muted-foreground mt-0.5">{unreadCount} sin leer</p>
                                                    )}
                                                </div>
                                            </div>
                                            {unreadCount > 0 && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-xs text-muted-foreground hover:text-primary"
                                                    onClick={handleMarkAllRead}
                                                    disabled={isNotifPending}
                                                >
                                                    <Check className="mr-1 h-3.5 w-3.5" />
                                                    {t('markAllRead')}
                                                </Button>
                                            )}
                                        </div>
                                    </SheetHeader>

                                    <ScrollArea className="max-h-[50vh]">
                                        {notifications.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                                                <Bell className="h-10 w-10 mb-3 opacity-20" />
                                                <p className="text-sm">{t('empty')}</p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col">
                                                {notifications.map((notification) => {
                                                    const isRead = !!notification.read_at;
                                                    return (
                                                        <button
                                                            key={notification.id}
                                                            onClick={() => {
                                                                if (notification.notification.data && typeof notification.notification.data === 'object' && 'url' in notification.notification.data) {
                                                                    const url = (notification.notification.data as any).url;
                                                                    if (typeof url === 'string') {
                                                                        setNotificationsOpen(false);
                                                                        setOpen(false);
                                                                        router.push(url as any);
                                                                        if (!notification.read_at) handleMarkRead(notification.id);
                                                                    }
                                                                }
                                                            }}
                                                            className={cn(
                                                                "flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-muted/50 active:bg-muted border-b last:border-0 text-left w-full",
                                                                !isRead && "bg-primary/5"
                                                            )}
                                                        >
                                                            <div className={cn(
                                                                "mt-0.5 p-2 rounded-xl shrink-0",
                                                                isRead ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                                                            )}>
                                                                {isRead ? <MailOpen className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                                                            </div>
                                                            <div className="flex-1 space-y-1 min-w-0">
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <p className={cn("text-[15px] font-medium leading-snug", isRead && "text-muted-foreground font-normal")}>
                                                                        {notification.notification.title}
                                                                    </p>
                                                                    <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0 mt-0.5">
                                                                        {format(new Date(notification.delivered_at), 'dd MMM', { locale: dateLocale })}
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm text-muted-foreground line-clamp-2">
                                                                    {notification.notification.body}
                                                                </p>
                                                                {!isRead && (
                                                                    <div className="pt-1">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-7 px-2.5 text-xs"
                                                                            onClick={(e) => { e.stopPropagation(); handleMarkRead(notification.id); }}
                                                                        >
                                                                            <Check className="mr-1 h-3 w-3" />
                                                                            {t('markRead')}
                                                                        </Button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </ScrollArea>

                                    <div className="px-5 pt-3 border-t">
                                        <Button variant="outline" className="w-full h-11 text-sm" onClick={() => {
                                            setNotificationsOpen(false);
                                            setOpen(false);
                                            router.push('/notifications' as any);
                                        }}>
                                            Ver todas las notificaciones
                                        </Button>
                                    </div>
                                </SheetContent>
                            </Sheet>

                            {/* ── Avatar → Profile Bottom Sheet ── */}
                            <Sheet open={profileOpen} onOpenChange={setProfileOpen}>
                                <SheetTrigger asChild>
                                    <button className="shrink-0 rounded-xl hover:ring-2 hover:ring-primary/30 transition-all active:scale-95">
                                        <Avatar className="h-11 w-11 ring-2 ring-background shadow-sm rounded-xl">
                                            <AvatarImage src={user.avatar_url || ""} alt={user.full_name || "User"} />
                                            <AvatarFallback className="bg-primary/10 text-primary font-bold rounded-xl">
                                                {user.full_name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || "US"}
                                            </AvatarFallback>
                                        </Avatar>
                                    </button>
                                </SheetTrigger>
                                <SheetContent side="bottom" className="rounded-t-2xl px-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
                                    <SheetHeader className="px-5 pb-4 border-b">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-12 w-12 ring-2 ring-background shadow-sm rounded-xl">
                                                <AvatarImage src={user.avatar_url || ""} alt={user.full_name || "User"} />
                                                <AvatarFallback className="bg-primary/10 text-primary font-bold rounded-xl text-lg">
                                                    {user.full_name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || "US"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <SheetTitle className="text-base font-semibold text-left">{user.full_name || "User"}</SheetTitle>
                                                <p className="text-sm text-muted-foreground truncate mt-0.5">{user.email || ""}</p>
                                            </div>
                                        </div>
                                    </SheetHeader>

                                    {/* Profile actions — large touch targets */}
                                    <nav className="flex flex-col py-2">
                                        <Link
                                            href="/profile"
                                            onClick={() => { setProfileOpen(false); setOpen(false); }}
                                            className="flex items-center gap-4 px-5 py-3.5 text-[15px] text-foreground hover:bg-muted/60 transition-colors active:bg-muted"
                                        >
                                            <Settings className="h-5 w-5 text-muted-foreground" />
                                            Configuración
                                        </Link>

                                        <Link
                                            href={"/" as any}
                                            onClick={() => { setProfileOpen(false); setOpen(false); }}
                                            className="flex items-center gap-4 px-5 py-3.5 text-[15px] text-foreground hover:bg-muted/60 transition-colors active:bg-muted"
                                        >
                                            <Home className="h-5 w-5 text-muted-foreground" />
                                            Ir a Inicio
                                        </Link>

                                        <Link
                                            href={"/contact" as any}
                                            onClick={() => { setProfileOpen(false); setOpen(false); }}
                                            className="flex items-center gap-4 px-5 py-3.5 text-[15px] text-foreground hover:bg-muted/60 transition-colors active:bg-muted"
                                        >
                                            <Mail className="h-5 w-5 text-muted-foreground" />
                                            Contacto
                                        </Link>

                                        <button
                                            onClick={() => { setProfileOpen(false); setOpen(false); }}
                                            className="flex items-center gap-4 px-5 py-3.5 text-[15px] text-foreground hover:bg-muted/60 transition-colors active:bg-muted text-left"
                                        >
                                            <Sparkles className="h-5 w-5 text-muted-foreground" />
                                            Feedback
                                        </button>

                                        {/* Separator */}
                                        <div className="h-px bg-border/50 my-1 mx-5" />

                                        {/* Theme selector */}
                                        {mounted && (
                                            <div className="flex items-center justify-between px-5 py-3">
                                                <span className="text-[15px] text-foreground">Tema</span>
                                                <div className="flex items-center rounded-full border bg-background p-0.5">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setTheme("system")}
                                                        className={cn("h-8 w-8 rounded-full", theme === 'system' && "bg-muted")}
                                                    >
                                                        <Monitor className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setTheme("light")}
                                                        className={cn("h-8 w-8 rounded-full", theme === 'light' && "bg-muted")}
                                                    >
                                                        <Sun className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setTheme("dark")}
                                                        className={cn("h-8 w-8 rounded-full", theme === 'dark' && "bg-muted")}
                                                    >
                                                        <Moon className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Separator */}
                                        <div className="h-px bg-border/50 my-1 mx-5" />

                                        {/* Logout */}
                                        <button
                                            onClick={() => { setProfileOpen(false); setOpen(false); handleLogout(); }}
                                            className="flex items-center gap-4 px-5 py-3.5 text-[15px] text-destructive hover:bg-destructive/10 transition-colors active:bg-destructive/20 text-left"
                                        >
                                            <LogOut className="h-5 w-5" />
                                            Cerrar Sesión
                                        </button>
                                    </nav>
                                </SheetContent>
                            </Sheet>
                        </div>
                    ) : (
                        <Button asChild size="sm" variant="outline" className="w-full">
                            <Link href="/login">Ingresar</Link>
                        </Button>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
