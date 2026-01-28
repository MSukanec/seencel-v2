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
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Menu, X, Lock, Home, Settings, LogOut, Sun, Moon, Monitor, Hammer } from "lucide-react";
import { useSidebarNavigation } from "@/hooks/use-sidebar-navigation";
import { UserProfile } from "@/types/user";
import { useLayoutStore, useActiveProjectId } from "@/store/layout-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "@/i18n/routing";
import { useTheme } from "next-themes";

import { useUser } from "@/context/user-context";

interface MobileNavProps {
    // We no longer need propUser
}

export function MobileNav() {
    const [open, setOpen] = React.useState(false);
    const { user } = useUser();
    const pathname = usePathname();
    const router = useRouter();
    const { contexts, getNavItems } = useSidebarNavigation();
    const { activeContext, actions } = useLayoutStore();
    const activeProjectId = useActiveProjectId();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.replace('/login');
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[100vw] sm:w-[100vw] p-0 flex flex-col border-none">
                <SheetHeader className="p-4 border-b text-left bg-background/50 backdrop-blur-xl sticky top-0 z-10 flex flex-row items-center justify-between">
                    <SheetTitle className="text-lg font-bold">Menú</SheetTitle>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground rounded-full">
                            <X className="h-4 w-4" />
                        </Button>
                    </SheetTrigger>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto py-6 bg-background">
                    <div className="px-6">
                        {/* Hub Button - Always visible at top */}
                        <Link
                            href="/hub"
                            onClick={() => setOpen(false)}
                            className={cn(
                                "flex items-center gap-4 px-4 py-4 rounded-xl text-base font-medium transition-all mb-4 border border-primary/20 bg-primary/5 hover:bg-primary/10",
                                pathname?.includes('/hub') && "bg-primary/10 text-primary"
                            )}
                        >
                            <Home className="h-5 w-5 text-primary" />
                            Hub
                        </Link>

                        <Accordion type="single" collapsible defaultValue={activeContext || undefined} onValueChange={(val) => {
                            if (val) actions.setActiveContext(val as any);
                        }}>
                            {/* Add Project section if activeProjectId exists */}
                            {activeProjectId && (
                                <AccordionItem
                                    value="project"
                                    className="border-b border-border/40 last:border-0 data-[state=open]:border-border/60"
                                >
                                    <AccordionTrigger
                                        className="hover:no-underline py-4 text-base font-medium text-foreground/80 data-[state=open]:text-primary data-[state=open]:font-semibold transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            <Hammer className="h-5 w-5" />
                                            Proyecto
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="flex flex-col gap-2 pl-4 pb-4">
                                            {getNavItems('project').map((item, idx) => {
                                                const isActive = pathname === item.href;
                                                return (
                                                    <Link
                                                        key={idx}
                                                        href={item.href as any}
                                                        onClick={() => {
                                                            setOpen(false);
                                                            actions.setActiveContext('project');
                                                        }}
                                                        className={cn(
                                                            "flex items-center gap-4 px-4 py-3.5 rounded-xl text-[15px] transition-all",
                                                            isActive
                                                                ? "bg-primary/10 text-primary font-medium shadow-sm"
                                                                : "hover:bg-muted/50 text-foreground/70"
                                                        )}
                                                    >
                                                        <item.icon className="h-4.5 w-4.5" />
                                                        {item.title}
                                                    </Link>
                                                )
                                            })}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            )}
                            {contexts.map((ctx) => {
                                const items = getNavItems(ctx.id);
                                return (
                                    <AccordionItem
                                        key={ctx.id}
                                        value={ctx.id}
                                        className={cn(
                                            "border-b border-border/40 last:border-0 data-[state=open]:border-border/60",
                                            ctx.hidden && "opacity-60 border-dashed bg-muted/20"
                                        )}
                                    >
                                        <AccordionTrigger
                                            disabled={ctx.disabled}
                                            className={cn(
                                                "hover:no-underline py-4 text-base font-medium text-foreground/80 data-[state=open]:text-primary data-[state=open]:font-semibold transition-all",
                                                (ctx.disabled || ctx.status === 'maintenance') && "opacity-60",
                                                ctx.disabled && "cursor-not-allowed"
                                            )}
                                        >
                                            <div className="flex items-center gap-4">
                                                <ctx.icon className="h-5 w-5" />
                                                {ctx.label} {ctx.hidden && "(Oculto)"} {ctx.disabled && <Lock className="h-4 w-4 ml-2" />} {!ctx.disabled && ctx.status === 'maintenance' && <Lock className="h-4 w-4 ml-2 text-orange-500" />}
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div className="flex flex-col gap-2 pl-4 pb-4">
                                                {items.map((item, idx) => {
                                                    const isActive = pathname === item.href;
                                                    return (
                                                        <Link
                                                            key={idx}
                                                            href={item.href as any}
                                                            onClick={(e) => {
                                                                if (ctx.disabled) {
                                                                    e.preventDefault();
                                                                    return;
                                                                }
                                                                setOpen(false);
                                                                actions.setActiveContext(ctx.id);
                                                            }}
                                                            className={cn(
                                                                "flex items-center gap-4 px-4 py-3.5 rounded-xl text-[15px] transition-all",
                                                                isActive
                                                                    ? "bg-primary/10 text-primary font-medium shadow-sm"
                                                                    : "hover:bg-muted/50 text-foreground/70"
                                                            )}
                                                        >
                                                            <item.icon className="h-4.5 w-4.5" />
                                                            {item.title}
                                                        </Link>
                                                    )
                                                })}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                );
                            })}
                        </Accordion>
                    </div>
                </div>

                {/* Footer: Avatar with Dropdown */}
                <div className="border-t p-4 mt-auto bg-background/50 backdrop-blur-xl">
                    <div className="flex items-center justify-end gap-4 w-full">
                        {user && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Avatar className="h-10 w-10 ring-2 ring-background shadow-sm cursor-pointer transition-transform hover:scale-105 rounded-lg">
                                        <AvatarImage src={user.avatar_url || ""} alt={user.full_name || "User"} />
                                        <AvatarFallback className="bg-primary/10 text-primary font-bold rounded-lg text-xs">
                                            {user.full_name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || "US"}
                                        </AvatarFallback>
                                    </Avatar>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56" align="end" forceMount>
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium leading-none">{user.full_name || "User"}</p>
                                            <p className="text-xs leading-none text-muted-foreground">
                                                {user.email || ""}
                                            </p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />

                                    <DropdownMenuItem asChild>
                                        <Link href="/settings" onClick={() => setOpen(false)}>
                                            <Settings className="mr-2 h-4 w-4" />
                                            Configuración
                                        </Link>
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator />

                                    {/* Theme Toggle */}
                                    <div className="flex items-center justify-between px-2 py-1.5 select-none">
                                        <span className="text-sm font-medium leading-none">Tema</span>
                                        <div className="flex items-center rounded-full border bg-background">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setTheme("system")}
                                                className={cn("h-7 w-7 rounded-full text-muted-foreground hover:text-foreground", mounted && theme === 'system' && "bg-muted text-foreground")}
                                            >
                                                <Monitor className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setTheme("light")}
                                                className={cn("h-7 w-7 rounded-full text-muted-foreground hover:text-foreground", mounted && theme === 'light' && "bg-muted text-foreground")}
                                            >
                                                <Sun className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setTheme("dark")}
                                                className={cn("h-7 w-7 rounded-full text-muted-foreground hover:text-foreground", mounted && theme === 'dark' && "bg-muted text-foreground")}
                                            >
                                                <Moon className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>

                                    <DropdownMenuSeparator />

                                    <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Cerrar Sesión
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}

                        {!user && (
                            <Button asChild size="sm" variant="outline"><Link href="/login">Ingresar</Link></Button>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}

