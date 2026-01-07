"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, Send } from "lucide-react";

export function ContactView() {
    const t = useTranslations('Common'); // Or specific Contact namespace if available

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
                                    <p className="text-sm text-muted-foreground mt-1">support@seencel.com</p>
                                    <p className="text-sm text-muted-foreground">ventas@seencel.com</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                    <Phone className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-medium">Teléfono</h3>
                                    <p className="text-sm text-muted-foreground mt-1">+54 11 1234-5678</p>
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
                        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">Nombre</Label>
                                    <Input id="firstName" placeholder="Tu nombre" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Apellido</Label>
                                    <Input id="lastName" placeholder="Tu apellido" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" placeholder="nombre@empresa.com" />
                            </div>
                            <Label htmlFor="subject">Asunto</Label>
                            <Input id="subject" placeholder="¿Cómo podemos ayudarte?" />
                            <div className="space-y-2">
                                <Label htmlFor="message">Mensaje</Label>
                                <Textarea
                                    id="message"
                                    placeholder="Escribe tu mensaje aquí..."
                                    className="min-h-[120px]"
                                />
                            </div>
                            <Button type="submit" className="w-full">
                                <Send className="mr-2 h-4 w-4" />
                                Enviar Mensaje
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
