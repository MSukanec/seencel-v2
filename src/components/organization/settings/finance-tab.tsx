"use client";

import { OrganizationPreferences, OrganizationCurrency, OrganizationWallet, Currency, Wallet } from "@/types/organization";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Coins, Wallet as WalletIcon, Settings2, Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FinanceTabProps {
    preferences?: OrganizationPreferences | null;
    orgCurrencies?: OrganizationCurrency[];
    orgWallets?: OrganizationWallet[];
    availableCurrencies?: Currency[];
    availableWallets?: Wallet[];
}

export function FinanceTab({
    preferences,
    orgCurrencies = [],
    orgWallets = [],
    availableCurrencies = [],
    availableWallets = []
}: FinanceTabProps) {

    // Helper to find name via ID
    const getCurrencyName = (id?: string | null) => availableCurrencies.find(c => c.id === id)?.name || "Sin seleccionar";
    const getWalletName = (id?: string | null) => availableWallets.find(w => w.id === id)?.name || "Sin seleccionar";

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold tracking-tight">Finanzas</h2>
                    <p className="text-sm text-muted-foreground">
                        Gestiona las monedas y billeteras habilitadas para tu organización.
                    </p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* CURRENCIES SECTION */}
                <Card className="border shadow-sm">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Coins className="w-5 h-5 text-primary" />
                            <CardTitle>Monedas</CardTitle>
                        </div>
                        <CardDescription>
                            Define la moneda principal para reportes y las monedas secundarias aceptadas.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Default Currency */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Moneda Por Defecto
                            </label>
                            <Select disabled defaultValue={preferences?.default_currency_id || undefined}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Selecciona una moneda" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableCurrencies.map(c => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.name} ({c.code})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-[10px] text-muted-foreground">
                                Esta es la moneda base para todos los cálculos financieros.
                            </p>
                        </div>

                        {/* Secondary Currencies */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium">Monedas Secundarias</label>
                                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                                    <Plus className="w-3 h-3 mr-1" />
                                    Agregar
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {orgCurrencies.length === 0 ? (
                                    <span className="text-sm text-muted-foreground italic">No hay monedas secundarias activas.</span>
                                ) : (
                                    orgCurrencies.map(oc => (
                                        <Badge key={oc.id} variant="secondary" className="flex gap-1 items-center px-3 py-1">
                                            {oc.currency_code}
                                            {oc.is_default && <span className="text-[10px] ml-1 bg-primary/10 text-primary px-1 rounded">DEFAULT</span>}
                                        </Badge>
                                    ))
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* WALLETS SECTION */}
                <Card className="border shadow-sm">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <WalletIcon className="w-5 h-5 text-primary" />
                            <CardTitle>Billeteras</CardTitle>
                        </div>
                        <CardDescription>
                            Configura los métodos de pago y cuentas habilitadas (Caja Chica, Banco, etc.).
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Default Wallet */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">
                                Billetera Por Defecto
                            </label>
                            <Select disabled defaultValue={preferences?.default_wallet_id || undefined}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Selecciona una billetera" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableWallets.map(w => (
                                        <SelectItem key={w.id} value={w.id}>
                                            {w.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-[10px] text-muted-foreground">
                                Billetera preseleccionada para nuevos movimientos.
                            </p>
                        </div>

                        {/* Secondary Wallets */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium">Billeteras Habilitadas</label>
                                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                                    <Plus className="w-3 h-3 mr-1" />
                                    Agregar
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {orgWallets.length === 0 ? (
                                    <span className="text-sm text-muted-foreground italic">No hay billeteras extra activas.</span>
                                ) : (
                                    orgWallets.map(ow => (
                                        <Badge key={ow.id} variant="outline" className="flex gap-1 items-center px-3 py-1 bg-background hover:bg-muted/50 cursor-pointer">
                                            {ow.wallet_name}
                                        </Badge>
                                    ))
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
