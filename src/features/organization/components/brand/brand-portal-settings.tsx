"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Sparkles,
    MousePointer2,
    Check,
    Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { SplitEditorLayout, SplitEditorPreview, SplitEditorSidebar } from "@/components/layout";

// --- Types ---
type BrandTheme = {
    primaryColor: string;
    radius: number;
    font: string;
};

type PortalConfig = {
    domain: string;
    showLogo: boolean;
    loginMessage: string;
};

export function BrandPortalSettings() {
    // State
    // We only need a subset of theme for the preview, or we mock it. 
    // Ideally this comes from a global theme context or prop, but for this extracted component we'll keep local state for "Preview" purposes 
    // or assume we are editing ONLY portal config but seeing it with default theme.
    // User request implies splitting the settings. 

    const [portal, setPortal] = useState<PortalConfig>({
        domain: "portal.miempresa.com",
        showLogo: true,
        loginMessage: "Bienvenido a tu espacio exclusivo."
    });

    // Mock theme for preview visualization
    const theme: BrandTheme = {
        primaryColor: "#83cc16",
        radius: 0.5,
        font: "Inter"
    };

    return (
        <SplitEditorLayout
            sidebarPosition="right"
            sidebar={
                <SplitEditorSidebar
                    header={
                        <div className="flex items-center gap-2 mb-2">
                            <Globe className="h-4 w-4 text-primary" />
                            <span className="font-semibold text-sm">Configuración del Portal</span>
                        </div>
                    }
                >
                    <div className="space-y-6">
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
                            <div className="space-y-3 p-4 rounded-xl border bg-card/50">
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
                    </div>
                </SplitEditorSidebar>
            }
        >
            <SplitEditorPreview>
                <div className="absolute inset-0 opacity-[0.03]"
                    style={{ backgroundImage: `radial-gradient(${theme.primaryColor} 1px, transparent 1px)`, backgroundSize: '24px 24px' }}
                />
                <PortalPreview theme={theme} portal={portal} />
            </SplitEditorPreview>
        </SplitEditorLayout>
    );
}

// --- Local Preview Component ---
function PortalPreview({ theme, portal }: { theme: BrandTheme, portal: PortalConfig }) {
    return (
        <motion.div
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
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
                className="flex-1 p-8 overflow-y-auto relative flex flex-col items-center justify-center"
                style={{
                    fontFamily: theme.font === "Inter" ? "var(--font-sans)" : theme.font,
                    ['--radius' as any]: `${theme.radius}rem`,
                    ['--primary' as any]: theme.primaryColor,
                }}
            >
                {/* Login Screen Mock */}
                <div className="w-full max-w-md space-y-8 text-center">
                    {portal.showLogo && (
                        <div className="w-20 h-20 mx-auto rounded-3xl bg-primary/20 flex items-center justify-center mb-6 animate-in zoom-in duration-500">
                            <Sparkles className="h-10 w-10 text-primary" style={{ color: theme.primaryColor }} />
                        </div>
                    )}
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">
                            {portal.loginMessage}
                        </h2>
                        <p className="text-muted-foreground">Ingresa tus credenciales para continuar</p>
                    </div>

                    <div className="space-y-4 pt-4 text-left">
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input placeholder="nombre@empresa.com" className="bg-muted/50" style={{ borderRadius: `${theme.radius}rem` }} />
                        </div>
                        <div className="space-y-2">
                            <Label>Contraseña</Label>
                            <Input type="password" placeholder="••••••••" className="bg-muted/50" style={{ borderRadius: `${theme.radius}rem` }} />
                        </div>
                        <Button
                            size="lg"
                            className="w-full shadow-xl transition-transform hover:scale-[1.02] active:scale-[0.98]"
                            style={{
                                backgroundColor: theme.primaryColor,
                                borderRadius: `${theme.radius}rem`
                            }}
                        >
                            Ingresar
                        </Button>
                    </div>
                </div>
            </div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/80 text-white text-xs backdrop-blur-md flex items-center gap-2 shadow-2xl border border-white/10">
                <MousePointer2 className="h-3 w-3 animate-bounce" />
                Vista Previa del Portal
            </div>
        </motion.div>
    );
}
