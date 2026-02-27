"use client";

import { OrganizationPreferences, OrganizationCurrency, OrganizationWallet, Currency, Wallet, OrganizationSubscription } from "@/types/organization";
import { Coins, Wallet as WalletIcon, Lightbulb } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { FormGroup } from "@/components/ui/form-group";
import { MultiSelect } from "@/components/ui/multi-select";
import { useTransition } from "react";
import { useState } from "react";
import { useOptimistic } from "react";
import { updateOrganizationPreferences, addOrganizationCurrency, removeOrganizationCurrency, addOrganizationWallet, removeOrganizationWallet } from "@/actions/organization-settings";
import { updateInsightConfig } from "@/features/organization/actions";
import { Slider } from "@/components/ui/slider";
import { FeatureGuard, FeatureLockBadge } from "@/components/ui/feature-guard";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";
import { DeleteConfirmationDialog } from "@/components/shared/forms/general/delete-confirmation-dialog";
import { SettingsSection, SettingsSectionContainer } from "@/components/shared/settings-section";

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

    // ============================================================================
    // Handlers
    // ============================================================================

    const handleConfirmDelete = () => {
        if (!itemToDelete || !organizationId) return;
        const { type, id } = itemToDelete;
        setItemToDelete(null);

        startTransition(async () => {
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
                router.refresh();
            }
        });
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

    // ============================================================================
    // Derived Data
    // ============================================================================

    const availableSecondaryCurrencies = availableCurrencies.filter(c =>
        c.id !== preferences?.default_currency_id
    );
    const availableSecondaryCurrencyOptions = availableSecondaryCurrencies.map(c => ({
        label: `${c.name} (${c.code})`,
        value: c.id
    }));
    const secondaryCurrencies = optimisticCurrencies.filter(oc => !oc.is_default);

    const availableWalletOptions = availableWallets
        .filter(w => w.id !== preferences?.default_wallet_id)
        .map(w => ({ label: w.name, value: w.id }));
    const selectedWalletIds = optimisticWallets
        .filter(ow => !ow.is_default && ow.wallet_id !== preferences?.default_wallet_id)
        .map(ow => ow.wallet_id);

    const handleWalletsChange = (newValues: string[]) => {
        if (!organizationId) return;
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
        const removedId = selectedWalletIds.find(id => !newValues.includes(id));
        if (removedId) {
            setItemToDelete({ type: 'wallet', id: removedId });
        }
    };

    const handleCurrenciesChange = (newValues: string[]) => {
        if (!organizationId) return;
        const currentIds = secondaryCurrencies.map(sc => sc.currency_id);
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
        const removedId = currentIds.find(id => !newValues.includes(id));
        if (removedId) {
            setItemToDelete({ type: 'currency', id: removedId });
        }
    };

    // ============================================================================
    // Render
    // ============================================================================

    return (
        <>
            <SettingsSectionContainer>

                {/* ── SECTION 1: MONEDAS ────────────────────────── */}
                <SettingsSection
                    icon={Coins}
                    title="Monedas"
                    description="Define la moneda base y las monedas secundarias aceptadas en tu organización."
                >
                    <div className="space-y-6">
                        {/* Moneda Principal (locked) */}
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

                        {/* Monedas Secundarias */}
                        <FormGroup label="Monedas Secundarias" helpText="Monedas adicionales aceptadas.">
                            <MultiSelect
                                options={availableSecondaryCurrencyOptions}
                                selected={secondaryCurrencies.map(sc => sc.currency_id)}
                                onChange={handleCurrenciesChange}
                                disabled={isPending}
                                placeholder="Seleccionar monedas..."
                                searchPlaceholder="Buscar moneda..."
                                emptyText="No se encontraron monedas."
                            />
                        </FormGroup>

                        {/* Estandarización de Moneda */}
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

                        {/* Moneda de Referencia (condicional) */}
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

                        {/* Decimales */}
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

                        {/* Formato de KPIs */}
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

                        {/* Etiqueta de Impuesto */}
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
                    </div>
                </SettingsSection>

                {/* ── SECTION 2: BILLETERAS ────────────────────── */}
                <SettingsSection
                    icon={WalletIcon}
                    title="Billeteras"
                    description="Gestión de cajas y cuentas bancarias de tu organización."
                >
                    <div className="space-y-6">
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
                    </div>
                </SettingsSection>

                {/* ── SECTION 3: INSIGHTS & ALERTAS ────────────── */}
                <SettingsSection
                    icon={Lightbulb}
                    title="Insights & Alertas"
                    description="Personaliza la sensibilidad de las alertas automáticas del sistema financiero."
                >
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-4">
                            <h4 className="text-sm font-medium">Umbrales de Detección</h4>
                            {subscription?.plan?.features?.custom_insight_thresholds !== true && (
                                <FeatureLockBadge
                                    featureName="Configurar Insights"
                                    requiredPlan="PRO"
                                />
                            )}
                        </div>

                        <FeatureGuard
                            isEnabled={subscription?.plan?.features?.custom_insight_thresholds === true}
                            featureName="Configurar Insights"
                            requiredPlan="PRO"
                            showBadge={false}
                            showPopover={false}
                        >
                            <div className="space-y-8">
                                {/* Variación Significativa */}
                                <div className="space-y-4">
                                    <div className="space-y-0.5">
                                        <label className="text-sm font-medium">Variación Significativa ({preferences?.insight_config?.thresholds?.growthSignificant ?? 15}%)</label>
                                        <p className="text-xs text-muted-foreground">Porcentaje de cambio mensual para considerar una alerta de "Aumento/Ahorro".</p>
                                    </div>
                                    <Slider
                                        defaultValue={[preferences?.insight_config?.thresholds?.growthSignificant ?? 15]}
                                        max={50} min={5} step={1}
                                        onValueCommit={(val) => handleUpdateInsightConfig({ thresholds: { ...preferences?.insight_config?.thresholds, growthSignificant: val[0] } })}
                                        disabled={isPending}
                                    />
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>5% (Muy sensible)</span>
                                        <span>50% (Poco sensible)</span>
                                    </div>
                                </div>

                                <div className="h-px bg-border" />

                                {/* Margen de Estabilidad */}
                                <div className="space-y-4">
                                    <div className="space-y-0.5">
                                        <label className="text-sm font-medium">Margen de Estabilidad ({preferences?.insight_config?.thresholds?.trendStable ?? 4}%)</label>
                                        <p className="text-xs text-muted-foreground">Cambios menores a este valor se consideran "Estables" y no generan tendencia.</p>
                                    </div>
                                    <Slider
                                        defaultValue={[preferences?.insight_config?.thresholds?.trendStable ?? 4]}
                                        max={10} min={1} step={0.5}
                                        onValueCommit={(val) => handleUpdateInsightConfig({ thresholds: { ...preferences?.insight_config?.thresholds, trendStable: val[0] } })}
                                        disabled={isPending}
                                    />
                                </div>

                                <div className="h-px bg-border" />

                                {/* Concentración Pareto */}
                                <div className="space-y-4">
                                    <div className="space-y-0.5">
                                        <label className="text-sm font-medium">Concentración Pareto ({preferences?.insight_config?.thresholds?.concentrationPareto ?? 80}%)</label>
                                        <p className="text-xs text-muted-foreground">Porcentaje acumulado para detectar "Alta Concentración" en pocas categorías.</p>
                                    </div>
                                    <Slider
                                        defaultValue={[preferences?.insight_config?.thresholds?.concentrationPareto ?? 80]}
                                        max={95} min={50} step={5}
                                        onValueCommit={(val) => handleUpdateInsightConfig({ thresholds: { ...preferences?.insight_config?.thresholds, concentrationPareto: val[0] } })}
                                        disabled={isPending}
                                    />
                                </div>

                                <div className="h-px bg-border" />

                                {/* Umbral de Re-inversión */}
                                <div className="space-y-4">
                                    <div className="space-y-0.5">
                                        <label className="text-sm font-medium">Umbral de Re-inversión ({preferences?.insight_config?.thresholds?.upsellLiquidity ?? 90}%)</label>
                                        <p className="text-xs text-muted-foreground">Porcentaje de la unidad pagada para identificar oportunidades de venta.</p>
                                    </div>
                                    <Slider
                                        defaultValue={[preferences?.insight_config?.thresholds?.upsellLiquidity ?? 90]}
                                        max={100} min={50} step={5}
                                        onValueCommit={(val) => handleUpdateInsightConfig({ thresholds: { ...preferences?.insight_config?.thresholds, upsellLiquidity: val[0] } })}
                                        disabled={isPending}
                                    />
                                </div>

                                <div className="h-px bg-border" />

                                {/* Riesgo por Exposición */}
                                <div className="space-y-4">
                                    <div className="space-y-0.5">
                                        <label className="text-sm font-medium">Riesgo por Exposición ({preferences?.insight_config?.thresholds?.cashFlowRisk ?? 80}%)</label>
                                        <p className="text-xs text-muted-foreground">Porcentaje de saldo pendiente sobre el total para alertar sobre riesgo de cobranza.</p>
                                    </div>
                                    <Slider
                                        defaultValue={[preferences?.insight_config?.thresholds?.cashFlowRisk ?? 80]}
                                        max={90} min={30} step={5}
                                        onValueCommit={(val) => handleUpdateInsightConfig({ thresholds: { ...preferences?.insight_config?.thresholds, cashFlowRisk: val[0] } })}
                                        disabled={isPending}
                                    />
                                </div>
                            </div>
                        </FeatureGuard>
                    </div>
                </SettingsSection>

            </SettingsSectionContainer>

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
        </>
    );
}
