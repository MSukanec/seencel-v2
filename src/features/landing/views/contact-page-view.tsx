"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PhoneInput } from "@/components/ui/phone-input";
import { CountrySelector, Country } from "@/components/ui/country-selector";
import { sendContactEmail } from "../actions/send-contact-email";
import { toast } from "sonner";
import { Loader2, Mail, MessageSquare, CheckCircle2, Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TurnstileCaptcha, type TurnstileCaptchaRef } from "@/components/shared/turnstile-captcha";

// Static list of common countries for contact form
const CONTACT_COUNTRIES: Country[] = [
    { id: "AR", name: "Argentina", alpha_2: "AR" },
    { id: "BO", name: "Bolivia", alpha_2: "BO" },
    { id: "BR", name: "Brasil", alpha_2: "BR" },
    { id: "CL", name: "Chile", alpha_2: "CL" },
    { id: "CO", name: "Colombia", alpha_2: "CO" },
    { id: "CR", name: "Costa Rica", alpha_2: "CR" },
    { id: "CU", name: "Cuba", alpha_2: "CU" },
    { id: "DO", name: "República Dominicana", alpha_2: "DO" },
    { id: "EC", name: "Ecuador", alpha_2: "EC" },
    { id: "SV", name: "El Salvador", alpha_2: "SV" },
    { id: "ES", name: "España", alpha_2: "ES" },
    { id: "GT", name: "Guatemala", alpha_2: "GT" },
    { id: "HN", name: "Honduras", alpha_2: "HN" },
    { id: "MX", name: "México", alpha_2: "MX" },
    { id: "NI", name: "Nicaragua", alpha_2: "NI" },
    { id: "PA", name: "Panamá", alpha_2: "PA" },
    { id: "PY", name: "Paraguay", alpha_2: "PY" },
    { id: "PE", name: "Perú", alpha_2: "PE" },
    { id: "PR", name: "Puerto Rico", alpha_2: "PR" },
    { id: "UY", name: "Uruguay", alpha_2: "UY" },
    { id: "VE", name: "Venezuela", alpha_2: "VE" },
    { id: "US", name: "Estados Unidos", alpha_2: "US" },
    { id: "OTHER", name: "Otro", alpha_2: null },
];

