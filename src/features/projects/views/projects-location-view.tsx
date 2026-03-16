"use client";

/**
 * ProjectsLocationView — Full-page interactive map with all project locations
 *
 * UX Flow:
 *   All projects → Click marker → zoom in + show detail card with inline editing
 *   Focused project → Click "back" or "fit all" → zoom out to all projects
 *
 * Labels always visible (name + year).
 * Focused card allows inline editing of status + address.
 */

import { useState, useCallback, useMemo, useRef, useTransition } from "react";
import {
    MapPin, Loader2, ArrowLeft, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { StatusChip } from "@/components/shared/chips";
import type { StatusOption } from "@/components/shared/chips";

import { GoogleMap, useLoadScript, OverlayView } from "@react-google-maps/api";
import { useTheme } from "next-themes";
import { MAP_TYPE_ID, getMapContainerClass } from "@/lib/map-config";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { FloatingToolbar } from "@/components/shared/toolbar-controls/floating-toolbar";
import { AddressPopoverContent, type AddressData } from "@/components/shared/popovers";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { updateProjectInline } from "@/features/projects/actions";

// ─── Types ───────────────────────────────────────────────

export interface ProjectLocation {
    id: string;
    name: string;
    status: string;
    lat: number;
    lng: number;
    city: string | null;
    country: string | null;
    state: string | null;
    address: string | null;
    zipCode: string | null;
    placeId: string | null;
    imageUrl: string | null;
    code: string | null;
    year: number | null;
}

interface ProjectsLocationViewProps {
    locations: ProjectLocation[];
    organizationId: string;
}

// ─── Status config ───────────────────────────────────────

const STATUS_OPTIONS: StatusOption[] = [
    { value: "planning", label: "Planificación", variant: "info" },
    { value: "active", label: "Activo", variant: "warning" },
    { value: "inactive", label: "Inactivo", variant: "neutral" },
    { value: "completed", label: "Completado", variant: "positive" },
];

// ─── Libraries (stable ref) ─────────────────────────────

const LIBRARIES: ("places")[] = ["places"];

// ─── Component ───────────────────────────────────────────

export function ProjectsLocationView({
    locations: initialLocations,
}: ProjectsLocationViewProps) {
    const router = useRouter();
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const mapClass = getMapContainerClass(isDark);
    const [isPending, startTransition] = useTransition();

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: apiKey,
        libraries: LIBRARIES,
    });

    const mapRef = useRef<google.maps.Map | null>(null);
    const [locations, setLocations] = useState(initialLocations);
    const [focusedProject, setFocusedProject] = useState<ProjectLocation | null>(null);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const defaultCenter = useMemo(() => ({ lat: -34.6037, lng: -58.3816 }), []);

    const onMapLoad = useCallback(
        (map: google.maps.Map) => {
            mapRef.current = map;
            if (locations.length === 0) return;

            const bounds = new google.maps.LatLngBounds();
            locations.forEach((loc) => bounds.extend({ lat: loc.lat, lng: loc.lng }));
            map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });

            const listener = google.maps.event.addListener(map, "idle", () => {
                const zoom = map.getZoom();
                if (zoom && zoom > 16) map.setZoom(16);
                google.maps.event.removeListener(listener);
            });
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    // ─── Zoom in to project ──────────────────────────────
    const handleMarkerClick = useCallback(
        (loc: ProjectLocation) => {
            const map = mapRef.current;
            if (!map || isTransitioning || focusedProject?.id === loc.id) return;

            setIsTransitioning(true);

            map.panTo({ lat: loc.lat, lng: loc.lng });

            const currentZoom = map.getZoom() || 4;
            const targetZoom = 16;
            const steps = 3;
            const delay = 180;
            let step = 0;

            const zoomInterval = setInterval(() => {
                step++;
                const progress = step / steps;
                const newZoom = currentZoom + (targetZoom - currentZoom) * progress;
                map.setZoom(Math.round(newZoom));

                if (step >= steps) {
                    clearInterval(zoomInterval);
                    setTimeout(() => {
                        setFocusedProject(loc);
                        setIsTransitioning(false);
                    }, 200);
                }
            }, delay);
        },
        [isTransitioning, focusedProject]
    );

    // ─── Zoom out to all projects (animated) ────────────-
    const handleBackToAll = useCallback(() => {
        const map = mapRef.current;
        if (!map || isTransitioning) return;

        setIsTransitioning(true);
        setFocusedProject(null);

        // Calculate target bounds
        if (locations.length > 0) {
            const bounds = new google.maps.LatLngBounds();
            locations.forEach((loc) => bounds.extend({ lat: loc.lat, lng: loc.lng }));

            // Animate zoom-out in steps (mirror of zoom-in)
            const currentZoom = map.getZoom() || 16;
            // Estimate what fitBounds would give us
            const targetZoom = locations.length === 1 ? 14 : Math.min(currentZoom - 6, 10);
            const steps = 4;
            const delay = 150;
            let step = 0;

            // Pan to center of all projects
            const center = bounds.getCenter();
            map.panTo(center);

            const zoomInterval = setInterval(() => {
                step++;
                const progress = step / steps;
                // Ease-out curve: fast start, slow end
                const eased = 1 - Math.pow(1 - progress, 2);
                const newZoom = currentZoom + (targetZoom - currentZoom) * eased;
                map.setZoom(Math.round(newZoom));

                if (step >= steps) {
                    clearInterval(zoomInterval);
                    // Final fitBounds for perfect framing
                    setTimeout(() => {
                        map.fitBounds(bounds, { top: 60, right: 60, bottom: 80, left: 60 });
                        setIsTransitioning(false);
                    }, 100);
                }
            }, delay);
        } else {
            setIsTransitioning(false);
        }
    }, [isTransitioning, locations]);

    // ─── Toolbar handlers ────────────────────────────────
    const handleZoomIn = useCallback(() => {
        const map = mapRef.current;
        if (map) map.setZoom((map.getZoom() || 4) + 1);
    }, []);

    const handleZoomOut = useCallback(() => {
        const map = mapRef.current;
        if (map) map.setZoom((map.getZoom() || 4) - 1);
    }, []);

    const handleFitToScreen = useCallback(() => {
        if (focusedProject) {
            handleBackToAll();
        } else {
            const map = mapRef.current;
            if (!map || locations.length === 0) return;
            const bounds = new google.maps.LatLngBounds();
            locations.forEach((loc) => bounds.extend({ lat: loc.lat, lng: loc.lng }));
            map.fitBounds(bounds, { top: 60, right: 60, bottom: 80, left: 60 });
        }
    }, [focusedProject, handleBackToAll, locations]);

    const handleGoToProject = useCallback(() => {
        if (focusedProject) {
            router.push(`/organization/projects/${focusedProject.id}` as any);
        }
    }, [focusedProject, router]);

    // ─── Inline update handlers ──────────────────────────
    const handleStatusChange = useCallback((newStatus: string) => {
        if (!focusedProject) return;

        // Optimistic update
        const updated = { ...focusedProject, status: newStatus };
        setFocusedProject(updated);
        setLocations(prev => prev.map(l => l.id === updated.id ? updated : l));

        startTransition(async () => {
            const result = await updateProjectInline(focusedProject.id, { status: newStatus });
            if (!result.success) {
                toast.error("Error al actualizar estado", { description: result.error });
                // Rollback
                setFocusedProject(focusedProject);
                setLocations(prev => prev.map(l => l.id === focusedProject.id ? focusedProject : l));
            } else {
                toast.success("Estado actualizado");
            }
        });
    }, [focusedProject]);

    const handleAddressChange = useCallback((addressData: AddressData) => {
        if (!focusedProject) return;
        const map = mapRef.current;

        // Optimistic update
        const updated: ProjectLocation = {
            ...focusedProject,
            address: addressData.address,
            city: addressData.city,
            state: addressData.state,
            country: addressData.country,
            zipCode: addressData.zip_code,
            placeId: addressData.place_id,
            lat: addressData.lat,
            lng: addressData.lng,
        };
        setFocusedProject(updated);
        setLocations(prev => prev.map(l => l.id === updated.id ? updated : l));

        // Pan map to new location
        if (map) {
            map.panTo({ lat: addressData.lat, lng: addressData.lng });
        }

        startTransition(async () => {
            const result = await updateProjectInline(focusedProject.id, {
                address: addressData.address,
                city: addressData.city,
                state: addressData.state,
                country: addressData.country,
                zip_code: addressData.zip_code,
                place_id: addressData.place_id,
                lat: addressData.lat,
                lng: addressData.lng,
            });
            if (!result.success) {
                toast.error("Error al actualizar dirección", { description: result.error });
                setFocusedProject(focusedProject);
                setLocations(prev => prev.map(l => l.id === focusedProject.id ? focusedProject : l));
            } else {
                toast.success("Dirección actualizada");
            }
        });
    }, [focusedProject]);

    // ─── Empty state ─────────────────────────────────────
    if (locations.length === 0) {
        return (
            <ViewEmptyState
                mode="empty"
                icon={MapPin}
                viewName="Ubicaciones"
                featureDescription="Tus proyectos aparecerán en el mapa cuando tengan una ubicación asignada. Podés agregar la ubicación desde el detalle de cada proyecto."
            />
        );
    }

    // ─── Loading ─────────────────────────────────────────
    if (loadError) {
        return (
            <div className="flex-1 flex items-center justify-center text-sm text-destructive">
                Error al cargar Google Maps
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className="flex-1 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando mapa...
            </div>
        );
    }

    // ─── Derived ─────────────────────────────────────────
    const focusedInitials = focusedProject?.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

    const focusedAddressData: AddressData | null = focusedProject ? {
        address: focusedProject.address || "",
        city: focusedProject.city || "",
        state: focusedProject.state || "",
        country: focusedProject.country || "",
        zip_code: focusedProject.zipCode || "",
        lat: focusedProject.lat,
        lng: focusedProject.lng,
        place_id: focusedProject.placeId || "",
    } : null;

    // ─── Map ─────────────────────────────────────────────
    return (
        <div className={cn("relative w-full h-full overflow-hidden", mapClass)}>
            <GoogleMap
                zoom={4}
                center={defaultCenter}
                mapContainerClassName="w-full h-full"
                onLoad={onMapLoad}
                options={{
                    mapTypeId: MAP_TYPE_ID,
                    disableDefaultUI: true,
                    zoomControl: false,
                    scrollwheel: true,
                    draggable: true,
                    disableDoubleClickZoom: false,
                    gestureHandling: "greedy",
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

                    const isFocused = focusedProject?.id === loc.id;
                    const displayLabel = loc.year ? `${loc.name} (${loc.year})` : loc.name;

                    return (
                        <OverlayView
                            key={loc.id}
                            position={{ lat: loc.lat, lng: loc.lng }}
                            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                        >
                            <div
                                className="relative flex flex-col items-center cursor-pointer"
                                style={{ transform: "translate(-50%, -50%)" }}
                                onClick={() => handleMarkerClick(loc)}
                            >
                                {/* Always-visible label */}
                                <div className={cn(
                                    "whitespace-nowrap mb-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition-all duration-300 select-none",
                                    isFocused
                                        ? "bg-primary text-primary-foreground shadow-lg"
                                        : "bg-black/60 backdrop-blur-sm text-white/90",
                                    focusedProject && !isFocused && "opacity-40",
                                )}>
                                    {displayLabel}
                                </div>

                                {/* Marker avatar */}
                                <div
                                    className={cn(
                                        "rounded-full border-2 shadow-md overflow-hidden transition-all duration-300",
                                        isFocused
                                            ? "w-[52px] h-[52px] border-primary shadow-lg shadow-primary/20 ring-4 ring-primary/20"
                                            : "w-[38px] h-[38px] border-white/50 hover:scale-110 hover:shadow-lg hover:border-white opacity-85 hover:opacity-100",
                                        focusedProject && !isFocused && "opacity-40 scale-75",
                                    )}
                                >
                                    {loc.imageUrl ? (
                                        /* eslint-disable-next-line @next/next/no-img-element */
                                        <img src={loc.imageUrl} alt={loc.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-muted flex items-center justify-center">
                                            <span className={cn(
                                                "font-bold text-muted-foreground",
                                                isFocused ? "text-sm" : "text-[11px]"
                                            )}>{initials}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </OverlayView>
                    );
                })}
            </GoogleMap>

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

            {/* ── TOP LEFT: Focused project card ── */}
            {focusedProject && (
                <div className="absolute top-4 left-4 z-10">
                    <div className={cn(
                        "bg-popover/95 backdrop-blur-md border border-border/50 rounded-xl shadow-2xl",
                        "p-4 min-w-[300px] max-w-[360px]",
                        "animate-in slide-in-from-top-2 fade-in duration-300",
                    )}>
                        <div className="flex items-start gap-3">
                            {/* Avatar */}
                            <div className="h-11 w-11 rounded-lg border border-border/50 overflow-hidden shrink-0">
                                {focusedProject.imageUrl ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img src={focusedProject.imageUrl} alt={focusedProject.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-muted flex items-center justify-center">
                                        <span className="text-xs font-bold text-muted-foreground">{focusedInitials}</span>
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-semibold text-foreground truncate">
                                    {focusedProject.name}
                                </h3>
                                {focusedProject.code && (
                                    <p className="text-[11px] font-mono text-muted-foreground mt-0.5">{focusedProject.code}</p>
                                )}

                                {/* Inline status selector */}
                                <div className="mt-1.5">
                                    <StatusChip
                                        value={focusedProject.status}
                                        onChange={handleStatusChange}
                                        options={STATUS_OPTIONS}
                                    />
                                </div>

                                {/* Inline address selector */}
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button className="flex items-center gap-1 mt-1.5 cursor-pointer hover:opacity-80 transition-opacity group max-w-full">
                                            <MapPin className="w-3 h-3 text-muted-foreground shrink-0 group-hover:text-foreground transition-colors" />
                                            <p className="text-[11px] text-muted-foreground group-hover:text-foreground transition-colors truncate">
                                                {focusedProject.address || [focusedProject.city, focusedProject.country].filter(Boolean).join(", ") || "Agregar dirección"}
                                            </p>
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent side="bottom" align="start" className="w-[380px] p-0">
                                        <AddressPopoverContent
                                            currentValue={focusedAddressData}
                                            onSelect={handleAddressChange}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        {/* Street View preview */}
                        <StreetViewThumbnail lat={focusedProject.lat} lng={focusedProject.lng} apiKey={apiKey} />

                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/30">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                                onClick={handleBackToAll}
                            >
                                <ArrowLeft className="h-3 w-3 mr-1" />
                                Volver
                            </Button>
                            <Button
                                variant="default"
                                size="sm"
                                className="h-7 px-3 text-xs ml-auto cursor-pointer"
                                onClick={handleGoToProject}
                                disabled={isPending}
                            >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Ver Proyecto
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating toolbar */}
            <FloatingToolbar
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onFitToScreen={handleFitToScreen}
            />
        </div>
    );
}

// ─── Street View Thumbnail ──────────────────────────────

function StreetViewThumbnail({ lat, lng, apiKey }: { lat: number; lng: number; apiKey: string }) {
    const [loaded, setLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    const url = `https://maps.googleapis.com/maps/api/streetview?size=600x200&location=${lat},${lng}&fov=100&pitch=5&key=${apiKey}`;

    if (hasError) return null;

    return (
        <div className="mt-3 rounded-lg overflow-hidden border border-border/30 relative">
            {!loaded && (
                <div className="w-full h-[80px] bg-muted/50 animate-pulse" />
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={url}
                alt="Street View"
                className={cn(
                    "w-full h-[80px] object-cover transition-opacity duration-300",
                    loaded ? "opacity-100" : "opacity-0 absolute inset-0",
                )}
                onLoad={(e) => {
                    // Google returns a grey "no imagery" tile if no street view
                    const img = e.currentTarget;
                    if (img.naturalWidth < 50) {
                        setHasError(true);
                    } else {
                        setLoaded(true);
                    }
                }}
                onError={() => setHasError(true)}
            />
            {loaded && (
                <div className="absolute bottom-1 right-1.5 px-1.5 py-0.5 rounded bg-black/50 backdrop-blur-sm">
                    <span className="text-[9px] text-white/80 font-medium">Street View</span>
                </div>
            )}
        </div>
    );
}
