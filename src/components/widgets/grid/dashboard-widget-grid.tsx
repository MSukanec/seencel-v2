"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { WidgetDefinition, WidgetLayoutItem, WidgetSpan } from "./types";
import { SIZE_TO_SPAN } from "./types";
import {
    ResponsiveGridLayout,
    verticalCompactor,
} from "react-grid-layout";
import type { Layout, LayoutItem, ResponsiveLayouts } from "react-grid-layout";
import { saveDashboardLayout } from "@/actions/widget-actions";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/routing";
import {
    GripVertical,
    Plus,
    Trash2,
    Settings,
    ExternalLink,
} from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useModal } from "@/stores/modal-store";
import { WidgetSelectorForm } from "@/components/widgets/forms/widget-selector-form";

// react-grid-layout styles
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

// ============================================================================
// DASHBOARD WIDGET GRID (react-grid-layout v2.x based)
// ============================================================================

/** Number of columns per breakpoint */
const GRID_COLS = { lg: 4, md: 2, sm: 2, xs: 1, xxs: 1 };
/** Breakpoint widths */
const BREAKPOINTS = { lg: 1200, md: 768, sm: 480, xs: 0, xxs: 0 };
/** Row height in pixels */
const ROW_HEIGHT = 180;
/** Margin between items [horizontal, vertical] */
const GRID_MARGIN: readonly [number, number] = [16, 16];

// ============================================================================
// Props
// ============================================================================

interface DashboardWidgetGridProps {
    registry: Record<string, WidgetDefinition>;
    layout: WidgetLayoutItem[];
    isEditing?: boolean;
    storageKey: string;
    prefetchedData?: Record<string, any>;
    /** Server-fetched layout. If provided, overrides localStorage. */
    savedLayout?: WidgetLayoutItem[] | null;
}

// ============================================================================
// HELPERS — Layout conversion
// ============================================================================

/** Convert our WidgetLayoutItem[] to react-grid-layout LayoutItem[] */
function toRGLLayout(items: WidgetLayoutItem[], registry: Record<string, WidgetDefinition>): LayoutItem[] {
    return items.map((item, i) => {
        const def = registry[item.id];
        const span: WidgetSpan = def?.defaultSpan || { w: 1, h: 1 };
        const minSpan: WidgetSpan = def?.minSpan || { w: 1, h: 1 };

        return {
            i: item.instanceId || item.id,
            x: item.x ?? (i % 4),
            y: item.y ?? Math.floor(i / 4) * 2,
            w: item.w ?? span.w,
            h: item.h ?? span.h,
            minW: minSpan.w,
            minH: minSpan.h,
            maxW: def?.maxSpan?.w || 4,
            maxH: def?.maxSpan?.h || 6,
        };
    });
}

/** Convert react-grid-layout Layout (readonly LayoutItem[]) + our items back to WidgetLayoutItem[] */
function fromRGLLayout(rglLayout: Layout, items: WidgetLayoutItem[]): WidgetLayoutItem[] {
    return rglLayout.map(l => {
        const existingItem = items.find(
            it => (it.instanceId || it.id) === l.i
        );
        return {
            id: existingItem?.id || l.i,
            x: l.x,
            y: l.y,
            w: l.w,
            h: l.h,
            config: existingItem?.config,
            instanceId: existingItem?.instanceId,
        };
    });
}

/**
 * Migrate legacy layout format (size: 'sm') to new format (x,y,w,h).
 * Returns null if no migration needed.
 */
function migrateLegacyLayout(items: any[]): WidgetLayoutItem[] | null {
    const needsMigration = items.some(i => i.size && (i.x === undefined || i.y === undefined));
    if (!needsMigration) return null;

    let x = 0;
    let y = 0;
    return items.map(item => {
        const span = item.size ? (SIZE_TO_SPAN[item.size as keyof typeof SIZE_TO_SPAN] || { w: 1, h: 1 }) : { w: item.w || 1, h: item.h || 1 };

        if (x + span.w > 4) {
            x = 0;
            y += 1;
        }

        const migrated: WidgetLayoutItem = {
            id: item.id,
            x,
            y,
            w: span.w,
            h: span.h,
            config: item.config,
            instanceId: item.instanceId,
        };

        x += span.w;
        if (x >= 4) { x = 0; y += 1; }

        return migrated;
    });
}

