"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PhoneInput } from "@/components/ui/phone-input";
import { sendContactEmail } from "../actions/send-contact-email";
import { toast } from "sonner";
import { Loader2, Mail, MessageSquare, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function ContactPageView() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        country: "Argentina",
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

        setIsLoading(true);

        try {
            const result = await sendContactEmail(formData);

            if (result.success) {
                setIsSuccess(true);
                toast.success("¡Mensaje enviado correctamente!");
            } else {
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
                                            country: "Argentina",
                                            subject: "",
                                            message: "",
                                            _gotcha: "",
                                        });
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
                                                <Label htmlFor="country">País *</Label>
                                                <Input
                                                    id="country"
                                                    value={formData.country}
                                                    onChange={(e) => handleChange("country", e.target.value)}
                                                    placeholder="Argentina"
                                                    required
                                                    minLength={2}
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

                                        <Button
                                            type="submit"
                                            className="w-full"
                                            disabled={isLoading}
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
