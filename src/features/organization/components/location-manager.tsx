"use client";

import { useState, useTransition } from "react";
import { GoogleMap, useLoadScript, OverlayView } from "@react-google-maps/api";
import usePlacesAutocomplete, {
    getGeocode,
    getLatLng,
} from "use-places-autocomplete";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TextField } from "@/components/shared/forms/fields";
import { Loader2, MapPin, Search } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { updateOrganization } from "@/actions/update-organization";

// Define libraries array outside component to prevent re-renders
const libraries: ("places")[] = ["places"];

// CSS filter applied to map container for dark desaturated hybrid look
import { MAP_TYPE_ID, getMapContainerClass } from "@/lib/map-config";

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

    const isDark = resolvedTheme === 'dark';
    const mapClass = getMapContainerClass(isDark);

    // Map State
    const [center, setCenter] = useState({
        lat: orgData.lat ? Number(orgData.lat) : -34.6037,
        lng: orgData.lng ? Number(orgData.lng) : -58.3816
    });
    const [zoom, setZoom] = useState(orgData.lat ? 17 : 12);
    const [marker, setMarker] = useState(center);

    // Form State
    const [formValues, setFormValues] = useState({
        address: orgData.address || "",
        city: orgData.city || "",
        state: orgData.state || "",
        country: orgData.country || "",
        postal_code: orgData.postal_code || "",
        lat: String(orgData.lat || ""),
        lng: String(orgData.lng || ""),
    });

    const {
        ready,
        value,
        setValue,
        suggestions: { status, data },
        clearSuggestions,
    } = usePlacesAutocomplete({ debounce: 300 });

    const handleSelect = async (address: string) => {
        setValue(address, false);
        clearSuggestions();

        try {
            const results = await getGeocode({ address });
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

            setCenter({ lat, lng });
            setMarker({ lat, lng });
            setZoom(17);

            const fullAddress = route ? `${route} ${street_number}`.trim() : address;

            setFormValues({
                address: fullAddress,
                city,
                state,
                country,
                postal_code,
                lat: String(lat),
                lng: String(lng),
            });

        } catch (error) {
            console.error("Error: ", error);
        }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const formData = new FormData();
        Object.entries(formValues).forEach(([key, val]) => {
            formData.append(key, val);
        });

        startTransition(async () => {
            const result = await updateOrganization(organization.id, formData);
            if (result?.error) {
                toast.error(result.error);
            } else {
                toast.success("Ubicación actualizada correctamente");
            }
        });
    };

    // Helper to update a single field in formValues
    const updateField = (field: keyof typeof formValues) => (value: string) => {
        setFormValues(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="relative w-full h-full min-h-[600px] overflow-hidden rounded-none border-0">
            {/* Background Map - Full Screen with hybrid + desaturated overlay */}
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
                                <MapPin className="text-white -rotate-45 h-8 w-8" />
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
                            Busca y confirma la sede central de tu organización.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Buscador de Google Places — se deja manual (no TextField) */}
                        <div className="relative">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                    disabled={!ready}
                                    placeholder="Buscar dirección..."
                                    className="pl-9"
                                />
                            </div>
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

                        <form onSubmit={handleFormSubmit} className="space-y-3 pt-2">
                            <TextField
                                label="Dirección"
                                value={formValues.address}
                                onChange={updateField("address")}
                                placeholder="Av. Corrientes 1234"
                                required={false}
                            />

                            <div className="grid grid-cols-2 gap-3">
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

                            <div className="grid grid-cols-2 gap-3">
                                <TextField
                                    label="Código Postal"
                                    value={formValues.postal_code}
                                    onChange={updateField("postal_code")}
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

                            {/* Hidden Coords */}
                            <input type="hidden" name="lat" value={formValues.lat} />
                            <input type="hidden" name="lng" value={formValues.lng} />

                            <Button disabled={isPending} className="w-full mt-2">
                                {isPending ? "Guardando..." : "Confirmar Ubicación"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
