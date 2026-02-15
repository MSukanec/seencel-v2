"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { MapPin, ArrowLeft, Building2, Hammer, Pencil } from "lucide-react";
import { PlanBadge, FounderBadge } from "@/components/shared/plan-badge";
import { cn } from "@/lib/utils";

import { AvatarStack } from "@/components/ui/avatar-stack";
import { useRouter } from "@/i18n/routing";
import type { WidgetProps } from "@/components/widgets/grid/types";
import { getOverviewHeroData } from "@/actions/widget-actions";

import { Skeleton } from "@/components/ui/skeleton";
import { GoogleMap, useLoadScript, OverlayView } from "@react-google-maps/api";
import { useTheme } from "next-themes";
import { MAP_TYPE_ID, getMapContainerClass } from "@/lib/map-config";
import { useActiveProjectId, useLayoutActions } from "@/stores/layout-store";

// ============================================================================
// OVERVIEW HERO WIDGET — Context-Aware with Smooth Map Transitions
// ============================================================================
// Reads activeProjectId from layout-store:
//   - null → Org mode: shows org logo, name, plan, all project markers
//   - string → Project mode: shows project cover, name, zoomed to project
//
// UX Flow:
//   Org → Click marker → zoom in + fade overlay → switch context (no skeleton)
//   Project → Click "back" → zoom out + fade overlay → switch to org (no skeleton)
// ============================================================================

const libraries: ("places")[] = ["places"];

// Map styling is centralized in @/lib/map-config

interface ProjectLocation {
    id: string;
    name: string;
    status: string;
    lat: number;
    lng: number;
    city: string | null;
    country: string | null;
    address: string | null;
    imageUrl: string | null;
}

interface HeroData {
    name: string;
    avatarUrl: string | null;
    planName: string | null;
    planSlug: string | null;
    isFounder: boolean;
    memberCount: number;
    projectCount: number;
    projectLocations: ProjectLocation[];
    members: { name: string; image: string | null; email?: string }[];
    isProjectMode: boolean;
    // Project-specific badges (only in project mode)
    projectStatus: string | null;
    projectTypeName: string | null;
    projectModalityName: string | null;
}





