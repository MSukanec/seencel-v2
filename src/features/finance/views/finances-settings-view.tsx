"use client";

import { OrganizationPreferences, OrganizationCurrency, OrganizationWallet, Currency, Wallet, OrganizationSubscription } from "@/types/organization";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, Wallet as WalletIcon, Lightbulb } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { FormGroup } from "@/components/ui/form-group";
import { MultiSelect } from "@/components/ui/multi-select";
import { ContentLayout } from "@/components/layout";
import { useTransition, useState, useEffect, useOptimistic } from "react";
import { updateOrganizationPreferences, addOrganizationCurrency, removeOrganizationCurrency, addOrganizationWallet, removeOrganizationWallet } from "@/actions/organization-settings";
import { updateInsightConfig } from "@/features/organization/actions";
import { Slider } from "@/components/ui/slider";
import { FeatureGuard, FeatureLockBadge } from "@/components/ui/feature-guard";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";
import { DeleteConfirmationDialog } from "@/components/shared/forms/general/delete-confirmation-dialog";

interface FinancesSettingsViewProps {
    preferences?: OrganizationPreferences | null;
    orgCurrencies?: OrganizationCurrency[];
    orgWallets?: OrganizationWallet[];
    availableCurrencies?: Currency[];
    availableWallets?: Wallet[];
    organizationId: string;
    subscription?: OrganizationSubscription | null;
}

