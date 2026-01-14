"use client";

import { OrganizationPreferences, OrganizationCurrency, OrganizationWallet, Currency, Wallet } from "@/types/organization";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Coins, Wallet as WalletIcon, Settings2, Plus, Trash2, Check, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormGroup } from "@/components/ui/form-group";
import { MultiSelect } from "@/components/ui/multi-select";
import { ManagedList } from "@/components/ui/managed-list";
import { useTransition, useState } from "react";
import { updateOrganizationPreferences, addOrganizationCurrency, removeOrganizationCurrency, addOrganizationWallet, removeOrganizationWallet } from "@/actions/organization-settings";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";
import { DeleteConfirmationDialog } from "@/components/shared/delete-confirmation-dialog";

interface FinanceTabProps {
    preferences?: OrganizationPreferences | null;
    orgCurrencies?: OrganizationCurrency[];
    orgWallets?: OrganizationWallet[];
    availableCurrencies?: Currency[];
    availableWallets?: Wallet[];
    organizationId: string;
}

export function FinanceTab({
    preferences,
    orgCurrencies = [],
    orgWallets = [],
    availableCurrencies = [],
    availableWallets = [],
    organizationId
}: FinanceTabProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [itemToDelete, setItemToDelete] = useState<{ type: 'currency' | 'wallet', id: string } | null>(null);

    const handleConfirmDelete = () => {
        if (!itemToDelete || !organizationId) return;

        startTransition(async () => {
            try {
                if (itemToDelete.type === 'currency') {
                    await removeOrganizationCurrency(organizationId, itemToDelete.id);
                    toast.success("Moneda removida");
                } else {
                    await removeOrganizationWallet(organizationId, itemToDelete.id);
                    toast.success("Billetera removida");
                }
                router.refresh();
            } catch (error) {
                toast.error("Error al remover elemento");
            } finally {
                setItemToDelete(null);
            }
        });
    };

    // Helper to find name via ID
    const getCurrencyName = (id?: string | null) => availableCurrencies.find(c => c.id === id)?.name || "Sin seleccionar";
    const getWalletName = (id?: string | null) => availableWallets.find(w => w.id === id)?.name || "Sin seleccionar";

    // Filtering available currencies for secondary: Exclude default currency 
    const availableSecondaryCurrencies = availableCurrencies.filter(c =>
        c.id !== preferences?.default_currency_id
    );

    const availableSecondaryCurrencyOptions = availableSecondaryCurrencies.map(c => ({
        label: `${c.name} (${c.code})`,
        value: c.id
    }));

    const secondaryCurrencies = orgCurrencies.filter(oc => !oc.is_default);


    // WALLETS LOGIC
    // Exclude default wallet from options
    const availableWalletOptions = availableWallets
        .filter(w => w.id !== preferences?.default_wallet_id)
        .map(w => ({ label: w.name, value: w.id }));

    const selectedWalletIds = orgWallets
        .filter(ow => !ow.is_default && ow.wallet_id !== preferences?.default_wallet_id)
        .map(ow => ow.wallet_id);

    const handleWalletsChange = (newValues: string[]) => {
        if (!organizationId) return;

        // Check for additions
        const addedId = newValues.find(id => !selectedWalletIds.includes(id));
        if (addedId) {
            startTransition(async () => {
                try {
                    await addOrganizationWallet(organizationId, addedId, false);
                    toast.success("Billetera agregada");
                    router.refresh();
                } catch (error) {
                    toast.error("Error al agregar billetera");
                }
            });
            return;
        }

        // Check for removals
        const removedId = selectedWalletIds.find(id => !newValues.includes(id));
        if (removedId) {
            setItemToDelete({ type: 'wallet', id: removedId });
            return;
        }
    };

    const handleUpdatePreference = (key: keyof OrganizationPreferences, value: any) => {
        if (!organizationId) return;

        startTransition(async () => {
            try {
                await updateOrganizationPreferences(organizationId, { [key]: value });
                toast.success("Preferencia actualizada");
                router.refresh();
            } catch (error) {
                toast.error("Error al actualizar preferencia");
            }
        });
    };

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
                        <FormGroup
                            label="Moneda Por Defecto"
                            helpText="Esta es la moneda base para todos los cálculos financieros."
                        >
                            <Select
                                disabled={isPending}
                                value={preferences?.default_currency_id || undefined}
                                onValueChange={(val) => handleUpdatePreference('default_currency_id', val)}
                            >
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
                        </FormGroup>

                        {/* Secondary Currencies */}
                        {/* Secondary Currencies */}
                        <FormGroup
                            label="Monedas Secundarias"
                            helpText="Selecciona una moneda adicional (máximo 1)."
                        >
                            <ManagedList
                                items={secondaryCurrencies.map(oc => {
                                    const c = availableCurrencies.find(ac => ac.id === oc.currency_id);
                                    return {
                                        id: oc.currency_id,
                                        label: c ? `${c.name} (${c.code})` : "Desconocido",
                                    };
                                })}
                                availableOptions={availableSecondaryCurrencyOptions}
                                onAdd={(val) => {
                                    if (!organizationId) return;
                                    startTransition(async () => {
                                        try {
                                            await addOrganizationCurrency(organizationId, val, false);
                                            toast.success("Moneda agregada");
                                            router.refresh();
                                        } catch (error: any) {
                                            toast.error(error.message || "Error al agregar moneda");
                                        }
                                    });
                                }}
                                onRemove={(id) => setItemToDelete({ type: 'currency', id })}
                                maxItems={1}
                                disabled={isPending}
                                dialogTitle="Agregar Moneda Secundaria"
                                dialogDescription="Selecciona una moneda adicional para usar en la organización."
                                selectLabel="Moneda"
                            />
                        </FormGroup>
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
                        <FormGroup
                            label="Billetera Por Defecto"
                            helpText="Billetera preseleccionada para nuevos movimientos."
                        >
                            <Select
                                disabled={isPending}
                                value={preferences?.default_wallet_id || undefined}
                                onValueChange={(val) => handleUpdatePreference('default_wallet_id', val)}
                            >
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
                        </FormGroup>

                        {/* Secondary Wallets */}
                        <FormGroup
                            label="Billeteras Habilitadas"
                            helpText="Selecciona cuentas adicionales para usar en transacciones."
                        >
                            <MultiSelect
                                options={availableWalletOptions}
                                selected={selectedWalletIds}
                                onChange={handleWalletsChange}
                                disabled={isPending}
                                placeholder="Seleccionar billeteras..."
                                searchPlaceholder="Buscar billetera..."
                                emptyText="No se encontraron billeteras."
                            />
                        </FormGroup>
                    </CardContent>
                </Card>
            </div>

            <DeleteConfirmationDialog
                open={!!itemToDelete}
                onOpenChange={(open) => !open && setItemToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Deshabilitar Elemento"
                description={
                    <span>
                        Al deshabilitar este elemento, dejará de aparecer como opción para nuevos movimientos.
                        <br /><br />
                        Los registros históricos y saldos existentes <strong>no se verán afectados</strong> y permanecerán intactos.
                    </span>
                }
                confirmLabel="Deshabilitar"
                isDeleting={isPending}
            />
        </div>
    );
}
