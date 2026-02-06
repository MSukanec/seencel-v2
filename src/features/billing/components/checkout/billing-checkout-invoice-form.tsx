"use client";

// ============================================================
// BILLING CHECKOUT INVOICE FORM
// ============================================================
// Formulario opcional de datos de facturación
// ============================================================

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CountrySelector } from "@/components/ui/country-selector";
import { Receipt } from "lucide-react";
import type { InvoiceData } from "@/features/billing/types/checkout";

// ============================================================
// PROPS
// ============================================================

interface BillingCheckoutInvoiceFormProps {
    data: InvoiceData;
    onChange: (data: Partial<InvoiceData>) => void;
    countries?: { id: string; name: string; alpha_2: string | null }[];
}

// ============================================================
// COMPONENT
// ============================================================

export function BillingCheckoutInvoiceForm({
    data,
    onChange,
    countries = [],
}: BillingCheckoutInvoiceFormProps) {
    return (
        <Card>
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Receipt className="h-5 w-5 text-primary" />
                        Datos de Facturación
                    </CardTitle>
                    <Switch
                        checked={data.needsInvoice}
                        onCheckedChange={(checked) => onChange({ needsInvoice: checked })}
                    />
                </div>
                <p className="text-sm text-muted-foreground">
                    Activá esta opción si necesitás factura para tu compra
                </p>
            </CardHeader>

            {data.needsInvoice && (
                <CardContent className="space-y-4 pt-0">
                    <Separator />

                    {/* Company Toggle */}
                    <div className="flex items-center justify-between py-2">
                        <div>
                            <Label className="text-sm font-medium">Facturar a empresa</Label>
                            <p className="text-xs text-muted-foreground">
                                Activá si necesitás factura a nombre de empresa
                            </p>
                        </div>
                        <Switch
                            checked={data.isCompany}
                            onCheckedChange={(checked) => onChange({ isCompany: checked })}
                        />
                    </div>

                    {/* Name/Company + Tax ID */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="billing_name">
                                {data.isCompany ? "Razón Social" : "Nombre Completo"}
                            </Label>
                            <Input
                                id="billing_name"
                                value={data.billingName}
                                onChange={(e) => onChange({ billingName: e.target.value })}
                                placeholder={data.isCompany ? "Mi Empresa S.A." : "Juan Pérez"}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tax_id">CUIT / NIF / RFC</Label>
                            <Input
                                id="tax_id"
                                value={data.taxId}
                                onChange={(e) => onChange({ taxId: e.target.value })}
                                placeholder="20-12345678-9"
                            />
                        </div>
                    </div>

                    {/* Address + Country */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="address">Dirección</Label>
                            <Input
                                id="address"
                                value={data.address}
                                onChange={(e) => onChange({ address: e.target.value })}
                                placeholder="Calle y número"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="country">País</Label>
                            <CountrySelector
                                value={data.countryId}
                                onChange={(value) => onChange({ countryId: value })}
                                countries={countries}
                                placeholder="Seleccionar país"
                            />
                        </div>
                    </div>

                    {/* City + Postcode */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="city">Ciudad</Label>
                            <Input
                                id="city"
                                value={data.city}
                                onChange={(e) => onChange({ city: e.target.value })}
                                placeholder="Ciudad"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="postcode">Código Postal</Label>
                            <Input
                                id="postcode"
                                value={data.postcode}
                                onChange={(e) => onChange({ postcode: e.target.value })}
                                placeholder="1234"
                            />
                        </div>
                    </div>
                </CardContent>
            )}
        </Card>
    );
}
