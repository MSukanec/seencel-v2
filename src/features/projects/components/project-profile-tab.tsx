"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { updateProject } from "@/features/projects/actions";
import { Separator } from "@/components/ui/separator";

export function ProjectProfileTab({ project }: { project: any }) {
    const [isPending, startTransition] = useTransition();

    // project_data comes joined from the query
    const data = project.project_data || {};

    const handleSubmit = (formData: FormData) => {
        startTransition(async () => {
            const result = await updateProject(formData);
            if (result?.error) {
                alert(`Error: ${result.error}`);
            } else {
                alert("Información del proyecto actualizada correctamente.");
            }
        });
    };

    return (
        <form action={handleSubmit}>
            <div className="grid gap-6">
                {/* General Info Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Información General</CardTitle>
                        <CardDescription>Detalles básicos e identificación del proyecto.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid w-full gap-1.5">
                            <Label htmlFor="name">Nombre del Proyecto</Label>
                            <Input
                                type="text"
                                id="name"
                                name="name"
                                defaultValue={project.name}
                                required
                                minLength={2}
                            />
                            {/* Hidden ID for Server Action */}
                            <input type="hidden" name="id" value={project.id} />
                        </div>
                        <div className="grid w-full gap-1.5">
                            <Label htmlFor="description">Descripción</Label>
                            <Textarea
                                id="description"
                                name="description"
                                defaultValue={data.description || project.description || ''} // Fallback to project desc
                                className="min-h-[80px]"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid w-full gap-1.5">
                                <Label htmlFor="start_date">Fecha Inicio</Label>
                                <Input
                                    type="date"
                                    id="start_date"
                                    name="start_date"
                                    defaultValue={data.start_date || (project.start_date ? new Date(project.start_date).toISOString().split('T')[0] : '')}
                                />
                            </div>
                            <div className="grid w-full gap-1.5">
                                <Label htmlFor="end_date">Fecha Fin Estimada</Label>
                                <Input
                                    type="date"
                                    id="end_date"
                                    name="end_date"
                                    defaultValue={data.estimated_end || (project.end_date ? new Date(project.end_date).toISOString().split('T')[0] : '')}
                                />
                            </div>
                        </div>
                        <div className="grid w-full gap-1.5">
                            <Label htmlFor="internal_notes">Notas Internas</Label>
                            <Textarea
                                id="internal_notes"
                                name="internal_notes"
                                defaultValue={data.internal_notes || ''}
                                placeholder="Notas visibles solo para el equipo..."
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Technical Specs Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Superficies y Métricas</CardTitle>
                        <CardDescription>Datos técnicos de la obra.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="grid w-full gap-1.5">
                            <Label htmlFor="surface_total">Superficie Total (m²)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                id="surface_total"
                                name="surface_total"
                                defaultValue={data.surface_total}
                            />
                        </div>
                        <div className="grid w-full gap-1.5">
                            <Label htmlFor="surface_covered">Sup. Cubierta (m²)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                id="surface_covered"
                                name="surface_covered"
                                defaultValue={data.surface_covered}
                            />
                        </div>
                        <div className="grid w-full gap-1.5">
                            <Label htmlFor="surface_semi">Sup. Semicubierta (m²)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                id="surface_semi"
                                name="surface_semi"
                                defaultValue={data.surface_semi}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Client Info Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Información del Cliente</CardTitle>
                        <CardDescription>Datos de contacto del cliente principal.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid w-full gap-1.5">
                            <Label htmlFor="client_name">Nombre del Cliente / Razón Social</Label>
                            <Input
                                type="text"
                                id="client_name"
                                name="client_name"
                                defaultValue={data.client_name || ''}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid w-full gap-1.5">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    type="email"
                                    id="email"
                                    name="email"
                                    defaultValue={data.email || ''}
                                />
                            </div>
                            <div className="grid w-full gap-1.5">
                                <Label htmlFor="contact_phone">Teléfono</Label>
                                <Input
                                    type="tel"
                                    id="contact_phone"
                                    name="contact_phone"
                                    defaultValue={data.contact_phone || ''}
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="border-t px-6 py-4 flex justify-between items-center bg-muted/20">
                        <p className="text-xs text-muted-foreground">
                            Asegúrate de guardar los cambios antes de salir.
                        </p>
                        <Button disabled={isPending}>
                            {isPending ? "Guardando..." : "Guardar Todo"}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </form>
    );
}
