"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { GoogleMap, useLoadScript, OverlayView, InfoWindow } from "@react-google-maps/api";
import { useTheme } from "next-themes";
import { MAP_TYPE_ID, getMapContainerClass } from "@/lib/map-config";
import { Loader2, MapPin, Building2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PublicProject } from "@/actions/community";
import { useTranslations } from "next-intl";

const libraries: ("places")[] = ["places"];

// Map styling is centralized in @/lib/map-config

interface CommunityMapProps {
    projects: PublicProject[];
}

export function CommunityMap({ projects }: CommunityMapProps) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: apiKey,
        libraries: libraries,
    });

    if (loadError) {
        return (
            <div className="flex items-center justify-center h-full bg-destructive/10 text-destructive">
                Error loading maps. Please check your API key.
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return <MapWithMarkers projects={projects} />;
}

function MapWithMarkers({ projects }: CommunityMapProps) {
    const t = useTranslations("CommunityMap");
    const { resolvedTheme } = useTheme();
    const mapRef = useRef<google.maps.Map | null>(null);
    const [selectedProject, setSelectedProject] = useState<PublicProject | null>(null);

    const isDark = resolvedTheme === 'dark';
    const mapClass = getMapContainerClass(isDark);

    // Default center (will be overridden by fitBounds)
    const defaultCenter = useMemo(() => ({ lat: 0, lng: 0 }), []);

    // Fit map to show all markers
    const onMapLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map;

        if (projects.length === 0) return;

        const bounds = new google.maps.LatLngBounds();
        projects.forEach(project => {
            bounds.extend({ lat: project.lat, lng: project.lng });
        });

        map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });

        // Prevent zooming too close if only one marker
        const listener = google.maps.event.addListener(map, 'idle', () => {
            const zoom = map.getZoom();
            if (zoom && zoom > 15) {
                map.setZoom(15);
            }
            google.maps.event.removeListener(listener);
        });
    }, [projects]);

    // Get logo URL for marker (org_logo already contains full URL from DB)
    const getLogoUrl = (logoUrl: string | null) => {
        return logoUrl || "/logo.png";
    };

    return (
        <div className="relative w-full h-full">
            <div className={`w-full h-full ${mapClass}`}>
                <GoogleMap
                    zoom={2}
                    center={defaultCenter}
                    mapContainerClassName="w-full h-full"
                    onLoad={onMapLoad}
                    options={{
                        mapTypeId: MAP_TYPE_ID,
                        disableDefaultUI: true,
                        zoomControl: true,
                        clickableIcons: false,
                    }}
                    onClick={() => setSelectedProject(null)}
                >
                    {/* Project Markers */}
                    {projects.map((project) => (
                        <OverlayView
                            key={project.id}
                            position={{ lat: project.lat, lng: project.lng }}
                            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                        >
                            <div
                                className="absolute transform -translate-x-1/2 -translate-y-full cursor-pointer transition-transform hover:scale-110 active:scale-95 duration-200 ease-out drop-shadow-xl"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedProject(project);
                                }}
                            >
                                <div className="relative w-12 h-12 bg-primary rounded-full rounded-br-none rotate-45 flex items-center justify-center border-2 border-white shadow-sm">
                                    <div className="w-8 h-8 bg-white rounded-full overflow-hidden -rotate-45 border border-black/5">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={getLogoUrl(project.org_logo)}
                                            alt={project.org_name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </div>
                            </div>
                        </OverlayView>
                    ))}

                    {/* Info Window for selected project */}
                    {selectedProject && (
                        <InfoWindow
                            position={{ lat: selectedProject.lat, lng: selectedProject.lng }}
                            onCloseClick={() => setSelectedProject(null)}
                            options={{ pixelOffset: new google.maps.Size(0, -50) }}
                        >
                            <div className="p-2 min-w-[200px] max-w-[280px]">
                                {/* Project Image */}
                                {selectedProject.image_url && (
                                    <div className="w-full h-24 rounded-lg overflow-hidden mb-3">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={selectedProject.image_url}
                                            alt={selectedProject.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}

                                {/* Project Name */}
                                <h3 className="font-semibold text-sm text-gray-900 mb-1">
                                    {selectedProject.name}
                                </h3>

                                {/* Location */}
                                <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                                    <MapPin className="w-3 h-3" />
                                    <span>
                                        {[selectedProject.city, selectedProject.country]
                                            .filter(Boolean)
                                            .join(", ") || t("unknownLocation")}
                                    </span>
                                </div>

                                {/* Organization */}
                                <div className="flex items-center gap-1 text-xs text-gray-600 mb-3">
                                    <Building2 className="w-3 h-3" />
                                    <span>{selectedProject.org_name}</span>
                                </div>

                                {/* Project Type Badge */}
                                {selectedProject.project_type_name && (
                                    <Badge variant="secondary" className="mb-3 text-xs">
                                        {selectedProject.project_type_name}
                                    </Badge>
                                )}

                                {/* View More Button (Coming Soon) */}
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full text-xs"
                                    disabled
                                >
                                    <ExternalLink className="w-3 h-3 mr-1" />
                                    {t("viewMore")}
                                </Button>
                            </div>
                        </InfoWindow>
                    )}
                </GoogleMap>
            </div>

            {/* Legend/Stats overlay */}
            <div className="absolute bottom-6 left-6 z-10">
                <div className="bg-background/90 backdrop-blur-xl border border-white/20 rounded-lg px-4 py-2 shadow-lg">
                    <div className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded-full bg-primary" />
                        <span className="font-medium">{projects.length}</span>
                        <span className="text-muted-foreground">{t("projectsOnMap")}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

