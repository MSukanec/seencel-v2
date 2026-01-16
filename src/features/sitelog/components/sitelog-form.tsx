"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
    CalendarIcon,
    Cloud,
    CloudFog,
    CloudLightning,
    CloudRain,
    CloudSun,
    Loader2,
    Snowflake,
    Sun,
    Wind
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { FormFooter } from "@/components/shared/form-footer";
import { FormGroup } from "@/components/ui/form-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { SiteLog, SiteLogType } from "@/types/sitelog";
import { toast } from "sonner";
import { createSiteLog } from "@/actions/sitelog";
import { MediaGalleryUpload, UploadedFile, type MediaGalleryUploadRef } from "@/components/shared/media-gallery-upload";

import { WEATHER_CONFIG, SEVERITY_OPTIONS } from "../constants";

const formSchema = z.object({
    comments: z.string().min(1, "El contenido de la bitácora es requerido"),
    log_date: z.date(),
    entry_type_id: z.string().optional(),
    weather: z.string().optional(),
    severity: z.string().default("low"),
    is_public: z.boolean().default(true),
});

interface SitelogFormProps {
    projectId: string;
    organizationId: string;
    descriptionType?: SiteLogType[];
    initialData?: SiteLog;
    onSuccess?: () => void;
}


type FormValues = z.infer<typeof formSchema>;

