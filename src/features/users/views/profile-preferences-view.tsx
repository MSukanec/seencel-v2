"use client";

// ============================================================================
// PROFILE PREFERENCES VIEW
// ============================================================================
// Vista de preferencias usando SettingsSection layout.
// Secciones: Idioma + Zona Horaria + Tema.
// ============================================================================

import { useState, useTransition } from "react";
import { useTheme } from "next-themes";
import { useTranslations, useLocale } from "next-intl";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Languages, Clock, Palette, Monitor, Type } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter, usePathname } from "@/i18n/routing";
import { updateUserPreferences } from "@/features/users/actions";
import { TIMEZONES, detectBrowserTimezone } from "@/lib/timezone-data";
import { SettingsSection, SettingsSectionContainer } from "@/components/shared/settings-section";
import { ContentLayout } from "@/components/layout/dashboard/shared/content-layout";
import { toast } from "sonner";
import { useLayoutActions, useFontSize, type FontSize } from "@/stores/layout-store";

const FONT_SIZE_OPTIONS: { value: FontSize; label: string }[] = [
    { value: 'smaller', label: 'Más pequeño' },
    { value: 'small', label: 'Pequeño' },
    { value: 'default', label: 'Normal' },
    { value: 'large', label: 'Grande' },
    { value: 'larger', label: 'Más grande' },
];

interface PreferencesViewProps {
    initialTimezone?: string | null;
}

export function PreferencesView({ initialTimezone }: PreferencesViewProps) {
    const { setTheme, theme } = useTheme();
    const t = useTranslations("Settings");
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();
    const [timezone, setTimezone] = useState<string>(initialTimezone || detectBrowserTimezone());
    const fontSize = useFontSize();
    const { setFontSize } = useLayoutActions();

    const onFontSizeChange = (size: FontSize) => {
        setFontSize(size); // Instant: localStorage + DOM
        updateUserPreferences({ font_size: size }); // Persist to DB
    };

    const onLanguageChange = (newLocale: string) => {
        startTransition(async () => {
            await updateUserPreferences({ language: newLocale as 'en' | 'es' });
            router.replace(pathname as any, { locale: newLocale });
        });
    };

    const onThemeChange = (newTheme: string) => {
        setTheme(newTheme);
        if (newTheme === 'light' || newTheme === 'dark') {
            updateUserPreferences({ theme: newTheme });
        }
    };

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
        <ContentLayout variant="settings">
            <SettingsSectionContainer>
                {/* ── Idioma ── */}
                <SettingsSection
                    icon={Languages}
                    title={t('Preferences.language.title')}
                    description={t('Preferences.language.description')}
                >
                    <Select defaultValue={locale} onValueChange={onLanguageChange} disabled={isPending}>
                        <SelectTrigger className="w-full md:w-[240px]">
                            <SelectValue placeholder={t('Preferences.language.placeholder')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="en">{t('Preferences.language.options.en')}</SelectItem>
                            <SelectItem value="es">{t('Preferences.language.options.es')}</SelectItem>
                        </SelectContent>
                    </Select>
                </SettingsSection>

                {/* ── Zona Horaria ── */}
                <SettingsSection
                    icon={Clock}
                    title="Zona Horaria"
                    description="Configura tu zona horaria para que las fechas y horas se muestren correctamente según tu ubicación."
                >
                    <Select value={timezone} onValueChange={onTimezoneChange}>
                        <SelectTrigger className="w-full md:w-[300px]">
                            <SelectValue placeholder="Seleccionar zona horaria" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                            {TIMEZONES.map((tz) => (
                                <SelectItem key={tz.value} value={tz.value}>
                                    {tz.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </SettingsSection>

                {/* ── Tema ── */}
                <SettingsSection
                    icon={Palette}
                    title={t('Preferences.theme.title')}
                    description={t('Preferences.theme.description')}
                >
                    <div className="grid grid-cols-3 gap-6">
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
                </SettingsSection>

                {/* ── Tamaño de Fuente ── */}
                <SettingsSection
                    icon={Type}
                    title="Tamaño de fuente"
                    description="Ajusta el tamaño del texto en toda la aplicación."
                >
                    <div className="flex items-center gap-1.5 p-1 bg-muted/50 rounded-lg w-fit">
                        {FONT_SIZE_OPTIONS.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => onFontSizeChange(option.value)}
                                className={cn(
                                    "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                                    fontSize === option.value
                                        ? "bg-background text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                                )}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </SettingsSection>
            </SettingsSectionContainer>
        </ContentLayout>
    );
}

// ============================================================================
// Theme Preview (internal)
// ============================================================================

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
