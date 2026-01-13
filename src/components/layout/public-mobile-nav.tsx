"use client";

import * as React from "react";
import { Link, useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, X, Rocket, Users, CreditCard, LayoutDashboard, LogOut, User as UserIcon, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { UserProfile } from "@/types/user";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface PublicMobileNavProps {
    user?: UserProfile | null;
}

export function PublicMobileNav({ user }: PublicMobileNavProps) {
    const [open, setOpen] = React.useState(false);
    const tPublic = useTranslations('Public.nav');
    const tUser = useTranslations('UserMenu');
    const router = useRouter();

    const publicLinks = [
        ...(user ? [{ href: "/organization", label: tUser('dashboard'), icon: LayoutDashboard }] : []),
        { href: "/features", label: tPublic('features'), icon: Rocket },
        { href: "/founders", label: tPublic('founders'), icon: Users },
        { href: "/pricing", label: tPublic('pricing'), icon: CreditCard },
        { href: "/contact", label: tPublic('contact'), icon: Mail },
    ];

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="top" className="w-full p-0 flex flex-col border-b border-border/10 bg-background/95 backdrop-blur-xl h-[100dvh]">
                <SheetHeader className="p-4 border-b text-left bg-transparent flex flex-row items-center justify-between pt-[calc(1rem+env(safe-area-inset-top))]">
                    <div className="flex items-center space-x-2">
                        <span className="font-bold text-xl tracking-tighter">SEENCEL</span>
                    </div>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground rounded-full">
                            <X className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto py-6 px-6 flex flex-col gap-6">
                    {/* Public Navigation Links */}
                    <div className="flex flex-col gap-2">
                        {publicLinks.map((link, idx) => (
                            <Link
                                key={idx}
                                href={link.href as any}
                                onClick={() => setOpen(false)}
                                className={cn(
                                    "flex items-center gap-4 px-4 py-4 rounded-xl text-lg font-medium transition-all hover:bg-muted/50 text-foreground/80",
                                    link.href === '/organization' && "text-primary bg-primary/5 font-semibold"
                                )}
                            >
                                <link.icon className={cn("h-5 w-5 text-muted-foreground", link.href === '/organization' && "text-primary")} />
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    <div className="mt-auto pb-8 flex flex-col gap-4">
                        {user ? (
                            // Logged In State
                            <div className="space-y-4">
                                {/* Buttons (Settings, Logout) */}
                                <div className="grid grid-cols-2 gap-3">
                                    <Button size="lg" variant="outline" className="w-full flex items-center gap-2 h-12" asChild onClick={() => setOpen(false)}>
                                        <Link href="/settings">
                                            <UserIcon className="h-4 w-4" />
                                            {tUser('settings')}
                                        </Link>
                                    </Button>

                                    <Button
                                        variant="destructive"
                                        size="lg"
                                        className="w-full justify-center h-12"
                                        onClick={async () => {
                                            const supabase = createClient();
                                            await supabase.auth.signOut();
                                            router.push('/login');
                                            router.refresh();
                                            setOpen(false);
                                        }}
                                    >
                                        <LogOut className="h-4 w-4 mr-2" />
                                        {tUser('logout')}
                                    </Button>
                                </div>

                                {/* User Card - AT THE BOTTOM */}
                                <div className="flex items-center gap-4 px-4 py-4 bg-muted/30 rounded-2xl border border-border/50">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={user.avatar_url || ""} />
                                        <AvatarFallback>
                                            {user.full_name?.substring(0, 2).toUpperCase() || "US"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{user.full_name}</span>
                                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">{user.email}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // Logged Out State
                            <div className="flex flex-col gap-3">
                                <Button size="lg" variant="outline" className="w-full text-base h-12" asChild onClick={() => setOpen(false)}>
                                    <Link href="/login">{tPublic('login')}</Link>
                                </Button>
                                <Button size="lg" className="w-full text-base h-12" asChild onClick={() => setOpen(false)}>
                                    <Link href="/signup">{tPublic('getStarted')}</Link>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