// ============================================================================
// WIDGET WRAPPER — Controls for each widget
// ============================================================================

function WidgetWrapper({
    id,
    children,
    isEditing,
    onRemove,
    configPanel,
    config,
    onConfigChange,
    href,
}: {
    id: string;
    children: React.ReactNode;
    isEditing?: boolean;
    onRemove?: (id: string) => void;
    configPanel?: WidgetDefinition['configPanel'];
    config?: Record<string, any>;
    onConfigChange?: (id: string, newConfig: Record<string, any>) => void;
    href?: string;
}) {
    return (
        <div className="relative group h-full w-full">
            {/* Controls - Only visible when editing */}
            {isEditing && (
                <>
                    <div className="absolute top-2 right-2 flex items-center gap-1 z-20">
                        {/* Widget Menu (settings + delete) */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <button
                                    className={cn(
                                        "p-1.5 rounded-md cursor-pointer",
                                        "bg-background/80 backdrop-blur-sm border border-border/50 shadow-sm",
                                        "hover:bg-primary/10 hover:text-primary transition-colors"
                                    )}
                                >
                                    <Settings className="w-3.5 h-3.5" />
                                </button>
                            </PopoverTrigger>
                            <PopoverContent align="end" side="bottom" className="w-[240px] p-0">
                                {configPanel && (
                                    <div className="p-3 space-y-2.5">
                                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                            Configuración
                                        </p>
                                        {configPanel({
                                            config: config || {},
                                            onConfigChange: (newConfig) => onConfigChange?.(id, newConfig),
                                        })}
                                    </div>
                                )}
                                <div className={cn(
                                    "border-t border-border/50",
                                    !configPanel && "border-t-0"
                                )}>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onRemove?.(id);
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Eliminar widget
                                    </button>
                                </div>
                            </PopoverContent>
                        </Popover>

                        {/* Drag Handle */}
                        <div
                            className={cn(
                                "drag-handle p-1.5 rounded-md cursor-grab active:cursor-grabbing",
                                "bg-background/80 backdrop-blur-sm border border-border/50 shadow-sm",
                                "hover:bg-primary/10 hover:text-primary transition-colors"
                            )}
                        >
                            <GripVertical className="w-3.5 h-3.5" />
                        </div>
                    </div>
                </>
            )}

            {/* Navigate button — visible on hover in VIEW mode */}
            {!isEditing && href && (() => {
                const [pathname, qs] = href.split('?');
                const query = qs
                    ? Object.fromEntries(new URLSearchParams(qs).entries())
                    : undefined;
                const linkHref = query
                    ? { pathname, query } as any
                    : pathname as any;

                return (
                    <Link
                        href={linkHref}
                        className={cn(
                            "absolute top-2 right-2 z-20",
                            "p-1.5 rounded-md",
                            "bg-background/80 backdrop-blur-sm border border-border/50 shadow-sm",
                            "hover:bg-primary/10 hover:text-primary transition-all",
                            "opacity-0 group-hover:opacity-100"
                        )}
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                );
            })()}

            {/* Content Mask while editing */}
            {isEditing && (
                <div className="absolute inset-0 z-10 bg-background/5 pointer-events-none rounded-xl" />
            )}

            {/* Widget Content */}
            <div className="h-full w-full">
                {children}
            </div>
        </div>
    );
}

// ============================================================================
// ADD WIDGET BUTTON (opens modal)
// ============================================================================

function AddWidgetButton({
    onAdd,
    usedIds,
    registry,
}: {
    onAdd: (id: string) => void;
    usedIds: string[];
    registry: Record<string, WidgetDefinition>;
}) {
    const { openModal } = useModal();

    const handleOpen = () => {
        openModal(
            <WidgetSelectorForm
                registry={registry}
                usedIds={usedIds}
                onAdd={onAdd}
            />,
            {
                title: "Agregar Widget",
                description: "Elegí un widget para agregar al dashboard.",
                size: "md",
            }
        );
    };

    return (
        <button
            onClick={handleOpen}
            className={cn(
                "rounded-xl border-2 border-dashed border-border/50",
                "flex flex-col items-center justify-center gap-2 p-6",
                "text-muted-foreground hover:text-primary hover:border-primary/50",
                "transition-all cursor-pointer min-h-[180px] w-full"
            )}
        >
            <Plus className="w-6 h-6" />
            <span className="text-sm font-medium">Agregar Widget</span>
        </button>
    );
}

// ============================================================================
// MAIN GRID COMPONENT
// ============================================================================

export function DashboardWidgetGrid({
    registry,
    layout: defaultLayout,
    isEditing = false,
    storageKey,
    prefetchedData,
    savedLayout,
}: DashboardWidgetGridProps) {
    // Use server layout > localStorage cache > default
    const [items, setItems] = useState<WidgetLayoutItem[]>(() => {
        if (savedLayout && savedLayout.length > 0) return savedLayout;
        return defaultLayout;
    });
    const [isClient, setIsClient] = useState(false);

    // Debounced save to server
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const persistToServer = useCallback((data: WidgetLayoutItem[]) => {
        // Save to localStorage immediately (fast cache)
        localStorage.setItem(storageKey, JSON.stringify(data));
        // Debounce server save (1.5s)
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
            saveDashboardLayout(storageKey, data).catch(err =>
                console.error('[DashboardGrid] Server save failed:', err)
            );
        }, 1500);
    }, [storageKey]);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        };
    }, []);

    // Container width measurement — custom ResizeObserver (more reliable than useContainerWidth)
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(1200);
    const currentBreakpointRef = useRef<string>('lg');

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        // Measure immediately
        setContainerWidth(el.offsetWidth);

        // Observe for resizes
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const w = entry.contentRect.width;
                if (w > 0) setContainerWidth(w);
            }
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    // 1. Load from server (already done via savedLayout prop) or localStorage fallback
    useEffect(() => {
        setIsClient(true);
        // If server already provided a layout, skip localStorage
        if (savedLayout && savedLayout.length > 0) return;

        // Fallback: try localStorage (legacy or cache)
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                const validated = parsed.filter((i: any) => registry[i.id]);
                if (validated.length > 0) {
                    const migrated = migrateLegacyLayout(validated);
                    setItems(migrated || validated);
                }
            } catch (e) {
                console.error("Failed to load layout", e);
            }
        }
    }, [storageKey, registry, savedLayout]);

    // 2. Convert items to react-grid-layout format
    const rglLayout = useMemo(
        () => toRGLLayout(items, registry),
        [items, registry]
    );

    // 3. Handlers
    const handleLayoutChange = useCallback((newLayout: Layout, _layouts: ResponsiveLayouts) => {
        // Only persist layout when at the widest breakpoint (lg = 4 cols)
        // This prevents mobile/tablet compressed layouts from overwriting the desktop layout
        if (currentBreakpointRef.current !== 'lg') return;

        setItems(prev => {
            const updated = fromRGLLayout(newLayout, prev);
            persistToServer(updated);
            return updated;
        });
    }, [persistToServer]);

    const handleBreakpointChange = useCallback((newBreakpoint: string) => {
        currentBreakpointRef.current = newBreakpoint;
    }, []);

    const handleRemove = useCallback((id: string) => {
        setItems(prev => {
            const newItems = prev.filter(i => (i.instanceId || i.id) !== id);
            persistToServer(newItems);
            return newItems;
        });
    }, [persistToServer]);

    const handleAdd = useCallback((id: string) => {
        const def = registry[id];
        if (!def) return;

        setItems(prev => {
            const w = def.defaultSpan.w;
            const h = def.defaultSpan.h;
            const cols = 4; // lg breakpoint columns

            // Build an occupancy grid to find the first available slot
            const maxY = prev.reduce((max, item) => Math.max(max, item.y + item.h), 0);
            const scanRows = maxY + h + 1; // scan existing rows + room for a new one

            // Create occupancy matrix [row][col] — true = occupied
            const occupied: boolean[][] = Array.from({ length: scanRows }, () => Array(cols).fill(false));
            for (const item of prev) {
                for (let row = item.y; row < item.y + item.h; row++) {
                    for (let col = item.x; col < item.x + item.w; col++) {
                        if (row < scanRows && col < cols) {
                            occupied[row][col] = true;
                        }
                    }
                }
            }

            // Find first position where the widget fits (scan top-to-bottom, left-to-right)
            let bestX = 0;
            let bestY = maxY; // fallback: bottom
            outer:
            for (let row = 0; row <= scanRows - h; row++) {
                for (let col = 0; col <= cols - w; col++) {
                    // Check if the entire w×h block is free
                    let fits = true;
                    for (let dy = 0; dy < h && fits; dy++) {
                        for (let dx = 0; dx < w && fits; dx++) {
                            if (occupied[row + dy][col + dx]) fits = false;
                        }
                    }
                    if (fits) {
                        bestX = col;
                        bestY = row;
                        break outer;
                    }
                }
            }

            const newItem: WidgetLayoutItem = {
                id: def.id,
                x: bestX,
                y: bestY,
                w,
                h,
                ...(def.defaultConfig ? { config: { ...def.defaultConfig } } : {}),
            };
            const newItems = [...prev, newItem];
            persistToServer(newItems);
            return newItems;
        });
    }, [persistToServer, registry]);

    const handleConfigChange = useCallback((id: string, newConfig: Record<string, any>) => {
        setItems(prev => {
            const newItems = prev.map(item =>
                (item.instanceId || item.id) === id ? { ...item, config: newConfig } : item
            );
            persistToServer(newItems);
            return newItems;
        });
    }, [persistToServer]);

    // SSR fallback
    if (!isClient) {
        return (
            <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                {defaultLayout.map((item) => {
                    const widgetDef = registry[item.id];
                    if (!widgetDef) return null;
                    const WidgetComponent = widgetDef.component;
                    return (
                        <div
                            key={item.instanceId || item.id}
                            className="min-h-[180px]"
                            style={{
                                gridColumn: `span ${item.w || widgetDef.defaultSpan.w}`,
                                gridRow: `span ${item.h || widgetDef.defaultSpan.h}`,
                            }}
                        >
                            <WidgetComponent config={item.config || widgetDef.defaultConfig} initialData={prefetchedData?.[item.id]} />
                        </div>
                    );
                })}
            </div>
        );
    }

    return (
        <div ref={containerRef} className="widget-grid-container w-full">
            <ResponsiveGridLayout
                className="layout"
                layouts={{ lg: rglLayout }}
                breakpoints={BREAKPOINTS}
                cols={GRID_COLS}
                rowHeight={ROW_HEIGHT}
                margin={GRID_MARGIN}
                containerPadding={[0, 0] as readonly [number, number]}
                width={containerWidth}
                dragConfig={{
                    enabled: isEditing,
                    handle: '.drag-handle',
                    threshold: 5,
                    bounded: false,
                }}
                resizeConfig={{
                    enabled: isEditing,
                    handles: ['n', 'e', 's', 'w', 'se'],
                }}
                compactor={verticalCompactor}
                onLayoutChange={handleLayoutChange}
                onBreakpointChange={handleBreakpointChange}
                autoSize={true}
            >
                {items.map((item) => {
                    const key = item.instanceId || item.id;
                    const widgetDef = registry[item.id];
                    if (!widgetDef) return null;

                    const WidgetComponent = widgetDef.component;
                    const effectiveConfig = item.config || widgetDef.defaultConfig;

                    return (
                        <div key={key} className="rounded-xl overflow-hidden">
                            <WidgetWrapper
                                id={key}
                                isEditing={isEditing}
                                onRemove={handleRemove}
                                configPanel={widgetDef.configurable ? widgetDef.configPanel : undefined}
                                config={effectiveConfig}
                                onConfigChange={handleConfigChange}
                                href={widgetDef.href}
                            >
                                <WidgetComponent
                                    config={effectiveConfig}
                                    initialData={prefetchedData?.[item.id]}
                                />
                            </WidgetWrapper>
                        </div>
                    );
                })}
            </ResponsiveGridLayout>

            {/* Add Widget — outside the grid, only in edit mode */}
            {isEditing && (
                <div className="mt-4">
                    <AddWidgetButton
                        onAdd={handleAdd}
                        usedIds={items.map(i => i.id)}
                        registry={registry}
                    />
                </div>
            )}

            {/* Custom styles for react-grid-layout */}
            <style>{`
                .widget-grid-container .react-grid-layout {
                    position: relative;
                    transition: height 200ms ease;
                }
                .widget-grid-container .react-grid-item {
                    transition: all 200ms ease;
                    transition-property: left, top, width, height;
                }
                .widget-grid-container .react-grid-item.cssTransforms {
                    transition-property: transform, width, height;
                }
                .widget-grid-container .react-grid-item.resizing {
                    z-index: 30;
                    will-change: width, height;
                    opacity: 0.9;
                }
                .widget-grid-container .react-grid-item.react-draggable-dragging {
                    z-index: 30;
                    will-change: transform;
                    opacity: 0.8;
                    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
                }
                .widget-grid-container .react-grid-placeholder {
                    background: hsl(var(--primary) / 0.15);
                    border: 2px dashed hsl(var(--primary) / 0.4);
                    border-radius: 0.75rem;
                    opacity: 1;
                }

                /* ── Resize handles — one per side ── */
                .widget-grid-container .react-resizable-handle {
                    position: absolute;
                    z-index: 20;
                    opacity: 0;
                    transition: opacity 150ms ease;
                }
                .widget-grid-container .react-grid-item:hover .react-resizable-handle {
                    opacity: 1;
                }

                /* East (right edge) */
                .widget-grid-container .react-resizable-handle-e {
                    right: 0;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 8px;
                    height: 40px;
                    cursor: e-resize;
                }
                .widget-grid-container .react-resizable-handle-e::after {
                    content: '';
                    position: absolute;
                    right: 2px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 3px;
                    height: 24px;
                    border-radius: 2px;
                    background: hsl(var(--muted-foreground) / 0.35);
                    transition: background 150ms ease;
                }
                .widget-grid-container .react-resizable-handle-e:hover::after {
                    background: hsl(var(--primary));
                }

                /* West (left edge) */
                .widget-grid-container .react-resizable-handle-w {
                    left: 0;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 8px;
                    height: 40px;
                    cursor: w-resize;
                }
                .widget-grid-container .react-resizable-handle-w::after {
                    content: '';
                    position: absolute;
                    left: 2px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 3px;
                    height: 24px;
                    border-radius: 2px;
                    background: hsl(var(--muted-foreground) / 0.35);
                    transition: background 150ms ease;
                }
                .widget-grid-container .react-resizable-handle-w:hover::after {
                    background: hsl(var(--primary));
                }

                /* South (bottom edge) */
                .widget-grid-container .react-resizable-handle-s {
                    bottom: 0;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 40px;
                    height: 8px;
                    cursor: s-resize;
                }
                .widget-grid-container .react-resizable-handle-s::after {
                    content: '';
                    position: absolute;
                    bottom: 2px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 24px;
                    height: 3px;
                    border-radius: 2px;
                    background: hsl(var(--muted-foreground) / 0.35);
                    transition: background 150ms ease;
                }
                .widget-grid-container .react-resizable-handle-s:hover::after {
                    background: hsl(var(--primary));
                }

                /* North (top edge) */
                .widget-grid-container .react-resizable-handle-n {
                    top: 0;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 40px;
                    height: 8px;
                    cursor: n-resize;
                }
                .widget-grid-container .react-resizable-handle-n::after {
                    content: '';
                    position: absolute;
                    top: 2px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 24px;
                    height: 3px;
                    border-radius: 2px;
                    background: hsl(var(--muted-foreground) / 0.35);
                    transition: background 150ms ease;
                }
                .widget-grid-container .react-resizable-handle-n:hover::after {
                    background: hsl(var(--primary));
                }

                /* South-East (corner) */
                .widget-grid-container .react-resizable-handle-se {
                    bottom: 2px;
                    right: 2px;
                    width: 16px;
                    height: 16px;
                    cursor: se-resize;
                }
                .widget-grid-container .react-resizable-handle-se::after {
                    content: '';
                    position: absolute;
                    right: 2px;
                    bottom: 2px;
                    width: 8px;
                    height: 8px;
                    border-right: 2px solid hsl(var(--muted-foreground) / 0.4);
                    border-bottom: 2px solid hsl(var(--muted-foreground) / 0.4);
                    border-radius: 0 0 2px 0;
                    transition: border-color 150ms ease;
                }
                .widget-grid-container .react-resizable-handle-se:hover::after {
                    border-color: hsl(var(--primary));
                }
            `}</style>
        </div>
    );
}
