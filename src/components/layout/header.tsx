"use client";

import * as React from "react"
import { usePathname, useRouter, Link } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
    NavigationMenuIndicator
} from "@/components/ui/navigation-menu"
import { Bell, Briefcase, ChevronDown, LayoutDashboard, Settings, User, Wallet, Building, Users, GraduationCap, ArrowRight, Zap, Target, Moon, Sun, Monitor } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import Image from "next/image";

import { UserProfile } from "@/types/user";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLayoutStore } from "@/store/layout-store";
import { FeedbackButton } from "@/components/feedback-button";
import { PlanStatusButton } from "@/components/plan-status-button";

import { ProjectSelectorWrapper } from "@/components/layout/project-selector-wrapper";

export function Header({ variant = 'app', user, activeOrgId }: { variant?: 'public' | 'app', user?: UserProfile | null, activeOrgId?: string }) {
    const pathname = usePathname();
    const router = useRouter();
    const tPublic = useTranslations('Public.nav');
    const tMega = useTranslations('MegaMenu');
    const tUser = useTranslations('UserMenu');

    const { setTheme, theme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/10 bg-background/80 backdrop-blur-md shadow-sm">
            <div className="flex h-16 w-full items-center px-8 relative max-w-[1920px] mx-auto">
                {/* 1. Logo */}
                <div className="flex items-center justify-start mr-8">
                    <Link href="/" className="flex items-center space-x-2">
                        <div className="relative h-8 w-8">
                            <Image
                                src="/logo.png"
                                alt="SEENCEL"
                                fill
                                className="object-contain"
                            />
                        </div>
                        <span className="font-bold text-xl tracking-tighter">
                            SEENCEL
                        </span>
                    </Link>
                </div>

                {/* PROJECT SELECTOR (Automatically visible in project context) */}
                {variant === 'app' && (
                    <ProjectSelectorWrapper />
                )}

                {/* 2. Navigation */}
                {variant === 'app' ? (
                    // APP NAVIGATION (Fluid Mega Menu)
                    <NavigationMenu delayDuration={0} className="hidden md:flex">
                        <NavigationMenuList>

                            {/* ORGANIZATION */}
                            <NavigationMenuItem>
                                <NavigationMenuTrigger className="bg-transparent hover:bg-muted/50 data-[state=open]:bg-muted/50">
                                    {tMega('Organization.title')}
                                </NavigationMenuTrigger>
                                <NavigationMenuContent>
                                    <ul className="grid gap-3 p-6 md:w-[600px] lg:w-[700px] lg:grid-cols-[250px_1fr_1fr]">
                                        <li className="row-span-3">
                                            <NavigationMenuLink asChild>
                                                <Link
                                                    className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-blue-500/10 to-blue-500/5 p-6 no-underline outline-none focus:shadow-md hover:bg-blue-500/20 transition-colors"
                                                    href="/organization"
                                                >
                                                    <Building className="h-8 w-8 mb-4 text-blue-500" />
                                                    <div className="mb-2 mt-4 text-lg font-medium text-foreground">
                                                        {tMega('Organization.title')}
                                                    </div>
                                                    <p className="text-sm leading-tight text-muted-foreground">
                                                        {tMega('Organization.description')}
                                                    </p>
                                                    <ArrowRight className="ml-auto h-4 w-4 mt-4 opacity-50" />
                                                </Link>
                                            </NavigationMenuLink>
                                        </li>

                                        <div className="flex flex-col space-y-2">
                                            <h4 className="font-medium leading-none mb-2 text-sm text-foreground/80 tracking-wide uppercase">{tMega('Organization.sections.management')}</h4>
                                            <ListItem href="/organization" title={tMega('Organization.items.overview')} />
                                            <ListItem href="#" title={tMega('Organization.items.basicData')} />
                                            <ListItem href="/organization/projects" title={tMega('Organization.items.projectManagement')} />
                                            <ListItem href="#" title={tMega('Organization.items.contacts')} />
                                            <ListItem href="#" title={tMega('Organization.items.technicalCatalog')} />
                                            <ListItem href="/settings" title={tMega('Organization.items.settings')} />
                                        </div>

                                        <div className="flex flex-col space-y-2">
                                            <h4 className="font-medium leading-none mb-2 text-sm text-foreground/80 tracking-wide uppercase">{tMega('Organization.sections.finance')}</h4>
                                            <ListItem href="/finance" title={tMega('Organization.items.finance')} />
                                            <ListItem href="#" title={tMega('Organization.items.capital')} />
                                            <ListItem href="#" title={tMega('Organization.items.generalExpenses')} />
                                            <ListItem href="#" title={tMega('Organization.items.taxes')} />
                                        </div>
                                    </ul>
                                </NavigationMenuContent>
                            </NavigationMenuItem>

                            {/* PROJECTS */}
                            <NavigationMenuItem>
                                <NavigationMenuTrigger className="bg-transparent hover:bg-muted/50 data-[state=open]:bg-muted/50">
                                    {tMega('Project.title')}
                                </NavigationMenuTrigger>
                                <NavigationMenuContent>
                                    <ul className="grid gap-3 p-6 md:w-[800px] lg:w-[900px] lg:grid-cols-[220px_1fr_1fr_1fr]">
                                        <li className="row-span-3">
                                            <NavigationMenuLink asChild>
                                                <Link
                                                    className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-orange-500/10 to-orange-500/5 p-6 no-underline outline-none focus:shadow-md hover:bg-orange-500/20 transition-colors"
                                                    href="/organization/projects"
                                                >
                                                    <Briefcase className="h-8 w-8 mb-4 text-orange-500" />
                                                    <div className="mb-2 mt-4 text-lg font-medium text-foreground">
                                                        {tMega('Project.title')}
                                                    </div>
                                                    <p className="text-sm leading-tight text-muted-foreground">
                                                        {tMega('Project.description')}
                                                    </p>
                                                    <ArrowRight className="ml-auto h-4 w-4 mt-4 opacity-50" />
                                                </Link>
                                            </NavigationMenuLink>
                                        </li>

                                        <div className="flex flex-col space-y-2">
                                            <h4 className="font-medium leading-none mb-2 text-sm text-foreground/80 tracking-wide uppercase">{tMega('Project.sections.management')}</h4>
                                            <ListItem href="/organization/projects" title={tMega('Project.items.overview')} />
                                            <ListItem href="#" title={tMega('Project.items.basicData')} />
                                            <ListItem href="#" title={tMega('Project.items.filesMedia')} />
                                            <ListItem href="#" title={tMega('Project.items.technicalDocs')} />
                                        </div>

                                        <div className="flex flex-col space-y-2">
                                            <h4 className="font-medium leading-none mb-2 text-sm text-foreground/80 tracking-wide uppercase">{tMega('Project.sections.construction')}</h4>
                                            <ListItem href="#" title={tMega('Project.items.computationBudget')} />
                                            <ListItem href="#" title={tMega('Project.items.labor')} />
                                            <ListItem href="#" title={tMega('Project.items.materials')} />
                                            <ListItem href="#" title={tMega('Project.items.subcontracts')} />
                                            <ListItem href="#" title={tMega('Project.items.indirects')} />
                                            <ListItem href="#" title={tMega('Project.items.siteLog')} />
                                        </div>

                                        <div className="flex flex-col space-y-2">
                                            <h4 className="font-medium leading-none mb-2 text-sm text-foreground/80 tracking-wide uppercase">{tMega('Project.sections.design')}</h4>
                                            <ListItem href="#" title={tMega('Project.items.moodboard')} />
                                            <div className="pt-2">
                                                <h4 className="font-medium leading-none mb-2 text-sm text-foreground/80 tracking-wide uppercase">{tMega('Project.sections.commercial')}</h4>
                                                <ListItem href="#" title={tMega('Project.items.clients')} />
                                            </div>
                                        </div>
                                    </ul>
                                </NavigationMenuContent>
                            </NavigationMenuItem>

                            {/* FINANCE */}
                            <NavigationMenuItem>
                                <NavigationMenuTrigger className="bg-transparent hover:bg-muted/50 data-[state=open]:bg-muted/50">
                                    {tMega('Finance.title')}
                                </NavigationMenuTrigger>
                                <NavigationMenuContent>
                                    <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                                        <li className="row-span-3">
                                            <NavigationMenuLink asChild>
                                                <Link
                                                    className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-green-500/10 to-green-500/5 p-6 no-underline outline-none focus:shadow-md hover:bg-green-500/20 transition-colors"
                                                    href="/finance"
                                                >
                                                    <Wallet className="h-8 w-8 mb-4 text-green-500" />
                                                    <div className="mb-2 mt-4 text-lg font-medium text-foreground">
                                                        {tMega('Finance.title')}
                                                    </div>
                                                    <p className="text-sm leading-tight text-muted-foreground">
                                                        {tMega('Finance.description')}
                                                    </p>
                                                    <ArrowRight className="ml-auto h-4 w-4 mt-4 opacity-50" />
                                                </Link>
                                            </NavigationMenuLink>
                                        </li>
                                        <ListItem href="/finance" title={tMega('Finance.items.overview')}>
                                            {tMega('Finance.items.overviewDescription')}
                                        </ListItem>
                                        <ListItem href="#" title={tMega('Finance.items.invoices')}>
                                            {tMega('Finance.items.invoicesDescription')}
                                        </ListItem>
                                        <ListItem href="#" title={tMega('Finance.items.expenses')}>
                                            {tMega('Finance.items.expensesDescription')}
                                        </ListItem>
                                    </ul>
                                </NavigationMenuContent>
                            </NavigationMenuItem>

                            {/* LEARNINGS */}
                            <NavigationMenuItem>
                                <NavigationMenuTrigger className="bg-transparent hover:bg-muted/50 data-[state=open]:bg-muted/50">
                                    {tMega('Learnings.title')}
                                </NavigationMenuTrigger>
                                <NavigationMenuContent>
                                    <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                                        <li className="row-span-3">
                                            <NavigationMenuLink asChild>
                                                <Link
                                                    className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-purple-500/10 to-purple-500/5 p-6 no-underline outline-none focus:shadow-md hover:bg-purple-500/20 transition-colors"
                                                    href={"#" as any}
                                                >
                                                    <GraduationCap className="h-8 w-8 mb-4 text-purple-500" />
                                                    <div className="mb-2 mt-4 text-lg font-medium text-foreground">
                                                        {tMega('Learnings.title')}
                                                    </div>
                                                    <p className="text-sm leading-tight text-muted-foreground">
                                                        {tMega('Learnings.description')}
                                                    </p>
                                                    <ArrowRight className="ml-auto h-4 w-4 mt-4 opacity-50" />
                                                </Link>
                                            </NavigationMenuLink>
                                        </li>
                                        <ListItem href="#" title={tMega('Learnings.items.courses')}>
                                            {tMega('Learnings.items.coursesDescription')}
                                        </ListItem>
                                        <ListItem href="#" title={tMega('Learnings.items.documentation')}>
                                            {tMega('Learnings.items.documentationDescription')}
                                        </ListItem>
                                        <ListItem href="#" title={tMega('Learnings.items.certifications')}>
                                            {tMega('Learnings.items.certificationsDescription')}
                                        </ListItem>
                                    </ul>
                                </NavigationMenuContent>
                            </NavigationMenuItem>


                            {/* COMMUNITY */}
                            <NavigationMenuItem>
                                <NavigationMenuTrigger className="bg-transparent hover:bg-muted/50 data-[state=open]:bg-muted/50">
                                    {tMega('Community.title')}
                                </NavigationMenuTrigger>
                                <NavigationMenuContent>
                                    <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                                        <li className="row-span-3">
                                            <NavigationMenuLink asChild>
                                                <Link
                                                    className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-yellow-500/10 to-yellow-500/5 p-6 no-underline outline-none focus:shadow-md hover:bg-yellow-500/20 transition-colors"
                                                    href={"#" as any}
                                                >
                                                    <Users className="h-8 w-8 mb-4 text-yellow-500" />
                                                    <div className="mb-2 mt-4 text-lg font-medium text-foreground">
                                                        {tMega('Community.title')}
                                                    </div>
                                                    <p className="text-sm leading-tight text-muted-foreground">
                                                        {tMega('Community.description')}
                                                    </p>
                                                    <ArrowRight className="ml-auto h-4 w-4 mt-4 opacity-50" />
                                                </Link>
                                            </NavigationMenuLink>
                                        </li>
                                        <ListItem href="#" title={tMega('Community.items.forums')}>
                                            {tMega('Community.items.forumsDescription')}
                                        </ListItem>
                                        <ListItem href="#" title={tMega('Community.items.events')}>
                                            {tMega('Community.items.eventsDescription')}
                                        </ListItem>
                                        <ListItem href="#" title={tMega('Community.items.showcase')}>
                                            {tMega('Community.items.showcaseDescription')}
                                        </ListItem>
                                    </ul>
                                </NavigationMenuContent>
                            </NavigationMenuItem>

                            <NavigationMenuIndicator />
                        </NavigationMenuList>
                    </NavigationMenu>
                ) : (
                    // PUBLIC NAVIGATION (Centered)
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                        <nav className="hidden md:flex items-center justify-center">
                            <ul className="flex items-center space-x-8">
                                <li><Link href="/features" className="text-sm font-medium hover:text-primary transition-colors">{tPublic('features')}</Link></li>
                                <li><Link href="/founders" className="text-sm font-medium hover:text-primary transition-colors">{tPublic('founders')}</Link></li>
                                <li><Link href="/pricing" className="text-sm font-medium hover:text-primary transition-colors">{tPublic('pricing')}</Link></li>
                            </ul>
                        </nav>
                    </div>
                )}


                {/* 3. User Actions / CTA (Right Side) */}
                <div className="flex flex-1 items-center justify-end space-x-4">
                    <nav className="flex items-center space-x-2">
                        {/* Hide Feedback on Public Header */}
                        {variant === 'app' && (
                            <div className="hidden md:flex items-center gap-2">
                                <PlanStatusButton />
                                <FeedbackButton />
                            </div>
                        )}

                        {variant === 'app' || user ? (
                            <>
                                {variant === 'public' && (
                                    <>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            asChild
                                            className="mr-2 h-8 gap-2 px-3 text-xs font-medium"
                                        >
                                            <Link href="/contact">{tPublic('contact')}</Link>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            asChild
                                            className="mr-2 h-8 gap-2 px-3 text-xs font-medium"
                                        >
                                            <Link href="/organization">{tUser('dashboard')}</Link>
                                        </Button>
                                    </>
                                )}

                                {variant === 'app' && (
                                    <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
                                        <Bell className="h-4 w-4" />
                                        <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-600 border border-background" />
                                    </Button>
                                )}
                                {/* User Dropdown */}
                                <DropdownMenu modal={false}>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="relative h-8 w-8 rounded-full ml-2">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={user?.avatar_url || ""} alt={user?.full_name || "User"} />
                                                <AvatarFallback>
                                                    {user?.full_name
                                                        ? user.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
                                                        : "US"}
                                                </AvatarFallback>
                                            </Avatar>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-56" align="end" forceMount>
                                        <DropdownMenuLabel className="font-normal">
                                            <div className="flex flex-col space-y-1">
                                                <p className="text-sm font-medium leading-none">{user?.full_name || "User"}</p>
                                                <p className="text-xs leading-none text-muted-foreground">
                                                    {user?.email || ""}
                                                </p>
                                            </div>
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />

                                        {/* Public: Show Dashboard/Workspace link */}
                                        {variant === 'public' && (
                                            <DropdownMenuItem asChild>
                                                <Link href="/organization">{tUser('dashboard')}</Link>
                                            </DropdownMenuItem>
                                        )}

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
                                                    className={cn("h-7 w-7 rounded-full text-muted-foreground hover:text-foreground", mounted && theme === 'system' && "bg-muted text-foreground")}
                                                    title="Sistema"
                                                >
                                                    <Monitor className="h-3.5 w-3.5" />
                                                    <span className="sr-only">System</span>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setTheme("light")}
                                                    className={cn("h-7 w-7 rounded-full text-muted-foreground hover:text-foreground", mounted && theme === 'light' && "bg-muted text-foreground")}
                                                    title="Claro"
                                                >
                                                    <Sun className="h-3.5 w-3.5" />
                                                    <span className="sr-only">Light</span>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setTheme("dark")}
                                                    className={cn("h-7 w-7 rounded-full text-muted-foreground hover:text-foreground", mounted && theme === 'dark' && "bg-muted text-foreground")}
                                                    title="Oscuro"
                                                >
                                                    <Moon className="h-3.5 w-3.5" />
                                                    <span className="sr-only">Dark</span>
                                                </Button>
                                            </div>
                                        </div>

                                        <DropdownMenuSeparator />

                                        {/* App: Show Home and Contact links */}
                                        {variant === 'app' && (
                                            <>
                                                <DropdownMenuItem asChild>
                                                    <Link href="/">{tUser('home')}</Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link href="/contact">Contacto</Link>
                                                </DropdownMenuItem>
                                            </>
                                        )}


                                        <DropdownMenuItem
                                            className="text-foreground hover:!text-red-600 hover:!bg-red-50 dark:hover:!bg-red-950/20 data-[highlighted]:text-red-600 cursor-pointer"
                                            onClick={async () => {
                                                const supabase = createClient();
                                                await supabase.auth.signOut();
                                                router.refresh();
                                                router.push('/login');
                                            }}
                                        >
                                            {tUser('logout')}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </>
                        ) : (
                            <>
                                <Button variant="ghost" asChild>
                                    <Link href="/login">{tPublic('login')}</Link>
                                </Button>
                                <Button asChild>
                                    <Link href="/signup">{tPublic('getStarted')}</Link>
                                </Button>
                            </>
                        )}
                    </nav>
                </div>
            </div>
        </header >
    );
}


const ListItem = React.forwardRef<
    React.ElementRef<"a">,
    React.ComponentPropsWithoutRef<"a"> & { title: string; href: string }
>(({ className, title, children, href, ...props }, ref) => {
    return (
        <li>
            <NavigationMenuLink asChild>
                <Link
                    ref={ref as any}
                    href={href as any}
                    className={cn(
                        "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                        className
                    )}
                    {...props}
                >
                    <div className="text-sm font-medium leading-none">{title}</div>
                    {children && (
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            {children}
                        </p>
                    )}
                </Link>
            </NavigationMenuLink>
        </li>
    )
})
ListItem.displayName = "ListItem"
