"use client";

import * as React from "react";
import { Link } from "@/i18n/routing";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Menu, X, Lock, Home, Settings, LogOut, Sun, Moon, Monitor, ChevronRight, ArrowLeft, Hammer, Sparkles, Mail } from "lucide-react";
import { useSidebarNavigation } from "@/hooks/use-sidebar-navigation";
import { useLayoutStore, useActiveProjectId } from "@/store/layout-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "@/i18n/routing";
import { useTheme } from "next-themes";
import { useUser } from "@/context/user-context";

// Types for drill-down navigation
type NavigationLevel = 'main' | 'context';
type ContextId = string | null;

export function MobileNav() {
    const [open, setOpen] = React.useState(false);
    const [level, setLevel] = React.useState<NavigationLevel>('main');
    const [activeContextId, setActiveContextId] = React.useState<ContextId>(null);
    const [isAnimating, setIsAnimating] = React.useState(false);

    const { user } = useUser();
    const pathname = usePathname();
    const router = useRouter();
    const { contexts, getNavItems } = useSidebarNavigation();
    const { actions } = useLayoutStore();
    const activeProjectId = useActiveProjectId();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    // Reset navigation when sheet closes
    React.useEffect(() => {
        if (!open) {
            // Small delay to allow close animation
            const timer = setTimeout(() => {
                setLevel('main');
                setActiveContextId(null);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [open]);

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
        setTimeout(() => setIsAnimating(false), 300);
    };

    // Navigate back to main level
    const navigateBack = () => {
        setIsAnimating(true);
        setLevel('main');
        setTimeout(() => {
            setActiveContextId(null);
            setIsAnimating(false);
        }, 300);
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

        // Add organization first
        const orgContext = contexts.find(c => c.id === 'organization');
        if (orgContext) list.push(orgContext);

        // Add project if active
        if (activeProjectId) {
            list.push({
                id: 'project',
                label: 'Proyecto',
                icon: Hammer,
            });
        }

        // Add remaining contexts
        contexts.forEach(ctx => {
            if (ctx.id !== 'organization') {
                list.push(ctx);
            }
        });

        return list;
    }, [contexts, activeProjectId]);

    // Get current context data
    const currentContext = allContexts.find(c => c.id === activeContextId);
    const currentItems = activeContextId ? getNavItems(activeContextId as any) : [];

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
                <SheetHeader className="p-4 border-b bg-background/80 backdrop-blur-xl sticky top-0 z-10 flex flex-row items-center justify-between">
                    {level === 'main' ? (
                        <SheetTitle className="text-lg font-semibold">Menú</SheetTitle>
                    ) : (
                        <button
                            onClick={navigateBack}
                            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors -ml-1"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span>Menú</span>
                        </button>
                    )}
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground rounded-full">
                            <X className="h-4 w-4" />
                        </Button>
                    </SheetTrigger>
                </SheetHeader>

                {/* Navigation container with slide animation */}
                <div className="flex-1 relative overflow-hidden">
                    {/* Main Level - Context List */}
                    <div
                        className={cn(
                            "absolute inset-0 bg-background transition-transform duration-300 ease-out",
                            level === 'context' ? "-translate-x-full" : "translate-x-0"
                        )}
                    >
                        <div className="h-full overflow-y-auto py-2">
                            <nav className="px-3 space-y-1">
                                {/* Hub - Direct navigation */}
                                <Link
                                    href="/hub"
                                    onClick={() => setOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all group",
                                        pathname?.includes('/hub')
                                            ? "bg-primary/10 text-primary"
                                            : "hover:bg-muted/60 text-foreground/80 hover:text-foreground"
                                    )}
                                >
                                    <div className={cn(
                                        "flex items-center justify-center w-9 h-9 rounded-lg transition-colors",
                                        pathname?.includes('/hub')
                                            ? "bg-primary/15"
                                            : "bg-muted/50 group-hover:bg-muted"
                                    )}>
                                        <Home className="h-4 w-4" />
                                    </div>
                                    <span className="flex-1">Hub</span>
                                </Link>

                                {/* Divider */}
                                <div className="h-px bg-border/50 my-2 mx-3" />

                                {/* Contexts - Drill down navigation */}
                                {allContexts.map((ctx) => {
                                    const isCurrentContext = pathname?.includes(`/${ctx.id}`);
                                    const Icon = ctx.icon;

                                    return (
                                        <button
                                            key={ctx.id}
                                            onClick={() => !ctx.disabled && navigateToContext(ctx.id)}
                                            disabled={ctx.disabled}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all group text-left",
                                                ctx.disabled
                                                    ? "opacity-50 cursor-not-allowed"
                                                    : "hover:bg-muted/60",
                                                isCurrentContext
                                                    ? "bg-primary/10 text-primary"
                                                    : "text-foreground/80 hover:text-foreground",
                                                ctx.hidden && "opacity-60"
                                            )}
                                        >
                                            <div className={cn(
                                                "flex items-center justify-center w-9 h-9 rounded-lg transition-colors",
                                                isCurrentContext
                                                    ? "bg-primary/15"
                                                    : "bg-muted/50 group-hover:bg-muted"
                                            )}>
                                                <Icon className="h-4 w-4" />
                                            </div>
                                            <span className="flex-1">
                                                {ctx.label}
                                                {ctx.hidden && " (Oculto)"}
                                            </span>
                                            {ctx.disabled ? (
                                                <Lock className="h-4 w-4 text-muted-foreground" />
                                            ) : ctx.status === 'maintenance' ? (
                                                <Lock className="h-4 w-4 text-orange-500" />
                                            ) : (
                                                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                                            )}
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>
                    </div>

                    {/* Context Level - Navigation Items */}
                    <div
                        className={cn(
                            "absolute inset-0 bg-background transition-transform duration-300 ease-out",
                            level === 'context' ? "translate-x-0" : "translate-x-full"
                        )}
                    >
                        <div className="h-full overflow-y-auto">
                            {currentContext && (
                                <>
                                    {/* Context Header */}
                                    <div className="px-4 py-3 border-b border-border/50 bg-muted/30">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
                                                <currentContext.icon className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <h2 className="font-semibold text-foreground">
                                                    {currentContext.label}
                                                </h2>
                                                <p className="text-xs text-muted-foreground">
                                                    {currentItems.length} opciones
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Navigation Items */}
                                    <nav className="p-3 space-y-1">
                                        {currentItems.map((item, idx) => {
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
                                                    className={cn(
                                                        "flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all group",
                                                        isActive
                                                            ? "bg-primary/10 text-primary font-medium"
                                                            : "hover:bg-muted/60 text-foreground/70 hover:text-foreground"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "flex items-center justify-center w-9 h-9 rounded-lg transition-colors",
                                                        isActive
                                                            ? "bg-primary/15"
                                                            : "bg-muted/40 group-hover:bg-muted/60"
                                                    )}>
                                                        <Icon className="h-4 w-4" />
                                                    </div>
                                                    <span>{item.title}</span>
                                                </Link>
                                            );
                                        })}
                                    </nav>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer: User Profile */}
                <div className="border-t p-3 mt-auto bg-background/80 backdrop-blur-xl">
                    <div className="flex items-center justify-end">
                        {/* User Avatar with Dropdown - SAME OPTIONS AS DESKTOP */}
                        {user ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-muted/60 transition-colors">
                                        <div className="text-right hidden sm:block">
                                            <p className="text-sm font-medium leading-none">{user.full_name || "User"}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
                                        </div>
                                        <Avatar className="h-9 w-9 ring-2 ring-background shadow-sm rounded-lg">
                                            <AvatarImage src={user.avatar_url || ""} alt={user.full_name || "User"} />
                                            <AvatarFallback className="bg-primary/10 text-primary font-bold rounded-lg text-xs">
                                                {user.full_name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || "US"}
                                            </AvatarFallback>
                                        </Avatar>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56" align="end" forceMount>
                                    {/* User Info Header */}
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium leading-none">{user.full_name || "User"}</p>
                                            <p className="text-xs leading-none text-muted-foreground">
                                                {user.email || ""}
                                            </p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />

                                    {/* 1. Configuración */}
                                    <DropdownMenuItem asChild>
                                        <Link href="/settings" onClick={() => setOpen(false)}>
                                            <Settings className="mr-2 h-4 w-4" />
                                            Configuración
                                        </Link>
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator />

                                    {/* 2. Feedback */}
                                    <DropdownMenuItem onClick={() => setOpen(false)}>
                                        <Sparkles className="mr-2 h-4 w-4" />
                                        Feedback
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator />

                                    {/* 3. Home */}
                                    <DropdownMenuItem asChild>
                                        <Link href="/" onClick={() => setOpen(false)}>
                                            <Home className="mr-2 h-4 w-4" />
                                            Ir a Inicio
                                        </Link>
                                    </DropdownMenuItem>

                                    {/* 4. Contacto */}
                                    <DropdownMenuItem asChild>
                                        <Link href="/contact" onClick={() => setOpen(false)}>
                                            <Mail className="mr-2 h-4 w-4" />
                                            Contacto
                                        </Link>
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator />

                                    {/* 5. Theme Toggle */}
                                    {mounted && (
                                        <div className="flex items-center justify-between px-2 py-2">
                                            <span className="text-sm text-muted-foreground">Tema</span>
                                            <div className="flex items-center rounded-full border bg-background">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setTheme("system")}
                                                    className={cn(
                                                        "h-6 w-6 rounded-full",
                                                        theme === 'system' && "bg-muted"
                                                    )}
                                                >
                                                    <Monitor className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setTheme("light")}
                                                    className={cn(
                                                        "h-6 w-6 rounded-full",
                                                        theme === 'light' && "bg-muted"
                                                    )}
                                                >
                                                    <Sun className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setTheme("dark")}
                                                    className={cn(
                                                        "h-6 w-6 rounded-full",
                                                        theme === 'dark' && "bg-muted"
                                                    )}
                                                >
                                                    <Moon className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    <DropdownMenuSeparator />

                                    {/* 6. Logout */}
                                    <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Cerrar Sesión
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Button asChild size="sm" variant="outline">
                                <Link href="/login">Ingresar</Link>
                            </Button>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
