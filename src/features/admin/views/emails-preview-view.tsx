"use client";

import { useState } from "react";
import {
    WelcomeEmail,
    PurchaseConfirmationEmail,
    SubscriptionActivatedEmail,
    SubscriptionExpiringEmail,
    SubscriptionExpiredEmail,
    BankTransferPendingEmail,
    BankTransferVerifiedEmail,
} from "@/features/emails/templates";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Mail,
    CreditCard,
    Rocket,
    Clock,
    AlertCircle,
    Building2,
    CheckCircle
} from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";

const EMAIL_TEMPLATES = [
    {
        id: "welcome",
        name: "Bienvenida",
        icon: Mail,
        description: "Enviado al registrarse",
        category: "Autenticación",
        component: (
            <WelcomeEmail
                firstName="Juan"
                email="juan@ejemplo.com"
            />
        ),
    },
    {
        id: "purchase",
        name: "Confirmación de Compra",
        icon: CreditCard,
        description: "Enviado al completar pago",
        category: "Pagos",
        component: (
            <PurchaseConfirmationEmail
                firstName="Juan"
                planName="Pro"
                billingCycle="annual"
                amount="99.00"
                currency="USD"
                paymentMethod="mercadopago"
                transactionId="MP-123456789"
                purchaseDate="28 de Enero, 2026"
            />
        ),
    },
    {
        id: "subscription-activated",
        name: "Suscripción Activada",
        icon: Rocket,
        description: "Enviado al activar plan",
        category: "Suscripciones",
        component: (
            <SubscriptionActivatedEmail
                firstName="Juan"
                planName="Pro"
                billingCycle="monthly"
                expiresAt="28 de Febrero, 2026"
                dashboardUrl="https://seencel.com/dashboard"
            />
        ),
    },
    {
        id: "subscription-expiring",
        name: "Suscripción por Vencer",
        icon: Clock,
        description: "Recordatorio 7 días antes",
        category: "Suscripciones",
        component: (
            <SubscriptionExpiringEmail
                firstName="Juan"
                planName="Pro"
                expiresAt="4 de Febrero, 2026"
                daysRemaining={7}
                renewUrl="https://seencel.com/organization/billing/plans"
            />
        ),
    },
    {
        id: "subscription-expired",
        name: "Suscripción Expirada",
        icon: AlertCircle,
        description: "Enviado al expirar plan",
        category: "Suscripciones",
        component: (
            <SubscriptionExpiredEmail
                firstName="Juan"
                planName="Pro"
                expiredAt="28 de Enero, 2026"
                reactivateUrl="https://seencel.com/organization/billing/plans"
            />
        ),
    },
    {
        id: "bank-transfer-pending",
        name: "Transferencia Pendiente",
        icon: Building2,
        description: "Instrucciones de pago",
        category: "Pagos",
        component: (
            <BankTransferPendingEmail
                firstName="Juan"
                planName="Pro"
                amount="15,000"
                currency="ARS"
                bankName="Banco Galicia"
                accountHolder="Seencel S.R.L."
                accountNumber="0070012030004567891234"
                reference="SEENCEL-ABC123"
                expiresAt="30 de Enero, 2026"
            />
        ),
    },
    {
        id: "bank-transfer-verified",
        name: "Transferencia Verificada",
        icon: CheckCircle,
        description: "Confirmación de verificación",
        category: "Pagos",
        component: (
            <BankTransferVerifiedEmail
                firstName="Juan"
                planName="Pro"
                amount="15,000"
                currency="ARS"
                verifiedAt="28 de Enero, 2026 - 14:32"
            />
        ),
    },
];

export function EmailsPreviewView() {
    const [selectedTemplate, setSelectedTemplate] = useState(EMAIL_TEMPLATES[0].id);
    const [viewMode, setViewMode] = useState<"preview" | "html">("preview");

    const currentTemplate = EMAIL_TEMPLATES.find(t => t.id === selectedTemplate);

    return (
        <div className="flex flex-col gap-6">
            {/* Template Selector */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {EMAIL_TEMPLATES.map((template) => {
                    const Icon = template.icon;
                    const isSelected = selectedTemplate === template.id;
                    return (
                        <button
                            key={template.id}
                            onClick={() => setSelectedTemplate(template.id)}
                            className={`
                                p-4 rounded-lg border text-left transition-all
                                ${isSelected
                                    ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                                    : "border-border hover:border-muted-foreground/30 hover:bg-muted/50"
                                }
                            `}
                        >
                            <Icon className={`h-5 w-5 mb-2 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                            <div className="text-sm font-medium truncate">{template.name}</div>
                            <div className="text-xs text-muted-foreground truncate">{template.description}</div>
                        </button>
                    );
                })}
            </div>

            {/* Preview Area */}
            {currentTemplate && (
                <Card className="overflow-hidden">
                    <div className="border-b bg-muted/50 px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <currentTemplate.icon className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <h3 className="font-semibold">{currentTemplate.name}</h3>
                                <p className="text-xs text-muted-foreground">{currentTemplate.description}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline">{currentTemplate.category}</Badge>
                            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "preview" | "html")}>
                                <TabsList className="h-8">
                                    <TabsTrigger value="preview" className="text-xs px-3 h-7">
                                        Vista Previa
                                    </TabsTrigger>
                                    <TabsTrigger value="html" className="text-xs px-3 h-7">
                                        HTML
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                    </div>

                    <CardContent className="p-0">
                        {viewMode === "preview" ? (
                            <div className="flex justify-center bg-[#e5e7eb] p-8 min-h-[600px]">
                                <div className="w-full max-w-[600px] shadow-2xl">
                                    {currentTemplate.component}
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 bg-zinc-950">
                                <pre className="text-xs text-zinc-300 overflow-x-auto whitespace-pre-wrap font-mono">
                                    {renderToStaticMarkup(currentTemplate.component)}
                                </pre>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
