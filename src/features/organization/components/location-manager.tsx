"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import { GoogleMap, useLoadScript, Marker, OverlayView } from "@react-google-maps/api";
import usePlacesAutocomplete, {
    getGeocode,
    getLatLng,
    getZipCode,
} from "use-places-autocomplete";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { updateOrganization } from "@/actions/update-organization";
import { Loader2, MapPin, Search } from "lucide-react";
import { toast } from "sonner";

import { useTheme } from "next-themes";
import { MAP_TYPE_ID, getMapContainerClass } from "@/lib/map-config";

// Define libraries array outside component to prevent re-renders
const libraries: ("places")[] = ["places"];

// Map styling is centralized in @/lib/map-config

export function OrganizationLocationManager({ organization }: { organization: any }) {
    const orgDataRaw = organization.organization_data;
    const orgData = Array.isArray(orgDataRaw) ? orgDataRaw[0] : orgDataRaw || {};
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: apiKey,
        libraries: libraries,
    });

    if (loadError) return <div className="p-4 bg-destructive/10 text-destructive">Error loading maps. Check API Key.</div>;
    if (!isLoaded) return <div className="p-4 flex items-center gap-2"><Loader2 className="animate-spin" /> Loading Maps...</div>;

    return <MapInterface organization={organization} orgData={orgData} />;
}

