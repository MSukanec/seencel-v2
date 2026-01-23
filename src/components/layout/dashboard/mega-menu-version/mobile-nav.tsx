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
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useSidebarNavigation } from "@/hooks/use-sidebar-navigation";
import { UserProfile } from "@/types/user";
import { useLayoutStore } from "@/store/layout-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "@/i18n/routing";

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

    // No need for useEffect fetch since we have Context

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
                        <Accordion type="single" collapsible defaultValue={activeContext || undefined} onValueChange={(val) => {
                            if (val) actions.setActiveContext(val as any);
                        }}>
                            {contexts.map((ctx) => {
                                const items = getNavItems(ctx.id);
                                return (
                                    <AccordionItem key={ctx.id} value={ctx.id} className="border-b border-border/40 last:border-0 data-[state=open]:border-border/60">
                                        <AccordionTrigger className="hover:no-underline py-4 text-base font-medium text-foreground/80 data-[state=open]:text-primary data-[state=open]:font-semibold transition-all">
                                            <div className="flex items-center gap-4">
                                                <ctx.icon className="h-5 w-5" />
                                                {ctx.label}
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
                                                            onClick={() => {
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

                {/* Footer: Avatar */}
                <div className="border-t p-4 mt-auto bg-background/50 backdrop-blur-xl">
                    <div className="flex items-center justify-end gap-4 w-full">
                        {user && (
                            <Avatar className="h-10 w-10 ring-2 ring-background shadow-sm cursor-pointer transition-transform hover:scale-105 rounded-lg" onClick={() => {
                                const shouldLogout = window.confirm(`¿Cerrar sesión de ${user.full_name}?`);
                                if (shouldLogout) {
                                    const supabase = createClient();
                                    supabase.auth.signOut().then(() => router.replace('/login'));
                                }
                            }}>
                                <AvatarImage src={user.avatar_url || ""} alt={user.full_name || "User"} />
                                <AvatarFallback className="bg-primary/10 text-primary font-bold rounded-lg text-xs">
                                    {user.full_name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || "US"}
                                </AvatarFallback>
                            </Avatar>
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

