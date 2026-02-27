"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Link, useRouter } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { useUser } from "@/stores/user-store";
import { useModal } from "@/stores/modal-store";
import { FeedbackForm } from "@/components/shared/forms/feedback-form";
import { HeaderIconButton } from "@/components/layout/dashboard/shared/header-icon-button";
import {
    Home,
    LayoutDashboard,
    Mail,
    Settings,
    LogOut,
    Monitor,
    Sun,
    Moon,
    Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// HEADER AVATAR BUTTON — User menu in the top-right corner
// ============================================================================
// Minimal trigger (avatar only), popover opens downward aligned to the right.
// Reads user data from the global user store (no props needed).
// Styles unified with SidebarNotificationsButton popover.
// ============================================================================

export function HeaderAvatarButton() {
    const [open, setOpen] = React.useState(false);
    const router = useRouter();
    const supabase = createClient();
    const user = useUser();
    const tUser = useTranslations('UserMenu');
    const { setTheme } = useTheme();

    const { openModal, closeModal } = useModal();
    const tFeedback = useTranslations('Feedback');

    const name = user?.full_name || "Usuario";
    const email = user?.email || "";
    const avatarUrl = user?.avatar_url || "";

    const initials = name
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();

    const handleFeedbackClick = () => {
        setOpen(false);
        openModal(
            <FeedbackForm onSuccess={closeModal} onCancel={closeModal} />,
            {
                title: tFeedback('title') || "Feedback",
                description: tFeedback('modalDescription') || "Envíanos tus comentarios o reporta un problema.",
                size: 'md'
            }
        );
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    const handleClose = () => setOpen(false);

    // Shared item classes — matches notifications popover density
    const itemClass = "flex items-center gap-3 px-3 py-2 text-sm transition-colors hover:bg-muted/50 cursor-pointer";

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <HeaderIconButton active={open} className="p-0">
                    <Avatar className="h-8 w-8 rounded-full">
                        <AvatarImage src={avatarUrl} alt={name} />
                        <AvatarFallback className="text-xs rounded-full bg-primary/10 text-primary font-medium">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                </HeaderIconButton>
            </PopoverTrigger>

            <PopoverContent
                side="bottom"
                align="end"
                sideOffset={8}
                className="w-[240px] p-0"
            >
                {/* User Info Header — matches notifications header p-4 pb-2 */}
                <div className="flex items-center gap-3 p-4 pb-2">
                    <Avatar className="h-9 w-9 rounded-full shrink-0">
                        <AvatarImage src={avatarUrl} alt={name} />
                        <AvatarFallback className="text-xs rounded-full bg-primary/10 text-primary">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-sm leading-none truncate">{name}</span>
                        <span className="text-xs text-muted-foreground truncate mt-1">{email}</span>
                    </div>
                </div>

                <Separator />

                {/* Menu Items — dense, border-separated like notification items */}
                <div className="flex flex-col">
                    <Link href="/profile" onClick={handleClose} className={itemClass}>
                        <Settings className="h-4 w-4 text-muted-foreground shrink-0" />
                        {tUser('settings')}
                    </Link>
                    <button onClick={handleFeedbackClick} className={cn(itemClass, "w-full text-left")}>
                        <Sparkles className="h-4 w-4 text-muted-foreground shrink-0" />
                        Reportar un Problema
                    </button>
                </div>

                <Separator />

                <div className="flex flex-col">
                    <a href="/?landing=true" onClick={handleClose} className={itemClass}>
                        <Home className="h-4 w-4 text-muted-foreground shrink-0" />
                        {tUser('home')}
                    </a>
                    <Link href="/organization" onClick={handleClose} className={itemClass}>
                        <LayoutDashboard className="h-4 w-4 text-muted-foreground shrink-0" />
                        Ir al Hub
                    </Link>
                    <Link href="/contact" onClick={handleClose} className={itemClass}>
                        <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                        Contacto
                    </Link>
                </div>

                <Separator />

                {/* Theme Toggle */}
                <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-sm text-muted-foreground">Tema</span>
                    <div className="flex items-center rounded-full border bg-background">
                        <Button variant="ghost" size="icon" onClick={() => setTheme("system")}
                            className="h-6 w-6 rounded-full text-muted-foreground hover:text-foreground" title="Sistema">
                            <Monitor className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setTheme("light")}
                            className="h-6 w-6 rounded-full text-muted-foreground hover:text-foreground" title="Claro">
                            <Sun className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setTheme("dark")}
                            className="h-6 w-6 rounded-full text-muted-foreground hover:text-foreground" title="Oscuro">
                            <Moon className="h-3 w-3" />
                        </Button>
                    </div>
                </div>

                <Separator />

                {/* Logout — footer style like notifications "Ver todas" */}
                <div className="p-2">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-2 py-1.5 text-sm rounded-md text-muted-foreground hover:text-red-600 transition-colors"
                    >
                        <LogOut className="h-4 w-4" />
                        {tUser('logout')}
                    </button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