export function FinancesSettingsView({
    preferences,
    orgCurrencies = [],
    orgWallets = [],
    availableCurrencies = [],
    availableWallets = [],
    organizationId,
    subscription
}: FinancesSettingsViewProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [itemToDelete, setItemToDelete] = useState<{ type: 'currency' | 'wallet', id: string } | null>(null);

    // 🚀 OPTIMISTIC UI: Instant visual updates for currencies and wallets
    const [optimisticCurrencies, setOptimisticCurrencies] = useOptimistic(
        orgCurrencies,
        (current, removedId: string) => current.filter(c => c.currency_id !== removedId)
    );

    const [optimisticWallets, setOptimisticWallets] = useOptimistic(
        orgWallets,
        (current, removedId: string) => current.filter(w => w.wallet_id !== removedId)
    );

    const handleConfirmDelete = () => {
        if (!itemToDelete || !organizationId) return;
        const { type, id } = itemToDelete;
        setItemToDelete(null); // Close dialog immediately

        startTransition(async () => {
            // 🚀 Optimistic update - item disappears NOW
            if (type === 'currency') {
                setOptimisticCurrencies(id);
            } else {
                setOptimisticWallets(id);
            }

            try {
                if (type === 'currency') {
                    await removeOrganizationCurrency(organizationId, id);
                    toast.success("Moneda removida");
                } else {
                    await removeOrganizationWallet(organizationId, id);
                    toast.success("Billetera removida");
                }
            } catch (error) {
                toast.error("Error al remover elemento");
                router.refresh(); // Recover on error
            }
        });
    };

    // Filtering available currencies for secondary: Exclude default currency 
    const availableSecondaryCurrencies = availableCurrencies.filter(c =>
        c.id !== preferences?.default_currency_id
    );

    const availableSecondaryCurrencyOptions = availableSecondaryCurrencies.map(c => ({
        label: `${c.name} (${c.code})`,
        value: c.id
    }));

    const secondaryCurrencies = optimisticCurrencies.filter(oc => !oc.is_default);


    // WALLETS LOGIC
    // Exclude default wallet from options
    const availableWalletOptions = availableWallets
        .filter(w => w.id !== preferences?.default_wallet_id)
        .map(w => ({ label: w.name, value: w.id }));

    const selectedWalletIds = optimisticWallets
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

    // NAVIGATION ITEMS
    const sections = [
        { id: "currencies", label: "Monedas", icon: Coins },
        { id: "wallets", label: "Billeteras", icon: WalletIcon },
        { id: "insights", label: "Insights & Alertas", icon: Lightbulb },
    ];

    const [activeSection, setActiveSection] = useState("currencies");

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setActiveSection(entry.target.id);
                }
            });
        }, {
            rootMargin: "-20% 0px -60% 0px" // Adjust to trigger when section is somewhat in view
        });

        sections.forEach(section => {
            const el = document.getElementById(section.id);
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, []);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const handleUpdateInsightConfig = (newConfig: any) => {
        if (!organizationId) return;
        startTransition(async () => {
            try {
                await updateInsightConfig(organizationId, newConfig);
                toast.success("Configuración actualizada");
                router.refresh();
            } catch (error) { toast.error("Error al actualizar"); }
        });
    };

    return (
        <ContentLayout variant="wide">
            <div className="space-y-6 max-w-5xl mx-auto">
                <div className="flex justify-between items-center border-b pb-6">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Configuración Financiera</h2>
                        <p className="text-muted-foreground">
                            Gestiona las monedas, billeteras y alertas de tu organización.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 items-start">

                    {/* SIDEBAR NAVIGATION (Sticky) */}
                    <aside className="w-full lg:w-64 flex-none lg:sticky lg:top-6 space-y-2">
                        {sections.map(item => (
                            <button
                                key={item.id}
                                onClick={() => scrollToSection(item.id)}
                                className={cn(
                                    "w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors text-left",
                                    activeSection === item.id
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <item.icon className="w-4 h-4" />
                                {item.label}
                            </button>
                        ))}
                    </aside>

                    {/* CONTENT SECTIONS */}
                    <div className="flex-1 space-y-12 min-w-0">

                        {/* SECTION 1: CURRENCIES */}
                        <div id="currencies" className="scroll-mt-6 space-y-4">
                            <div className="border-b pb-2">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <Coins className="w-5 h-5" /> Monedas
                                </h3>
                                <p className="text-sm text-muted-foreground">Define la moneda base y las secundarias aceptadas.</p>
                            </div>

                            <Card className="border shadow-none bg-card/50">
                                <CardHeader>
                                    <CardTitle className="text-base">Configuración de Moneda</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Default Currency - LOCKED */}
                                    <FormGroup label="Moneda Principal">
                                        <Select disabled={true} value={preferences?.default_currency_id || undefined}>
                                            <SelectTrigger className="w-full opacity-70 cursor-not-allowed bg-muted/50">
                                                <SelectValue placeholder="Selecciona una moneda" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableCurrencies.map(c => (
                                                    <SelectItem key={c.id} value={c.id}>{c.name} ({c.code})</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-[0.8rem] text-muted-foreground mt-2">
                                            La moneda base no puede ser modificada. Contáctanos si necesitas ayuda.
                                        </p>
                                    </FormGroup>

                                    {/* Secondary Currencies */}
                                    <FormGroup label="Monedas Secundarias" helpText="Monedas adicionales aceptadas.">
                                        <MultiSelect
                                            options={availableSecondaryCurrencyOptions}
                                            selected={secondaryCurrencies.map(sc => sc.currency_id)}
                                            onChange={(newValues) => {
                                                if (!organizationId) return;
                                                const currentIds = secondaryCurrencies.map(sc => sc.currency_id);
                                                // Add logic
                                                const addedId = newValues.find(id => !currentIds.includes(id));
                                                if (addedId) {
                                                    startTransition(async () => {
                                                        try {
                                                            await addOrganizationCurrency(organizationId, addedId, false);
                                                            toast.success("Moneda agregada");
                                                            router.refresh();
                                                        } catch (error: any) { toast.error(error.message || "Error"); }
                                                    });
                                                    return;
                                                }
                                                // Remove logic
                                                const removedId = currentIds.find(id => !newValues.includes(id));
                                                if (removedId) {
                                                    setItemToDelete({ type: 'currency', id: removedId });
                                                    return;
                                                }
                                            }}
                                            disabled={isPending}
                                            placeholder="Seleccionar monedas..."
                                            searchPlaceholder="Buscar moneda..."
                                            emptyText="No se encontraron monedas."
                                        />
                                    </FormGroup>

                                    {/* Reference Currency Switch */}
                                    <div className="flex flex-row items-center justify-between rounded-lg border p-4 bg-background">
                                        <div className="space-y-0.5">
                                            <div className="text-sm font-medium">Estandarización de Moneda</div>
                                            <div className="text-xs text-muted-foreground">Habilita una moneda de referencia para reportes unificados.</div>
                                        </div>
                                        <Switch
                                            checked={preferences?.use_currency_exchange || false}
                                            onCheckedChange={(val) => handleUpdatePreference('use_currency_exchange', val)}
                                            disabled={isPending}
                                        />
                                    </div>

                                    {/* Reference Currency Selector */}
                                    {preferences?.use_currency_exchange && (
                                        <div className="animate-in fade-in slide-in-from-top-2 duration-300 pl-4 border-l-2 border-primary/20">
                                            <FormGroup label="Moneda de Referencia">
                                                <Select
                                                    disabled={isPending}
                                                    value={preferences?.functional_currency_id || preferences?.default_currency_id || undefined}
                                                    onValueChange={(val) => handleUpdatePreference('functional_currency_id', val)}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Selecciona moneda ref" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {availableCurrencies.map(c => (
                                                            <SelectItem key={c.id} value={c.id}>{c.name} ({c.code})</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FormGroup>
                                        </div>
                                    )}

                                    {/* Decimal Places Selector */}
                                    <FormGroup label="Decimales en Montos" helpText="Cantidad de decimales a mostrar en valores monetarios.">
                                        <Select
                                            disabled={isPending}
                                            value={String(preferences?.currency_decimal_places ?? 2)}
                                            onValueChange={(val) => handleUpdatePreference('currency_decimal_places', parseInt(val, 10))}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Selecciona decimales" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="0">Sin decimales (enteros)</SelectItem>
                                                <SelectItem value="1">1 decimal</SelectItem>
                                                <SelectItem value="2">2 decimales (estándar)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormGroup>

                                    {/* KPI Format Toggle */}
                                    <div className="flex flex-row items-center justify-between rounded-lg border p-4 bg-background">
                                        <div className="space-y-0.5">
                                            <div className="text-sm font-medium">Formato de KPIs</div>
                                            <div className="text-xs text-muted-foreground">
                                                Cómo mostrar los números grandes en dashboards.
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-mono text-muted-foreground">
                                                {preferences?.kpi_compact_format ? "$ 10K" : "$ 10.568"}
                                            </span>
                                            <Switch
                                                checked={preferences?.kpi_compact_format || false}
                                                onCheckedChange={(val) => handleUpdatePreference('kpi_compact_format', val)}
                                                disabled={isPending}
                                            />
                                        </div>
                                    </div>

                                    {/* Default Tax Label Selector */}
                                    <FormGroup label="Etiqueta de Impuesto" helpText="Nombre del impuesto usado por defecto en cotizaciones (IVA, VAT, etc).">
                                        <Select
                                            disabled={isPending}
                                            value={preferences?.default_tax_label || 'IVA'}
                                            onValueChange={(val) => handleUpdatePreference('default_tax_label', val)}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Selecciona etiqueta" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="IVA">IVA (Impuesto al Valor Agregado)</SelectItem>
                                                <SelectItem value="VAT">VAT (Value Added Tax)</SelectItem>
                                                <SelectItem value="Sales Tax">Sales Tax (USA)</SelectItem>
                                                <SelectItem value="GST">GST (Goods and Services Tax)</SelectItem>
                                                <SelectItem value="ICMS">ICMS (Brasil)</SelectItem>
                                                <SelectItem value="Tax">Tax (Genérico)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormGroup>
                                </CardContent>
                            </Card>
                        </div>

                        {/* SECTION 2: WALLETS */}
                        <div id="wallets" className="scroll-mt-6 space-y-4">
                            <div className="border-b pb-2">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <WalletIcon className="w-5 h-5" /> Billeteras
                                </h3>
                                <p className="text-sm text-muted-foreground">Gestión de cajas y cuentas bancarias.</p>
                            </div>

                            <Card className="border shadow-none bg-card/50">
                                <CardHeader>
                                    <CardTitle className="text-base">Configuración de Cuentas</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <FormGroup label="Billetera Por Defecto" helpText="Se usará automáticamente en nuevos movimientos.">
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
                                                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormGroup>

                                    <FormGroup label="Billeteras Habilitadas" helpText="Cuentas disponibles para elegir en transacciones.">
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

                        {/* SECTION 3: INSIGHTS */}
                        <div id="insights" className="scroll-mt-6 space-y-4">
                            <div className="border-b pb-2">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <Lightbulb className="w-5 h-5" /> Insights & Alertas
                                </h3>
                                <p className="text-sm text-muted-foreground">Personaliza la sensibilidad de las alertas automáticas.</p>
                            </div>

                            <Card className="border shadow-none bg-card/50">
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-base">Umbrales de Detección</CardTitle>
                                        {subscription?.plan?.features?.custom_insight_thresholds !== true && (
                                            <FeatureLockBadge
                                                featureName="Configurar Insights"
                                                requiredPlan="PRO"
                                            />
                                        )}
                                    </div>
                                    <CardDescription>Ajusta qué tan sensible es el sistema para generar avisos.</CardDescription>
                                </CardHeader>
                                <FeatureGuard
                                    isEnabled={subscription?.plan?.features?.custom_insight_thresholds === true}
                                    featureName="Configurar Insights"
                                    requiredPlan="PRO"
                                    showBadge={false}
                                    showPopover={false}
                                >
                                    <CardContent className="space-y-8">

                                        {/* 1. GROWTH SIGNIFICANT */}
                                        <div className="space-y-4">
                                            <div className="flex justify-between">
                                                <div className="space-y-0.5">
                                                    <label className="text-sm font-medium">Variación Significativa ({preferences?.insight_config?.thresholds?.growthSignificant ?? 15}%)</label>
                                                    <p className="text-xs text-muted-foreground">Porcentaje de cambio mensual para considerar una alerta de "Aumento/Ahorro".</p>
                                                </div>
                                            </div>
                                            <Slider
                                                defaultValue={[preferences?.insight_config?.thresholds?.growthSignificant ?? 15]}
                                                max={50}
                                                min={5}
                                                step={1}
                                                onValueCommit={(val) => {
                                                    const newVal = val[0];
                                                    handleUpdateInsightConfig({ thresholds: { ...preferences?.insight_config?.thresholds, growthSignificant: newVal } });
                                                }}
                                                disabled={isPending}
                                            />
                                            <div className="flex justify-between text-xs text-muted-foreground">
                                                <span>5% (Muy sensible)</span>
                                                <span>50% (Poco sensible)</span>
                                            </div>
                                        </div>

                                        <div className="h-px bg-border" />

                                        {/* 2. TREND STABLE */}
                                        <div className="space-y-4">
                                            <div className="flex justify-between">
                                                <div className="space-y-0.5">
                                                    <label className="text-sm font-medium">Margen de Estabilidad ({preferences?.insight_config?.thresholds?.trendStable ?? 4}%)</label>
                                                    <p className="text-xs text-muted-foreground">Cambios menores a este valor se consideran "Estables" y no generan tendencia.</p>
                                                </div>
                                            </div>
                                            <Slider
                                                defaultValue={[preferences?.insight_config?.thresholds?.trendStable ?? 4]}
                                                max={10}
                                                min={1}
                                                step={0.5}
                                                onValueCommit={(val) => {
                                                    const newVal = val[0];
                                                    handleUpdateInsightConfig({ thresholds: { ...preferences?.insight_config?.thresholds, trendStable: newVal } });
                                                }}
                                                disabled={isPending}
                                            />
                                        </div>

                                        <div className="h-px bg-border" />

                                        {/* 3. PARETO */}
                                        <div className="space-y-4">
                                            <div className="flex justify-between">
                                                <div className="space-y-0.5">
                                                    <label className="text-sm font-medium">Concentración Pareto ({preferences?.insight_config?.thresholds?.concentrationPareto ?? 80}%)</label>
                                                    <p className="text-xs text-muted-foreground">Porcentaje acumulado para detectar "Alta Concentración" en pocas categorías.</p>
                                                </div>
                                            </div>
                                            <Slider
                                                defaultValue={[preferences?.insight_config?.thresholds?.concentrationPareto ?? 80]}
                                                max={95}
                                                min={50}
                                                step={5}
                                                onValueCommit={(val) => {
                                                    const newVal = val[0];
                                                    handleUpdateInsightConfig({ thresholds: { ...preferences?.insight_config?.thresholds, concentrationPareto: newVal } });
                                                }}
                                                disabled={isPending}
                                            />
                                        </div>

                                        <div className="h-px bg-border" />

                                        {/* 4. UPSELL LIQUIDITY */}
                                        <div className="space-y-4">
                                            <div className="flex justify-between">
                                                <div className="space-y-0.5">
                                                    <label className="text-sm font-medium">Umbral de Re-inversión ({preferences?.insight_config?.thresholds?.upsellLiquidity ?? 90}%)</label>
                                                    <p className="text-xs text-muted-foreground">Porcentaje de la unidad pagada para identificar oportunidades de venta.</p>
                                                </div>
                                            </div>
                                            <Slider
                                                defaultValue={[preferences?.insight_config?.thresholds?.upsellLiquidity ?? 90]}
                                                max={100}
                                                min={50}
                                                step={5}
                                                onValueCommit={(val) => {
                                                    const newVal = val[0];
                                                    handleUpdateInsightConfig({ thresholds: { ...preferences?.insight_config?.thresholds, upsellLiquidity: newVal } });
                                                }}
                                                disabled={isPending}
                                            />
                                        </div>

                                        <div className="h-px bg-border" />

                                        {/* 5. CASH FLOW RISK */}
                                        <div className="space-y-4">
                                            <div className="flex justify-between">
                                                <div className="space-y-0.5">
                                                    <label className="text-sm font-medium">Riesgo por Exposición ({preferences?.insight_config?.thresholds?.cashFlowRisk ?? 80}%)</label>
                                                    <p className="text-xs text-muted-foreground">Porcentaje de saldo pendiente sobre el total para alertar sobre riesgo de cobranza.</p>
                                                </div>
                                            </div>
                                            <Slider
                                                defaultValue={[preferences?.insight_config?.thresholds?.cashFlowRisk ?? 80]}
                                                max={90}
                                                min={30}
                                                step={5}
                                                onValueCommit={(val) => {
                                                    const newVal = val[0];
                                                    handleUpdateInsightConfig({ thresholds: { ...preferences?.insight_config?.thresholds, cashFlowRisk: newVal } });
                                                }}
                                                disabled={isPending}
                                            />
                                        </div>

                                    </CardContent>
                                </FeatureGuard>
                            </Card>
                        </div>

                    </div>
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
        </ContentLayout>
    );
}
