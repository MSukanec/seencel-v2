"use client";

import { useTransition } from "react";
import { useForm, Controller } from "react-hook-form"; // Controller needed for PhoneInput
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { updateOrganization } from "@/actions/update-organization";
import { OrganizationLogoUpload } from "./organization-logo-upload";
import { Loader2 } from "lucide-react";
import { getStorageUrl } from "@/lib/storage-utils";
import { PhoneInput } from "@/components/ui/phone-input";
import { toast } from "sonner";

// Schema Definition
const formSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
    tax_id: z.string().optional(),
    email: z.string().email("Correo electrónico inválido.").or(z.literal('')).optional(),
    phone: z.string().optional(),
    website: z.string().optional(),
    description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function OrganizationDetailsForm({ organization }: { organization: any }) {
    const [isPending, startTransition] = useTransition();

    const orgDataRaw = organization.organization_data;
    const orgData = Array.isArray(orgDataRaw) ? orgDataRaw[0] : orgDataRaw || {};

    const logoPath = organization.logo_path
        ? (organization.logo_path.startsWith('organizations/') ? organization.logo_path : `organizations/${organization.logo_path}`)
        : null;
    const logoUrl = getStorageUrl(logoPath, 'public-assets');

    // Helper to sanitize phone value to E.164 format (must start with +)
    const sanitizePhoneValue = (phone: string | undefined): string => {
        if (!phone) return "";
        // If already starts with +, it's valid E.164
        if (phone.startsWith('+')) return phone;
        // If it's a numeric string without +, we can't determine country code, return empty
        // The user will need to re-enter the number with proper format
        return "";
    };

    // React Hook Form Setup
    const {
        register,
        control,
        handleSubmit,
        setValue,
        watch,
        formState: { errors }
    } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: organization.name || "",
            tax_id: orgData.tax_id || "",
            email: orgData.email || "",
            phone: sanitizePhoneValue(orgData.phone),
            website: orgData.website || "",
            description: orgData.description || ""
        }
    });

    // Smart URL Handler
    const handleUrlBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        let value = e.target.value.trim();
        if (value && !/^https?:\/\//i.test(value)) {
            // Check if it looks like a domain before adding prefix, or just add it aggressively?
            // User requested "smart". Adding https:// is standard "smart" fix.
            value = `https://${value}`;
            setValue("website", value);
        }
    };

    const onSubmit = (data: FormValues) => {
        const formData = new FormData();
        formData.append("name", data.name);
        if (data.description) formData.append("description", data.description);
        if (data.tax_id) formData.append("tax_id", data.tax_id);
        if (data.email) formData.append("email", data.email!);
        if (data.phone) formData.append("phone", data.phone!);
        if (data.website) formData.append("website", data.website!);

        startTransition(async () => {
            const result = await updateOrganization(organization.id, formData);
            if (result.error) {
                toast.error("Error al guardar", {
                    description: result.error
                });
            } else {
                toast.success("Organización actualizada", {
                    description: "Los cambios se han guardado correctamente."
                });
            }
        });
    };

    return (
        <div className="space-y-6">
            {/* Card 1: Logo */}
            <Card>
                <CardHeader>
                    <CardTitle>Foto de Perfil</CardTitle>
                    <CardDescription>
                        Elige una imagen que te represente en tu equipo y organizaciones.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <OrganizationLogoUpload
                        organizationId={organization.id}
                        initialLogoUrl={logoUrl}
                        organizationName={organization.name}
                    />
                </CardContent>
                <CardFooter className="bg-muted/50 border-t px-6 py-4">
                    <p className="text-sm text-muted-foreground w-full">
                        Recomendamos usar una imagen profesional y clara.
                    </p>
                </CardFooter>
            </Card>

            {/* Card 2: Form */}
            <form onSubmit={handleSubmit(onSubmit)}>
                <Card>
                    <CardHeader>
                        <CardTitle>Información de la Organización</CardTitle>
                        <CardDescription>
                            Administra tus datos de contacto y cómo apareces en los proyectos.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Name */}
                            <div className="space-y-2">
                                <Label htmlFor="name">Nombre de la Organización</Label>
                                <Input
                                    id="name"
                                    {...register("name")}
                                    className={errors.name ? "border-destructive focus-visible:ring-destructive" : ""}
                                />
                                {errors.name && (
                                    <p className="text-xs text-destructive font-medium">{errors.name.message}</p>
                                )}
                            </div>

                            {/* Tax ID */}
                            <div className="space-y-2">
                                <Label htmlFor="tax_id">CUIT / CIF</Label>
                                <Input
                                    id="tax_id"
                                    {...register("tax_id")}
                                    className={errors.tax_id ? "border-destructive focus-visible:ring-destructive" : ""}
                                />
                                {errors.tax_id && (
                                    <p className="text-xs text-destructive font-medium">{errors.tax_id.message}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <Label htmlFor="email">Correo electrónico</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    {...register("email")}
                                    className={errors.email ? "border-destructive focus-visible:ring-destructive" : ""}
                                />
                                {errors.email && (
                                    <p className="text-xs text-destructive font-medium">{errors.email.message}</p>
                                )}
                            </div>

                            {/* Phone - Using Controller for PhoneInput */}
                            <div className="space-y-2">
                                <Label htmlFor="phone">Teléfono</Label>
                                <Controller
                                    name="phone"
                                    control={control}
                                    render={({ field }) => (
                                        <PhoneInput
                                            {...field}
                                            id="phone"
                                            defaultCountry="AR" // Or dynamic based on org country
                                            className={errors.phone ? "[&_input]:border-destructive" : ""}
                                            onChange={(value) => field.onChange(value || "")}
                                        />
                                    )}
                                />
                                {errors.phone && (
                                    <p className="text-xs text-destructive font-medium">{errors.phone.message}</p>
                                )}
                            </div>

                            {/* Website - Smart Input */}
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="website">Sitio Web</Label>
                                <Input
                                    id="website"
                                    {...register("website", {
                                        onBlur: handleUrlBlur
                                    })}
                                    placeholder="ejemplo.com"
                                    className={errors.website ? "border-destructive focus-visible:ring-destructive" : ""}
                                />
                                {errors.website && (
                                    <p className="text-xs text-destructive font-medium">{errors.website.message}</p>
                                )}
                            </div>

                            {/* Description */}
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="description">Descripción</Label>
                                <Textarea
                                    id="description"
                                    {...register("description")}
                                    className="min-h-[100px] resize-none"
                                />
                                {errors.description && (
                                    <p className="text-xs text-destructive font-medium">{errors.description.message}</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-muted/50 border-t px-6 py-4 flex justify-between items-center">
                        <p className="text-sm text-muted-foreground">
                            Asegúrate de que la información sea correcta.
                        </p>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isPending ? "Guardando..." : "Guardar cambios"}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}