export function ContactPageView() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const captchaRef = useRef<TurnstileCaptchaRef>(null);

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        country: "AR", // Country ID
        subject: "",
        message: "",
        _gotcha: "", // Honeypot field
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Honeypot check
        if (formData._gotcha) {
            setIsSuccess(true);
            return;
        }

        // Captcha check
        if (!captchaToken) {
            toast.error("Por favor, completá la verificación de seguridad");
            return;
        }

        setIsLoading(true);

        try {
            // Convert country ID to country name for the email
            const countryName = CONTACT_COUNTRIES.find(c => c.id === formData.country)?.name || formData.country;

            const result = await sendContactEmail({
                ...formData,
                country: countryName,
            });

            if (result.success) {
                setIsSuccess(true);
                toast.success("¡Mensaje enviado correctamente!");
            } else {
                // Reset captcha on error
                captchaRef.current?.reset();
                setCaptchaToken(null);
                toast.error(result.message || "Error al enviar el mensaje");
            }
        } catch (error) {
            console.error("Error:", error);
            toast.error("Error al enviar el mensaje. Inténtalo de nuevo.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="container mx-auto px-4 py-16 min-h-[calc(100vh-5rem)] flex items-center">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto w-full">
                {/* Left: Info Section */}
                <div className="space-y-8">
                    <div className="space-y-4">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                            Ponte en contacto
                        </h1>
                        <p className="text-lg text-muted-foreground">
                            ¿Tenés alguna consulta sobre Seencel? Estamos acá para ayudarte.
                            Completá el formulario y te responderemos a la brevedad.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                <Mail className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Email</h3>
                                <a
                                    href="mailto:contacto@seencel.com"
                                    className="text-muted-foreground hover:text-primary transition-colors"
                                >
                                    contacto@seencel.com
                                </a>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                                <Phone className="h-6 w-6 text-green-500" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Teléfono / WhatsApp</h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">+54 9 11 3227-3000</span>
                                    <a
                                        href="tel:+5491132273000"
                                        title="Llamar"
                                        className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-muted transition-colors"
                                    >
                                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                    </a>
                                    <a
                                        href="https://wa.me/5491132273000"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Abrir WhatsApp"
                                        className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-green-500/10 transition-colors"
                                    >
                                        <svg className="h-3.5 w-3.5 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                        </svg>
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                <MessageSquare className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Respuesta</h3>
                                <p className="text-muted-foreground">Generalmente en menos de 24hs</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Form Card */}
                <Card className="shadow-xl border-border/50">
                    <AnimatePresence mode="wait">
                        {isSuccess ? (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="p-12 text-center space-y-4"
                            >
                                <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                                </div>
                                <h3 className="text-2xl font-bold">¡Mensaje enviado!</h3>
                                <p className="text-muted-foreground">
                                    Gracias por contactarnos. Te responderemos a la brevedad.
                                </p>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsSuccess(false);
                                        setFormData({
                                            firstName: "",
                                            lastName: "",
                                            email: "",
                                            phone: "",
                                            country: "AR",
                                            subject: "",
                                            message: "",
                                            _gotcha: "",
                                        });
                                        setCaptchaToken(null);
                                    }}
                                >
                                    Enviar otro mensaje
                                </Button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="form"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <CardHeader>
                                    <CardTitle>Envianos un mensaje</CardTitle>
                                    <CardDescription>
                                        Completá el formulario y nos pondremos en contacto.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        {/* Honeypot - Hidden from users */}
                                        <input
                                            type="text"
                                            name="_gotcha"
                                            value={formData._gotcha}
                                            onChange={(e) => handleChange("_gotcha", e.target.value)}
                                            style={{ display: "none" }}
                                            tabIndex={-1}
                                            autoComplete="off"
                                        />

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="firstName">Nombre *</Label>
                                                <Input
                                                    id="firstName"
                                                    value={formData.firstName}
                                                    onChange={(e) => handleChange("firstName", e.target.value)}
                                                    placeholder="Juan"
                                                    required
                                                    minLength={2}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="lastName">Apellido *</Label>
                                                <Input
                                                    id="lastName"
                                                    value={formData.lastName}
                                                    onChange={(e) => handleChange("lastName", e.target.value)}
                                                    placeholder="Pérez"
                                                    required
                                                    minLength={2}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email *</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => handleChange("email", e.target.value)}
                                                placeholder="juan@ejemplo.com"
                                                required
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="phone">Teléfono</Label>
                                                <PhoneInput
                                                    id="phone"
                                                    defaultCountry="AR"
                                                    value={formData.phone}
                                                    onChange={(value) => handleChange("phone", value || "")}
                                                    placeholder="+54 9 11..."
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>País *</Label>
                                                <CountrySelector
                                                    value={formData.country}
                                                    onChange={(value) => handleChange("country", value)}
                                                    countries={CONTACT_COUNTRIES}
                                                    placeholder="Seleccionar país..."
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="subject">Asunto *</Label>
                                            <Input
                                                id="subject"
                                                value={formData.subject}
                                                onChange={(e) => handleChange("subject", e.target.value)}
                                                placeholder="¿En qué podemos ayudarte?"
                                                required
                                                minLength={5}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="message">Mensaje *</Label>
                                            <Textarea
                                                id="message"
                                                value={formData.message}
                                                onChange={(e) => handleChange("message", e.target.value)}
                                                placeholder="Contanos tu consulta..."
                                                className="min-h-[120px]"
                                                required
                                                minLength={10}
                                                maxLength={1000}
                                            />
                                            <p className="text-xs text-muted-foreground text-right">
                                                {formData.message.length}/1000
                                            </p>
                                        </div>

                                        <TurnstileCaptcha
                                            ref={captchaRef}
                                            onVerify={(token) => setCaptchaToken(token)}
                                            onError={() => toast.error("Error de verificación")}
                                            onExpire={() => setCaptchaToken(null)}
                                        />

                                        <Button
                                            type="submit"
                                            className="w-full"
                                            disabled={isLoading || !captchaToken}
                                            size="lg"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Enviando...
                                                </>
                                            ) : (
                                                "Enviar mensaje"
                                            )}
                                        </Button>
                                    </form>
                                </CardContent>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Card>
            </div>
        </div>
    );
}
