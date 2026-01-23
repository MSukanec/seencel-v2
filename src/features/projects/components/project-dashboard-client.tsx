"use client";

import { useEffect, useState, useMemo } from "react";
import { useLayoutStore, NavigationContext } from "@/store/layout-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Users, FileText, Calendar, Clock, AlertCircle, MapPin, Loader2 } from "lucide-react";

import { GoogleMap, useLoadScript, MarkerF } from "@react-google-maps/api";
import { useTheme } from "next-themes";
import Image from "next/image";

interface ProjectDashboardClientProps {
    project: any;
    signedImageUrl?: string | null;
}

const libraries: ("places")[] = ["places"];

// Map Styles (Reuse logic or keep simple for mini-map)
const mapOptions = {
    disableDefaultUI: true,
    zoomControl: false,
    clickableIcons: false,
    streetViewControl: false,
    mapTypeControl: false,
};

export function ProjectDashboardClient({ project, signedImageUrl }: ProjectDashboardClientProps) {
    const { actions } = useLayoutStore();

    useEffect(() => {
        actions.setActiveContext('project');
        actions.setActiveProjectId(project.id);
    }, [project.id, actions]);

    return (
        <div className="space-y-6 pb-20">
            {/* HERO SECTION */}
            <ProjectHero project={project} imageUrl={signedImageUrl} />

            {/* Quick Stats Row */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Estado</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold capitalize">{project.status || 'Activo'}</div>
                        <p className="text-xs text-muted-foreground">Progreso general</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Equipo</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">12</div>
                        <p className="text-xs text-muted-foreground">Miembros activos</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tareas</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">24</div>
                        <p className="text-xs text-muted-foreground">Pendientes esta semana</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Plazo</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {project.project_data?.estimated_end ? new Date(project.project_data.estimated_end).toLocaleDateString() : 'Sin definir'}
                        </div>
                        <p className="text-xs text-muted-foreground">Fecha de finalización</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Area */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Visión General</TabsTrigger>
                    <TabsTrigger value="activity">Actividad Reciente</TabsTrigger>
                    <TabsTrigger value="reports">Reportes</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <Card className="col-span-4">
                            <CardHeader>
                                <CardTitle>Avance General</CardTitle>
                            </CardHeader>
                            <CardContent className="pl-2">
                                {/* Placeholder for a chart or timeline */}
                                <div className="h-[200px] flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg bg-muted/5">
                                    <p>[Gráfico de Avance del Proyecto]</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="col-span-3">
                            <CardHeader>
                                <CardTitle>Detalles</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm">Inicio: {project.project_data?.start_date ? new Date(project.project_data.start_date).toLocaleDateString() : '-'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm">Prioridad: Alta</span>
                                    </div>
                                    <div className="text-sm text-muted-foreground mt-4">
                                        {project.project_data?.description || "Sin descripción disponible."}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
                <TabsContent value="activity">
                    <Card>
                        <CardHeader>
                            <CardTitle>Historial de Cambios</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">Lista de actividades recientes...</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function ProjectHero({ project, imageUrl }: { project: any, imageUrl?: string | null }) {
    // Map setup
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        libraries: libraries,
    });

    // Coordinates
    const lat = Number(project.project_data?.lat || -34.6037);
    const lng = Number(project.project_data?.lng || -58.3816);
    const center = useMemo(() => ({ lat, lng }), [lat, lng]);
    const hasLocation = !!project.project_data?.lat;

    // Theme for map style
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === 'dark';
    // Simplified Dark Mode style
    const mapStyle = isDark ? [
        { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
        { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
    ] : []; // Default lightness

    return (
        <div className="relative w-full h-[300px] md:h-[400px] rounded-2xl overflow-hidden shadow-2xl group border border-border/50">
            {/* Background Image / Gradient */}
            {imageUrl ? (
                <div className="absolute inset-0">
                    <Image
                        src={imageUrl}
                        alt="Project Cover"
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                </div>
            ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
                    <Building className="h-24 w-24 text-white/10" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                </div>
            )}

            {/* Content overlay */}
            <div className="absolute bottom-0 left-0 p-8 w-full md:w-2/3">
                <div className="space-y-2 animate-in slide-in-from-bottom-4 duration-500">
                    <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight drop-shadow-md">
                        {project.name}
                    </h1>
                    {project.project_data?.address_full && (
                        <div className="flex items-center gap-2 text-white/90">
                            <MapPin className="h-4 w-4 text-primary" />
                            <p className="text-sm md:text-base font-medium drop-shadow-sm">
                                {project.project_data.address_full}
                            </p>
                        </div>
                    )}
                    {project.project_data?.client_name && (
                        <p className="text-sm text-white/70">
                            Cliente: <span className="text-white font-medium">{project.project_data.client_name}</span>
                        </p>
                    )}
                </div>
            </div>

            {/* Mini Map Card (Bottom Right) */}
            <div className="absolute bottom-6 right-6 hidden md:block w-[280px] h-[180px] rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 hover:scale-105 transition-transform duration-300">
                {isLoaded && hasLocation ? (
                    <GoogleMap
                        zoom={15}
                        center={center}
                        mapContainerClassName="w-full h-full"
                        options={{ ...mapOptions, styles: mapStyle }}
                    >
                        <MarkerF position={center} />
                    </GoogleMap>
                ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center flex-col gap-2 p-4 text-center">
                        <MapPin className="h-8 w-8 text-muted-foreground/50" />
                        <span className="text-xs text-muted-foreground">Ubicación no definida</span>
                    </div>
                )}
            </div>
        </div>
    );
}

// Icon for fallback
function Building({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
            <path d="M9 22v-4h6v4" />
            <path d="M8 6h.01" />
            <path d="M16 6h.01" />
            <path d="M8 10h.01" />
            <path d="M16 10h.01" />
            <path d="M8 14h.01" />
            <path d="M16 14h.01" />
        </svg>
    )
}

