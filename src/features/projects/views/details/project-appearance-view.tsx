"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Save } from "lucide-react";
import {
    Image as ImageIcon,
    Loader2,
    Sparkles,
    Check,
    Scan,
} from "lucide-react";
import { PhotoZoneSelector } from "@/components/shared/theme-customizer/photo-zone-selector";
import { ColorSlot } from "@/components/shared/theme-customizer/color-slot";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { ContentLayout } from "@/components/layout/dashboard/shared/content-layout";
import { SettingsSection, SettingsSectionContainer } from "@/components/shared/settings-section";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { extractColorsFromImage, rgbToOklch } from "@/components/shared/theme-customizer/lib/color-extraction";
import type { ExtractedColor } from "@/components/shared/theme-customizer/types/palette";
import { useThemeCustomization } from "@/stores/theme-store";
import { toast } from "sonner";

// ── Types ───────────────────────────────────────────────────────────────────

interface ProjectAppearanceViewProps {
    project: {
        id: string;
        organization_id: string;
        name: string;
        image_url?: string | null;
        image_palette?: {
            primary?: string;
            secondary?: string;
            accent?: string;
            background?: string;
        } | null;
        color?: string | null;
        project_settings?: {
            use_palette_theme?: boolean;
        } | null;
    };
    /** @deprecated — Theme saving is fully blocked (Próximamente). Kept for future use. */
    canCustomizeBranding?: boolean;
}

// ── Fonts ───────────────────────────────────────────────────────────────────

