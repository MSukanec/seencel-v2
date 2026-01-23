"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Bot,
    MousePointer2,
    Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { SplitEditorLayout, SplitEditorPreview, SplitEditorSidebar } from "@/components/layout";

// --- Types ---
type BrandTheme = {
    primaryColor: string;
    secondaryColor: string;
    radius: number;
    font: string;
    mode: 'light' | 'dark' | 'system';
};

// --- Constants ---
const FONTS = [
    { name: "Inter", value: "font-sans" },
    { name: "Manrope", value: "font-manrope" },
    { name: "Outfit", value: "font-outfit" },
    { name: "Playfair", value: "font-serif" },
];

export function BrandDigitalExperience() {
    // Default Tab State
    const [digitalTab, setDigitalTab] = useState("appearance");

    // State
    const [theme, setTheme] = useState<BrandTheme>({
        primaryColor: "#83cc16", // Lime-500 default
        secondaryColor: "#0f172a",
        radius: 0.5,
        font: "Inter",
        mode: 'light'
    });

    return (
        <SplitEditorLayout
            sidebarPosition="right"
            sidebar={
                <SplitEditorSidebar
                    header={
                        <Tabs value={digitalTab} onValueChange={setDigitalTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 rounded-xl h-9">
                                <TabsTrigger value="identity" className="rounded-lg text-xs h-7">Identidad</TabsTrigger>
                                <TabsTrigger value="appearance" className="rounded-lg text-xs h-7">Estilo</TabsTrigger>
                                <TabsTrigger value="emails" className="rounded-lg text-xs h-7">Email</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    }
                >
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

                        {(digitalTab === "identity" || digitalTab === "emails") && (
                            <div className="flex items-center justify-center p-8 text-center text-muted-foreground text-sm italic border-dashed border-2 rounded-xl">
                                <div className="space-y-2">
                                    <Bot className="h-8 w-8 mx-auto opacity-50" />
                                    <p>Próximamente disponible en esta demo.</p>
                                </div>
                            </div>
                        )}
                    </AnimatePresence>
                </SplitEditorSidebar>
            }
        >
            <SplitEditorPreview>
                <div className="absolute inset-0 opacity-[0.03]"
                    style={{ backgroundImage: `radial-gradient(${theme.primaryColor} 1px, transparent 1px)`, backgroundSize: '24px 24px' }}
                />
                <DigitalPreview theme={theme} />
            </SplitEditorPreview>
        </SplitEditorLayout>
    );
}

// --- Local Subcomponents ---

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

function DigitalPreview({ theme }: { theme: BrandTheme }) {
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
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/20 flex items-center justify-center mb-6">
                        <div className="w-8 h-8 bg-primary rounded" style={{ backgroundColor: theme.primaryColor }} />
                    </div>
                    <h2 className="text-4xl font-bold tracking-tight text-foreground">
                        Bienvenido a Seencel
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
                            Comenzar
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