function MapInterface({ organization, orgData }: { organization: any, orgData: any }) {
    const [isPending, startTransition] = useTransition();
    const { resolvedTheme } = useTheme();

    // Determine filter based on theme
    const isDark = resolvedTheme === 'dark';
    const mapClass = getMapContainerClass(isDark);

    // Custom Marker Image URL - uses logo_url (full URL from DB)
    const logoUrl = organization.logo_url || "/logo.png";

    // Map State
    const [center, setCenter] = useState({
        lat: orgData.lat ? Number(orgData.lat) : -34.6037, // Default Buenos Aires
        lng: orgData.lng ? Number(orgData.lng) : -58.3816
    });
    const [zoom, setZoom] = useState(orgData.lat ? 17 : 12); // Slightly more zoomed in if location exists
    const [marker, setMarker] = useState(center);

    // Form State
    const [formValues, setFormValues] = useState({
        address: orgData.address || "",
        city: orgData.city || "",
        state: orgData.state || "",
        postal_code: orgData.postal_code || "",
        country: orgData.country || "",
        lat: orgData.lat || "",
        lng: orgData.lng || ""
    });

    // Validates autocomplete loaded
    const {
        ready,
        value,
        setValue,
        suggestions: { status, data },
        clearSuggestions,
    } = usePlacesAutocomplete({
        requestOptions: {
            /* Define search scope here if needed */
        },
        debounce: 300,
    });

    const handleSelect = async (address: string) => {
        setValue(address, false);
        clearSuggestions();

        try {
            const results = await getGeocode({ address });
            const { lat, lng } = await getLatLng(results[0]);

            // Extract components
            const components = results[0].address_components;
            let city = "", state = "", country = "", postal_code = "", route = "", street_number = "";

            components.forEach((c) => {
                if (c.types.includes("locality")) city = c.long_name;
                if (!city && c.types.includes("administrative_area_level_2")) city = c.long_name; // Fallback
                if (c.types.includes("administrative_area_level_1")) state = c.long_name;
                if (c.types.includes("country")) country = c.long_name;
                if (c.types.includes("postal_code")) postal_code = c.long_name;
                if (c.types.includes("route")) route = c.long_name;
                if (c.types.includes("street_number")) street_number = c.long_name;
            });

            // Update Map
            setCenter({ lat, lng });
            setMarker({ lat, lng });
            setZoom(17);

            // Update Form
            const fullAddress = route ? `${route} ${street_number}`.trim() : address;
            setFormValues({
                address: fullAddress,
                city,
                state,
                postal_code,
                country,
                lat: String(lat),
                lng: String(lng)
            });

        } catch (error) {
            console.error("Error: ", error);
        }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const formData = new FormData();
        // Append all field values from state + implicit ones
        Object.entries(formValues).forEach(([key, val]) => {
            formData.append(key, val);
        });

        startTransition(async () => {
            const result = await updateOrganization(organization.id, formData);
            if (result.error) {
                toast.error(`Error: ${result.error}`);
            } else {
                toast.success("Ubicación actualizada correctamente");
            }
        });
    };

    return (
        <div className="relative w-full h-full overflow-hidden">
            {/* Background Map */}
            <div className={`absolute inset-0 z-0 ${mapClass}`}>
                <GoogleMap
                    zoom={zoom}
                    center={center}
                    mapContainerClassName="w-full h-full"
                    options={{
                        mapTypeId: MAP_TYPE_ID,
                        disableDefaultUI: true,
                        zoomControl: true,
                        clickableIcons: false,
                    }}
                    onClick={(e) => {
                        if (e.latLng) {
                            const lat = e.latLng.lat();
                            const lng = e.latLng.lng();
                            setMarker({ lat, lng });
                            setFormValues(prev => ({ ...prev, lat: String(lat), lng: String(lng) }));
                        }
                    }}
                >
                    <OverlayView
                        position={marker}
                        mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                    >
                        <div className="absolute transform -translate-x-1/2 -translate-y-full cursor-pointer transition-transform hover:scale-110 active:scale-95 duration-200 ease-out drop-shadow-2xl">
                            <div className="relative w-16 h-16 bg-primary rounded-full rounded-br-none rotate-45 flex items-center justify-center border-[3px] border-white shadow-sm">
                                <div className="w-12 h-12 bg-white rounded-full overflow-hidden -rotate-45 border border-black/5">
                                    {/* Use standard img for overlay, next/image can be tricky with absolute positioning/sizing here */}
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={logoUrl}
                                        alt="Logo"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                        </div>
                    </OverlayView>
                </GoogleMap>
            </div>

            {/* Floating Control Panel */}
            <div className="absolute top-6 left-6 z-10 w-[420px]">
                <Card className="backdrop-blur-xl bg-background/90 shadow-2xl border-white/20">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-primary" />
                            Ubicación de la Organización
                        </CardTitle>
                        <CardDescription>
                            Busca y confirma la sede central.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">

                        <div className="relative">
                            <Label className="mb-2 block text-xs uppercase tracking-wider text-muted-foreground font-semibold">BUSCAR DIRECCIÓN</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                    disabled={!ready}
                                    placeholder="Buscar ubicación..."
                                    className="pl-9"
                                />
                            </div>
                            {/* Autocomplete Suggestions */}
                            {status === "OK" && (
                                <ul className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg py-1 max-h-60 overflow-auto">
                                    {data.map(({ place_id, description }) => (
                                        <li
                                            key={place_id}
                                            onClick={() => handleSelect(description)}
                                            className="px-4 py-2 hover:bg-muted cursor-pointer text-sm"
                                        >
                                            {description}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
                            <div className="grid w-full gap-1.5">
                                <Label htmlFor="address">Dirección</Label>
                                <Input
                                    value={formValues.address}
                                    onChange={e => setFormValues({ ...formValues, address: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid w-full gap-1.5">
                                    <Label htmlFor="city">Ciudad</Label>
                                    <Input
                                        value={formValues.city}
                                        onChange={e => setFormValues({ ...formValues, city: e.target.value })}
                                    />
                                </div>
                                <div className="grid w-full gap-1.5">
                                    <Label htmlFor="state">Provincia / Estado</Label>
                                    <Input
                                        value={formValues.state}
                                        onChange={e => setFormValues({ ...formValues, state: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid w-full gap-1.5">
                                    <Label htmlFor="postal_code">Código Postal</Label>
                                    <Input
                                        value={formValues.postal_code}
                                        onChange={e => setFormValues({ ...formValues, postal_code: e.target.value })}
                                    />
                                </div>
                                <div className="grid w-full gap-1.5">
                                    <Label htmlFor="country">País</Label>
                                    <Input
                                        value={formValues.country}
                                        onChange={e => setFormValues({ ...formValues, country: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Hidden Coords */}
                            <input type="hidden" name="lat" value={formValues.lat} />
                            <input type="hidden" name="lng" value={formValues.lng} />

                            <Button disabled={isPending} className="w-full mt-2">
                                {isPending ? "Guardando..." : "Guardar Ubicación"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