export function SitelogForm({
    organizationId,
    projectId,
    descriptionType = [],
    initialData,
    onSuccess
}: SitelogFormProps) {
    const t = useTranslations('Sitelog');
    const [isLoading, setIsLoading] = useState(false);
    // Initialize media files if editing (assuming initialData has media array compatible with UploadedFile)
    const [mediaFiles, setMediaFiles] = useState<UploadedFile[]>(
        initialData?.media?.map((m: any) => ({
            id: m.id,
            url: m.url,
            name: m.name || "Archivo",
            type: m.type,
            size: 0, // Mock size
            path: m.path || m.url,
            bucket: m.bucket || 'sitelogs'
        })) || []
    );

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            comments: initialData?.comments || "",
            log_date: initialData ? new Date(initialData.log_date) : new Date(),
            severity: initialData?.severity || "low",
            is_public: initialData ? initialData.is_public : true,
            entry_type_id: initialData?.entry_type_id || (() => {
                const general = descriptionType?.find(t => t.name.toLowerCase() === 'general');
                return general?.id;
            })(),
            weather: (() => {
                if (!initialData?.weather) return undefined;
                const w = initialData.weather.toLowerCase().trim();
                // Try direct match first
                const exactMatch = WEATHER_CONFIG.find(opt => opt.value === w);
                if (exactMatch) return exactMatch.value;

                // Try to find if it contains the value (e.g. "Sunny day" -> "sunny")
                const partialMatch = WEATHER_CONFIG.find(opt => w.includes(opt.value));
                if (partialMatch) return partialMatch.value;

                return undefined;
            })(),
        },
    });

    const uploadRef = useRef<MediaGalleryUploadRef>(null);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);

        // Upload pending files first
        let finalMediaFiles = mediaFiles;
        if (uploadRef.current) {
            try {
                finalMediaFiles = await uploadRef.current.startUpload();
            } catch (error) {
                console.error("Upload error", error);
                toast.error("Error al subir archivos pendientes");
                setIsLoading(false);
                return;
            }
        }

        const formData = new FormData();

        formData.append('project_id', projectId);
        formData.append('organization_id', organizationId);
        formData.append('comments', values.comments);
        formData.append('log_date', values.log_date.toISOString());
        formData.append('severity', values.severity);
        formData.append('is_public', String(values.is_public));

        if (initialData?.id) {
            formData.append('id', initialData.id);
        }

        if (values.entry_type_id) {
            formData.append('entry_type_id', values.entry_type_id);
        }
        if (values.weather) {
            formData.append('weather', values.weather);
        }

        // Serialize media files using the most up-to-date list
        if (finalMediaFiles.length > 0) {
            formData.append('media', JSON.stringify(finalMediaFiles));
        }

        const result = await createSiteLog(formData);

        if (result.error) {
            toast.error("Error al crear registro", {
                description: result.error
            });
        } else {
            toast.success("Registro creado", {
                description: "Se ha añadido la entrada a la bitácora."
            });
            form.reset();
            setMediaFiles([]); // Reset files
            onSuccess?.(); // Close modal
        }
        setIsLoading(false);
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col max-h-full min-h-0">
            <div className="flex-1 overflow-y-auto min-h-0 pr-2">
                <div className="space-y-4">
                    {/* Row 1: Date & Type */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormGroup label="Fecha del registro">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full pl-3 text-left font-normal",
                                            !form.getValues("log_date") && "text-muted-foreground"
                                        )}
                                    >
                                        {form.watch("log_date") ? (
                                            format(form.watch("log_date"), "PPP", { locale: es })
                                        ) : (
                                            <span>Seleccionar fecha</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={form.watch("log_date")}
                                        onSelect={(date) => date && form.setValue("log_date", date)}
                                        disabled={(date) =>
                                            date > new Date() || date < new Date("1900-01-01")
                                        }
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </FormGroup>

                        <FormGroup label="Tipo de entrada">
                            <Select
                                onValueChange={(val) => form.setValue("entry_type_id", val)}
                                value={form.watch("entry_type_id")}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar tipo..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {descriptionType?.map((type) => (
                                        <SelectItem key={type.id} value={type.id}>
                                            {type.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormGroup>
                    </div>

                    {/* Row 2: Weather & Severity */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormGroup label="Clima">
                            <Select
                                onValueChange={(val) => form.setValue("weather", val)}
                                value={form.watch("weather")}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={t('weather.placeholder')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {WEATHER_CONFIG.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            <div className="flex items-center gap-2">
                                                <option.icon className={cn("h-4 w-4", option.color)} />
                                                <span>{option.label}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormGroup>

                        <FormGroup label="Impacto en obra">
                            <Select
                                onValueChange={(val) => form.setValue("severity", val)}
                                value={form.watch("severity")}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar impacto..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {SEVERITY_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            <div className="flex items-center gap-2">
                                                <div className={cn("h-2 w-2 rounded-full", option.color)} />
                                                <span>{option.label}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormGroup>
                    </div>

                    {/* Row 3: Content */}
                    <FormGroup label="Contenido del registro" error={form.formState.errors.comments?.message}>
                        <Textarea
                            placeholder="Describe las actividades, incidencias o avances..."
                            className="min-h-[120px] resize-none"
                            {...form.register("comments")}
                        />
                    </FormGroup>

                    {/* Row 4: Attachments */}
                    <FormGroup label="Archivos adjuntos">
                        <MediaGalleryUpload
                            ref={uploadRef}
                            autoUpload={false}
                            folderPath={`organizations/${organizationId}/sitelogs`}
                            onUploadComplete={setMediaFiles}
                            initialFiles={mediaFiles}
                            acceptedFileTypes={{
                                'image/*': [],
                                'video/*': [],
                                'application/pdf': []
                            }}
                        />
                    </FormGroup>

                    {/* Row 5: Visibility */}
                    {/* Row 5: Visibility */}
                    <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label className="text-base text-foreground">Visible para cliente</Label>
                            <p className="text-sm text-muted-foreground">
                                Si se desactiva, este registro solo será visible para el equipo interno.
                            </p>
                        </div>
                        <Switch
                            checked={form.watch("is_public")}
                            onCheckedChange={(val) => form.setValue("is_public", val)}
                        />
                    </div>
                </div>
            </div>

            <FormFooter
                submitLabel="Guardar registro"
                isLoading={isLoading}
                onCancel={onSuccess}
                className="-mx-4 -mb-4 mt-6"
            />
        </form>
    );
}
