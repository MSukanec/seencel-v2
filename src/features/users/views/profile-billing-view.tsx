"use client";

// ============================================================================
// PROFILE BILLING VIEW
// ============================================================================
// Vista de facturación personal usando SettingsSection layout.
// Secciones: Tipo de Facturación + Datos de Facturación.
// ============================================================================

import { useTransition, useState } from "react";
import { useTranslations } from "next-intl";
import { Receipt, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { CountrySelector } from "@/components/ui/country-selector";
import { SettingsSection, SettingsSectionContainer } from "@/components/shared/settings-section";
import { ContentLayout } from "@/components/layout/dashboard/shared/content-layout";
import { updateBillingProfile } from "@/features/billing/actions";
import { BillingProfile } from "@/features/billing/queries";
import { toast } from "sonner";

interface Country {
    id: string;
    name: string;
    alpha_2: string | null;
}

interface ProfileBillingViewProps {
    billingProfile: BillingProfile | null;
    countries: Country[];
}

export function ProfileBillingView({ billingProfile, countries }: ProfileBillingViewProps) {
    const t = useTranslations('Settings.Billing');
    const [isPending, startTransition] = useTransition();

    const [isCompany, setIsCompany] = useState(billingProfile?.is_company ?? false);
    const [fullName, setFullName] = useState(billingProfile?.full_name ?? "");
    const [companyName, setCompanyName] = useState(billingProfile?.company_name ?? "");
    const [taxId, setTaxId] = useState(billingProfile?.tax_id ?? "");
    const [countryId, setCountryId] = useState(billingProfile?.country_id ?? "");
    const [addressLine1, setAddressLine1] = useState(billingProfile?.address_line1 ?? "");
    const [city, setCity] = useState(billingProfile?.city ?? "");
    const [postcode, setPostcode] = useState(billingProfile?.postcode ?? "");

    const onSubmit = (formData: FormData) => {
        startTransition(async () => {
            formData.set("is_company", isCompany.toString());
            formData.set("country_id", countryId);

            const result = await updateBillingProfile(formData);
            if (result.success) {
                toast.success(t('success'));
            } else {
                toast.error(t('error'));
            }
        });
    };

    return (
        <ContentLayout variant="settings">
            <SettingsSectionContainer>
                {/* ── Datos de Facturación ── */}
                <SettingsSection
                    icon={Receipt}
                    title={t('title')}
                    description={t('description')}
                >
                    <form action={onSubmit} className="space-y-5">
                        {/* Tipo: Empresa / Persona */}
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label className="text-base">{t('isCompany')}</Label>
                                <p className="text-sm text-muted-foreground">{t('isCompanyDescription')}</p>
                            </div>
                            <Switch
                                checked={isCompany}
                                onCheckedChange={setIsCompany}
                            />
                        </div>

                        {/* Nombre/Empresa + CUIT */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor={isCompany ? "company_name" : "full_name"}>
                                    {isCompany ? t('companyName') : t('fullName')}
                                </Label>
                                {isCompany ? (
                                    <Input
                                        id="company_name"
                                        name="company_name"
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        placeholder={t('companyNamePlaceholder')}
                                    />
                                ) : (
                                    <Input
                                        id="full_name"
                                        name="full_name"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder={t('fullNamePlaceholder')}
                                    />
                                )}
                                <input type="hidden" name="full_name" value={fullName} />
                                <input type="hidden" name="company_name" value={companyName} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="tax_id">{t('taxId')}</Label>
                                <Input
                                    id="tax_id"
                                    name="tax_id"
                                    value={taxId}
                                    onChange={(e) => setTaxId(e.target.value)}
                                    placeholder={t('taxIdPlaceholder')}
                                />
                            </div>
                        </div>

                        {/* Dirección + País */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="address_line1">{t('address')}</Label>
                                <Input
                                    id="address_line1"
                                    name="address_line1"
                                    value={addressLine1}
                                    onChange={(e) => setAddressLine1(e.target.value)}
                                    placeholder={t('addressPlaceholder')}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="country_id">{t('country')}</Label>
                                <CountrySelector
                                    value={countryId}
                                    onChange={setCountryId}
                                    countries={countries}
                                    placeholder={t('countryPlaceholder')}
                                />
                                <input type="hidden" name="country_id" value={countryId} />
                            </div>
                        </div>

                        {/* Ciudad + Código Postal */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="city">{t('city')}</Label>
                                <Input
                                    id="city"
                                    name="city"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    placeholder={t('cityPlaceholder')}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="postcode">{t('postcode')}</Label>
                                <Input
                                    id="postcode"
                                    name="postcode"
                                    value={postcode}
                                    onChange={(e) => setPostcode(e.target.value)}
                                    placeholder={t('postcodePlaceholder')}
                                />
                            </div>
                        </div>

                        {/* Guardar */}
                        <div className="flex items-center justify-between pt-2">
                            <p className="text-xs text-muted-foreground">{t('footer')}</p>
                            <Button type="submit" disabled={isPending} size="sm">
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {t('save')}
                            </Button>
                        </div>
                    </form>
                </SettingsSection>
            </SettingsSectionContainer>
        </ContentLayout>
    );
}
