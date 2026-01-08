"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2, Mail, Phone, MapPin, Send } from "lucide-react";
import { sendContactEmail } from "../actions/send-contact-email";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/ui/phone-input";
import { CountrySelector } from "@/components/ui/country-selector";

// Mock countries list
const COUNTRIES = [
    { id: "AR", name: "Argentina", alpha_2: "AR" },
    { id: "US", name: "United States", alpha_2: "US" },
    { id: "MX", name: "México", alpha_2: "MX" },
    { id: "BR", name: "Brasil", alpha_2: "BR" },
    { id: "CO", name: "Colombia", alpha_2: "CO" },
    { id: "CL", name: "Chile", alpha_2: "CL" },
    { id: "PE", name: "Perú", alpha_2: "PE" },
    { id: "ES", name: "España", alpha_2: "ES" },
];

const formSchema = z.object({
    firstName: z.string().min(2, { message: "Mínimo 2 caracteres" }),
    lastName: z.string().min(2, { message: "Mínimo 2 caracteres" }),
    email: z.string().email({ message: "Email inválido" }),
    phone: z.string().optional(),
    country: z.string().min(1, { message: "Por favor selecciona un país" }),
    subject: z.string().min(5, { message: "Mínimo 5 caracteres" }),
    message: z.string().min(10, { message: "Escribe al menos 10 caracteres" }).max(1000, { message: "Máximo 1000 caracteres" }),
    _gotcha: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function ContactView() {
    const t = useTranslations('Common');
    const [mountedAt] = useState(Date.now());

    const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            country: "",
            subject: "",
            message: "",
            _gotcha: ""
        }
    });

    // Watch values for controlled components
    const phoneValue = watch("phone");
    const countryValue = watch("country");

    const onSubmit = async (data: FormValues) => {
        // 1. Honeypot check
        if (data._gotcha) {
            return;
        }

        // 2. Time-lock check (Bots submit instantly)
        const timeElapsed = Date.now() - mountedAt;
        if (timeElapsed < 3000) {
            console.log("Time-lock triggered");
            return;
        }

        try {
            const result = await sendContactEmail(data);

            if (result.success) {
                toast.success(result.message || "¡Mensaje enviado!", {
                    description: "Nos pondremos en contacto contigo pronto.",
                });
            } else {
                toast.error(result.message || "Hubo un error al enviar el mensaje.");
            }
        } catch (error) {
            toast.error("Error de conexión. Inténtalo nuevamente.");
        }
    };

    return (
        <div className="container mx-auto py-10 px-4 md:px-6 max-w-5xl">
            <div className="mb-8 text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Contacto</h1>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                    ¿Tienes alguna duda o necesitas asistencia? Nuestro equipo está listo para ayudarte.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Contact Information */}
                <div className="space-y-6">
                    <Card className="h-full border-none shadow-none bg-transparent md:bg-card md:border md:shadow-sm">
                        <CardHeader>
                            <CardTitle>Información de Contacto</CardTitle>
                            <CardDescription>
                                Contáctanos directamente a través de estos canales.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                    <Mail className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-medium">Correo Electrónico</h3>
                                    <a href="mailto:contacto@seencel.com" className="text-sm text-muted-foreground mt-1 hover:text-primary transition-colors block">
                                        contacto@seencel.com
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                    <Phone className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-medium">WhatsApp</h3>
                                    <a
                                        href="https://wa.me/5491132273000"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-muted-foreground mt-1 hover:text-primary transition-colors block"
                                    >
                                        +54 11 3227 3000
                                    </a>
                                    <p className="text-xs text-muted-foreground">Lun - Vie, 9am - 6pm</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                    <MapPin className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-medium">Oficinas</h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Av. Libertador 1234, Piso 5<br />
                                        Buenos Aires, Argentina
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Contact Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Envíanos un mensaje</CardTitle>
                        <CardDescription>
                            Completa el formulario y te responderemos a la brevedad.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                            {/* Honeypot field - Keep it hidden */}
                            <input type="text" {...register("_gotcha")} className="hidden" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />

                            {/* Row 1: Name / Last Name */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">Nombre</Label>
                                    <Input
                                        id="firstName"
                                        placeholder="Tu nombre"
                                        {...register("firstName")}
                                        className={errors.firstName ? "border-red-500" : ""}
                                    />
                                    {errors.firstName && <span className="text-red-500 text-xs">{errors.firstName.message}</span>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Apellido</Label>
                                    <Input
                                        id="lastName"
                                        placeholder="Tu apellido"
                                        {...register("lastName")}
                                        className={errors.lastName ? "border-red-500" : ""}
                                    />
                                    {errors.lastName && <span className="text-red-500 text-xs">{errors.lastName.message}</span>}
                                </div>
                            </div>

                            {/* Row 2: Email and Phone */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="nombre@empresa.com"
                                        {...register("email")}
                                        className={errors.email ? "border-red-500" : ""}
                                    />
                                    {errors.email && <span className="text-red-500 text-xs">{errors.email.message}</span>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Teléfono</Label>
                                    <PhoneInput
                                        value={phoneValue || ""}
                                        onChange={(val) => setValue("phone", val)}
                                        className="w-full"
                                        placeholder="Ingresa tu número"
                                    />
                                    {/* Phone validation can be added if needed, currently optional */}
                                </div>
                            </div>

                            {/* Row 4: Country */}
                            <div className="space-y-2">
                                <Label htmlFor="country">País</Label>
                                <CountrySelector
                                    value={countryValue}
                                    onChange={(val) => setValue("country", val, { shouldValidate: true })}
                                    countries={COUNTRIES}
                                    placeholder="Selecciona tu país"
                                />
                                {errors.country && <span className="text-red-500 text-xs">{errors.country.message}</span>}
                            </div>

                            {/* Row 5: Subject */}
                            <div className="space-y-2">
                                <Label htmlFor="subject">Asunto</Label>
                                <Input
                                    id="subject"
                                    placeholder="¿Cómo podemos ayudarte?"
                                    {...register("subject")}
                                    className={errors.subject ? "border-red-500" : ""}
                                />
                                {errors.subject && <span className="text-red-500 text-xs">{errors.subject.message}</span>}
                            </div>

                            {/* Row 6: Message */}
                            <div className="space-y-2">
                                <Label htmlFor="message">Mensaje</Label>
                                <Textarea
                                    id="message"
                                    placeholder="Escribe tu mensaje aquí..."
                                    className={`min-h-[120px] ${errors.message ? "border-red-500" : ""}`}
                                    {...register("message")}
                                />
                                {errors.message && <span className="text-red-500 text-xs">{errors.message.message}</span>}
                            </div>

                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="mr-2 h-4 w-4" />
                                )}
                                {isSubmitting ? "Enviando..." : "Enviar Mensaje"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
