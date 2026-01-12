"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { motion } from "framer-motion";
import {
    FileText,
    Type,
    Ruler,
    Check,
    Minus,
    Plus,
    Maximize,
    Loader2,
    Lock,
    Crown,
    Settings2,
    Palette,
    Footprints,
    LayoutTemplate,
    Trash2,
    Image as ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils";
import { SplitEditorLayout, SplitEditorSidebar } from "@/components/layout/split-editor-layout";
import {
    getOrganizationPdfTheme,
    updateOrganizationPdfTheme,
    createOrganizationPdfTemplate,
    deleteOrganizationPdfTemplate,
    type PdfGlobalTheme
} from "@/features/organization/actions/pdf-settings";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { FeatureGuard } from "@/components/ui/feature-guard";

// --- Constants ---
const PDF_FONTS = ["Inter", "Roboto", "Open Sans", "Merriweather", "Playfair Display", "Arial"];

export function BrandPdfTemplates() {
    // Config State
    const [config, setConfig] = useState<PdfGlobalTheme>({
        // Default Fallback State (Frontend only, DB overrides this)
        id: undefined,
        name: "Cargando...",
        pageSize: 'A4',
        orientation: 'portrait',
        marginTop: 20,
        marginBottom: 20,
        marginLeft: 20,
        marginRight: 20,
        fontFamily: "Inter",
        primaryColor: "#000000",
        secondaryColor: "#e5e5e5",
        textColor: "#1f2937",
        logoWidth: 80,
        logoHeight: 60,
        companyNameSize: 24,
        companyNameColor: "#1f2937",
        titleSize: 18,
        subtitleSize: 14,
        bodySize: 12,
        companyInfoSize: 10,
        showFooter: true,
        showPageNumbers: true,
        footerText: "Documento Confidencial",
    });

    const [isPro, setIsPro] = useState(false);
    const [canCreateCustomTemplates, setCanCreateCustomTemplates] = useState(false);
    const [isGlobal, setIsGlobal] = useState(true);
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [availableTemplates, setAvailableTemplates] = useState<{ id: string, name: string }[]>([]);

    // New: Demo Data for previewing real info
    const [demoData, setDemoData] = useState<{ companyName?: string, address?: string, city?: string, state?: string, country?: string, phone?: string, email?: string } | undefined>(undefined);


    // UI State
    const [isNewTemplateOpen, setIsNewTemplateOpen] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState("");
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const [isLoading, startTransition] = useTransition();

    const loadTheme = (templateId?: string) => {
        startTransition(async () => {
            const res = await getOrganizationPdfTheme(templateId);
            if (res.data) {
                setConfig(res.data);
            }
            if (res.isPro !== undefined) setIsPro(res.isPro);
            if (res.canCreateCustomTemplates !== undefined) setCanCreateCustomTemplates(res.canCreateCustomTemplates);
            if (res.isGlobal !== undefined) setIsGlobal(res.isGlobal);
            if (res.logoUrl) setLogoUrl(res.logoUrl);
            if (res.availableTemplates) setAvailableTemplates(res.availableTemplates);
            if (res.demoData) setDemoData(res.demoData); // Store demo data

            if (res.error) {
                toast.error("Error al cargar", { description: res.error });
            }
        });
    };

    useEffect(() => {
        loadTheme();
    }, []);

    const handleSave = () => {
        if (isGlobal) return;

        startTransition(async () => {
            const res = await updateOrganizationPdfTheme(config);
            if (res.success) {
                toast.success("Configuración guardada", {
                    description: "Los cambios se han aplicado a la plantilla."
                });
            } else {
                toast.error("Error al guardar", { description: res.error });
            }
        });
    };

    const handleCreateTemplate = () => {
        if (!newTemplateName.trim()) return;

        startTransition(async () => {
            const res = await createOrganizationPdfTemplate(newTemplateName);
            if (res.success && res.newTemplateId) {
                toast.success("Plantilla creada", { description: `Se ha creado "${newTemplateName}"` });
                setIsNewTemplateOpen(false);
                setNewTemplateName("");
                loadTheme(res.newTemplateId);
            } else {
                toast.error("Error al crear", { description: res.error });
            }
        });
    };

    const handleDeleteTemplate = () => {
        if (!config.id || isGlobal) return;

        startTransition(async () => {
            const res = await deleteOrganizationPdfTemplate(config.id!);
            if (res.success) {
                toast.success("Plantilla eliminada");
                setIsDeleteDialogOpen(false);
                loadTheme();
            } else {
                toast.error("Error al eliminar", { description: res.error });
            }
        });
    };

    const handleTemplateChange = (val: string) => {
        if (val === "default") {
            loadTheme("GLOBAL_DEFAULT");
        } else {
            loadTheme(val);
        }
    };

    const canEdit = isPro && !isGlobal;

    return (
        <SplitEditorLayout
            sidebarPosition="right"
            className="h-full overflow-hidden"
            sidebar={
                <SplitEditorSidebar
                    header={
                        <div className="flex flex-col gap-4 pb-4 border-b border-border/40">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-primary" />
                                    <span className="font-semibold text-sm">Plantillas PDF</span>
                                </div>
                                <FeatureGuard
                                    isEnabled={canCreateCustomTemplates}
                                    featureName="Plantillas PDF Personalizadas"
                                    requiredPlan="PRO"
                                >
                                    <Button
                                        size="sm"
                                        className="h-7 text-xs px-2"
                                        onClick={() => setIsNewTemplateOpen(true)}
                                    >
                                        <Plus className="h-3 w-3 mr-1" />
                                        Nueva Plantilla
                                    </Button>
                                </FeatureGuard>
                            </div>

                            <Select
                                disabled={!isPro && availableTemplates.length === 0}
                                value={isGlobal ? "default" : config.id}
                                onValueChange={handleTemplateChange}
                            >
                                <SelectTrigger className="w-full h-9 text-xs">
                                    <SelectValue placeholder="Seleccionar plantilla" />
                                </SelectTrigger>
                                <SelectContent
                                    position="popper"
                                    side="bottom"
                                    align="start"
                                    sideOffset={4}
                                    className="max-h-[200px] w-[var(--radix-select-trigger-width)]"
                                >
                                    <SelectItem value="default" className="cursor-pointer">
                                        <div className="flex items-center justify-between w-full gap-2 min-w-0">
                                            <span className="truncate">Plantilla Predeterminada</span>
                                            <Badge variant="secondary" className="ml-auto text-[9px] h-4 px-1 bg-[var(--plan-pro)]/10 text-[var(--plan-pro)] font-medium border-0 shrink-0">Solo Lectura</Badge>
                                        </div>
                                    </SelectItem>
                                    {availableTemplates.map(t => (
                                        <SelectItem key={t.id} value={t.id} className="cursor-pointer">
                                            {t.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    }
                >
                    <div className="space-y-6 animate-in fade-in duration-500 pb-20 pt-4 -mt-4">
                        <Accordion type="single" collapsible defaultValue="general" className="w-full space-y-2">

                            {/* --- FORMATO GENERAL --- */}
                            <AccordionItem value="general" className="border rounded-lg px-2 shadow-sm bg-card/30">
                                <AccordionTrigger className="hover:no-underline py-3 px-1 text-sm font-semibold">
                                    <span className="flex items-center gap-2">
                                        <LayoutTemplate className="h-4 w-4 text-primary" />
                                        Formato General
                                    </span>
                                </AccordionTrigger>
                                <AccordionContent className="pt-2 pb-4 px-1 space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        {['A4', 'Letter'].map((size) => (
                                            <div
                                                key={size}
                                                onClick={() => canEdit && setConfig({ ...config, pageSize: size as any })}
                                                className={cn(
                                                    "p-3 rounded-xl border bg-card/50 transition-all flex items-center justify-center text-sm font-medium relative overflow-hidden",
                                                    canEdit ? "cursor-pointer hover:border-primary" : "cursor-not-allowed opacity-60",
                                                    config.pageSize === size ? "ring-2 ring-primary border-transparent bg-primary/5" : ""
                                                )}
                                            >
                                                {size}
                                                {!canEdit && config.pageSize !== size && <Lock className="absolute h-3 w-3 text-muted-foreground/30 top-1 right-1" />}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="uppercase text-[10px] font-bold text-muted-foreground tracking-wider">Orientación</Label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { id: 'portrait', label: 'Vertical' },
                                                { id: 'landscape', label: 'Horizontal' }
                                            ].map((opt) => (
                                                <div
                                                    key={opt.id}
                                                    onClick={() => canEdit && setConfig({ ...config, orientation: opt.id as any })}
                                                    className={cn(
                                                        "p-3 rounded-xl border bg-card/50 transition-all flex items-center justify-center text-sm font-medium relative overflow-hidden",
                                                        canEdit ? "cursor-pointer hover:border-primary" : "cursor-not-allowed opacity-60",
                                                        config.orientation === opt.id ? "ring-2 ring-primary border-transparent bg-primary/5" : ""
                                                    )}
                                                >
                                                    {opt.label}
                                                    {!canEdit && config.orientation !== opt.id && <Lock className="absolute h-3 w-3 text-muted-foreground/30 top-1 right-1" />}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* SEPARATOR AND MARGINS */}
                                    <div className="h-px bg-border/40 my-2" />

                                    <div className="space-y-3">
                                        <Label className="uppercase text-[10px] font-bold text-muted-foreground tracking-wider flex items-center gap-2">
                                            <Ruler className="h-3 w-3" /> Márgenes (mm)
                                        </Label>
                                        <div className="grid grid-cols-2 gap-x-6 gap-y-6 p-4 rounded-xl border bg-card/40">
                                            {(['marginTop', 'marginBottom', 'marginLeft', 'marginRight'] as const).map((margin) => (
                                                <div key={margin} className="space-y-2">
                                                    <div className="flex justify-between items-center">
                                                        <Label className="text-[10px] text-muted-foreground capitalize">{margin.replace('margin', '')}</Label>
                                                        <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded">{config[margin]}</span>
                                                    </div>
                                                    <Slider
                                                        disabled={!canEdit}
                                                        value={[config[margin]]}
                                                        max={60}
                                                        min={5}
                                                        step={1}
                                                        onValueChange={(v) => canEdit && setConfig({ ...config, [margin]: v[0] })}
                                                        className={cn("[&>.absolute]:bg-primary", !canEdit && "opacity-50")}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            {/* --- LOGO & HEADER --- */}
                            <AccordionItem value="logo" className="border rounded-lg px-2 shadow-sm bg-card/30">
                                <AccordionTrigger className="hover:no-underline py-3 px-1 text-sm font-semibold">
                                    <span className="flex items-center gap-2">
                                        <ImageIcon className="h-4 w-4 text-primary" />
                                        Logotipo y Cabecera
                                    </span>
                                </AccordionTrigger>
                                <AccordionContent className="pt-2 pb-4 px-1 space-y-6">
                                    <div className="space-y-4 p-4 rounded-xl border bg-card/40">
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <Label className="text-[10px] text-muted-foreground uppercase">Ancho Logo (px)</Label>
                                                <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded">{config.logoWidth}</span>
                                            </div>
                                            <Slider
                                                disabled={!canEdit}
                                                value={[config.logoWidth]}
                                                max={300}
                                                min={20}
                                                step={5}
                                                onValueChange={(v) => canEdit && setConfig({ ...config, logoWidth: v[0] })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <Label className="text-[10px] text-muted-foreground uppercase">Alto Logo (px)</Label>
                                                <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded">{config.logoHeight}</span>
                                            </div>
                                            <Slider
                                                disabled={!canEdit}
                                                value={[config.logoHeight]}
                                                max={200}
                                                min={20}
                                                step={5}
                                                onValueChange={(v) => canEdit && setConfig({ ...config, logoHeight: v[0] })}
                                            />
                                        </div>
                                    </div>

                                    {/* Company Name Props */}
                                    {/* Note: Schema has companyNameSize/Color but preview currently doesn't show text header. Will add logic. */}
                                </AccordionContent>
                            </AccordionItem>

                            {/* --- BRANDING / TYPOGRAPHY --- */}
                            <AccordionItem value="branding" className="border rounded-lg px-2 shadow-sm bg-card/30">
                                <AccordionTrigger className="hover:no-underline py-3 px-1 text-sm font-semibold">
                                    <span className="flex items-center gap-2">
                                        <Palette className="h-4 w-4 text-primary" />
                                        Estilos y Colores
                                    </span>
                                </AccordionTrigger>
                                <AccordionContent className="pt-2 pb-4 px-1 space-y-6">
                                    {/* FONT FAMILY */}
                                    <div className="space-y-3">
                                        <Label className="uppercase text-[10px] font-bold text-muted-foreground tracking-wider flex items-center gap-2">
                                            <Type className="h-3 w-3" /> Tipografía
                                        </Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {PDF_FONTS.map(font => (
                                                <div
                                                    key={font}
                                                    onClick={() => canEdit && setConfig({ ...config, fontFamily: font })}
                                                    className={cn(
                                                        "p-2 rounded-lg border text-xs text-center transition-colors truncate",
                                                        canEdit ? "cursor-pointer hover:bg-muted/50" : "cursor-not-allowed opacity-50",
                                                        config.fontFamily === font ? "border-primary bg-primary/5 font-semibold" : ""
                                                    )}
                                                    style={{ fontFamily: font }}
                                                >
                                                    {font}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* FONT SIZES */}
                                    <div className="h-px bg-border/50" />
                                    <div className="space-y-4">
                                        <Label className="uppercase text-[10px] font-bold text-muted-foreground tracking-wider">Tamaños de Texto</Label>
                                        <div className="grid grid-cols-2 gap-4">
                                            {/* Title Size */}
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <Label className="text-[10px]">Títulos</Label>
                                                    <span className="text-[10px] font-mono text-muted-foreground">{config.titleSize}pt</span>
                                                </div>
                                                <Slider disabled={!canEdit} value={[config.titleSize]} max={36} min={10} step={1} onValueChange={v => canEdit && setConfig({ ...config, titleSize: v[0] })} />
                                            </div>
                                            {/* Subtitle Size */}
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <Label className="text-[10px]">Subtítulos</Label>
                                                    <span className="text-[10px] font-mono text-muted-foreground">{config.subtitleSize}pt</span>
                                                </div>
                                                <Slider disabled={!canEdit} value={[config.subtitleSize]} max={24} min={8} step={1} onValueChange={v => canEdit && setConfig({ ...config, subtitleSize: v[0] })} />
                                            </div>
                                            {/* Body Size */}
                                            <div className="space-y-2 col-span-2">
                                                <div className="flex justify-between">
                                                    <Label className="text-[10px]">Cuerpo</Label>
                                                    <span className="text-[10px] font-mono text-muted-foreground">{config.bodySize}pt</span>
                                                </div>
                                                <Slider disabled={!canEdit} value={[config.bodySize]} max={18} min={6} step={0.5} onValueChange={v => canEdit && setConfig({ ...config, bodySize: v[0] })} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* COLORS */}
                                    <div className="h-px bg-border/50" />
                                    <div className="space-y-3">
                                        <Label className="uppercase text-[10px] font-bold text-muted-foreground tracking-wider">Paleta de Colores</Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <ColorPicker disabled={!canEdit} label="Primario" color={config.primaryColor} onChange={(c) => setConfig({ ...config, primaryColor: c })} />
                                            <ColorPicker disabled={!canEdit} label="Secundario" color={config.secondaryColor} onChange={(c) => setConfig({ ...config, secondaryColor: c })} />
                                            <ColorPicker disabled={!canEdit} label="Texto Base" color={config.textColor} onChange={(c) => setConfig({ ...config, textColor: c })} />
                                            <ColorPicker disabled={!canEdit} label="Nombre Empresa" color={config.companyNameColor} onChange={(c) => setConfig({ ...config, companyNameColor: c })} />
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            {/* --- FOOTER --- */}
                            <AccordionItem value="footer" className="border rounded-lg px-2 shadow-sm bg-card/30">
                                <AccordionTrigger className="hover:no-underline py-3 px-1 text-sm font-semibold">
                                    <span className="flex items-center gap-2">
                                        <Footprints className="h-4 w-4 text-primary" />
                                        Pie de Página
                                    </span>
                                </AccordionTrigger>
                                <AccordionContent className="pt-2 pb-4 px-1">
                                    <div className="p-4 rounded-xl border bg-card/40 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs">Mostrar Footer</Label>
                                            <Switch disabled={!canEdit} checked={config.showFooter} onCheckedChange={(c) => setConfig({ ...config, showFooter: c })} />
                                        </div>
                                        {config.showFooter && (
                                            <div className={cn("space-y-4 animate-in slide-in-from-top-2 fade-in", !canEdit && "opacity-50 pointer-events-none")}>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] text-muted-foreground">Texto Legal</Label>
                                                    <Input
                                                        disabled={!canEdit}
                                                        value={config.footerText}
                                                        onChange={(e) => setConfig({ ...config, footerText: e.target.value })}
                                                        className="h-8 text-xs font-mono bg-background"
                                                    />
                                                </div>
                                                {/* Footer Text Size Slider */}
                                                <div className="space-y-2">
                                                    <div className="flex justify-between">
                                                        <Label className="text-[10px]">Tamaño Texto Pie</Label>
                                                        <span className="text-[10px] font-mono text-muted-foreground">{config.companyInfoSize}pt</span>
                                                    </div>
                                                    <Slider disabled={!canEdit} value={[config.companyInfoSize]} max={14} min={6} step={1} onValueChange={v => canEdit && setConfig({ ...config, companyInfoSize: v[0] })} />
                                                </div>
                                                <div className="flex items-center justify-between pt-2 border-t border-dashed">
                                                    <Label className="text-[10px] text-muted-foreground">Numeración</Label>
                                                    <Switch disabled={!canEdit} checked={config.showPageNumbers} onCheckedChange={(c) => setConfig({ ...config, showPageNumbers: c })} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>


                        {/* FOOTER ACTIONS */}
                        {!isGlobal && (
                            <div className="pt-4 text-center pb-8 space-y-3 border-t border-dashed mt-4">
                                <Button
                                    onClick={handleSave}
                                    disabled={isLoading}
                                    className="w-full bg-primary text-primary-foreground font-semibold shadow-lg hover:brightness-110"
                                >
                                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                                    {isLoading ? "Guardando..." : "Guardar Cambios"}
                                </Button>

                                <Button
                                    onClick={() => setIsDeleteDialogOpen(true)}
                                    disabled={isLoading}
                                    variant="ghost"
                                    className="w-full text-red-500 hover:text-red-700 hover:bg-red-50 h-8 text-xs"
                                >
                                    <Trash2 className="h-3 w-3 mr-2" />
                                    Eliminar Plantilla
                                </Button>
                            </div>
                        )}
                    </div>
                </SplitEditorSidebar>
            }
        >
            <ZoomPanCanvas>
                <PdfPreview config={config} logoUrl={logoUrl} demoData={demoData} />
            </ZoomPanCanvas>

            {/* DIALOGS ... (Unchanged) */}
            <Dialog open={isNewTemplateOpen} onOpenChange={setIsNewTemplateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nueva Plantilla</DialogTitle>
                        <DialogDescription>
                            Crea una nueva plantilla para personalizar el diseño de tus documentos.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Nombre de la Plantilla</Label>
                            <Input
                                value={newTemplateName}
                                onChange={(e) => setNewTemplateName(e.target.value)}
                                placeholder="Ej: Facturas Corporativas"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsNewTemplateOpen(false)}>Cancelar</Button>
                        <Button onClick={handleCreateTemplate} disabled={isLoading || !newTemplateName.trim()}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Crear Plantilla
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente la plantilla
                            <span className="font-bold text-foreground"> "{config.name}"</span>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => { e.preventDefault(); handleDeleteTemplate(); }}
                            className="bg-red-500 hover:bg-red-600 border-red-500"
                        >
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Eliminar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </SplitEditorLayout>
    );
}

// --- Local Components ---
function ColorPicker({ label, color, onChange, disabled }: { label: string, color: string, onChange: (c: string) => void, disabled?: boolean }) {
    return (
        <div className="space-y-2">
            <Label className="text-[10px] text-muted-foreground uppercase">{label}</Label>
            <div className={cn(
                "flex items-center gap-3 p-2 rounded-xl border bg-card hover:border-primary/50 transition-colors group cursor-pointer relative overflow-hidden h-10",
                disabled && "opacity-50 pointer-events-none"
            )}>
                <input
                    disabled={disabled}
                    type="color"
                    value={color}
                    onChange={(e) => onChange(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div
                    className="w-6 h-6 rounded-lg shadow-sm ring-1 ring-border/50 group-hover:scale-105 transition-transform"
                    style={{ backgroundColor: color }}
                />
                <div className="flex-1">
                    <span className="text-xs font-mono text-muted-foreground uppercase">{color}</span>
                </div>
            </div>
        </div>
    );
}

function ZoomPanCanvas({ children }: { children: React.ReactNode }) {
    const [scale, setScale] = useState(0.6);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const dragStartRef = useRef({ x: 0, y: 0 });

    // Zoom Constraints
    const MIN_SCALE = 0.3;
    const MAX_SCALE = 3.0;

    // Native non-passive wheel listener
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            e.stopPropagation();

            const delta = e.deltaY * -0.001;
            setScale(prevScale => Math.min(Math.max(prevScale + delta, MIN_SCALE), MAX_SCALE));
        };

        container.addEventListener('wheel', onWheel, { passive: false });
        return () => container.removeEventListener('wheel', onWheel);
    }, []);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        const newX = e.clientX - dragStartRef.current.x;
        const newY = e.clientY - dragStartRef.current.y;
        setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => setIsDragging(false);

    const fitToScreen = () => {
        const container = containerRef.current;
        const content = contentRef.current;
        if (!container || !content) {
            setScale(0.6);
            setPosition({ x: 0, y: 0 });
            return;
        }

        const containerRect = container.getBoundingClientRect();
        const contentRect = content.getBoundingClientRect();

        // Calculate scale to fit content in container with padding
        const padding = 40;
        const availableWidth = containerRect.width - padding * 2;
        const availableHeight = containerRect.height - padding * 2;

        // Get the original (unscaled) content size
        const originalWidth = contentRect.width / scale;
        const originalHeight = contentRect.height / scale;

        // Calculate the scale that fits the content
        const scaleX = availableWidth / originalWidth;
        const scaleY = availableHeight / originalHeight;
        const newScale = Math.min(scaleX, scaleY, 1); // Don't scale above 100%

        setScale(Math.max(newScale, MIN_SCALE));
        setPosition({ x: 0, y: 0 });
    };

    return (
        <div className="flex-1 w-full h-full relative bg-[#3f3f46] overflow-hidden select-none group">
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 bg-black/80 backdrop-blur-sm p-1.5 rounded-full border border-white/10 shadow-xl transition-opacity opacity-0 group-hover:opacity-100">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-white hover:bg-white/20" onClick={() => setScale(s => Math.max(s - 0.1, MIN_SCALE))}><Minus className="h-4 w-4" /></Button>
                <span className="text-xs font-mono text-white w-12 text-center">{Math.round(scale * 100)}%</span>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-white hover:bg-white/20" onClick={() => setScale(s => Math.min(s + 0.1, MAX_SCALE))}><Plus className="h-4 w-4" /></Button>
                <div className="w-[1px] h-4 bg-white/20 mx-1" />
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-white hover:bg-white/20" onClick={fitToScreen}><Maximize className="h-3 w-3" /></Button>
            </div>

            <div
                ref={containerRef}
                className={cn("w-full h-full flex items-center justify-center cursor-move", isDragging ? "cursor-grabbing" : "cursor-grab")}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <motion.div
                    ref={contentRef}
                    style={{
                        scale,
                        x: position.x,
                        y: position.y,
                        transformOrigin: 'center center'
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="shadow-2xl"
                >
                    {children}
                </motion.div>
            </div>

            <div className="absolute bottom-4 left-4 text-[10px] text-white/40 pointer-events-none">
                Scroll: Zoom • Drag: Pan
            </div>
        </div>
    );
}

// Updated Preview to support Demo Data
function PdfPreview({ config, logoUrl, demoData }: { config: PdfGlobalTheme, logoUrl?: string | null, demoData?: { address?: string, city?: string, state?: string, country?: string, phone?: string, email?: string } }) {
    const mmToPx = 3.78;

    // Paper Size (Base Portrait)
    let width = config.pageSize === 'A4' ? 210 * mmToPx : 216 * mmToPx;
    let height = config.pageSize === 'A4' ? 297 * mmToPx : 279 * mmToPx;

    // Handle Orientation
    if (config.orientation === 'landscape') {
        const temp = width;
        width = height;
        height = temp;
    }

    const styles = {
        paddingTop: `${config.marginTop * mmToPx}px`,
        paddingBottom: `${config.marginBottom * mmToPx}px`,
        paddingLeft: `${config.marginLeft * mmToPx}px`,
        paddingRight: `${config.marginRight * mmToPx}px`,
        fontFamily: config.fontFamily,
        color: config.textColor // Using updated text color logic
    };

    // Fallback/Mock data if no demoData provided
    const displayAddr = demoData ? [demoData.address, demoData.city, demoData.state, demoData.country].filter(Boolean).join(", ") : "Dirección de la Empresa, Ciudad, País";
    const displayContact = [demoData?.phone, demoData?.email].filter(Boolean).join(" • ");

    return (
        <div
            className="bg-white relative flex flex-col transition-all duration-300 ease-in-out"
            style={{ width, height, ...styles }}
        >
            <div className="absolute inset-0 pointer-events-none border-dashed border-blue-400/30"
                style={{
                    top: styles.paddingTop,
                    bottom: styles.paddingBottom,
                    left: styles.paddingLeft,
                    right: styles.paddingRight,
                    borderWidth: '1px'
                }}
            />

            {/* DOCUMENT CONTENT */}

            {/* Header Area */}
            <header className="flex justify-between items-start mb-12 border-b pb-6" style={{ borderColor: config.primaryColor }}>
                <div className="space-y-3">
                    {logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={logoUrl}
                            alt="Logo"
                            className="object-contain"
                            style={{
                                width: config.logoWidth ? `${config.logoWidth}px` : undefined,
                                height: config.logoHeight ? `${config.logoHeight}px` : undefined
                            }}
                        />
                    ) : (
                        <div
                            className="bg-gray-100 rounded animate-pulse"
                            style={{ width: config.logoWidth ?? 48, height: config.logoHeight ?? 48 }}
                        />
                    )}
                    <div className="space-y-1">
                        <div
                            className="font-bold leading-none"
                            style={{ fontSize: `${config.companyNameSize}pt`, color: config.companyNameColor }}
                        >
                            {demoData ? "Mi Empresa" : "Nombre Empresa"}
                        </div>
                        {/* Organization Data in Header */}
                        <div className="text-[9px] text-muted-foreground opacity-80 leading-tight space-y-0.5" style={{ fontFamily: 'inherit' }}>
                            <p>{displayAddr}</p>
                            {displayContact && <p>{displayContact}</p>}
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <h1
                        className="font-bold uppercase tracking-widest"
                        style={{ color: config.primaryColor, fontSize: `${config.titleSize}pt` }}
                    >
                        DOCUMENTO
                    </h1>
                    <p className="text-[10px] text-muted-foreground mt-2 font-mono">#REF-0000-XYZ</p>
                </div>
            </header>

            {/* Body */}
            <main className="flex-1 space-y-6 text-justify leading-relaxed relative overflow-hidden" style={{ fontSize: `${config.bodySize}pt` }}>
                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div className="p-4 bg-gray-50 rounded border border-gray-100 h-24" />
                    <div className="p-4 bg-gray-50 rounded border border-gray-100 h-24" />
                </div>

                <h3
                    className="font-bold mt-8 border-l-4 pl-3 uppercase tracking-wide"
                    style={{ borderColor: config.primaryColor, color: config.primaryColor, fontSize: `${config.subtitleSize}pt` }}
                >
                    Detalle de Contenidos
                </h3>

                {/* Mock Table */}
                <div className="mt-4 border rounded-lg overflow-hidden" style={{ borderColor: config.secondaryColor }}>
                    <div className="p-3 font-bold flex justify-between uppercase tracking-wider" style={{ backgroundColor: config.primaryColor + '10', fontSize: `${Math.max(config.bodySize - 2, 8)}pt` }}>
                        <span>Descripción del Servicio / Producto</span>
                        <span>Importe</span>
                    </div>
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="p-3 border-t flex justify-between border-gray-100" style={{ fontSize: `${Math.max(config.bodySize - 2, 8)}pt` }}>
                            <span className="w-2/3 h-2 bg-gray-100 rounded opacity-50" />
                            <span className="w-16 h-2 bg-gray-100 rounded opacity-50" />
                        </div>
                    ))}
                </div>

                <div className="flex justify-end pt-4">
                    <div className="text-right">
                        <p className="text-[9px] text-gray-400 uppercase">Total Estimado</p>
                        <p className="text-2xl font-bold" style={{ color: config.primaryColor }}>$ 0,000.00</p>
                    </div>
                </div>
            </main>


            {/* Footer Area */}
            {config.showFooter && (
                <footer className="mt-auto pt-4 border-t flex items-end justify-between text-gray-400" style={{ borderColor: config.secondaryColor, fontSize: `${config.companyInfoSize}pt` }}>
                    <div className="max-w-[70%]">
                        <p className="font-bold text-gray-600">{config.footerText}</p>
                    </div>
                    {config.showPageNumbers && (
                        <div className="bg-gray-100 px-2 py-1 rounded font-mono text-[7px]">Página 1 de 1</div>
                    )}
                </footer>
            )}
        </div>
    );
}
