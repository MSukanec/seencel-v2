"use client";

import * as React from "react"
import { Link, useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { UserProfile } from "@/types/user";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLayoutStore } from "@/store/layout-store"; // Import store
import { FeedbackButton } from "@/components/feedback-button";

import { useTranslations } from "next-intl";

import Image from "next/image"; // Ensure import

export function SidebarHeader({ user }: { user?: UserProfile | null }) {
    const { actions } = useLayoutStore();
    const tUser = useTranslations('UserMenu');
    const router = useRouter();
    const supabase = createClient();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border bg-sidebar/95 backdrop-blur-md shadow-sm h-14">
            <div className="flex h-14 w-full items-center pl-0 pr-4">
                {/* 1. Logo - Centered in 60px to align with collapsed sidebar */}
                <div className="flex items-center justify-center w-[60px] h-full shrink-0 border-r border-border/50">
                    <Link href="/" className="flex items-center justify-center">
                        <Image
                            src="/logo.png"
                            alt="SEENCEL"
                            width={32}
                            height={32}
                            className="rounded-md object-contain"
                        />
                    </Link>
                </div>

                <div className="flex-1 px-4 flex items-center overflow-hidden">
                    {useLayoutStore((state) => state.headerTitle)}
                    <div id="header-portal-root" className="flex items-center ml-6 flex-1" />
                </div>

                {/* 3. User Actions / CTA (Right Side) */}
                <div className="flex items-center space-x-2">


                    <nav className="flex items-center space-x-1">
                        <div className="mr-1">
                            <FeedbackButton />
                        </div>
                        <ModeToggle />
                        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground h-8 w-8">
                            <Bell className="h-4 w-4" />
                            <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-red-600 border border-background" />
                        </Button>

                        {/* User Dropdown */}
                        <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-8 w-8 rounded-full ml-1">
                                    <Avatar className="h-7 w-7">
                                        <AvatarImage src={user?.avatar_url || ""} alt={user?.full_name || "User"} />
                                        <AvatarFallback className="text-xs">
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
                                <DropdownMenuItem asChild>
                                    <Link href="/">{tUser('home')}</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/settings">{tUser('settings')}</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/contact">Contacto</Link>
                                </DropdownMenuItem>


                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-foreground hover:!text-red-600 hover:!bg-red-50 dark:hover:!bg-red-950/20 data-[highlighted]:text-red-600 cursor-pointer" onClick={handleLogout}>
                                    {tUser('logout')}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </nav>
                </div>
            </div >
        </header >
    );
}
