"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Palette,
    Type,
    Layout,
    Globe,
    Mail,
    Sparkles,
    Monitor,
    Bot,
    MousePointer2,
    Building,
    FileText,
    AlignLeft,
    Check,
    MoveVertical,
    MoveHorizontal,
    Activity // Used in preview
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { HeaderTitleUpdater } from "@/components/layout/header-title-updater";

// --- Types ---
type BrandTheme = {
    primaryColor: string;
    secondaryColor: string;
    radius: number;
    font: string;
    mode: 'light' | 'dark' | 'system';
};

type PortalConfig = {
    domain: string;
    showLogo: boolean;
    loginMessage: string;
};

// PDF Template Types based on schema
type PdfTemplateConfig = {
    name: string;
    pageSize: 'A4' | 'Letter' | 'Legal';
    orientation: 'portrait' | 'landscape';
    marginTop: number;
    marginBottom: number;
    marginLeft: number;
    marginRight: number;
    fontFamily: string;
    primaryColor: string;
    secondaryColor: string;
    showFooter: boolean;
    showPageNumbers: boolean;
    footerText: string;
    showClientSection: boolean;
    showSignatureSection: boolean;
    signatureLayout: 'vertical' | 'horizontal';
};

// --- Initial State (Mocks) ---
const FONTS = [
    { name: "Inter", value: "font-sans" },
    { name: "Manrope", value: "font-manrope" },
    { name: "Outfit", value: "font-outfit" },
    { name: "Playfair", value: "font-serif" },
];

const PDF_FONTS = [
    "Arial", "Helvetica", "Times New Roman", "Courier New", "Inter"
];

