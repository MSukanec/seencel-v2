"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PortalPreview } from "./portal-preview";
import { updatePortalSettings, updatePortalBranding, PortalSettings } from "../../actions";
import { SplitEditorLayout, SplitEditorPreview, SplitEditorSidebar } from "@/components/layout";
import { FeatureGuard } from "@/components/ui/feature-guard";
import { useTranslations } from "next-intl";
import {
    LayoutDashboard,
    CreditCard,
    Calendar,
    FileText,
    MessageSquare,
    Save,
    Smartphone,
    Monitor,
    TrendingUp,
    DollarSign,
    MousePointer2,
    Check,
    Palette,
    Eye,
    EyeOff
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ClientPortalConfigProps {
    projectId: string;
    organizationId: string;
    initialSettings: PortalSettings | null;
    initialBranding?: PortalBranding | null;
    canCustomize?: boolean; // Based on plan features
}

export interface PortalBranding {
    portal_name?: string | null;
    welcome_message?: string | null;
    primary_color?: string;
    background_color?: string;
    hero_image_url?: string | null;
    show_hero?: boolean;
    show_footer?: boolean;
    footer_text?: string | null;
    show_powered_by?: boolean;
}

const defaultSettings: Omit<PortalSettings, 'project_id' | 'organization_id'> = {
    show_dashboard: true,
    show_installments: false,
    show_payments: false,
    show_logs: false,
    show_amounts: true,
    show_progress: true,
    show_quotes: false,
    allow_comments: false,
};

const defaultBranding: PortalBranding = {
    portal_name: '',
    // Use a placeholder that will be replaced by translation in component if empty, or handle default there
    welcome_message: 'Bienvenido a tu portal',
    primary_color: '#83cc16',
    background_color: '#09090b',
    show_hero: true,
    show_footer: true,
    footer_text: '',
    show_powered_by: true,
};

export function ClientPortalConfig({ projectId, organizationId, initialSettings, initialBranding, canCustomize = true }: ClientPortalConfigProps) {
    const [isPending, startTransition] = useTransition();
    const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('mobile');
    const [activeTab, setActiveTab] = useState<'brand' | 'sections'>('brand');
    const t = useTranslations('Portal.Config');
    const tCommon = useTranslations('Portal.Config.Customization');
    const tDefaults = useTranslations('Portal.Defaults');

    const [settings, setSettings] = useState<Omit<PortalSettings, 'project_id' | 'organization_id'>>({
        show_dashboard: initialSettings?.show_dashboard ?? defaultSettings.show_dashboard,
        show_installments: initialSettings?.show_installments ?? defaultSettings.show_installments,
        show_payments: initialSettings?.show_payments ?? defaultSettings.show_payments,
        show_logs: initialSettings?.show_logs ?? defaultSettings.show_logs,
        show_amounts: initialSettings?.show_amounts ?? defaultSettings.show_amounts,
        show_progress: initialSettings?.show_progress ?? defaultSettings.show_progress,
        show_quotes: initialSettings?.show_quotes ?? defaultSettings.show_quotes,
        allow_comments: initialSettings?.allow_comments ?? defaultSettings.allow_comments,
    });

    const [branding, setBranding] = useState<PortalBranding>({
        portal_name: initialBranding?.portal_name ?? defaultBranding.portal_name,
        welcome_message: initialBranding?.welcome_message ?? defaultBranding.welcome_message,
        primary_color: initialBranding?.primary_color ?? defaultBranding.primary_color,
        background_color: initialBranding?.background_color ?? defaultBranding.background_color,
        show_hero: initialBranding?.show_hero ?? defaultBranding.show_hero,
        show_footer: initialBranding?.show_footer ?? defaultBranding.show_footer,
        footer_text: initialBranding?.footer_text ?? defaultBranding.footer_text,
        show_powered_by: initialBranding?.show_powered_by ?? defaultBranding.show_powered_by,
    });

    const handleToggle = (key: keyof typeof settings) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = () => {
        startTransition(async () => {
            try {
                await Promise.all([
                    updatePortalSettings(projectId, organizationId, settings),
                    updatePortalBranding(projectId, organizationId, branding)
                ]);
                toast.success("Configuración guardada correctamente");
            } catch (error) {
                toast.error("Error al guardar la configuración");
            }
        });
    };

    const toggleOptions = [
        { key: 'show_dashboard' as const, label: 'Dashboard', description: 'Resumen del proyecto con métricas clave', icon: LayoutDashboard },
        { key: 'show_progress' as const, label: 'Mostrar Progreso', description: 'Barra de progreso del proyecto', icon: TrendingUp },
        { key: 'show_amounts' as const, label: 'Mostrar Montos', description: 'Valores en moneda (vs ocultos)', icon: DollarSign },
        { key: 'show_quotes' as const, label: 'Presupuestos', description: 'Ver presupuestos del proyecto', icon: FileText },
        { key: 'show_payments' as const, label: 'Pagos Realizados', description: 'Historial de pagos del cliente', icon: CreditCard },
        { key: 'show_installments' as const, label: 'Cronograma de Cuotas', description: 'Próximos pagos y cuotas pendientes', icon: Calendar },
        { key: 'show_logs' as const, label: 'Bitácora', description: 'Actualizaciones y avances del proyecto', icon: FileText },
        { key: 'allow_comments' as const, label: 'Comentarios', description: 'Permitir mensajes entre cliente y equipo', icon: MessageSquare },
    ];

    return (
        <SplitEditorLayout
            sidebarPosition="right"
            sidebar={
                <SplitEditorSidebar
                    header={
                        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'brand' | 'sections')} className="w-full">
                            <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 rounded-xl h-9">
                                <TabsTrigger value="brand" className="rounded-lg text-xs h-7">{t('Customization.title')}</TabsTrigger>
                                <TabsTrigger value="sections" className="rounded-lg text-xs h-7">{t('Sections.title')}</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    }
                >
                    <AnimatePresence mode="wait">
                        {/* BRANDING TAB */}
                        {activeTab === 'brand' && (
                            <motion.div key="brand-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                                {/* Portal Name */}
                                <section className="space-y-3">
                                    <Label className="uppercase text-xs font-bold text-muted-foreground tracking-wider">{t('Customization.portalName')}</Label>
                                    <Input
                                        placeholder="Dejar vacío para usar el nombre del proyecto"
                                        value={branding.portal_name || ''}
                                        onChange={(e) => setBranding({ ...branding, portal_name: e.target.value })}
                                        className="bg-card"
                                    />
                                </section>

                                {/* Welcome Message */}
                                <section className="space-y-3">
                                    <Label className="uppercase text-xs font-bold text-muted-foreground tracking-wider">{t('Customization.welcomeMessage')}</Label>
                                    <Input
                                        placeholder={t('Customization.welcomePlaceholder')}
                                        value={branding.welcome_message || ''}
                                        onChange={(e) => setBranding({ ...branding, welcome_message: e.target.value })}
                                        className="bg-card"
                                    />
                                </section>

                                {/* Colors */}
                                <section className="space-y-3">
                                    <Label className="uppercase text-xs font-bold text-muted-foreground tracking-wider">{t('Customization.branding')}</Label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <ColorPicker
                                            label={t('Customization.primaryColor')}
                                            color={branding.primary_color || '#83cc16'}
                                            onChange={(c) => setBranding({ ...branding, primary_color: c })}
                                        />
                                        <ColorPicker
                                            label={t('Customization.backgroundColor')}
                                            color={branding.background_color || '#09090b'}
                                            onChange={(c) => setBranding({ ...branding, background_color: c })}
                                        />
                                    </div>
                                </section>

                                {/* Hero */}
                                <section className="space-y-3">
                                    <Label className="uppercase text-xs font-bold text-muted-foreground tracking-wider">Hero / Cabecera</Label>
                                    <div
                                        onClick={() => setBranding({ ...branding, show_hero: !branding.show_hero })}
                                        className={cn(
                                            "flex items-center justify-between p-3 rounded-xl border bg-card cursor-pointer hover:border-primary/50 transition-all",
                                            branding.show_hero && "ring-1 ring-primary/50 border-primary/30 bg-primary/5"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn("p-2 rounded-lg transition-colors", branding.show_hero ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")}>
                                                {branding.show_hero ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                            </div>
                                            <span className="text-sm font-medium">Mostrar Hero con Imagen</span>
                                        </div>
                                        <Switch checked={branding.show_hero} onCheckedChange={(v) => setBranding({ ...branding, show_hero: v })} onClick={(e) => e.stopPropagation()} />
                                    </div>
                                </section>

                                {/* Footer */}
                                <section className="space-y-3">
                                    <Label className="uppercase text-xs font-bold text-muted-foreground tracking-wider">Pie de Página</Label>
                                    <div className="space-y-2">
                                        <div
                                            onClick={() => setBranding({ ...branding, show_footer: !branding.show_footer })}
                                            className={cn(
                                                "flex items-center justify-between p-3 rounded-xl border bg-card cursor-pointer hover:border-primary/50 transition-all",
                                                branding.show_footer && "ring-1 ring-primary/50 border-primary/30 bg-primary/5"
                                            )}
                                        >
                                            <span className="text-sm font-medium">Mostrar Footer</span>
                                            <Switch checked={branding.show_footer} onCheckedChange={(v) => setBranding({ ...branding, show_footer: v })} onClick={(e) => e.stopPropagation()} />
                                        </div>
                                        {branding.show_footer && (
                                            <>
                                                <Input
                                                    placeholder="Texto personalizado del footer"
                                                    value={branding.footer_text || ''}
                                                    onChange={(e) => setBranding({ ...branding, footer_text: e.target.value })}
                                                    className="bg-card"
                                                />
                                                <div
                                                    onClick={() => setBranding({ ...branding, show_powered_by: !branding.show_powered_by })}
                                                    className={cn(
                                                        "flex items-center justify-between p-3 rounded-xl border bg-card cursor-pointer hover:border-primary/50 transition-all",
                                                        branding.show_powered_by && "ring-1 ring-primary/50 border-primary/30 bg-primary/5"
                                                    )}
                                                >
                                                    <span className="text-sm font-medium">Mostrar "Powered by SEENCEL"</span>
                                                    <Switch checked={branding.show_powered_by} onCheckedChange={(v) => setBranding({ ...branding, show_powered_by: v })} onClick={(e) => e.stopPropagation()} />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </section>
                            </motion.div>
                        )}

                        {/* SECTIONS TAB */}
                        {activeTab === 'sections' && (
                            <motion.div key="sections-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2">
                                {toggleOptions.map((option) => (
                                    <div
                                        key={option.key}
                                        onClick={() => handleToggle(option.key)}
                                        className={cn(
                                            "flex items-center justify-between p-3 rounded-xl border bg-card cursor-pointer hover:border-primary/50 transition-all",
                                            settings[option.key] && "ring-1 ring-primary/50 border-primary/30 bg-primary/5"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "p-2 rounded-lg transition-colors",
                                                settings[option.key] ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                                            )}>
                                                <option.icon className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <span className="text-sm font-medium block">{option.label}</span>
                                                <span className="text-xs text-muted-foreground">{option.description}</span>
                                            </div>
                                        </div>
                                        <Switch
                                            checked={settings[option.key]}
                                            onCheckedChange={() => handleToggle(option.key)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* SAVE BUTTON - Always visible at bottom */}
                    <div className="pt-6 border-t mt-6">
                        {activeTab === 'brand' ? (
                            <FeatureGuard
                                isEnabled={canCustomize}
                                featureName="Personalizar Portal"
                                requiredPlan="PRO"
                            >
                                <Button onClick={handleSave} disabled={isPending} className="w-full gap-2">
                                    <Save className="h-4 w-4" />
                                    {isPending ? t('Customization.saving') : t('Customization.save')}
                                </Button>
                            </FeatureGuard>
                        ) : (
                            <Button onClick={handleSave} disabled={isPending} className="w-full gap-2">
                                <Save className="h-4 w-4" />
                                {isPending ? t('Customization.saving') : t('Customization.saveSections')}
                            </Button>
                        )}
                    </div>
                </SplitEditorSidebar>
            }
        >
            <SplitEditorPreview>
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
                    style={{ backgroundImage: `radial-gradient(${branding.primary_color} 1px, transparent 1px)`, backgroundSize: '24px 24px' }}
                />

                {/* View Mode Toggle */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-black/60 backdrop-blur-md rounded-full p-1 border border-white/10">
                    <button
                        onClick={() => setViewMode('mobile')}
                        className={cn(
                            "p-2 rounded-full transition-colors",
                            viewMode === 'mobile' ? "bg-white/20 text-white" : "text-white/60 hover:text-white"
                        )}
                    >
                        <Smartphone className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => setViewMode('desktop')}
                        className={cn(
                            "p-2 rounded-full transition-colors",
                            viewMode === 'desktop' ? "bg-white/20 text-white" : "text-white/60 hover:text-white"
                        )}
                    >
                        <Monitor className="h-4 w-4" />
                    </button>
                </div>

                {/* Portal Preview */}
                <div className="flex items-center justify-center h-full pt-12">
                    <PortalPreview
                        settings={settings}
                        viewMode={viewMode}
                        branding={branding}
                    />
                </div>

                {/* Bottom Badge */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/80 text-white text-xs backdrop-blur-md flex items-center gap-2 shadow-2xl border border-white/10">
                    <MousePointer2 className="h-3 w-3 animate-bounce" />
                    Vista Previa en Tiempo Real
                </div>
            </SplitEditorPreview>
        </SplitEditorLayout>
    );
}

// --- Color Picker Component ---
function ColorPicker({ label, color, onChange }: { label: string, color: string, onChange: (c: string) => void }) {
    return (
        <div className="space-y-2">
            <Label className="text-xs">{label}</Label>
            <div className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:border-primary/50 transition-colors group cursor-pointer relative overflow-hidden">
                <input
                    type="color"
                    value={color}
                    onChange={(e) => onChange(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div
                    className="w-10 h-10 rounded-lg shadow-sm ring-2 ring-border/50 group-hover:scale-105 transition-transform"
                    style={{ backgroundColor: color }}
                />
                <span className="text-sm font-mono text-muted-foreground">{color}</span>
            </div>
        </div>
    );
}

