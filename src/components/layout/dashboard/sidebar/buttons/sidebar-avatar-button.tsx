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
import {
    Home,
    Mail,
    Settings,
    LogOut,
    Monitor,
    Sun,
    Moon,
    Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useModal } from "@/stores/modal-store";
import { FeedbackForm } from "@/components/shared/forms/feedback-form";

// ============================================================================
// AVATAR BUTTON WITH USER MENU POPOVER
// ============================================================================
// GPT-style popover that opens above the button
// Width matches sidebar width with padding
// ============================================================================

interface SidebarAvatarButtonProps {
    avatarUrl?: string | null;
    name: string;
    email?: string | null;
    isExpanded?: boolean;
    className?: string;
}

export function SidebarAvatarButton({
    avatarUrl,
    name,
    email,
    isExpanded = false,
    className
}: SidebarAvatarButtonProps) {
    const [open, setOpen] = React.useState(false);
    const router = useRouter();
    const supabase = createClient();
    const tUser = useTranslations('UserMenu');
    const { setTheme } = useTheme();

    // Modal controls for Feedback
    const { openModal, closeModal } = useModal();
    const tFeedback = useTranslations('Feedback');

    const handleFeedbackClick = () => {
        setOpen(false); // Close popover
        openModal(
            <FeedbackForm
                onSuccess={closeModal}
                onCancel={closeModal}
            />,
            {
                title: tFeedback('title') || "Feedback",
                description: tFeedback('modalDescription') || "Envíanos tus comentarios o reporta un problema.",
                size: 'md'
            }
        );
    };

    // Generate initials from name
    const initials = name
        ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : "US";

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    const handleClose = () => setOpen(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    className={cn(
                        "group relative flex items-center w-full rounded-lg transition-all duration-200",
                        "hover:bg-secondary/80 text-muted-foreground hover:text-foreground",
                        "p-0 min-h-[40px]",
                        open && "bg-secondary/80",
                        className
                    )}
                >
                    {/* Avatar */}
                    <div className="w-8 h-8 flex items-center justify-center shrink-0">
                        <Avatar className="h-7 w-7 rounded-lg">
                            <AvatarImage src={avatarUrl || ""} alt={name} />
                            <AvatarFallback className="text-xs rounded-lg bg-primary/10 text-primary">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                    </div>

                    {/* Text Content */}
                    <div className={cn(
                        "flex flex-col items-start justify-center min-w-0 overflow-hidden transition-all duration-150 ease-in-out ml-2",
                        isExpanded ? "flex-1 opacity-100" : "w-0 opacity-0 ml-0"
                    )}>
                        <span className="font-semibold text-sm text-foreground truncate w-full text-left">
                            {name}
                        </span>
                        {email && (
                            <span className="text-xs text-muted-foreground truncate w-full text-left">
                                {email}
                            </span>
                        )}
                    </div>
                </button>
            </PopoverTrigger>

            {/* Popover Content - Opens above, centered, width matches sidebar */}
            <PopoverContent
                side="top"
                align="center"
                sideOffset={8}
                className="w-[224px] p-2 mx-2"
            >
                {/* User Info Header */}
                <div className="flex items-center gap-3 p-2 mb-1">
                    <Avatar className="h-10 w-10 rounded-lg">
                        <AvatarImage src={avatarUrl || ""} alt={name} />
                        <AvatarFallback className="text-sm rounded-lg bg-primary/10 text-primary">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                        <span className="font-medium text-sm truncate">{name}</span>
                        <span className="text-xs text-muted-foreground truncate">{email}</span>
                    </div>
                </div>

                <Separator className="my-1" />

                {/* Menu Items */}
                <div className="flex flex-col gap-0.5">
                    {/* 1. Configuración */}
                    <Link
                        href="/settings"
                        onClick={handleClose}
                        className="flex items-center gap-3 px-2 py-2 text-sm rounded-md hover:bg-secondary transition-colors"
                    >
                        <Settings className="h-4 w-4 text-muted-foreground" />
                        {tUser('settings')}
                    </Link>

                    <Separator className="my-1" />

                    {/* 2. Reportar un Problema */}
                    <button
                        onClick={handleFeedbackClick}
                        className="flex items-center gap-3 px-2 py-2 text-sm rounded-md hover:bg-secondary transition-colors w-full text-left"
                    >
                        <Sparkles className="h-4 w-4 text-muted-foreground" />
                        Reportar un Problema
                    </button>

                    <Separator className="my-1" />

                    {/* 3. Ir al Inicio */}
                    <a
                        href="/?landing=true"
                        onClick={handleClose}
                        className="flex items-center gap-3 px-2 py-2 text-sm rounded-md hover:bg-secondary transition-colors"
                    >
                        <Home className="h-4 w-4 text-muted-foreground" />
                        {tUser('home')}
                    </a>

                    {/* 4. Contacto */}
                    <Link
                        href="/contact"
                        onClick={handleClose}
                        className="flex items-center gap-3 px-2 py-2 text-sm rounded-md hover:bg-secondary transition-colors"
                    >
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        Contacto
                    </Link>
                </div>

                <Separator className="my-1" />

                {/* Theme Toggle */}
                <div className="flex items-center justify-between px-2 py-2">
                    <span className="text-sm text-muted-foreground">Tema</span>
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

                <Separator className="my-1" />

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-2 py-2 text-sm rounded-md hover:bg-red-50 dark:hover:bg-red-950/20 text-foreground hover:text-red-600 transition-colors"
                >
                    <LogOut className="h-4 w-4" />
                    {tUser('logout')}
                </button>
            </PopoverContent>
        </Popover>
    );
}

