
"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Monitor, PanelLeft, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLayoutStore } from "@/store/layout-store";
import { useRouter, usePathname } from "@/i18n/routing";
import { useTransition } from "react";
import { updateUserPreferences } from "@/features/users/actions";
import { TIMEZONES, detectBrowserTimezone } from "@/lib/timezone-data";
import { toast } from "sonner";

interface PreferencesViewProps {
    initialTimezone?: string | null;
}

export function PreferencesView({ initialTimezone }: PreferencesViewProps) {
    const { setTheme, theme } = useTheme();
    const { actions } = useLayoutStore();
    const t = useTranslations("Settings");
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();

    // Timezone state - use saved value or fallback to browser detection
    const [timezone, setTimezone] = useState<string>(initialTimezone || detectBrowserTimezone());

    // Handle Language Change
    const onLanguageChange = (newLocale: string) => {
        startTransition(async () => {
            await updateUserPreferences({ language: newLocale as 'en' | 'es' });
            router.replace(pathname as any, { locale: newLocale });
        });
    };

    // Handle Theme Change
    const onThemeChange = (newTheme: string) => {
        setTheme(newTheme);
        if (newTheme === 'light' || newTheme === 'dark') {
            updateUserPreferences({ theme: newTheme });
        }
    };

    // Handle Timezone Change
    const onTimezoneChange = async (newTimezone: string) => {
        setTimezone(newTimezone);
        try {
            await updateUserPreferences({ timezone: newTimezone });
            toast.success("Zona horaria actualizada");
        } catch {
            toast.error("Error al actualizar zona horaria");
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('Preferences.appearance.title')}</CardTitle>
                <CardDescription>{t('Preferences.appearance.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* LANGUAGE */}
                <div className="flex items-center justify-between gap-8">
                    <div className="space-y-1 flex-1">
                        <Label className="text-base">{t('Preferences.language.title')}</Label>
                        <p className="text-sm text-muted-foreground">
                            {t('Preferences.language.description')}
                        </p>
                    </div>
                    <Select defaultValue={locale} onValueChange={onLanguageChange} disabled={isPending}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder={t('Preferences.language.placeholder')} />
                        </SelectTrigger>
                        <SelectContent align="end">
                            <SelectItem value="en">{t('Preferences.language.options.en')}</SelectItem>
                            <SelectItem value="es">{t('Preferences.language.options.es')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Separator />

                {/* TIMEZONE */}
                <div className="flex items-center justify-between gap-8">
                    <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <Label className="text-base">Zona Horaria</Label>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Configura tu zona horaria para mostrar fechas y horas correctamente.
                        </p>
                    </div>
                    <Select value={timezone} onValueChange={onTimezoneChange}>
                        <SelectTrigger className="w-[240px]">
                            <SelectValue placeholder="Seleccionar zona horaria" />
                        </SelectTrigger>
                        <SelectContent align="end" className="max-h-[300px]">
                            {TIMEZONES.map((tz) => (
                                <SelectItem key={tz.value} value={tz.value}>
                                    {tz.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Separator />

                {/* THEME */}
                <div className="space-y-4">
                    <div className="space-y-1">
                        <Label className="text-base">{t('Preferences.theme.title')}</Label>
                        <p className="text-sm text-muted-foreground">
                            {t('Preferences.theme.description')}
                        </p>
                    </div>
                    <div className="grid grid-cols-3 gap-8">
                        <ThemePreview
                            label={t('Preferences.theme.options.system')}
                            value="system"
                            current={theme}
                            onClick={() => setTheme("system")}
                            type="system"
                        />
                        <ThemePreview
                            label={t('Preferences.theme.options.light')}
                            value="light"
                            current={theme}
                            onClick={() => onThemeChange("light")}
                            type="light"
                        />
                        <ThemePreview
                            label={t('Preferences.theme.options.dark')}
                            value="dark"
                            current={theme}
                            onClick={() => onThemeChange("dark")}
                            type="dark"
                        />
                    </div>
                </div>
            </CardContent>

            <Separator className="my-6" />

            <CardContent className="space-y-6 pt-0">
                {/* SIDEBAR SETTINGS */}
                <div className="space-y-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <PanelLeft className="h-4 w-4 text-muted-foreground" />
                            <Label className="text-base">Barra Lateral</Label>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Personaliza el comportamiento y apariencia de la barra lateral.
                        </p>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label className="text-base">Avatares de Proyecto</Label>
                            <p className="text-sm text-muted-foreground">
                                Mostrar imagen de portada en el selector de proyectos.
                            </p>
                        </div>
                        <Switch
                            checked={useLayoutStore(s => s.sidebarProjectAvatars)}
                            onCheckedChange={(checked) => {
                                actions.setSidebarProjectAvatars(checked);
                                updateUserPreferences({ sidebar_project_avatars: checked });
                            }}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function ThemePreview({
    label,
    value,
    current,
    onClick,
    type
}: {
    label: string;
    value: string;
    current?: string;
    onClick: () => void;
    type: 'light' | 'dark' | 'system';
}) {
    const isActive = current === value;

    return (
        <div onClick={onClick} className="cursor-pointer group">
            <div className={cn(
                "relative h-28 w-full rounded-lg border-2 overflow-hidden transition-all mb-2",
                isActive ? "border-primary ring-2 ring-primary/20 ring-offset-2" : "border-muted group-hover:border-primary/50"
            )}>
                {type === 'light' && (
                    <div className="h-full w-full bg-[#f4f4f5] p-2 flex flex-col gap-2">
                        <div className="h-2 w-full bg-white rounded-sm shadow-sm border border-black/5" />
                        <div className="flex-1 w-full bg-white rounded-sm shadow-sm border border-black/5 p-1.5 flex gap-1">
                            <div className="w-1/4 h-full bg-black/5 rounded-[2px]" />
                            <div className="flex-1 h-full flex flex-col gap-1.5">
                                <div className="h-2 w-3/4 bg-black/10 rounded-[2px]" />
                                <div className="h-1.5 w-full bg-black/5 rounded-[1px]" />
                                <div className="h-1.5 w-full bg-black/5 rounded-[1px]" />
                            </div>
                        </div>
                    </div>
                )}
                {type === 'dark' && (
                    <div className="h-full w-full bg-[#18181b] p-2 flex flex-col gap-2">
                        <div className="h-2 w-full bg-[#27272a] rounded-sm shadow-sm border border-white/5" />
                        <div className="flex-1 w-full bg-[#27272a] rounded-sm shadow-sm border border-white/5 p-1.5 flex gap-1">
                            <div className="w-1/4 h-full bg-white/5 rounded-[2px]" />
                            <div className="flex-1 h-full flex flex-col gap-1.5">
                                <div className="h-2 w-3/4 bg-white/10 rounded-[2px]" />
                                <div className="h-1.5 w-full bg-white/5 rounded-[1px]" />
                                <div className="h-1.5 w-full bg-white/5 rounded-[1px]" />
                            </div>
                        </div>
                    </div>
                )}
                {type === 'system' && (
                    <div className="h-full w-full flex">
                        <div className="w-1/2 h-full bg-[#f4f4f5] p-2 pr-0 flex flex-col gap-2 border-r border-black/5">
                            <div className="h-2 w-full bg-white rounded-l-sm shadow-sm border-y border-l border-black/5" />
                            <div className="flex-1 w-full bg-white rounded-l-sm shadow-sm border-y border-l border-black/5 p-1.5 flex gap-1">
                                <div className="w-1/4 h-full bg-black/5 rounded-[2px]" />
                                <div className="flex-1 h-full flex flex-col gap-1.5">
                                    <div className="h-2 w-3/4 bg-black/10 rounded-[2px]" />
                                    <div className="h-1.5 w-full bg-black/5 rounded-[1px]" />
                                </div>
                            </div>
                        </div>
                        <div className="w-1/2 h-full bg-[#18181b] p-2 pl-0 flex flex-col gap-2">
                            <div className="h-2 w-full bg-[#27272a] rounded-r-sm shadow-sm border-y border-r border-white/5" />
                            <div className="flex-1 w-full bg-[#27272a] rounded-r-sm shadow-sm border-y border-r border-white/5 p-1.5 flex gap-1">
                                <div className="flex-1 h-full flex flex-col gap-1.5">
                                    <div className="h-2 w-3/4 bg-white/10 rounded-[2px]" />
                                    <div className="h-1.5 w-full bg-white/5 rounded-[1px]" />
                                </div>
                            </div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-background/80 backdrop-blur-sm p-1.5 rounded-full shadow-lg border border-border">
                                <Monitor className="w-4 h-4 text-foreground" />
                            </div>
                        </div>
                    </div>
                )}
                {isActive && (
                    <div className="absolute bottom-1 right-1 h-5 w-5 bg-primary rounded-full flex items-center justify-center shadow-md">
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                )}
            </div>
            <div className="text-center font-medium text-sm text-foreground/80">
                {label}
            </div>
        </div>
    );
}
