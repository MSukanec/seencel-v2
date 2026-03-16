"use client";

// ============================================================================
// LOCATION MAP — Mini map preview for the location section
// ============================================================================
// Dynamically imported to avoid SSR issues with Google Maps API.
// Renders a compact rectangular map with a custom marker.
// ============================================================================

import { GoogleMap, useLoadScript, OverlayView } from "@react-google-maps/api";
import { MapPin, Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import { MAP_TYPE_ID, getMapContainerClass } from "@/lib/map-config";

const libraries: ("places")[] = ["places"];

interface LocationMapProps {
    center: { lat: number; lng: number };
    marker: { lat: number; lng: number };
    zoom: number;
    onMapClick: (lat: number, lng: number) => void;
}

export function LocationMap({ center, marker, zoom, onMapClick }: LocationMapProps) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const mapClass = getMapContainerClass(isDark);

    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: apiKey,
        libraries,
    });

    if (loadError) {
        return (
            <div className="w-full h-[280px] rounded-lg bg-destructive/10 border border-destructive/20 flex items-center justify-center text-sm text-destructive">
                Error al cargar el mapa. Verificá la API Key.
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className="w-full h-[280px] rounded-lg bg-muted/50 border border-border/50 flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className={`w-full h-[280px] rounded-lg overflow-hidden border border-border/50 [&_.gm-style-cc]:!hidden [&_a[target="_blank"]]:!hidden [&_.gmnoprint]:!hidden ${mapClass}`}>
            <GoogleMap
                zoom={zoom}
                center={center}
                mapContainerClassName="w-full h-full"
                options={{
                    mapTypeId: MAP_TYPE_ID,
                    disableDefaultUI: true,
                    zoomControl: false,
                    keyboardShortcuts: false,
                    clickableIcons: false,
                }}
                onClick={(e) => {
                    if (e.latLng) {
                        onMapClick(e.latLng.lat(), e.latLng.lng());
                    }
                }}
            >
                <OverlayView
                    position={marker}
                    mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                >
                    <div className="absolute transform -translate-x-1/2 -translate-y-full cursor-pointer transition-transform hover:scale-110 active:scale-95 duration-200 ease-out drop-shadow-2xl">
                        <div className="relative w-10 h-10 bg-primary rounded-full rounded-br-none rotate-45 flex items-center justify-center border-2 border-white shadow-sm">
                            <MapPin className="text-white -rotate-45 h-5 w-5" />
                        </div>
                    </div>
                </OverlayView>
            </GoogleMap>
        </div>
    );
}
