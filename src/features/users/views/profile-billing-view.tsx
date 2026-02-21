"use client";

// ============================================================================
// PROFILE BILLING VIEW
// ============================================================================
// Vista de facturación personal usando SettingsSection layout.
// Auto-save con debounce (mismo patrón que profile-info-view).
// Usa Field Factories (Standard 19.10) para todos los campos.
// ============================================================================

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Receipt } from "lucide-react";
import { SettingsSection, SettingsSectionContainer } from "@/components/shared/settings-section";
import { ContentLayout } from "@/components/layout/dashboard/shared/content-layout";
import { updateBillingProfile } from "@/features/billing/actions";
import { BillingProfile } from "@/features/billing/queries";
import { useAutoSave } from "@/hooks/use-auto-save";
import { CountrySelector } from "@/components/ui/country-selector";
import { FormGroup } from "@/components/ui/form-group";
import { FactoryLabel } from "@/components/shared/forms/fields/field-wrapper";

// Field Factories (Standard 19.10)
import { TextField, SwitchField } from "@/components/shared/forms/fields";

interface Country {
    id: string;
    name: string;
    alpha_2: string | null;
}

interface ProfileBillingViewProps {
    billingProfile: BillingProfile | null;
    countries: Country[];
}

interface BillingFields {
    is_company: boolean;
    full_name: string;
    company_name: string;
    tax_id: string;
    country_id: string;
    address_line1: string;
    city: string;
    postcode: string;
}

export function ProfileBillingView({ billingProfile, countries }: ProfileBillingViewProps) {
    const t = useTranslations('Settings.Billing');

    // ── Form state ──
    const [isCompany, setIsCompany] = useState(billingProfile?.is_company ?? false);
    const [fullName, setFullName] = useState(billingProfile?.full_name ?? "");
    const [companyName, setCompanyName] = useState(billingProfile?.company_name ?? "");
    const [taxId, setTaxId] = useState(billingProfile?.tax_id ?? "");
    const [countryId, setCountryId] = useState(billingProfile?.country_id ?? "");
    const [addressLine1, setAddressLine1] = useState(billingProfile?.address_line1 ?? "");
    const [city, setCity] = useState(billingProfile?.city ?? "");
    const [postcode, setPostcode] = useState(billingProfile?.postcode ?? "");

    // ── Helper: build current fields snapshot ──
    const buildFields = (overrides: Partial<BillingFields> = {}): BillingFields => ({
        is_company: isCompany,
        full_name: fullName,
        company_name: companyName,
        tax_id: taxId,
        country_id: countryId,
        address_line1: addressLine1,
        city: city,
        postcode: postcode,
        ...overrides,
    });

    // ── Auto-save (según autosave-pattern.md) ──
    const { triggerAutoSave } = useAutoSave<BillingFields>({
        saveFn: async (fields) => {
            const formData = new FormData();
            formData.set("is_company", fields.is_company.toString());
            formData.set("full_name", fields.full_name);
            formData.set("company_name", fields.company_name);
            formData.set("tax_id", fields.tax_id);
            formData.set("country_id", fields.country_id);
            formData.set("address_line1", fields.address_line1);
            formData.set("city", fields.city);
            formData.set("postcode", fields.postcode);

            const result = await updateBillingProfile(formData);
            if (!result.success) throw new Error(t('error'));
        },
        successMessage: t('success'),
        errorMessage: t('error'),
    });

    // ── Field change handlers ──
    const handleIsCompanyChange = (value: boolean) => {
        setIsCompany(value);
        triggerAutoSave(buildFields({ is_company: value }));
    };

    const handleFullNameChange = (value: string) => {
        setFullName(value);
        triggerAutoSave(buildFields({ full_name: value }));
    };

    const handleCompanyNameChange = (value: string) => {
        setCompanyName(value);
        triggerAutoSave(buildFields({ company_name: value }));
    };

    const handleTaxIdChange = (value: string) => {
        setTaxId(value);
        triggerAutoSave(buildFields({ tax_id: value }));
    };

    const handleCountryChange = (value: string) => {
        setCountryId(value);
        triggerAutoSave(buildFields({ country_id: value }));
    };

    const handleAddressChange = (value: string) => {
        setAddressLine1(value);
        triggerAutoSave(buildFields({ address_line1: value }));
    };

    const handleCityChange = (value: string) => {
        setCity(value);
        triggerAutoSave(buildFields({ city: value }));
    };

    const handlePostcodeChange = (value: string) => {
        setPostcode(value);
        triggerAutoSave(buildFields({ postcode: value }));
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
                    <div className="space-y-4">
                        {/* Tipo: Empresa / Persona */}
                        <SwitchField
                            label={t('isCompany')}
                            description={t('isCompanyDescription')}
                            value={isCompany}
                            onChange={handleIsCompanyChange}
                        />

                        {/* Nombre/Empresa + CUIT */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {isCompany ? (
                                <TextField
                                    label={t('companyName')}
                                    value={companyName}
                                    onChange={handleCompanyNameChange}
                                    placeholder={t('companyNamePlaceholder')}
                                    required={false}
                                />
                            ) : (
                                <TextField
                                    label={t('fullName')}
                                    value={fullName}
                                    onChange={handleFullNameChange}
                                    placeholder={t('fullNamePlaceholder')}
                                    required={false}
                                />
                            )}
                            <TextField
                                label={t('taxId')}
                                value={taxId}
                                onChange={handleTaxIdChange}
                                placeholder={t('taxIdPlaceholder')}
                                required={false}
                            />
                        </div>

                        {/* Dirección + País */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <TextField
                                label={t('address')}
                                value={addressLine1}
                                onChange={handleAddressChange}
                                placeholder={t('addressPlaceholder')}
                                required={false}
                            />
                            <FormGroup
                                label={<FactoryLabel label={t('country')} />}
                                required={false}
                            >
                                <CountrySelector
                                    value={countryId}
                                    onChange={handleCountryChange}
                                    countries={countries}
                                    placeholder={t('countryPlaceholder')}
                                />
                            </FormGroup>
                        </div>

                        {/* Ciudad + Código Postal */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <TextField
                                label={t('city')}
                                value={city}
                                onChange={handleCityChange}
                                placeholder={t('cityPlaceholder')}
                                required={false}
                            />
                            <TextField
                                label={t('postcode')}
                                value={postcode}
                                onChange={handlePostcodeChange}
                                placeholder={t('postcodePlaceholder')}
                                required={false}
                            />
                        </div>

                        {/* Footer info */}
                        <p className="text-xs text-muted-foreground pt-2">{t('footer')}</p>
                    </div>
                </SettingsSection>
            </SettingsSectionContainer>
        </ContentLayout>
    );
}