const FONTS = [
    { name: "Inter", value: "font-sans" },
    { name: "Manrope", value: "font-manrope" },
    { name: "Outfit", value: "font-outfit" },
    { name: "Playfair", value: "font-serif" },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Returns 'white' or 'black' depending on background luminance (WCAG relative luminance) */
function getContrastTextColor(hex: string): string {
    const cleaned = hex.replace('#', '');
    const r = parseInt(cleaned.substring(0, 2), 16) / 255;
    const g = parseInt(cleaned.substring(2, 4), 16) / 255;
    const b = parseInt(cleaned.substring(4, 6), 16) / 255;
    const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
    return luminance > 0.35 ? '#000000' : '#ffffff';
}

/**
 * Assign intelligent roles to extracted colors using OKLCH analysis.
 * - Background: most neutral (lowest chroma) + most extreme luminance
 * - Primary: most chromatic/saturated (will be used for buttons, actions)
 * - Accent: second most chromatic
 * - Secondary: remaining color
 * Colors are NOT modified, only role-assigned.
 */
function assignColorRoles(colors: ExtractedColor[]): {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
} {
    if (colors.length < 4) {
        return {
            primary: colors[0]?.hex || '#666666',
            secondary: colors[1]?.hex || '#888888',
            accent: colors[2]?.hex || '#999999',
            background: colors[3]?.hex || colors[0]?.hex || '#333333',
        };
    }

    // Score each color for "background suitability" (low chroma + extreme luminance)
    const scored = colors.slice(0, 4).map((color, idx) => {
        const { l, c } = color.oklch;
        // Background score: low chroma is good, extreme luminance (very dark or very light) is good
        const chromaPenalty = c; // Lower is better for background
        const luminanceExtremity = Math.abs(l - 0.5); // Higher = more extreme = better bg
        const bgScore = luminanceExtremity - chromaPenalty * 5; // Favor neutral + extreme luminance
        return { color, idx, l, c, bgScore, chromaScore: c };
    });

    // 1) Background: highest bgScore (most neutral + most extreme luminance)
    scored.sort((a, b) => b.bgScore - a.bgScore);
    const bgItem = scored[0];
    const remaining = scored.filter(s => s.idx !== bgItem.idx);

    // 2) Primary: highest chroma from remaining (most vibrant for buttons)
    remaining.sort((a, b) => b.chromaScore - a.chromaScore);
    const primaryItem = remaining[0];
    const afterPrimary = remaining.filter(s => s.idx !== primaryItem.idx);

    // 3) Accent: second highest chroma
    const accentItem = afterPrimary[0];
    const secondaryItem = afterPrimary[1];

    return {
        primary: primaryItem.color.hex,
        secondary: secondaryItem.color.hex,
        accent: accentItem.color.hex,
        background: bgItem.color.hex,
    };
}


// ── Main View ───────────────────────────────────────────────────────────────

export function ProjectAppearanceView({ project, canCustomizeBranding = true }: ProjectAppearanceViewProps) {
    const { applyProjectTheme, resetTheme, setProjectThemeOverride } = useThemeCustomization();

    // Image & extraction state
    const [isExtracting, setIsExtracting] = useState(false);

    const [previewUrl, setPreviewUrl] = useState<string | null>(project.image_url || null);
    const [extractedColors, setExtractedColors] = useState<ExtractedColor[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [showZoneSelector, setShowZoneSelector] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Editable theme colors (what actually gets applied)
    const [themeColors, setThemeColors] = useState<{
        primary: string;
        secondary: string;
        accent: string;
        background: string;
    } | null>(project.image_palette ? {
        primary: project.image_palette.primary || '#666666',
        secondary: project.image_palette.secondary || '#888888',
        accent: project.image_palette.accent || '#999999',
        background: project.image_palette.background || '#333333',
    } : null);
    // Original extracted colors (for reset)
    const [originalThemeColors, setOriginalThemeColors] = useState<typeof themeColors>(themeColors);

    // Style state
    const [radius, setRadius] = useState(0.5);
    const [font, setFont] = useState("Inter");

    // ── Rehidratar extractedColors + auto-preview al montar ────────────────

    React.useEffect(() => {
        if (project.image_palette && extractedColors.length === 0) {
            const palette = project.image_palette;
            const dbColors = [
                palette.primary,
                palette.secondary,
                palette.accent,
                palette.background,
            ].filter((c): c is string => Boolean(c));

            if (dbColors.length > 0) {
                // Rehydrate extracted colors for display (inline swatches)
                const rehydrated: ExtractedColor[] = dbColors.map((hex, i) => {
                    const cleaned = hex.replace('#', '');
                    const r = parseInt(cleaned.substring(0, 2), 16) || 0;
                    const g = parseInt(cleaned.substring(2, 4), 16) || 0;
                    const b = parseInt(cleaned.substring(4, 6), 16) || 0;
                    return {
                        rgb: { r, g, b },
                        hex: `#${cleaned}`,
                        oklch: rgbToOklch(r, g, b),
                        population: 1000 - i * 100,
                    };
                });
                setExtractedColors(rehydrated);

                // Set override so ThemeCustomizationHydrator doesn't reset the preview
                setProjectThemeOverride(project.id, true);

                // Auto-apply global theme preview so user sees it live
                applyProjectTheme({
                    id: project.id,
                    use_palette_theme: true,
                    image_palette: palette,
                });
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [project.id]);

    // ── Cleanup: ALWAYS reset theme when leaving (playground mode) ──────────

    React.useEffect(() => {
        return () => {
            resetTheme();
            // Clean the session override so the Hydrator can function normally
            setProjectThemeOverride(project.id, false);
            // Also restore radius and font
            document.documentElement.style.removeProperty('--radius');
            document.body.classList.remove('font-manrope', 'font-outfit', 'font-serif');
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Live preview: apply radius to :root ──────────────────────────────────

    useEffect(() => {
        document.documentElement.style.setProperty('--radius', `${radius}rem`);
    }, [radius]);

    // ── Live preview: apply font to body ─────────────────────────────────────

    useEffect(() => {
        const fontClasses = ['font-manrope', 'font-outfit', 'font-serif'];
        document.body.classList.remove(...fontClasses);
        const selectedFont = FONTS.find(f => f.name === font);
        if (selectedFont && selectedFont.value !== 'font-sans') {
            document.body.classList.add(selectedFont.value);
        }
    }, [font]);

    // ── Image Upload & Color Extraction (auto-save to DB) ────────────────────

    const handleFileSelect = useCallback(async (file: File) => {
        if (!file.type.startsWith("image/")) {
            setError("Por favor seleccioná una imagen válida");
            return;
        }

        setIsExtracting(true);
        setError(null);
        setPreviewUrl(URL.createObjectURL(file));

        try {
            const colors = await extractColorsFromImage(file, 8);
            setExtractedColors(colors);

            // Assign roles intelligently (most neutral→bg, most chromatic→primary)
            const paletteData = assignColorRoles(colors);

            // Auto-fill the editable color slots
            const typedPalette = {
                primary: paletteData.primary || '#666666',
                secondary: paletteData.secondary || '#888888',
                accent: paletteData.accent || '#999999',
                background: paletteData.background || '#333333',
            };
            setThemeColors(typedPalette);
            setOriginalThemeColors(typedPalette);

            // Apply theme preview globally (playground only, not persisted)
            applyProjectTheme({
                id: project.id,
                use_palette_theme: true,
                image_palette: paletteData,
            });

            toast.success("Paleta extraída", { description: "Los colores se aplicaron como vista previa." });
        } catch (err) {
            setError("Error extrayendo colores. Intentá con otra imagen.");
            console.error(err);
        } finally {
            setIsExtracting(false);
        }
    }, [project.id, applyProjectTheme]);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file) handleFileSelect(file);
        },
        [handleFileSelect]
    );

    // ── Zone selection: extract colors from a specific area ──────────────

    const handleZoneSelected = useCallback(async (canvas: HTMLCanvasElement) => {
        setShowZoneSelector(false);
        setIsExtracting(true);
        setError(null);

        try {
            // Convert canvas to blob URL for color extraction
            const blob = await new Promise<Blob>((resolve, reject) =>
                canvas.toBlob(b => b ? resolve(b) : reject(new Error('Canvas to blob failed')), 'image/png')
            );
            const blobUrl = URL.createObjectURL(blob);

            const colors = await extractColorsFromImage(blobUrl, 8);
            URL.revokeObjectURL(blobUrl);
            setExtractedColors(colors);

            // Assign roles intelligently (most neutral→bg, most chromatic→primary)
            const paletteData = assignColorRoles(colors);

            // Auto-fill the editable color slots
            const typedPalette = {
                primary: paletteData.primary || '#666666',
                secondary: paletteData.secondary || '#888888',
                accent: paletteData.accent || '#999999',
                background: paletteData.background || '#333333',
            };
            setThemeColors(typedPalette);
            setOriginalThemeColors(typedPalette);

            // Apply theme preview globally (playground only, not persisted)
            applyProjectTheme({
                id: project.id,
                use_palette_theme: true,
                image_palette: paletteData,
            });

            toast.success("Paleta de zona extraída", { description: "Colores de la zona seleccionada aplicados como vista previa." });
        } catch (err) {
            setError("Error extrayendo colores de la zona. Intentá con otra selección.");
            console.error(err);
        } finally {
            setIsExtracting(false);
        }
    }, [project.id, applyProjectTheme]);

    // ── Save Theme — BLOCKED (Próximamente) ──────────────────────────────────
    // Theme persistence is fully disabled. The view acts as a playground only.



    return (
        <>
            <Toolbar
                portalToHeader={true}
                actions={[{
                    label: "Guardar tema",
                    icon: Save,
                    onClick: () => { },
                    disabled: true,
                    featureGuard: {
                        isEnabled: false,
                        featureName: "Personalización de Tema",
                        requiredPlan: "PRO" as const,
                        customMessage: "Esta función estará disponible próximamente. Por ahora podés explorar y experimentar con los colores libremente.",
                    },
                }]}
            />
            <ContentLayout variant="wide" className="py-6">
                <SettingsSectionContainer>
                    {/* ── Sección 1: Imagen y Paleta de Colores ───────────────── */}
                    <SettingsSection
                        icon={ImageIcon}
                        title="Imagen y Paleta"
                        description="Subí una imagen de referencia (interiors, fachada, paisaje) y Seencel extraerá una paleta de colores automática que se aplicará como tema visual del proyecto."
                    >
                        <div className="space-y-4">
                            {/* Upload area */}
                            <div
                                onDrop={handleDrop}
                                onDragOver={(e) => e.preventDefault()}
                                onClick={() => fileInputRef.current?.click()}
                                className={cn(
                                    "relative rounded-xl text-center transition-all cursor-pointer",
                                    previewUrl
                                        ? "overflow-hidden"
                                        : "border-2 border-dashed border-muted p-6 hover:border-primary/50",
                                    isExtracting && "opacity-50 pointer-events-none"
                                )}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleFileSelect(file);
                                    }}
                                />

                                {previewUrl ? (
                                    <div className="relative overflow-hidden rounded-lg">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={previewUrl}
                                            alt="Imagen de referencia"
                                            className="w-full h-52 object-cover"
                                        />

                                        {/* Overlay: Extracting spinner */}
                                        {isExtracting && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                                                <div className="flex items-center gap-2 text-white text-sm font-medium">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Extrayendo colores...
                                                </div>
                                            </div>
                                        )}

                                        {/* Overlay: Inline palette swatches — top center */}
                                        {!isExtracting && extractedColors.length > 0 && (
                                            <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-1">
                                                {extractedColors.slice(0, 4).map((color, i) => (
                                                    <button
                                                        key={i}
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigator.clipboard.writeText(color.hex);
                                                            toast.success(`${color.hex.toUpperCase()} copiado`);
                                                        }}
                                                        className={cn(
                                                            "group/swatch relative flex items-center justify-center cursor-pointer",
                                                            "w-12 h-8 rounded-md shadow-md ring-1 ring-black/20",
                                                            "transition-all hover:scale-110 hover:ring-white/50",
                                                        )}
                                                        style={{ backgroundColor: color.hex }}
                                                        title={`Copiar ${color.hex}`}
                                                    >
                                                        <span
                                                            className="text-[8px] font-mono font-semibold leading-none opacity-0 group-hover/swatch:opacity-100 transition-opacity"
                                                            style={{ color: getContrastTextColor(color.hex) }}
                                                        >
                                                            {color.hex.toUpperCase()}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* Overlay: Zone selector button — bottom left */}
                                        {!isExtracting && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowZoneSelector(true);
                                                }}
                                                className={cn(
                                                    "absolute bottom-2 left-2",
                                                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md",
                                                    "text-xs font-medium text-white/90 hover:text-white",
                                                    "bg-black/40 backdrop-blur-sm hover:bg-black/60",
                                                    "transition-all"
                                                )}
                                            >
                                                <Scan className="h-3.5 w-3.5" />
                                                Seleccionar zona
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="py-6">
                                        <div className="mx-auto w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3">
                                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <p className="font-medium text-sm mb-1">
                                            Arrastrá una imagen aquí
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            o hacé clic para seleccionar
                                        </p>
                                    </div>
                                )}
                            </div>

                            {error && (
                                <p className="text-sm text-destructive">{error}</p>
                            )}

                            {/* Editable color slots */}
                            {themeColors && (
                                <div className="grid grid-cols-4 gap-3">
                                    <ColorSlot
                                        label="Primario"
                                        value={themeColors.primary}
                                        originalValue={originalThemeColors?.primary || themeColors.primary}
                                        onChange={(hex) => {
                                            const updated = { ...themeColors, primary: hex };
                                            setThemeColors(updated);
                                            applyProjectTheme({
                                                id: project.id,
                                                use_palette_theme: true,
                                                image_palette: updated,
                                            });
                                        }}
                                    />
                                    <ColorSlot
                                        label="Secundario"
                                        value={themeColors.secondary}
                                        originalValue={originalThemeColors?.secondary || themeColors.secondary}
                                        onChange={(hex) => {
                                            const updated = { ...themeColors, secondary: hex };
                                            setThemeColors(updated);
                                            applyProjectTheme({
                                                id: project.id,
                                                use_palette_theme: true,
                                                image_palette: updated,
                                            });
                                        }}
                                    />
                                    <ColorSlot
                                        label="Acento"
                                        value={themeColors.accent}
                                        originalValue={originalThemeColors?.accent || themeColors.accent}
                                        onChange={(hex) => {
                                            const updated = { ...themeColors, accent: hex };
                                            setThemeColors(updated);
                                            applyProjectTheme({
                                                id: project.id,
                                                use_palette_theme: true,
                                                image_palette: updated,
                                            });
                                        }}
                                    />
                                    <ColorSlot
                                        label="Fondo"
                                        value={themeColors.background}
                                        originalValue={originalThemeColors?.background || themeColors.background}
                                        onChange={(hex) => {
                                            const updated = { ...themeColors, background: hex };
                                            setThemeColors(updated);
                                            applyProjectTheme({
                                                id: project.id,
                                                use_palette_theme: true,
                                                image_palette: updated,
                                            });
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </SettingsSection>

                    {/* ── Sección 2: Estilo Visual ──────────────────────────── */}
                    <SettingsSection
                        icon={Sparkles}
                        title="Estilo"
                        description="Personalizá la geometría y tipografía de la interfaz para este proyecto."
                    >
                        <div className="space-y-6">
                            {/* Border Radius */}
                            <div className="space-y-3">
                                <Label className="text-xs font-medium text-muted-foreground">
                                    Geometría (Radius)
                                </Label>
                                <div className="space-y-3 p-4 rounded-xl border bg-card/50">
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>Cuadrado</span>
                                        <span>Redondo</span>
                                    </div>
                                    <Slider
                                        value={[radius]}
                                        max={1.5}
                                        step={0.1}
                                        onValueChange={(val) => setRadius(val[0])}
                                    />
                                </div>
                            </div>

                            {/* Typography */}
                            <div className="space-y-3">
                                <Label className="text-xs font-medium text-muted-foreground">
                                    Tipografía
                                </Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {FONTS.map((f) => (
                                        <div
                                            key={f.name}
                                            onClick={() => setFont(f.name)}
                                            className={cn(
                                                "p-3 rounded-xl border bg-card cursor-pointer hover:border-primary transition-all flex items-center justify-between",
                                                font === f.name &&
                                                "ring-2 ring-primary border-transparent bg-primary/5"
                                            )}
                                        >
                                            <span className="text-sm font-medium">
                                                {f.name}
                                            </span>
                                            {font === f.name && (
                                                <Check className="h-3.5 w-3.5 text-primary" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </SettingsSection>
                </SettingsSectionContainer>
            </ContentLayout>

            {/* Zone selector modal */}
            {showZoneSelector && previewUrl && (
                <PhotoZoneSelector
                    imageUrl={previewUrl}
                    onZoneSelected={handleZoneSelected}
                    onCancel={() => setShowZoneSelector(false)}
                />
            )}
        </>
    );
}
