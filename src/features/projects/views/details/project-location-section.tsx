"use client";

// ============================================================================
// PROJECT LOCATION SECTION
// ============================================================================
// Sección de ubicación embebida dentro del perfil del proyecto.
// Muestra campos de dirección + mini mapa rectangular.
// Reemplaza la tab dedicada de ubicación.
// ============================================================================

import { useState, useTransition, useCallback } from "react";
import dynamic from "next/dynamic";
import { TextField } from "@/components/shared/forms/fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, MapPin, Search } from "lucide-react";
import { useAutoSave } from "@/hooks/use-auto-save";
import { updateProject } from "@/features/projects/actions";

import type { ComponentType } from "react";

// Props interface for the map component
interface LocationMapProps {
    center: { lat: number; lng: number };
    marker: { lat: number; lng: number };
    zoom: number;
    onMapClick: (lat: number, lng: number) => void;
}

// Lazy load the map to avoid SSR issues and reduce bundle
const LocationMap: ComponentType<LocationMapProps> = dynamic(
    () => import("@/components/shared/maps/location-map").then(m => ({ default: m.LocationMap })),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-[280px] rounded-lg bg-muted/50 border border-border/50 flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
        ),
    }
) as ComponentType<LocationMapProps>;

interface ProjectLocationSectionProps {
    project: any;
}

export function ProjectLocationSection({ project }: ProjectLocationSectionProps) {
    const projectData = project.project_data || {};

    // ── Form State ──
    const [formValues, setFormValues] = useState({
        address: projectData.address || "",
        city: projectData.city || "",
        state: projectData.state || "",
        country: projectData.country || "",
        zip_code: projectData.zip_code || "",
        lat: String(projectData.lat || ""),
        lng: String(projectData.lng || ""),
        place_id: projectData.place_id || ""
    });

    // ── Auto-save ──
    const { triggerAutoSave } = useAutoSave<typeof formValues>({
        saveFn: async (fields) => {
            const formData = new FormData();
            Object.entries(fields).forEach(([key, val]) => {
                formData.append(key, val);
            });
            formData.append("id", project.id);
            const result = await updateProject(formData);
            if (result?.error) throw new Error(result.error);
        }
    });

    // ── Map State ──
    const [center, setCenter] = useState({
        lat: projectData.lat ? Number(projectData.lat) : -34.6037,
        lng: projectData.lng ? Number(projectData.lng) : -58.3816,
    });
    const [marker, setMarker] = useState(center);
    const [zoom, setZoom] = useState(projectData.lat ? 17 : 12);

    // ── Google Places autocomplete state (managed by child map component) ──
    const handlePlaceSelect = useCallback((place: {
        address: string;
        city: string;
        state: string;
        country: string;
        zip_code: string;
        lat: number;
        lng: number;
        place_id: string;
    }) => {
        const newValues = {
            address: place.address,
            city: place.city,
            state: place.state,
            country: place.country,
            zip_code: place.zip_code,
            lat: String(place.lat),
            lng: String(place.lng),
            place_id: place.place_id,
        };
        setFormValues(newValues);
        setCenter({ lat: place.lat, lng: place.lng });
        setMarker({ lat: place.lat, lng: place.lng });
        setZoom(17);
        triggerAutoSave(newValues);
    }, [triggerAutoSave]);

    const handleMapClick = useCallback((lat: number, lng: number) => {
        setMarker({ lat, lng });
        setFormValues(prev => {
            const next = { ...prev, lat: String(lat), lng: String(lng) };
            triggerAutoSave(next);
            return next;
        });
    }, [triggerAutoSave]);

    // ── Field updater ──
    const updateField = (field: keyof typeof formValues) => (value: string) => {
        setFormValues(prev => {
            const next = { ...prev, [field]: value };
            triggerAutoSave(next);
            return next;
        });
    };

    const hasLocation = !!(formValues.lat && formValues.lng);

    return (
        <div className="space-y-4">
            {/* Google Places Search */}
            <LocationSearchInput onSelect={handlePlaceSelect} />

            {/* Address Fields */}
            <TextField
                label="Dirección"
                value={formValues.address}
                onChange={updateField("address")}
                placeholder="Av. Corrientes 1234"
                required={false}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <TextField
                    label="Ciudad"
                    value={formValues.city}
                    onChange={updateField("city")}
                    placeholder="Buenos Aires"
                    required={false}
                />
                <TextField
                    label="Provincia / Estado"
                    value={formValues.state}
                    onChange={updateField("state")}
                    placeholder="Buenos Aires"
                    required={false}
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <TextField
                    label="Código Postal"
                    value={formValues.zip_code}
                    onChange={updateField("zip_code")}
                    placeholder="1043"
                    required={false}
                />
                <TextField
                    label="País"
                    value={formValues.country}
                    onChange={updateField("country")}
                    placeholder="Argentina"
                    required={false}
                />
            </div>

            {/* Mini Map Preview */}
            <LocationMap
                center={center}
                marker={marker}
                zoom={zoom}
                onMapClick={handleMapClick}
            />

        </div>
    );
}

// ── Google Places Search Input ──
// Separate component that lazy-loads the Places API
function LocationSearchInput({ onSelect }: {
    onSelect: (place: {
        address: string;
        city: string;
        state: string;
        country: string;
        zip_code: string;
        lat: number;
        lng: number;
        place_id: string;
    }) => void;
}) {
    // Dynamic import hook — will only load if Google Maps script is available
    const [searchValue, setSearchValue] = useState("");
    const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const handleSearch = useCallback(async (value: string) => {
        setSearchValue(value);
        if (!value || value.length < 3) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        try {
            if (!window.google?.maps?.places) return;
            const service = new google.maps.places.AutocompleteService();
            service.getPlacePredictions(
                { input: value },
                (predictions, status) => {
                    if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
                        setSuggestions(predictions);
                        setShowSuggestions(true);
                    }
                }
            );
        } catch {
            // Places API not loaded yet
        }
    }, []);

    const handleSelect = useCallback(async (prediction: google.maps.places.AutocompletePrediction) => {
        setSearchValue(prediction.description);
        setShowSuggestions(false);
        setSuggestions([]);

        try {
            const geocoder = new google.maps.Geocoder();
            const result = await geocoder.geocode({ placeId: prediction.place_id });
            if (!result.results[0]) return;

            const place = result.results[0];
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();

            const components = place.address_components;
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

            const fullAddress = route ? `${route} ${street_number}`.trim() : prediction.description;

            onSelect({
                address: fullAddress,
                city,
                state,
                country,
                zip_code: postal_code,
                lat,
                lng,
                place_id: prediction.place_id,
            });
        } catch (error) {
            console.error("Geocoding error:", error);
        }
    }, [onSelect]);

    return (
        <div className="relative">
            <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    value={searchValue}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Buscar dirección..."
                    className="pl-9"
                />
            </div>
            {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg py-1 max-h-60 overflow-auto">
                    {suggestions.map((prediction) => (
                        <li
                            key={prediction.place_id}
                            onClick={() => handleSelect(prediction)}
                            className="px-4 py-2 hover:bg-muted cursor-pointer text-sm"
                        >
                            {prediction.description}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
