"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Crown, Users, Sparkles, Medal, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AvatarStack } from "@/components/ui/avatar-stack";
import type { WidgetProps } from "@/components/widgets/grid/types";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { GoogleMap, useLoadScript, OverlayView } from "@react-google-maps/api";
import { useTheme } from "next-themes";
import { useActiveProjectId, useLayoutActions } from "@/stores/layout-store";

// ============================================================================
// OVERVIEW HERO WIDGET — Context-Aware with Smooth Map Transitions
// ============================================================================
// Reads activeProjectId from layout-store:
//   - null → Org mode: shows org logo, name, plan, all project markers
//   - string → Project mode: shows project cover, name, zoomed to project
//
// UX: Clicking a project marker in org mode → smooth map zoom → context switch
//      No skeleton flash, no widget remount — pure CSS + Maps API transitions
// ============================================================================

const libraries: ("places")[] = ["places"];

// Ultra-dark map style
const darkMapStyle = [
    { elementType: "geometry", stylers: [{ color: "#1a1a1c" }] },
    { elementType: "labels", stylers: [{ visibility: "off" }] },
    { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#2a2a2c" }] },
    { featureType: "administrative.country", elementType: "geometry.stroke", stylers: [{ color: "#3a3a3c" }] },
    { featureType: "poi", stylers: [{ visibility: "off" }] },
    { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#2c2c2e" }] },
    { featureType: "road", elementType: "geometry.stroke", stylers: [{ visibility: "off" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#333335" }] },
    { featureType: "transit", stylers: [{ visibility: "off" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#111113" }] },
    { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#1e1e20" }] },
];

// Ultra-minimal light map style
const lightMapStyle = [
    { elementType: "geometry", stylers: [{ color: "#f2f2f2" }] },
    { elementType: "labels", stylers: [{ visibility: "off" }] },
    { featureType: "administrative", elementType: "geometry", stylers: [{ visibility: "off" }] },
    { featureType: "poi", stylers: [{ visibility: "off" }] },
    { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#e5e5e5" }] },
    { featureType: "road", elementType: "geometry.stroke", stylers: [{ visibility: "off" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#dadada" }] },
    { featureType: "transit", stylers: [{ visibility: "off" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#d0d0d0" }] },
];

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
}

// Plan badge config
function getPlanBadgeConfig(planSlug?: string | null) {
    switch (planSlug?.toLowerCase()) {
        case 'pro':
            return { icon: Crown, label: 'Profesional', bg: 'bg-stone-500/20', border: 'border-stone-500/30', text: 'text-stone-300', iconColor: 'text-stone-400' };
        case 'teams':
            return { icon: Users, label: 'Equipos', bg: 'bg-slate-500/20', border: 'border-slate-500/30', text: 'text-slate-300', iconColor: 'text-slate-400' };
        case 'free':
        default:
            return { icon: Sparkles, label: 'Esencial', bg: 'bg-zinc-400/20', border: 'border-zinc-400/30', text: 'text-zinc-300', iconColor: 'text-zinc-400' };
    }
}

function buildLogoUrl(logoPath: string | null): string | null {
    if (!logoPath) return null;
    if (logoPath.startsWith("http")) return logoPath;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const path = logoPath.startsWith("organizations/")
        ? logoPath
        : `organizations/${logoPath}`;
    return `${supabaseUrl}/storage/v1/object/public/public-assets/${path}`;
}


// ── MAP BACKGROUND ──────────────────────────────────────────────────────────
// Receives a shared mapRef so the parent can animate pan/zoom
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
    const currentMapStyle = resolvedTheme === "dark" ? darkMapStyle : lightMapStyle;
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
            map.fitBounds(bounds, { top: 10, right: 10, bottom: 80, left: 10 });

            // Prevent zooming too close for single marker
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
        <GoogleMap
            zoom={3}
            center={defaultCenter}
            mapContainerClassName="w-full h-full"
            onLoad={onMapLoad}
            options={{
                disableDefaultUI: true,
                zoomControl: false,
                scrollwheel: false,
                draggable: false,
                disableDoubleClickZoom: true,
                gestureHandling: "none",
                keyboardShortcuts: false,
                styles: currentMapStyle,
                clickableIcons: false,
                backgroundColor: "transparent",
            }}
        >
            {/* Project markers — circular avatars */}
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
                            {/* Tooltip */}
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
                            {/* Avatar marker */}
                            <div className="w-[34px] h-[34px] rounded-full border border-border/60 shadow-sm overflow-hidden transition-all duration-200 hover:scale-125 hover:shadow-lg hover:border-border relative opacity-80 hover:opacity-100">
                                {loc.imageUrl ? (
                                    <img
                                        src={loc.imageUrl}
                                        alt={loc.name}
                                        className="w-full h-full object-cover"
                                    />
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
    const [data, setData] = useState<HeroData | null>(initialData ?? null);
    const [prevProjectId, setPrevProjectId] = useState<string | null>(activeProjectId);
    const [hoveredProject, setHoveredProject] = useState<string | null>(null);
    // Transitioning = map is animating zoom, overlay is fading
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [pendingProjectSwitch, setPendingProjectSwitch] = useState<ProjectLocation | null>(null);

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
    const mapRef = useRef<google.maps.Map | null>(null);

    const { isLoaded } = useLoadScript({
        googleMapsApiKey: apiKey,
        libraries,
    });

    // ── SMOOTH ZOOM TRANSITION ──
    // When a marker is clicked in org mode: zoom in → switch context
    const handleMarkerClick = useCallback((loc: ProjectLocation) => {
        const map = mapRef.current;
        if (!map || isTransitioning) return;

        // Already in project mode? Clicking the marker does nothing special
        if (activeProjectId) return;

        // Start transition: fade overlay, zoom map
        setIsTransitioning(true);
        setPendingProjectSwitch(loc);

        // Smooth pan + zoom to project location
        map.panTo({ lat: loc.lat, lng: loc.lng });

        // Zoom in gradually for a cinematic effect
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
                // After zoom completes, switch context
                setTimeout(() => {
                    setActiveProjectId(loc.id);
                    setIsTransitioning(false);
                    setPendingProjectSwitch(null);
                }, 400);
            }
        }, delay);
    }, [activeProjectId, isTransitioning, setActiveProjectId]);

    const handleMapReady = useCallback(() => {
        // Map is loaded and fitted
    }, []);

    // ── CONTEXT CHANGE HANDLER ──
    // When activeProjectId changes externally (from header selector):
    // Fetch new data but DON'T show skeleton if we have existing data
    useEffect(() => {
        if (activeProjectId !== prevProjectId) {
            setPrevProjectId(activeProjectId);

            // If we already have data, update in-place (no skeleton)
            // The map will animate via panTo in the next render
            if (data) {
                // Find the project in our existing locations (from org data)
                if (activeProjectId && data.projectLocations) {
                    const targetLoc = data.projectLocations.find(l => l.id === activeProjectId);
                    if (targetLoc) {
                        // Animate map to project
                        const map = mapRef.current;
                        if (map) {
                            map.panTo({ lat: targetLoc.lat, lng: targetLoc.lng });
                            map.setZoom(14);
                        }
                    }
                } else if (!activeProjectId && mapRef.current && data.projectLocations?.length > 0) {
                    // Switching back to org — zoom out to show all
                    const bounds = new google.maps.LatLngBounds();
                    data.projectLocations.forEach(loc => {
                        bounds.extend({ lat: loc.lat, lng: loc.lng });
                    });
                    mapRef.current.fitBounds(bounds, { top: 10, right: 10, bottom: 80, left: 10 });
                }

                // Trigger data re-fetch in background (won't show skeleton)
                setData(null);
            } else {
                setData(null);
            }
        }
    }, [activeProjectId, prevProjectId, data]);

    // ── DATA FETCH ──
    useEffect(() => {
        if (data) return;

        async function fetchHeroData() {
            try {
                const supabase = createClient();

                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data: userData } = await supabase
                    .from("users")
                    .select("user_preferences!inner(last_organization_id)")
                    .eq("auth_id", user.id)
                    .single();

                const pref = Array.isArray(userData?.user_preferences)
                    ? (userData.user_preferences as any)[0]
                    : (userData?.user_preferences as any);
                const orgId = pref?.last_organization_id;
                if (!orgId) return;

                // ── PROJECT MODE ──
                if (activeProjectId) {
                    const [projectResult, locationResult, membersAvatarResult] = await Promise.all([
                        supabase
                            .from("projects")
                            .select("id, name, image_url, status")
                            .eq("id", activeProjectId)
                            .single(),
                        supabase
                            .from("project_data")
                            .select("lat, lng, city, country, address")
                            .eq("project_id", activeProjectId)
                            .single(),
                        supabase
                            .from("organization_members")
                            .select("users(full_name, avatar_url, email)")
                            .eq("organization_id", orgId)
                            .eq("is_active", true)
                            .limit(8),
                    ]);

                    const project = projectResult.data as any;
                    const locData = locationResult.data as any;

                    const projectLocations: ProjectLocation[] = [];
                    if (locData && locData.lat && locData.lng) {
                        projectLocations.push({
                            id: project?.id || activeProjectId,
                            name: project?.name || "Proyecto",
                            status: project?.status || "active",
                            lat: Number(locData.lat),
                            lng: Number(locData.lng),
                            city: locData.city,
                            country: locData.country,
                            address: locData.address || null,
                            imageUrl: project?.image_url || null,
                        });
                    }

                    const membersForStack = (membersAvatarResult?.data || [])
                        .filter((m: any) => m.users)
                        .map((m: any) => ({
                            name: m.users.full_name || "Member",
                            image: m.users.avatar_url || null,
                            email: m.users.email || undefined,
                        }));

                    setData({
                        name: project?.name || "Proyecto",
                        avatarUrl: project?.image_url || null,
                        planName: null,
                        planSlug: null,
                        isFounder: false,
                        memberCount: 0,
                        projectCount: 0,
                        projectLocations,
                        members: membersForStack,
                        isProjectMode: true,
                    });
                    return;
                }

                // ── ORGANIZATION MODE ──
                const [orgResult, membersResult, projectCountResult, locationsResult, membersAvatarResult] = await Promise.all([
                    supabase
                        .from("organizations")
                        .select("name, logo_path, settings, plans(name, slug)")
                        .eq("id", orgId)
                        .single(),
                    supabase
                        .from("organization_members")
                        .select("id", { count: "exact", head: true })
                        .eq("organization_id", orgId)
                        .eq("is_active", true),
                    supabase
                        .from("projects")
                        .select("id", { count: "exact", head: true })
                        .eq("organization_id", orgId)
                        .eq("is_deleted", false),
                    supabase
                        .from("project_data")
                        .select("lat, lng, city, country, address, projects!inner(id, name, status, is_deleted, image_url)")
                        .eq("organization_id", orgId)
                        .not("lat", "is", null)
                        .not("lng", "is", null),
                    supabase
                        .from("organization_members")
                        .select("users(full_name, avatar_url, email)")
                        .eq("organization_id", orgId)
                        .eq("is_active", true)
                        .limit(8),
                ]);

                const orgData = orgResult.data as any;
                const projectLocations = (locationsResult.data || [])
                    .filter((pd: any) => pd.projects && !pd.projects.is_deleted)
                    .map((pd: any) => {
                        const p = pd.projects;
                        return {
                            id: p.id,
                            name: p.name,
                            status: p.status,
                            lat: Number(pd.lat),
                            lng: Number(pd.lng),
                            city: pd.city,
                            country: pd.country,
                            address: pd.address || null,
                            imageUrl: p.image_url || null,
                        };
                    });

                const membersForStack = (membersAvatarResult?.data || [])
                    .filter((m: any) => m.users)
                    .map((m: any) => ({
                        name: m.users.full_name || "Member",
                        image: m.users.avatar_url || null,
                        email: m.users.email || undefined,
                    }));

                setData({
                    name: orgData?.name || "Organización",
                    avatarUrl: buildLogoUrl(orgData?.logo_path || null),
                    planName: orgData?.plans?.name || null,
                    planSlug: orgData?.plans?.slug || null,
                    isFounder: (orgData?.settings as any)?.is_founder === true,
                    memberCount: membersResult.count || 0,
                    projectCount: projectCountResult.count || 0,
                    projectLocations,
                    members: membersForStack,
                    isProjectMode: false,
                });
            } catch (error) {
                console.error("Error fetching hero data:", error);
            }
        }

        fetchHeroData();
    }, [data, activeProjectId]);

    // ── LOADING SKELETON ──
    // All hooks are above, safe to early return
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

    // During transition, show the pending project info instead of org info
    const displayName = pendingProjectSwitch ? pendingProjectSwitch.name : data.name;
    const displayAvatar = pendingProjectSwitch ? pendingProjectSwitch.imageUrl : data.avatarUrl;
    const isProjectView = data.isProjectMode || !!pendingProjectSwitch;

    const initials = displayName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    const showMap = isLoaded && apiKey;

    return (
        <div
            className={cn(
                "relative h-full w-full rounded-xl overflow-hidden",
                "border border-white/[0.08]",
            )}
        >
            {/* Background: Map or Grid fallback */}
            <div className="absolute inset-0">
                {showMap ? (
                    <>
                        <HeroMapBackground
                            locations={data.projectLocations}
                            mapRef={mapRef}
                            onMapReady={handleMapReady}
                            hoveredProject={hoveredProject}
                            onHover={setHoveredProject}
                            onLeave={() => setHoveredProject(null)}
                            onMarkerClick={handleMarkerClick}
                        />
                        {!hasLocations && (
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

            {/* Hide Google Maps attribution text */}
            <style>{`
                .gm-style .gmnoprint,
                .gm-style .gm-style-cc,
                .gm-style a[href*="google"],
                .gm-style a[title*="Google"] { display: none !important; }
                .gm-style iframe + div { display: none !important; }
                .gm-style .gm-style-mtc { display: none !important; }
                .gm-style > div > div > a { display: none !important; }
            `}</style>

            {/* Content overlay — with transition animations */}
            <div
                className={cn(
                    "relative z-10 h-full flex items-end p-6 gap-6 pointer-events-none",
                    "transition-opacity duration-500",
                    isTransitioning && "opacity-0"
                )}
            >
                <div className="flex items-center gap-4 min-w-0 pointer-events-auto">
                    {/* Avatar — round for org, square for project */}
                    <Avatar className={cn(
                        "h-16 w-16 border-2 border-white/20 shadow-lg shadow-black/20 shrink-0",
                        "transition-all duration-500",
                        isProjectView ? "rounded-xl" : "rounded-full"
                    )}>
                        <AvatarImage src={displayAvatar || undefined} alt={displayName} className="object-cover" />
                        <AvatarFallback className={cn(
                            "bg-white/15 text-white font-bold text-lg",
                            isProjectView ? "rounded-xl" : "rounded-full"
                        )}>
                            {initials}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex flex-col gap-1.5 min-w-0">
                        <h2 className="text-xl font-bold text-white truncate leading-tight drop-shadow-md">
                            {displayName}
                        </h2>
                        <div className="flex items-center gap-1.5">
                            {/* Plan Badge — only in Org mode, fade out during transition */}
                            {!isProjectView && (
                                <div className="transition-opacity duration-300">
                                    {(() => {
                                        const plan = getPlanBadgeConfig(data.planSlug || data.planName);
                                        const PlanIcon = plan.icon;
                                        return (
                                            <div className={cn(
                                                "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full backdrop-blur-sm border",
                                                plan.bg, plan.border
                                            )}>
                                                <PlanIcon className={cn("w-3 h-3", plan.iconColor)} />
                                                <span className={cn("text-[11px] font-semibold uppercase tracking-wider", plan.text)}>
                                                    {plan.label}
                                                </span>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}
                            {/* Founder Badge — only in Org mode */}
                            {!isProjectView && data.isFounder && (
                                <div
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full backdrop-blur-sm border transition-opacity duration-300"
                                    style={{
                                        backgroundColor: 'color-mix(in srgb, var(--plan-founder) 20%, transparent)',
                                        borderColor: 'color-mix(in srgb, var(--plan-founder) 30%, transparent)',
                                    }}
                                >
                                    <Medal className="w-3 h-3" style={{ color: 'var(--plan-founder)' }} />
                                    <span
                                        className="text-[11px] font-semibold uppercase tracking-wider"
                                        style={{ color: 'var(--plan-founder)' }}
                                    >
                                        Fundadora
                                    </span>
                                </div>
                            )}
                        </div>
                        {/* Member Avatars */}
                        {data.members && data.members.length > 0 && (
                            <div className="mt-0.5">
                                <AvatarStack members={data.members} max={5} size={7} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