// ── MAP BACKGROUND ──────────────────────────────────────────────────────────
function HeroMapBackground({
    locations,
    mapRef,
    onMapReady,
    hoveredProject,
    onHover,
    onLeave,
    onMarkerClick,
}: {
    locations: ProjectLocation[];
    mapRef: React.MutableRefObject<google.maps.Map | null>;
    onMapReady: () => void;
    hoveredProject: string | null;
    onHover: (id: string) => void;
    onLeave: () => void;
    onMarkerClick: (loc: ProjectLocation) => void;
}) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const mapClass = getMapContainerClass(isDark);
    const defaultCenter = useMemo(() => ({ lat: 0, lng: 0 }), []);

    const onMapLoad = useCallback(
        (map: google.maps.Map) => {
            mapRef.current = map;
            if (locations.length === 0) {
                onMapReady();
                return;
            }

            const bounds = new google.maps.LatLngBounds();
            locations.forEach((loc) => {
                bounds.extend({ lat: loc.lat, lng: loc.lng });
            });
            map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });

            const listener = google.maps.event.addListener(map, "idle", () => {
                const zoom = map.getZoom();
                if (zoom && zoom > 15) map.setZoom(15);
                google.maps.event.removeListener(listener);
                onMapReady();
            });
        },
        [locations, mapRef, onMapReady]
    );

    return (
        <div className={`w-full h-full ${mapClass}`}>
            <GoogleMap
                zoom={3}
                center={defaultCenter}
                mapContainerClassName="w-full h-full"
                onLoad={onMapLoad}
                options={{
                    mapTypeId: MAP_TYPE_ID,
                    disableDefaultUI: true,
                    zoomControl: false,
                    scrollwheel: false,
                    draggable: false,
                    disableDoubleClickZoom: true,
                    gestureHandling: "none",
                    keyboardShortcuts: false,
                    clickableIcons: false,
                }}
            >
                {locations.map((loc) => {
                    const initials = loc.name
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase();

                    return (
                        <OverlayView
                            key={loc.id}
                            position={{ lat: loc.lat, lng: loc.lng }}
                            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                        >
                            <div
                                className="relative group cursor-pointer"
                                style={{ transform: "translate(-50%, -50%)" }}
                                onMouseEnter={() => onHover(loc.id)}
                                onMouseLeave={onLeave}
                                onClick={() => onMarkerClick(loc)}
                            >
                                {hoveredProject === loc.id && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap z-50 pointer-events-none">
                                        <div className="bg-popover/95 backdrop-blur-md border border-border/50 rounded-lg shadow-xl px-3 py-2">
                                            <p className="text-sm font-semibold text-popover-foreground">{loc.name}</p>
                                            {(loc.address || loc.city || loc.country) && (
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                                                    <p className="text-xs text-muted-foreground">
                                                        {loc.address || [loc.city, loc.country].filter(Boolean).join(", ")}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px]">
                                            <div className="w-2 h-2 bg-popover/95 border-r border-b border-border/50 rotate-45" />
                                        </div>
                                    </div>
                                )}
                                <div className="w-[34px] h-[34px] rounded-full border border-border/60 shadow-sm overflow-hidden transition-all duration-200 hover:scale-125 hover:shadow-lg hover:border-border relative opacity-80 hover:opacity-100">
                                    {loc.imageUrl ? (
                                        <img src={loc.imageUrl} alt={loc.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-muted flex items-center justify-center">
                                            <span className="text-[10px] font-bold text-muted-foreground">{initials}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </OverlayView>
                    );
                })}
            </GoogleMap>
        </div>
    );
}

// Grid pattern fallback
function GradientBackground() {
    return (
        <div className="absolute inset-0 overflow-hidden bg-muted/30">
            <svg
                className="absolute inset-0 w-full h-full"
                xmlns="http://www.w3.org/2000/svg"
                style={{ opacity: 0.06 }}
            >
                <defs>
                    <pattern id="hero-grid" width="32" height="32" patternUnits="userSpaceOnUse">
                        <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="0.5" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#hero-grid)" />
            </svg>
        </div>
    );
}


// ── MAIN WIDGET ─────────────────────────────────────────────────────────────
export function OverviewHeroWidget({ initialData }: WidgetProps) {
    const activeProjectId = useActiveProjectId();
    const { setActiveProjectId } = useLayoutActions();
    const router = useRouter();
    const [data, setData] = useState<HeroData | null>(initialData ?? null);
    const [hoveredProject, setHoveredProject] = useState<string | null>(null);

    // Transition state: controls overlay fade + prevents double-clicks
    const [isTransitioning, setIsTransitioning] = useState(false);
    const transitionSafetyRef = useRef<NodeJS.Timeout | null>(null);

    // Safety: auto-reset isTransitioning after 3s max to prevent freeze
    const startTransition = useCallback(() => {
        if (transitionSafetyRef.current) clearTimeout(transitionSafetyRef.current);
        setIsTransitioning(true);
        transitionSafetyRef.current = setTimeout(() => {
            setIsTransitioning(false);
        }, 3000);
    }, []);

    const endTransition = useCallback(() => {
        if (transitionSafetyRef.current) clearTimeout(transitionSafetyRef.current);
        setIsTransitioning(false);
    }, []);

    // We cache org data so we can restore it without skeleton when going back
    const orgDataCache = useRef<HeroData | null>(null);
    // We cache all project locations from org mode for zoom-out
    const allLocationsCache = useRef<ProjectLocation[]>([]);

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
    const mapRef = useRef<google.maps.Map | null>(null);

    const { isLoaded } = useLoadScript({
        googleMapsApiKey: apiKey,
        libraries,
    });

    // Keep caches updated
    useEffect(() => {
        if (data && !data.isProjectMode) {
            orgDataCache.current = data;
            allLocationsCache.current = data.projectLocations;
        }
    }, [data]);

    // ── ANIMATED ZOOM IN → Switch to Project ──
    const handleMarkerClick = useCallback((loc: ProjectLocation) => {
        const map = mapRef.current;
        if (!map || isTransitioning || activeProjectId) return;

        startTransition();

        // Phase 1: Fade out overlay (CSS transition handles this)
        // Phase 2: Animate map zoom
        map.panTo({ lat: loc.lat, lng: loc.lng });

        const currentZoom = map.getZoom() || 3;
        const targetZoom = 14;
        const steps = 3;
        const delay = 200;
        let step = 0;

        const zoomInterval = setInterval(() => {
            step++;
            const progress = step / steps;
            const newZoom = currentZoom + (targetZoom - currentZoom) * progress;
            map.setZoom(Math.round(newZoom));

            if (step >= steps) {
                clearInterval(zoomInterval);

                // Phase 3: Build project data from marker (NO skeleton, NO setData(null))
                const projectData: HeroData = {
                    name: loc.name,
                    avatarUrl: loc.imageUrl,
                    planName: null,
                    planSlug: null,
                    isFounder: false,
                    memberCount: 0,
                    projectCount: 0,
                    projectLocations: [loc],
                    members: data?.members || [],
                    isProjectMode: true,
                    projectStatus: null, // Will be filled by background refetch
                    projectTypeName: null,
                    projectModalityName: null,
                };

                // Wait for zoom to settle, then swap data + context atomically
                setTimeout(() => {
                    setData(projectData);
                    setActiveProjectId(loc.id);
                    // Small delay before revealing new overlay
                    setTimeout(() => {
                        endTransition();
                    }, 100);
                }, 300);
            }
        }, delay);
    }, [activeProjectId, isTransitioning, setActiveProjectId, data, startTransition, endTransition]);

    // ── ANIMATED ZOOM OUT → Back to Organization ──
    const handleBackToOrg = useCallback(() => {
        const map = mapRef.current;
        if (!map || isTransitioning) return;

        startTransition();

        // Phase 1: Zoom out to show all projects
        if (allLocationsCache.current.length > 0) {
            const bounds = new google.maps.LatLngBounds();
            allLocationsCache.current.forEach(loc => {
                bounds.extend({ lat: loc.lat, lng: loc.lng });
            });
            map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
        }

        // Phase 2: After zoom-out animation settles, swap data + context
        setTimeout(() => {
            // Restore org data from cache if available (no skeleton!)
            if (orgDataCache.current) {
                setData(orgDataCache.current);
            } else {
                // Fallback: force refetch (will show skeleton briefly)
                setData(null);
            }
            setActiveProjectId(null);

            setTimeout(() => {
                endTransition();
            }, 100);
        }, 800); // Enough time for fitBounds animation
    }, [isTransitioning, setActiveProjectId, startTransition, endTransition]);

    // ── EXTERNAL CONTEXT CHANGE (from header selector) ──
    const prevProjectIdRef = useRef<string | null>(activeProjectId);
    useEffect(() => {
        if (activeProjectId === prevProjectIdRef.current) return;
        const prevId = prevProjectIdRef.current;
        prevProjectIdRef.current = activeProjectId;

        // Skip if we're in the middle of our own animated transition
        if (isTransitioning) return;

        const map = mapRef.current;

        if (activeProjectId) {
            // Switched to a project from header — find location and zoom
            const loc = allLocationsCache.current.find(l => l.id === activeProjectId);
            if (loc && map) {
                startTransition();
                map.panTo({ lat: loc.lat, lng: loc.lng });
                map.setZoom(14);

                const projectData: HeroData = {
                    name: loc.name,
                    avatarUrl: loc.imageUrl,
                    planName: null,
                    planSlug: null,
                    isFounder: false,
                    memberCount: 0,
                    projectCount: 0,
                    projectLocations: [loc],
                    members: data?.members || [],
                    isProjectMode: true,
                    projectStatus: null,
                    projectTypeName: null,
                    projectModalityName: null,
                };

                setTimeout(() => {
                    setData(projectData);
                    setTimeout(() => endTransition(), 100);
                }, 600);
            } else {
                // Project not found in cache — full refetch
                setData(null);
            }
        } else if (prevId) {
            // Switched back to org from header
            if (orgDataCache.current) {
                startTransition();

                if (map && allLocationsCache.current.length > 0) {
                    const bounds = new google.maps.LatLngBounds();
                    allLocationsCache.current.forEach(l => {
                        bounds.extend({ lat: l.lat, lng: l.lng });
                    });
                    map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
                }

                setTimeout(() => {
                    setData(orgDataCache.current!);
                    setTimeout(() => endTransition(), 100);
                }, 600);
            } else {
                setData(null);
            }
        }
    }, [activeProjectId, isTransitioning, data]);

    // ── DATA FETCH — only when data is null (initial load or cache miss) ──
    useEffect(() => {
        if (data) return;

        getOverviewHeroData(activeProjectId || null)
            .then((result) => {
                if (result) setData(result);
            })
            .catch((err) => console.error("Error fetching hero data:", err));
    }, [data, activeProjectId]);

    const handleMapReady = useCallback(() => { }, []);

    // ── LOADING SKELETON (only on initial load, never after transitions) ──
    if (!data) {
        return (
            <div className="h-full w-full rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 p-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-14 w-14 rounded-xl bg-white/10" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-48 bg-white/10" />
                        <Skeleton className="h-4 w-24 bg-white/10" />
                    </div>
                </div>
            </div>
        );
    }

    // ── DERIVED STATE ──
    const hasLocations = data.projectLocations && data.projectLocations.length > 0;
    const initials = data.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
    const showMap = isLoaded && apiKey;

    // Use all cached locations for the map (so markers stay visible during transitions)
    const mapLocations = allLocationsCache.current.length > 0
        ? allLocationsCache.current
        : data.projectLocations;

    return (
        <div
            className={cn(
                "relative h-full w-full rounded-xl overflow-hidden group/name",
                "border border-white/[0.08]",
            )}
        >
            {/* Background: Map or Grid fallback */}
            <div className="absolute inset-0">
                {showMap ? (
                    <>
                        <HeroMapBackground
                            locations={mapLocations}
                            mapRef={mapRef}
                            onMapReady={handleMapReady}
                            hoveredProject={hoveredProject}
                            onHover={setHoveredProject}
                            onLeave={() => setHoveredProject(null)}
                            onMarkerClick={handleMarkerClick}
                        />
                        {!hasLocations && !isTransitioning && (
                            <div className="absolute bottom-3 right-4 z-10 pointer-events-none">
                                <p className="text-[10px] text-muted-foreground/40 italic">
                                    {data.isProjectMode
                                        ? "Este proyecto no tiene ubicación"
                                        : "Tus proyectos aparecerán aquí"
                                    }
                                </p>
                            </div>
                        )}
                    </>
                ) : (
                    <GradientBackground />
                )}
            </div>

            {/* Hide Google Maps attribution */}
            <style>{`
                .gm-style .gmnoprint,
                .gm-style .gm-style-cc,
                .gm-style a[href*="google"],
                .gm-style a[title*="Google"] { display: none !important; }
                .gm-style iframe + div { display: none !important; }
                .gm-style .gm-style-mtc { display: none !important; }
                .gm-style > div > div > a { display: none !important; }
            `}</style>

            {/* ── CONTENT OVERLAY ── */}
            <div
                className={cn(
                    "relative z-10 h-full flex items-end p-6 gap-6 pointer-events-none",
                    "transition-opacity duration-300 ease-in-out",
                    isTransitioning && "opacity-0"
                )}
            >
                <div className="flex items-center gap-4 min-w-0 pointer-events-auto">
                    {/* Avatar */}
                    <div
                        key={data.isProjectMode ? 'proj' : 'org'}
                        className={cn(
                            "h-16 w-16 border-2 border-white/20 shadow-lg shadow-black/20 shrink-0 overflow-hidden flex items-center justify-center",
                            "transition-all duration-500",
                            data.isProjectMode ? "rounded-xl" : "rounded-full"
                        )}
                    >
                        {data.avatarUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                                src={data.avatarUrl}
                                alt={data.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    // Hide broken image, fallback will show
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    const fallback = (e.target as HTMLImageElement).nextElementSibling;
                                    if (fallback) (fallback as HTMLElement).style.display = 'flex';
                                }}
                            />
                        ) : null}
                        <div
                            className={cn(
                                "w-full h-full items-center justify-center bg-white/15 text-white font-bold text-lg",
                                data.isProjectMode ? "rounded-xl" : "rounded-full",
                                data.avatarUrl ? "hidden" : "flex"
                            )}
                        >
                            {initials}
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                            <h2 className="text-xl font-bold text-white truncate leading-tight drop-shadow-md">
                                {data.name}
                            </h2>
                            {data.isProjectMode && activeProjectId && (
                                <button
                                    onClick={() => router.push(`/organization/projects/${activeProjectId}` as any)}
                                    className={cn(
                                        "shrink-0 w-7 h-7 rounded-full",
                                        "bg-white/10 hover:bg-white/25 backdrop-blur-sm",
                                        "border border-white/10 hover:border-white/25",
                                        "flex items-center justify-center",
                                        "text-white/0 group-hover/name:text-white/70 hover:!text-white",
                                        "transition-all duration-200 hover:scale-110",
                                        "opacity-0 group-hover/name:opacity-100",
                                        "cursor-pointer"
                                    )}
                                    title="Ver detalle del proyecto"
                                >
                                    <Pencil className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {/* Plan Badge — only in Org mode */}
                            {!data.isProjectMode && (
                                <PlanBadge
                                    planSlug={data.planSlug || data.planName}
                                    compact
                                />
                            )}
                            {/* Project Badges — Status, Type, Modality */}
                            {data.isProjectMode && data.projectStatus && (
                                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full backdrop-blur-sm border bg-white/10 border-white/15">
                                    <span className="text-[11px] font-semibold text-white/70">{data.projectStatus}</span>
                                </div>
                            )}
                            {data.isProjectMode && data.projectTypeName && (
                                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full backdrop-blur-sm border bg-white/10 border-white/15">
                                    <Building2 className="w-3 h-3 text-white/60" />
                                    <span className="text-[11px] font-semibold text-white/70">{data.projectTypeName}</span>
                                </div>
                            )}
                            {data.isProjectMode && data.projectModalityName && (
                                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full backdrop-blur-sm border bg-white/10 border-white/15">
                                    <Hammer className="w-3 h-3 text-white/60" />
                                    <span className="text-[11px] font-semibold text-white/70">{data.projectModalityName}</span>
                                </div>
                            )}
                        </div>
                        {/* Members */}
                        {data.members && data.members.length > 0 && (
                            <div className="mt-0.5">
                                <AvatarStack members={data.members} max={5} size={7} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── BACK BUTTON — bottom-right, only in project mode ── */}
            {data.isProjectMode && !isTransitioning && (
                <button
                    onClick={handleBackToOrg}
                    className={cn(
                        "absolute bottom-4 right-4 z-20",
                        "w-9 h-9 rounded-full",
                        "bg-black/40 hover:bg-black/60 backdrop-blur-md",
                        "border border-white/10 hover:border-white/20",
                        "flex items-center justify-center",
                        "text-white/70 hover:text-white",
                        "transition-all duration-200 hover:scale-110",
                        "shadow-lg shadow-black/20",
                        "cursor-pointer"
                    )}
                    title="Volver a la organización"
                >
                    <ArrowLeft className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}
