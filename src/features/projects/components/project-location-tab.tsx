"use client";

import { useState, useTransition } from "react";
import { GoogleMap, useLoadScript, OverlayView } from "@react-google-maps/api";
import usePlacesAutocomplete, {
    getGeocode,
    getLatLng,
} from "use-places-autocomplete";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MapPin, Search } from "lucide-react";
import { useTheme } from "next-themes";
import { updateProject } from "@/features/projects/actions";

// Define libraries array outside component to prevent re-renders
const libraries: ("places")[] = ["places"];

// Map Styles matching Organization Map
const darkMapStyle = [
    { elementType: "geometry", stylers: [{ color: "#212121" }] },
    { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
    { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#757575" }] },
    { featureType: "administrative.country", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
    { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
    { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#bdbdbd" }] },
    { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
    { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#181818" }] },
    { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
    { featureType: "poi.park", elementType: "labels.text.stroke", stylers: [{ color: "#1b1b1b" }] },
    { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#2c2c2c" }] },
    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#8a8a8a" }] },
    { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#373737" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3c3c3c" }] },
    { featureType: "road.highway.controlled_access", elementType: "geometry", stylers: [{ color: "#4e4e4e" }] },
    { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
    { featureType: "transit", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#3d3d3d" }] }
];

const lightMapStyle = [
    { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
    { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
    { featureType: "administrative.land_parcel", elementType: "labels.text.fill", stylers: [{ color: "#bdbdbd" }] },
    { featureType: "poi", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
    { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
    { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#e5e5e5" }] },
    { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
    { featureType: "road.arterial", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#dadada" }] },
    { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
    { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
    { featureType: "transit.line", elementType: "geometry", stylers: [{ color: "#e5e5e5" }] },
    { featureType: "transit.station", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9c9c9" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
];

export function ProjectLocationTab({ project }: { project: any }) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: apiKey,
        libraries: libraries,
    });

    if (loadError) return <div className="p-4 bg-destructive/10 text-destructive">Error loading maps. Check API Key.</div>;
    if (!isLoaded) return <div className="p-4 flex items-center gap-2"><Loader2 className="animate-spin" /> Loading Maps...</div>;

    return <MapInterface project={project} />;
}

function MapInterface({ project }: { project: any }) {
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    const { resolvedTheme } = useTheme();

    // Access nested data. Note: One-to-one relation usually returns an object if simple or array if not.
    // Assuming getProjectById returns { ...project, project_data: { ... } } or similar
    // Based on previous code, let's robustly check.
    const projectData = project.project_data || {};

    const currentMapStyle = resolvedTheme === 'dark' ? darkMapStyle : lightMapStyle;

    const [center, setCenter] = useState({
        lat: projectData.lat ? Number(projectData.lat) : (project.lat ? Number(project.lat) : -34.6037),
        lng: projectData.lng ? Number(projectData.lng) : (project.lng ? Number(project.lng) : -58.3816)
    });
    const [zoom, setZoom] = useState((projectData.lat || project.lat) ? 17 : 12);
    const [marker, setMarker] = useState(center);

    // Form State
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
                zip_code: postal_code,
                lat: String(lat),
                lng: String(lng),
                place_id: results[0].place_id
            });

        } catch (error) {
            console.error("Error: ", error);
        }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        const formData = new FormData();
        Object.entries(formValues).forEach(([key, val]) => {
            formData.append(key, val);
        });

        startTransition(async () => {
            const result = await updateProject(project.id, formData);
            if (result?.error) {
                setMessage({ text: result.error, type: 'error' });
            } else {
                setMessage({ text: "Ubicación actualizada correctamente.", type: 'success' });
            }
        });
    };

    return (
        <div className="relative w-full h-full min-h-[600px] overflow-hidden rounded-none border-0">
            {/* Background Map - Full Screen intent */}
            <div className="absolute inset-0 z-0">
                <GoogleMap
                    zoom={zoom}
                    center={center}
                    mapContainerClassName="w-full h-full"
                    options={{
                        disableDefaultUI: true,
                        zoomControl: true,
                        styles: currentMapStyle,
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
                            <div className="relative w-16 h-16 bg-[#83cc16] rounded-full rounded-br-none rotate-45 flex items-center justify-center border-[3px] border-white shadow-sm">
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
                            Ubicación del Proyecto
                        </CardTitle>
                        <CardDescription>
                            Define la ubicación exacta de la obra.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {message && (
                            <div className={`p-3 rounded-md text-sm font-medium ${message.type === 'success' ? 'bg-green-500/10 text-green-600' : 'bg-destructive/10 text-destructive'}`}>
                                {message.text}
                            </div>
                        )}
                        <div className="relative">
                            <Label className="mb-2 block text-xs uppercase tracking-wider text-muted-foreground font-semibold">BUSCAR</Label>
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
                                    <Label htmlFor="zip_code">Código Postal</Label>
                                    <Input
                                        value={formValues.zip_code}
                                        onChange={e => setFormValues({ ...formValues, zip_code: e.target.value })}
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

                            {/* Hidden Coords & Place ID */}
                            <input type="hidden" name="lat" value={formValues.lat} />
                            <input type="hidden" name="lng" value={formValues.lng} />
                            <input type="hidden" name="place_id" value={formValues.place_id} />

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
