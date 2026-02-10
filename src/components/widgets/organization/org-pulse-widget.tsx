"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Crown, Building2, Users, Sparkles, Medal, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AvatarStack } from "@/components/ui/avatar-stack";
import type { WidgetProps } from "@/components/widgets/grid/types";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { GoogleMap, useLoadScript, OverlayView } from "@react-google-maps/api";
import { useTheme } from "next-themes";
import { useRouter } from "@/i18n/routing";

// ============================================================================
// ORG PULSE WIDGET — Hero Card with Map Background
// ============================================================================
// Shows: Logo + Name + Plan Badge + Quick Stats over a Google Map with
// project markers auto-fitted. Falls back to gradient if no coordinates.
// Size: wide (col-span-full, 4 columns)
// ============================================================================

const libraries: ("places")[] = ["places"];

// Ultra-dark map style — very dark tones, no need for overlay gradient
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

// Ultra-minimal light map style — neutral grey tones
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

interface OrgPulseData {
    name: string;
    logoPath: string | null;
    planName: string | null;
    planSlug: string | null;
    isFounder: boolean;
    memberCount: number;
    projectCount: number;
    recentActivityCount: number;
    projectLocations: ProjectLocation[];
    members: { name: string; image: string | null; email?: string }[];
}

// Plan badge config — colors match CSS variables in globals.css
function getPlanBadgeConfig(planSlug?: string | null) {
    switch (planSlug?.toLowerCase()) {
        case 'pro':
            return { icon: Crown, label: 'Profesional', bg: 'bg-indigo-500/20', border: 'border-indigo-500/30', text: 'text-indigo-300', iconColor: 'text-indigo-400' };
        case 'teams':
            return { icon: Users, label: 'Equipos', bg: 'bg-purple-500/20', border: 'border-purple-500/30', text: 'text-purple-300', iconColor: 'text-purple-400' };
        case 'free':
        default:
            return { icon: Sparkles, label: 'Gratis', bg: 'bg-lime-500/20', border: 'border-lime-500/30', text: 'text-lime-300', iconColor: 'text-lime-400' };
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



// Map background component
function PulseMapBackground({ locations, onNavigate }: { locations: ProjectLocation[]; onNavigate: (projectId: string) => void }) {
    const { resolvedTheme } = useTheme();
    const mapRef = useRef<google.maps.Map | null>(null);
    const [hoveredProject, setHoveredProject] = useState<string | null>(null);
    const currentMapStyle = resolvedTheme === "dark" ? darkMapStyle : lightMapStyle;
    const defaultCenter = useMemo(() => ({ lat: 0, lng: 0 }), []);

    const onMapLoad = useCallback(
        (map: google.maps.Map) => {
            mapRef.current = map;
            if (locations.length === 0) return;

            const bounds = new google.maps.LatLngBounds();
            locations.forEach((loc) => {
                bounds.extend({ lat: loc.lat, lng: loc.lng });
            });
            map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });

            // Prevent zooming too close for single marker
            const listener = google.maps.event.addListener(map, "idle", () => {
                const zoom = map.getZoom();
                if (zoom && zoom > 12) map.setZoom(12);
                google.maps.event.removeListener(listener);
            });
        },
        [locations]
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
                            onMouseEnter={() => setHoveredProject(loc.id)}
                            onMouseLeave={() => setHoveredProject(null)}
                            onClick={() => onNavigate(loc.id)}
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
                            {/* Avatar — subtle, theme-aware */}
                            <div className="w-7 h-7 rounded-full border border-border/60 shadow-sm overflow-hidden transition-all duration-200 hover:scale-125 hover:shadow-lg hover:border-border relative opacity-80 hover:opacity-100">
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

// Grid pattern fallback (when no map or no coordinates)
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

export function OrgPulseWidget({ initialData }: WidgetProps) {
    const [data, setData] = useState<OrgPulseData | null>(initialData ?? null);

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
    const hasLocations = data && data.projectLocations && data.projectLocations.length > 0;

    const { isLoaded } = useLoadScript({
        googleMapsApiKey: apiKey,
        libraries,
    });

    // Client-side fallback fetch
    useEffect(() => {
        if (data) return;

        async function fetchPulseData() {
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
                    logoPath: orgData?.logo_path || null,
                    planName: orgData?.plans?.name || null,
                    planSlug: orgData?.plans?.slug || null,
                    isFounder: (orgData?.settings as any)?.is_founder === true,
                    memberCount: membersResult.count || 0,
                    projectCount: projectCountResult.count || 0,
                    recentActivityCount: 0,
                    projectLocations,
                    members: membersForStack,
                });
            } catch (error) {
                console.error("Error fetching pulse data:", error);
            }
        }

        fetchPulseData();
    }, [data]);

    // Loading skeleton
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

    const logoUrl = buildLogoUrl(data.logoPath);
    const initials = data.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    const showMap = isLoaded && apiKey;
    const router = useRouter();
    const handleNavigateToProject = useCallback((projectId: string) => {
        router.push(`/project/${projectId}` as any);
    }, [router]);

    return (
        <div
            className={cn(
                "relative h-full w-full rounded-xl overflow-hidden",
                "border border-white/[0.08]",
            )}
        >
            {/* Background: Map (world view if no projects) or Grid fallback */}
            <div className="absolute inset-0">
                {showMap ? (
                    <>
                        <PulseMapBackground locations={data.projectLocations} onNavigate={handleNavigateToProject} />
                        {/* Subtle hint when no project locations */}
                        {!hasLocations && (
                            <div className="absolute bottom-3 right-4 z-10 pointer-events-none">
                                <p className="text-[10px] text-muted-foreground/40 italic">
                                    Tus proyectos aparecerán aquí
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

            {/* Content — aligned bottom-left, pointer-events-none to let map markers receive hover/click */}
            <div className="relative z-10 h-full flex items-end p-6 gap-6 pointer-events-none">
                {/* Logo + Name + Plan + Members */}
                <div className="flex items-center gap-4 min-w-0 pointer-events-auto">
                    <Avatar className="h-16 w-16 rounded-full border-2 border-white/20 shadow-lg shadow-black/20 shrink-0">
                        <AvatarImage src={logoUrl || undefined} alt={data.name} className="object-cover" />
                        <AvatarFallback className="rounded-full bg-white/15 text-white font-bold text-lg">
                            {initials}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex flex-col gap-1.5 min-w-0">
                        <h2 className="text-xl font-bold text-white truncate leading-tight drop-shadow-md">
                            {data.name}
                        </h2>
                        <div className="flex items-center gap-1.5">
                            {/* Plan Badge */}
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
                            {/* Founder Badge — platinum */}
                            {data.isFounder && (
                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-300/20 border border-slate-400/30 backdrop-blur-sm">
                                    <Medal className="w-3 h-3 text-slate-300" />
                                    <span className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider">
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
