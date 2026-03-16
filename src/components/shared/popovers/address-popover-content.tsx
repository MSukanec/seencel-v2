/**
 * AddressPopoverContent — Shared popover for address selection
 *
 * Used by: AddressChip (forms), inline editing columns, detail panels
 * Single source of truth for the address selector UI.
 *
 * Features:
 * - Google Places Autocomplete search
 * - Mini embedded GoogleMap with satellite dark mode
 * - Custom pin marker (same style as project-location-view)
 * - Returns full AddressData on selection
 */

"use client";

import * as React from "react";
import { GoogleMap, useLoadScript, OverlayView } from "@react-google-maps/api";
import usePlacesAutocomplete, { getGeocode, getLatLng } from "use-places-autocomplete";
import { MapPin, Search, Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import { MAP_TYPE_ID, getMapContainerClass } from "@/lib/map-config";
import { cn } from "@/lib/utils";

// ─── Libraries (stable ref to prevent re-renders) ────────
const LIBRARIES: ("places")[] = ["places"];

// ─── Default center (Buenos Aires) ───────────────────────
const DEFAULT_CENTER = { lat: -34.6037, lng: -58.3816 };
const DEFAULT_ZOOM = 12;
const SELECTED_ZOOM = 16;

// ─── Types ───────────────────────────────────────────────

export interface AddressData {
    address: string;
    city: string;
    state: string;
    country: string;
    zip_code: string;
    lat: number;
    lng: number;
    place_id: string;
}

export interface AddressPopoverContentProps {
    currentValue: AddressData | null;
    onSelect: (data: AddressData) => void;
}

// ─── Inner Content (needs Google Maps loaded) ────────────

function AddressPopoverInner({ currentValue, onSelect }: AddressPopoverContentProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const mapClass = getMapContainerClass(isDark);

    // Determine if we have real coordinates vs just city/country text
    const hasCoords = currentValue && currentValue.lat !== 0 && currentValue.lng !== 0;
    const hasTextOnly = currentValue && !hasCoords && (currentValue.city || currentValue.address);

    const initialCenter = hasCoords
        ? { lat: currentValue.lat, lng: currentValue.lng }
        : DEFAULT_CENTER;

    const [center, setCenter] = React.useState(initialCenter);
    const [marker, setMarker] = React.useState<{ lat: number; lng: number } | null>(
        hasCoords ? initialCenter : null
    );
    const [zoom, setZoom] = React.useState(hasCoords ? SELECTED_ZOOM : DEFAULT_ZOOM);
    const [showMarker, setShowMarker] = React.useState(!!hasCoords);

    const {
        ready,
        value,
        setValue,
        suggestions: { status, data },
        clearSuggestions,
    } = usePlacesAutocomplete({ debounce: 300 });

    // On mount: if we have city/country but no coords, geocode to center the map
    React.useEffect(() => {
        if (hasTextOnly && currentValue) {
            const query = [currentValue.address, currentValue.city, currentValue.country]
                .filter(Boolean)
                .join(", ");
            if (query) {
                getGeocode({ address: query })
                    .then((results) => getLatLng(results[0]))
                    .then(({ lat, lng }) => {
                        setCenter({ lat, lng });
                        setMarker({ lat, lng });
                        setShowMarker(true);
                        setZoom(SELECTED_ZOOM);
                    })
                    .catch(() => {
                        // Silently fail — map stays at default
                    });
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSelect = async (description: string) => {
        setValue(description, false);
        clearSuggestions();

        try {
            const results = await getGeocode({ address: description });
            const { lat, lng } = await getLatLng(results[0]);

            const components = results[0].address_components;
            let city = "", state = "", country = "", postal_code = "", route = "", street_number = "";

            components.forEach((c) => {
                if (c.types.includes("locality")) city = c.long_name;
                if (!city && c.types.includes("administrative_area_level_2")) city = c.long_name;
                if (c.types.includes("administrative_area_level_1")) state = c.long_name;
                if (c.types.includes("country")) country = c.long_name;
                if (c.types.includes("postal_code")) postal_code = c.long_name;
                if (c.types.includes("route")) route = c.long_name;
                if (c.types.includes("street_number")) street_number = c.long_name;
            });

            const fullAddress = route ? `${route} ${street_number}`.trim() : description;

            setCenter({ lat, lng });
            setMarker({ lat, lng });
            setShowMarker(true);
            setZoom(SELECTED_ZOOM);

            onSelect({
                address: fullAddress,
                city,
                state,
                country,
                zip_code: postal_code,
                lat,
                lng,
                place_id: results[0].place_id,
            });
        } catch (error) {
            console.error("AddressPopover geocode error:", error);
        }
    };

    return (
        <div className="flex flex-col">
            {/* Search Input */}
            <div className="p-3 pb-2">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        disabled={!ready}
                        placeholder="Buscar dirección..."
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-muted/50 border border-border/50 rounded-md outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors placeholder:text-muted-foreground/60"
                        autoFocus
                    />
                </div>

                {/* Suggestions List */}
                {status === "OK" && (
                    <ul className="mt-1.5 max-h-[120px] overflow-auto space-y-0.5">
                        {data.map(({ place_id, description }) => (
                            <li
                                key={place_id}
                                onClick={() => handleSelect(description)}
                                className="flex items-start gap-2 px-2 py-1.5 text-xs rounded-md hover:bg-muted cursor-pointer transition-colors"
                            >
                                <MapPin className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                                <span className="text-foreground leading-tight">{description}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Mini Map — hide Google logo and controls via CSS */}
            <div className={cn("h-[180px] w-full border-t border-border/30 seencel-map-clean", mapClass)}>
                <GoogleMap
                    zoom={zoom}
                    center={center}
                    mapContainerClassName="w-full h-full"
                    options={{
                        mapTypeId: MAP_TYPE_ID,
                        disableDefaultUI: true,
                        clickableIcons: false,
                        gestureHandling: "greedy",
                        keyboardShortcuts: false,
                    }}
                >
                    {showMarker && marker && (
                        <OverlayView
                            position={marker}
                            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                        >
                            <div className="absolute transform -translate-x-1/2 -translate-y-full drop-shadow-lg">
                                <div className="relative w-8 h-8 bg-primary rounded-full rounded-br-none rotate-45 flex items-center justify-center border-2 border-white shadow-sm">
                                    <MapPin className="text-white -rotate-45 h-4 w-4" />
                                </div>
                            </div>
                        </OverlayView>
                    )}
                </GoogleMap>
            </div>

            {/* Current value footer */}
            {currentValue && currentValue.city && (
                <div className="px-3 py-2 border-t border-border/30">
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">
                            {[currentValue.address, currentValue.city, currentValue.country].filter(Boolean).join(", ")}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Component (handles Google Maps loading) ─────────────

export function AddressPopoverContent(props: AddressPopoverContentProps) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: apiKey,
        libraries: LIBRARIES,
    });

    if (loadError) {
        return (
            <div className="p-4 text-xs text-destructive text-center">
                Error al cargar Google Maps
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className="flex items-center justify-center gap-2 p-8 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Cargando mapa...</span>
            </div>
        );
    }

    return <AddressPopoverInner {...props} />;
}