export function BrandSettingsClient() {

    // Default to 'digital' tab
    const [theme, setTheme] = useState<BrandTheme>({
        primaryColor: "#83cc16", // Lime-500 default
        secondaryColor: "#0f172a",
        radius: 0.5,
        font: "Inter",
        mode: 'light'
    });

    const [portal, setPortal] = useState<PortalConfig>({
        domain: "portal.miempresa.com",
        showLogo: true,
        loginMessage: "Bienvenido a tu espacio exclusivo."
    });

    const [pdfConfig, setPdfConfig] = useState<PdfTemplateConfig>({
        name: "Plantilla Oficial",
        pageSize: 'A4',
        orientation: 'portrait',
        marginTop: 20,
        marginBottom: 20,
        marginLeft: 20,
        marginRight: 20,
        fontFamily: "Arial",
        primaryColor: "#1f2937",
        secondaryColor: "#e5e7eb",
        showFooter: true,
        showPageNumbers: true,
        footerText: "Documento generado por Seencel • Confidencial",
        showClientSection: true,
        showSignatureSection: true,
        signatureLayout: 'horizontal'
    });

    // Helper for Digital Tabs
    const [digitalTab, setDigitalTab] = useState("appearance");
    // Helper for PDF Tabs
    const [pdfTab, setPdfTab] = useState("layout");

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-muted/10 -m-6 animate-in fade-in duration-500">

            {/* BREADCRUMBS INJECTED INTO HEADER */}
            <HeaderTitleUpdater title={
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="hover:text-foreground transition-colors cursor-pointer">Organización</span>
                    <span>/</span>
                    <span className="font-semibold text-foreground flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        Marca & Estilo
                    </span>
                </div>
            } />

            {/* MAIN CONTENT WITH TOP TABS */}
            <Tabs defaultValue="digital" className="flex flex-col flex-1 overflow-hidden" onValueChange={() => { }}>

                {/* TOP BAR / TABS LIST */}
                <div className="flex-none px-6 py-3 border-b border-border/40 bg-background/80 backdrop-blur-md flex items-center justify-between z-20">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-bold tracking-tight hidden md:block">Brand Studio</h1>

                        <TabsList className="bg-muted p-1 rounded-lg h-9">
                            <TabsTrigger value="digital" className="text-xs px-3 gap-2">
                                <Monitor className="h-3.5 w-3.5" />
                                Experiencia Digital
                            </TabsTrigger>
                            <TabsTrigger value="pdf" className="text-xs px-3 gap-2">
                                <FileText className="h-3.5 w-3.5" />
                                Documentos & PDF
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="h-8 text-xs">Resetear</Button>
                        <Button size="sm" className="h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20">
                            Guardar Cambios
                        </Button>
                    </div>
                </div>

                {/* TAB CONTENT AREAS (Both share the split layout) */}
                <TabsContent value="digital" className="flex-1 flex overflow-hidden m-0 data-[state=inactive]:hidden h-full">

                    {/* LEFT CONFIG: DIGITAL */}
                    <div className="w-[400px] md:w-[450px] border-r border-border/40 bg-background/50 backdrop-blur-3xl flex flex-col z-10 shadow-xl">
                        <div className="px-6 pt-6 pb-2">
                            <Tabs value={digitalTab} onValueChange={setDigitalTab} className="w-full">
                                <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1 rounded-xl h-9">
                                    <TabsTrigger value="identity" className="rounded-lg text-xs h-7">Identidad</TabsTrigger>
                                    <TabsTrigger value="appearance" className="rounded-lg text-xs h-7">Estilo</TabsTrigger>
                                    <TabsTrigger value="portal" className="rounded-lg text-xs h-7">Portal</TabsTrigger>
                                    <TabsTrigger value="emails" className="rounded-lg text-xs h-7">Email</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                            <AnimatePresence mode="wait">
                                {digitalTab === "appearance" && (
                                    <motion.div key="digital-appearance" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                                        {/* Color Section */}
                                        <section className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <Label className="uppercase text-xs font-bold text-muted-foreground tracking-wider">Colores de Marca</Label>
                                                <Button variant="ghost" size="sm" className="h-6 text-xs text-primary"><Bot className="h-3 w-3 mr-1" /> IA Magic</Button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <ColorPicker label="Primario" color={theme.primaryColor} onChange={(c) => setTheme({ ...theme, primaryColor: c })} />
                                                <ColorPicker label="Secundario" color={theme.secondaryColor} onChange={(c) => setTheme({ ...theme, secondaryColor: c })} />
                                            </div>
                                        </section>

                                        {/* Radius Section */}
                                        <section className="space-y-4">
                                            <Label className="uppercase text-xs font-bold text-muted-foreground tracking-wider">Geometría (Radius)</Label>
                                            <div className="space-y-4 p-4 rounded-xl border bg-card/50">
                                                <div className="flex justify-between text-xs text-muted-foreground">
                                                    <span>Cuadrado</span>
                                                    <span>Redondo</span>
                                                </div>
                                                <Slider value={[theme.radius]} max={1.5} step={0.1} onValueChange={(val) => setTheme({ ...theme, radius: val[0] })} />
                                            </div>
                                        </section>

                                        {/* Typography Section */}
                                        <section className="space-y-4">
                                            <Label className="uppercase text-xs font-bold text-muted-foreground tracking-wider">Tipografía</Label>
                                            <div className="grid grid-cols-2 gap-3">
                                                {FONTS.map((font) => (
                                                    <div
                                                        key={font.name}
                                                        onClick={() => setTheme({ ...theme, font: font.name })}
                                                        className={cn(
                                                            "p-3 rounded-xl border bg-card cursor-pointer hover:border-primary transition-all flex items-center justify-between",
                                                            theme.font === font.name ? "ring-2 ring-primary border-transparent bg-primary/5" : ""
                                                        )}
                                                    >
                                                        <span className="text-sm font-medium">{font.name}</span>
                                                        {theme.font === font.name && <Check className="h-4 w-4 text-primary" />}
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    </motion.div>
                                )}

                                {digitalTab === "portal" && (
                                    <motion.div key="digital-portal" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                                        <section className="space-y-4">
                                            <Label className="uppercase text-xs font-bold text-muted-foreground tracking-wider">Dominio</Label>
                                            <div className="flex gap-2">
                                                <Input value={portal.domain} onChange={(e) => setPortal({ ...portal, domain: e.target.value })} className="h-9" />
                                                <Button size="sm" variant="outline"><Check className="h-4 w-4" /></Button>
                                            </div>
                                            <p className="text-xs text-muted-foreground">Configura un registro CNAME en tu proveedor de DNS.</p>
                                        </section>
                                        <section className="space-y-4">
                                            <Label className="uppercase text-xs font-bold text-muted-foreground tracking-wider">Login Screen</Label>
                                            <div className="space-y-3 p-4 rounded-xl border bg-card">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-sm">Mostrar Logo</Label>
                                                    <Switch checked={portal.showLogo} onCheckedChange={(c) => setPortal({ ...portal, showLogo: c })} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-sm">Mensaje de Bienvenida</Label>
                                                    <Input value={portal.loginMessage} onChange={(e) => setPortal({ ...portal, loginMessage: e.target.value })} placeholder="Mensaje de bienvenida" />
                                                </div>
                                            </div>
                                        </section>
                                    </motion.div>
                                )}

                                {(digitalTab === "identity" || digitalTab === "emails") && (
                                    <div className="flex items-center justify-center p-8 text-center text-muted-foreground text-sm italic border-dashed border-2 rounded-xl">
                                        <div className="space-y-2">
                                            <Bot className="h-8 w-8 mx-auto opacity-50" />
                                            <p>Próximamente disponible en esta demo.</p>
                                        </div>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* RIGHT PREVIEW: DIGITAL */}
                    <div className="flex-1 relative bg-[#e5e5e5] dark:bg-[#121212] overflow-hidden flex items-center justify-center p-8">
                        <div className="absolute inset-0 opacity-[0.03]"
                            style={{ backgroundImage: `radial-gradient(${theme.primaryColor} 1px, transparent 1px)`, backgroundSize: '24px 24px' }}
                        />
                        <DigitalPreview theme={theme} portal={portal} />
                    </div>
                </TabsContent>


                <TabsContent value="pdf" className="flex-1 flex overflow-hidden m-0 data-[state=inactive]:hidden h-full">
                    {/* LEFT CONFIG: PDF */}
                    <div className="w-[400px] md:w-[450px] border-r border-border/40 bg-background/50 backdrop-blur-3xl flex flex-col z-10 shadow-xl">
                        <div className="px-6 pt-6 pb-2">
                            <Tabs value={pdfTab} onValueChange={setPdfTab} className="w-full">
                                <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 rounded-xl h-9">
                                    <TabsTrigger value="layout" className="rounded-lg text-xs h-7">Diseño</TabsTrigger>
                                    <TabsTrigger value="content" className="rounded-lg text-xs h-7">Contenido</TabsTrigger>
                                    <TabsTrigger value="style" className="rounded-lg text-xs h-7">Estilos</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                            <AnimatePresence mode="wait">
                                {pdfTab === 'layout' && (
                                    <motion.div key="pdf-layout" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                                        <section className="space-y-4">
                                            <Label className="uppercase text-xs font-bold text-muted-foreground tracking-wider">Formato de Papel</Label>
                                            <div className="grid grid-cols-2 gap-3">
                                                {['A4', 'Letter'].map((size) => (
                                                    <div
                                                        key={size}
                                                        onClick={() => setPdfConfig({ ...pdfConfig, pageSize: size as any })}
                                                        className={cn(
                                                            "p-3 rounded-xl border bg-card/50 cursor-pointer hover:border-primary transition-all flex items-center justify-center text-sm font-medium",
                                                            pdfConfig.pageSize === size ? "ring-2 ring-primary border-transparent bg-primary/5" : ""
                                                        )}
                                                    >
                                                        {size}
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                        <section className="space-y-4">
                                            <Label className="uppercase text-xs font-bold text-muted-foreground tracking-wider">Márgenes (mm)</Label>
                                            <div className="grid grid-cols-2 gap-4">
                                                {['marginTop', 'marginBottom', 'marginLeft', 'marginRight'].map((margin) => (
                                                    <div key={margin} className="space-y-1.5">
                                                        <Label className="text-xs text-muted-foreground capitalize">{margin.replace('margin', '')}</Label>
                                                        <Slider
                                                            value={[pdfConfig[margin as keyof PdfTemplateConfig] as number]}
                                                            max={50}
                                                            onValueChange={(v) => setPdfConfig({ ...pdfConfig, [margin]: v[0] })}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    </motion.div>
                                )}

                                {pdfTab === 'content' && (
                                    <motion.div key="pdf-content" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                                        <section className="space-y-4 p-4 rounded-xl border bg-card/50">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Building className="h-4 w-4 text-muted-foreground" />
                                                    <Label className="font-medium">Datos de Cliente</Label>
                                                </div>
                                                <Switch checked={pdfConfig.showClientSection} onCheckedChange={(c) => setPdfConfig({ ...pdfConfig, showClientSection: c })} />
                                            </div>
                                        </section>

                                        <section className="space-y-4 p-4 rounded-xl border bg-card/50">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <AlignLeft className="h-4 w-4 text-muted-foreground" />
                                                    <Label className="font-medium">Pie de Página</Label>
                                                </div>
                                                <Switch checked={pdfConfig.showFooter} onCheckedChange={(c) => setPdfConfig({ ...pdfConfig, showFooter: c })} />
                                            </div>
                                            {pdfConfig.showFooter && (
                                                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                                    <Input
                                                        value={pdfConfig.footerText}
                                                        onChange={(e) => setPdfConfig({ ...pdfConfig, footerText: e.target.value })}
                                                        className="h-8 text-xs"
                                                    />
                                                    <div className="flex items-center justify-between">
                                                        <Label className="text-xs text-muted-foreground">Número de Página</Label>
                                                        <Switch checked={pdfConfig.showPageNumbers} onCheckedChange={(c) => setPdfConfig({ ...pdfConfig, showPageNumbers: c })} />
                                                    </div>
                                                </div>
                                            )}
                                        </section>

                                        <section className="space-y-4 p-4 rounded-xl border bg-card/50">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                                    <Label className="font-medium">Sección de Firmas</Label>
                                                </div>
                                                <Switch checked={pdfConfig.showSignatureSection} onCheckedChange={(c) => setPdfConfig({ ...pdfConfig, showSignatureSection: c })} />
                                            </div>
                                            {pdfConfig.showSignatureSection && (
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant={pdfConfig.signatureLayout === 'horizontal' ? 'secondary' : 'outline'}
                                                        onClick={() => setPdfConfig({ ...pdfConfig, signatureLayout: 'horizontal' })}
                                                        className="flex-1"
                                                    >
                                                        <MoveHorizontal className="h-3 w-3 mr-2" /> Horizontal
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant={pdfConfig.signatureLayout === 'vertical' ? 'secondary' : 'outline'}
                                                        onClick={() => setPdfConfig({ ...pdfConfig, signatureLayout: 'vertical' })}
                                                        className="flex-1"
                                                    >
                                                        <MoveVertical className="h-3 w-3 mr-2" /> Vertical
                                                    </Button>
                                                </div>
                                            )}
                                        </section>
                                    </motion.div>
                                )}

                                {pdfTab === 'style' && (
                                    <motion.div key="pdf-style" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                                        <section className="space-y-4">
                                            <Label className="uppercase text-xs font-bold text-muted-foreground tracking-wider">Acentos de Color</Label>
                                            <div className="grid grid-cols-1 gap-4">
                                                <ColorPicker label="Color Primario (Encabezados)" color={pdfConfig.primaryColor} onChange={(c) => setPdfConfig({ ...pdfConfig, primaryColor: c })} />
                                                <ColorPicker label="Color Secundario (Bordes)" color={pdfConfig.secondaryColor} onChange={(c) => setPdfConfig({ ...pdfConfig, secondaryColor: c })} />
                                            </div>
                                        </section>

                                        <section className="space-y-4">
                                            <Label className="uppercase text-xs font-bold text-muted-foreground tracking-wider">Tipografía</Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {PDF_FONTS.map(font => (
                                                    <div
                                                        key={font}
                                                        onClick={() => setPdfConfig({ ...pdfConfig, fontFamily: font })}
                                                        className={cn(
                                                            "p-2 rounded-lg border text-sm text-center cursor-pointer hover:bg-muted/50 transition-colors",
                                                            pdfConfig.fontFamily === font ? "border-primary bg-primary/5 font-semibold" : ""
                                                        )}
                                                        style={{ fontFamily: font }}
                                                    >
                                                        {font}
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* RIGHT PREVIEW: PDF */}
                    <div className="flex-1 relative bg-[#e5e5e5] dark:bg-[#121212] overflow-hidden flex items-center justify-center p-8">
                        <PdfPreview config={pdfConfig} />
                    </div>
                </TabsContent>

            </Tabs>
        </div>
    );
}

// --- SUBCOMPONENTS ---

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
                <div className="flex-1">
                    <span className="text-xs font-mono">{color}</span>
                </div>
            </div>
        </div>
    );
}


function DigitalPreview({ theme, portal }: { theme: BrandTheme, portal: PortalConfig }) {
    return (
        <motion.div
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.05, opacity: 0 }}
            className="relative w-full max-w-4xl h-[80vh] bg-background rounded-[2rem] shadow-2xl overflow-hidden border-8 border-white/20 ring-1 ring-black/5 flex flex-col"
            style={{ borderRadius: `${Math.max(1, theme.radius * 2)}rem` }}
        >
            {/* Mock Browser Header */}
            <div className="h-12 border-b bg-muted/30 flex items-center px-4 gap-2 shrink-0">
                <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                    <div className="w-3 h-3 rounded-full bg-green-400/80" />
                </div>
                <div className="flex-1 flex justify-center">
                    <div className="px-4 py-1 rounded-md bg-white/50 text-xs text-muted-foreground w-64 text-center font-mono truncate">
                        https://{portal.domain}
                    </div>
                </div>
            </div>

            {/* Preview Content */}
            <div
                className="flex-1 p-8 overflow-y-auto relative"
                style={{
                    fontFamily: theme.font === "Inter" ? "var(--font-sans)" : theme.font,
                    ['--radius' as any]: `${theme.radius}rem`,
                    ['--primary' as any]: theme.primaryColor,
                }}
            >
                {/* Hero Banner Mock */}
                <div className="mb-12 text-center space-y-6">
                    {portal.showLogo && (
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/20 flex items-center justify-center mb-6">
                            <Sparkles className="h-8 w-8 text-primary" style={{ color: theme.primaryColor }} />
                        </div>
                    )}
                    <h2 className="text-4xl font-bold tracking-tight text-foreground">
                        {portal.loginMessage}
                    </h2>
                    <div className="flex justify-center gap-4 pt-4">
                        <Button
                            size="lg"
                            className="px-8 shadow-xl transition-transform hover:scale-105"
                            style={{
                                backgroundColor: theme.primaryColor,
                                borderRadius: `${theme.radius}rem`
                            }}
                        >
                            Ingresar
                        </Button>
                    </div>
                </div>
                {/* Card Mocks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="overflow-hidden border-primary bg-primary/5" style={{ borderRadius: `${theme.radius}rem`, borderColor: theme.primaryColor }}>
                        <div className="p-6 space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="font-semibold text-primary" style={{ color: theme.primaryColor }}>Activo</span>
                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                            </div>
                            <h3 className="text-lg font-bold">Proyecto Alpha</h3>
                            <div className="h-2 w-full bg-white/50 rounded-full overflow-hidden mt-4">
                                <div className="h-full bg-primary w-[75%]" style={{ backgroundColor: theme.primaryColor }} />
                            </div>
                        </div>
                    </Card>
                    <Card style={{ borderRadius: `${theme.radius}rem` }}>
                        <div className="p-6 space-y-2">
                            <Label>Usuario</Label>
                            <Input placeholder="usuario@email.com" style={{ borderRadius: `${theme.radius}rem` }} />
                        </div>
                    </Card>
                </div>
            </div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/80 text-white text-xs backdrop-blur-md flex items-center gap-2 shadow-2xl border border-white/10">
                <MousePointer2 className="h-3 w-3 animate-bounce" />
                Vista Previa en Tiempo Real
            </div>
        </motion.div>
    );
}

function PdfPreview({ config }: { config: PdfTemplateConfig }) {
    // Calculate simulated pixel dimensions (A4 approx ratio 1:1.414)
    // A4: 210mm x 297mm
    const ratio = config.pageSize === 'Letter' ? 1.294 : 1.414;
    const width = 600; // Base width pixels
    const height = width * ratio;

    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0, rotateX: 10 }} animate={{ scale: 1, opacity: 1, rotateX: 0 }}
            className="relative shadow-2xl shadow-black/20"
            style={{ perspective: '1000px' }}
        >
            <div
                className="bg-white text-black text-[10px] md:text-[12px] overflow-hidden relative transition-all duration-300 ease-out"
                style={{
                    width: `${width}px`,
                    height: `${height}px`,
                    fontFamily: config.fontFamily,
                    paddingTop: `${config.marginTop}px`,
                    paddingBottom: `${config.marginBottom}px`,
                    paddingLeft: `${config.marginLeft}px`,
                    paddingRight: `${config.marginRight}px`,
                }}
            >
                {/* Header Section (Simulated) */}
                <div className="flex justify-between items-start mb-8 border-b pb-4" style={{ borderColor: config.secondaryColor }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-gray-400">
                            <Building className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold" style={{ color: config.primaryColor }}>MI EMPRESA S.A.</h1>
                            <p className="text-gray-500 text-xs">Avenida Siempre Viva 123</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-2xl font-light text-gray-300">PRESUPUESTO</h2>
                        <p className="font-mono text-sm">#PRE-2024-001</p>
                    </div>
                </div>

                {/* Client Section */}
                {config.showClientSection && (
                    <div className="mb-8 p-4 bg-gray-50 rounded border border-gray-100 flex justify-between">
                        <div>
                            <p className="text-xs uppercase font-bold text-gray-400 mb-1">FACTURAR A</p>
                            <p className="font-bold text-lg">Cliente Ejemplo S.R.L.</p>
                            <p className="text-gray-600">CUIT: 30-12345678-9</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs uppercase font-bold text-gray-400 mb-1">FECHA</p>
                            <p>05 Ene, 2026</p>
                        </div>
                    </div>
                )}

                {/* Body Content Placeholder */}
                <div className="space-y-4 mb-8">
                    <div className="w-full h-8 bg-gray-100 rounded mb-2 flex items-center px-2">
                        <span className="font-bold text-xs w-1/2">Descripción</span>
                        <span className="font-bold text-xs w-1/4 text-right">Cant.</span>
                        <span className="font-bold text-xs w-1/4 text-right">Total</span>
                    </div>
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center px-2 border-b border-gray-50 pb-2">
                            <span className="text-xs w-1/2">Servicio de Consultoría Profesional - Item #{i}</span>
                            <span className="text-xs w-1/4 text-right">1.00</span>
                            <span className="text-xs w-1/4 text-right font-mono">$ 150.00</span>
                        </div>
                    ))}
                    <div className="flex justify-end pt-4">
                        <div className="w-1/3 border-t-2 pt-2" style={{ borderColor: config.primaryColor }}>
                            <div className="flex justify-between font-bold text-lg">
                                <span>TOTAL</span>
                                <span>$ 450.00</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Text Body */}
                <div className="text-justify text-gray-600 space-y-2 mb-8 columns-2 gap-6">
                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.</p>
                    <p>Quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore.</p>
                </div>

                {/* Signatures */}
                {config.showSignatureSection && (
                    <div className={cn("mt-auto pt-8", config.signatureLayout === 'horizontal' ? "flex justify-between gap-10" : "flex flex-col gap-10 items-end")}>
                        <div className="text-center pt-8 border-t border-gray-300 w-48">
                            <p className="font-bold text-xs">Firma del Responsable</p>
                            <p className="text-[10px] text-gray-400">Mi Empresa S.A.</p>
                        </div>
                        <div className="text-center pt-8 border-t border-gray-300 w-48">
                            <p className="font-bold text-xs">Conformidad Cliente</p>
                            <p className="text-[10px] text-gray-400">Aclaración y Fecha</p>
                        </div>
                    </div>
                )}

                {/* Footer */}
                {config.showFooter && (
                    <div
                        className="absolute bottom-0 left-0 right-0 h-10 border-t flex items-center justify-between px-8 text-[10px] text-gray-400"
                        style={{ borderColor: config.secondaryColor }}
                    >
                        <span>{config.footerText}</span>
                        {config.showPageNumbers && <span>Página 1 de 1</span>}
                    </div>
                )}
            </div>

            {/* Paper Effects */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-black/5 to-transparent mix-blend-multiply" />
        </motion.div>
    );
}
