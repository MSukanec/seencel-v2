"use client";

// ============================================================================
// PROFILE INFO VIEW
// ============================================================================
// Vista de perfil personal usando SettingsSection layout.
// Secciones: Foto de Perfil + Datos Personales + Datos de Facturación.
// Auto-save con debounce en todas las secciones.
// Usa Field Factories (Standard 19.10) para todos los campos.
// ============================================================================

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Camera, UserRound, Receipt } from "lucide-react";
import { SettingsSection, SettingsSectionContainer } from "@/components/shared/settings-section";
import { FormGroup } from "@/components/ui/form-group";
import { AvatarManager } from "@/features/users/components/avatar-manager";
import { updateUserProfile } from "@/features/users/actions";
import { updateBillingProfile } from "@/features/billing/actions";
import { BillingProfile } from "@/features/billing/queries";
import { UserProfile } from "@/types/user";
import { useAutoSave } from "@/hooks/use-auto-save";
import { CountrySelector } from "@/components/ui/country-selector";
import { FactoryLabel } from "@/components/shared/forms/fields/field-wrapper";
import { parseDateFromDB, formatDateForDB } from "@/lib/timezone-data";

// Field Factories (Standard 19.10)
import {
    TextField,
    PhoneField,
    DateField,
    SwitchField,
} from "@/components/shared/forms/fields";

interface Country {
    id: string;
    name: string;
    alpha_2: string | null;
}

interface ProfileInfoViewProps {
    profile: UserProfile | null;
    countries: Country[];
    billingProfile?: BillingProfile | null;
}

interface ProfileFields {
    first_name: string;
    last_name: string;
    phone: string;
    birthdate: string;
    country: string;
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

export function ProfileInfoView({ profile, countries, billingProfile }: ProfileInfoViewProps) {
    const t = useTranslations('Settings.Profile');
    const tBilling = useTranslations('Settings.Billing');

    // ── Profile form state ──
    const [firstName, setFirstName] = useState(profile?.first_name || "");
    const [lastName, setLastName] = useState(profile?.last_name || "");
    const [phoneValue, setPhoneValue] = useState(profile?.phone_e164 || "");
    const [countryValue, setCountryValue] = useState(profile?.country || "");
    const [birthdateValue, setBirthdateValue] = useState<Date | undefined>(
        parseDateFromDB(profile?.birthdate) ?? undefined
    );

    // ── Billing form state ──
    const [isCompany, setIsCompany] = useState(billingProfile?.is_company ?? false);
    const [billingFullName, setBillingFullName] = useState(billingProfile?.full_name ?? "");
    const [companyName, setCompanyName] = useState(billingProfile?.company_name ?? "");
    const [taxId, setTaxId] = useState(billingProfile?.tax_id ?? "");
    const [billingCountryId, setBillingCountryId] = useState(billingProfile?.country_id ?? "");
    const [addressLine1, setAddressLine1] = useState(billingProfile?.address_line1 ?? "");
    const [city, setCity] = useState(billingProfile?.city ?? "");
    const [postcode, setPostcode] = useState(billingProfile?.postcode ?? "");

    const initials = profile?.full_name
        ? profile.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
        : "US";

    // ── Profile: build fields ──
    const buildProfileFields = (overrides: Partial<ProfileFields> = {}): ProfileFields => ({
        first_name: firstName,
        last_name: lastName,
        phone: phoneValue,
        birthdate: birthdateValue ? (formatDateForDB(birthdateValue) ?? "") : "",
        country: countryValue,
        ...overrides,
    });

    // ── Profile: auto-save ──
    const { triggerAutoSave: triggerProfileSave } = useAutoSave<ProfileFields>({
        saveFn: async (fields) => {
            const formData = new FormData();
            formData.set("first_name", fields.first_name);
            formData.set("last_name", fields.last_name);
            formData.set("phone", fields.phone);
            formData.set("birthdate", fields.birthdate);
            formData.set("country", fields.country);
            await updateUserProfile(formData);
        },
        successMessage: "Perfil actualizado",
        errorMessage: t('error'),
    });

    // ── Billing: build fields ──
    const buildBillingFields = (overrides: Partial<BillingFields> = {}): BillingFields => ({
        is_company: isCompany,
        full_name: billingFullName,
        company_name: companyName,
        tax_id: taxId,
        country_id: billingCountryId,
        address_line1: addressLine1,
        city: city,
        postcode: postcode,
        ...overrides,
    });

    // ── Billing: auto-save ──
    const { triggerAutoSave: triggerBillingSave } = useAutoSave<BillingFields>({
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
            if (!result.success) throw new Error(tBilling('error'));
        },
        successMessage: tBilling('success'),
        errorMessage: tBilling('error'),
    });

    // ── Profile change handlers ──
    const handleFirstNameChange = (value: string) => {
        setFirstName(value);
        triggerProfileSave(buildProfileFields({ first_name: value }));
    };
    const handleLastNameChange = (value: string) => {
        setLastName(value);
        triggerProfileSave(buildProfileFields({ last_name: value }));
    };
    const handlePhoneChange = (value: string) => {
        setPhoneValue(value);
        triggerProfileSave(buildProfileFields({ phone: value }));
    };
    const handleBirthdateChange = (value: Date | undefined) => {
        setBirthdateValue(value);
        triggerProfileSave(buildProfileFields({ birthdate: value ? (formatDateForDB(value) ?? "") : "" }));
    };
    const handleCountryChange = (value: string) => {
        setCountryValue(value);
        triggerProfileSave(buildProfileFields({ country: value }));
    };

    // ── Billing change handlers ──
    const handleIsCompanyChange = (value: boolean) => {
        setIsCompany(value);
        triggerBillingSave(buildBillingFields({ is_company: value }));
    };
    const handleBillingFullNameChange = (value: string) => {
        setBillingFullName(value);
        triggerBillingSave(buildBillingFields({ full_name: value }));
    };
    const handleCompanyNameChange = (value: string) => {
        setCompanyName(value);
        triggerBillingSave(buildBillingFields({ company_name: value }));
    };
    const handleTaxIdChange = (value: string) => {
        setTaxId(value);
        triggerBillingSave(buildBillingFields({ tax_id: value }));
    };
    const handleBillingCountryChange = (value: string) => {
        setBillingCountryId(value);
        triggerBillingSave(buildBillingFields({ country_id: value }));
    };
    const handleAddressChange = (value: string) => {
        setAddressLine1(value);
        triggerBillingSave(buildBillingFields({ address_line1: value }));
    };
    const handleCityChange = (value: string) => {
        setCity(value);
        triggerBillingSave(buildBillingFields({ city: value }));
    };
    const handlePostcodeChange = (value: string) => {
        setPostcode(value);
        triggerBillingSave(buildBillingFields({ postcode: value }));
    };

    if (!profile) {
        return <div className="text-muted-foreground p-6">{t('loading')}</div>;
    }

    return (
        <SettingsSectionContainer>
                {/* ── Foto de Perfil ── */}
                <SettingsSection
                    icon={Camera}
                    title={t('Avatar.title')}
                    description={t('Avatar.description')}
                >
                    <AvatarManager
                        avatarUrl={profile?.avatar_url || null}
                        fullName={profile?.full_name || "User"}
                        initials={initials}
                    />
                    <p className="text-xs text-muted-foreground mt-3">
                        {t('Avatar.footer')}
                    </p>
                </SettingsSection>

                {/* ── Datos Personales ── */}
                <SettingsSection
                    icon={UserRound}
                    title={t('displayNameTitle')}
                    description={t('displayNameDescription')}
                >
                    <div className="space-y-4">
                        {/* Nombre y Apellido */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <TextField
                                label={t('firstName')}
                                value={firstName}
                                onChange={handleFirstNameChange}
                                placeholder="Jane"
                                required={false}
                            />
                            <TextField
                                label={t('lastName')}
                                value={lastName}
                                onChange={handleLastNameChange}
                                placeholder="Doe"
                                required={false}
                            />
                        </div>

                        {/* Email y Teléfono */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <TextField
                                label={t('email')}
                                value={profile.email}
                                onChange={() => { }}
                                type="email"
                                disabled
                                required={false}
                            />
                            <PhoneField
                                label={t('phone')}
                                value={phoneValue}
                                onChange={handlePhoneChange}
                                placeholder={t('phone')}
                                defaultCountry="AR"
                                required={false}
                                helpText=""
                            />
                        </div>

                        {/* Fecha de Nacimiento y País */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <DateField
                                label={t('birthdate')}
                                value={birthdateValue}
                                onChange={handleBirthdateChange}
                                required={false}
                                endMonth={new Date()}
                            />
                            <FormGroup
                                label={<FactoryLabel label={t('nationality')} />}
                                required={false}
                            >
                                <CountrySelector
                                    value={countryValue}
                                    onChange={handleCountryChange}
                                    countries={countries}
                                    placeholder={t('selectCountry')}
                                />
                            </FormGroup>
                        </div>
                    </div>
                </SettingsSection>

                {/* ── Datos de Facturación ── */}
                <SettingsSection
                    icon={Receipt}
                    title={tBilling('title')}
                    description={tBilling('description')}
                >
                    <div className="space-y-4">
                        {/* Tipo: Empresa / Persona */}
                        <SwitchField
                            label={tBilling('isCompany')}
                            description={tBilling('isCompanyDescription')}
                            value={isCompany}
                            onChange={handleIsCompanyChange}
                        />

                        {/* Campos visibles solo si factura como empresa */}
                        {isCompany && (
                            <>
                                {/* Nombre/Empresa + CUIT */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <TextField
                                        label={tBilling('companyName')}
                                        value={companyName}
                                        onChange={handleCompanyNameChange}
                                        placeholder={tBilling('companyNamePlaceholder')}
                                        required={false}
                                    />
                                    <TextField
                                        label={tBilling('taxId')}
                                        value={taxId}
                                        onChange={handleTaxIdChange}
                                        placeholder={tBilling('taxIdPlaceholder')}
                                        required={false}
                                    />
                                </div>

                                {/* Dirección + País */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <TextField
                                        label={tBilling('address')}
                                        value={addressLine1}
                                        onChange={handleAddressChange}
                                        placeholder={tBilling('addressPlaceholder')}
                                        required={false}
                                    />
                                    <FormGroup
                                        label={<FactoryLabel label={tBilling('country')} />}
                                        required={false}
                                    >
                                        <CountrySelector
                                            value={billingCountryId}
                                            onChange={handleBillingCountryChange}
                                            countries={countries}
                                            placeholder={tBilling('countryPlaceholder')}
                                        />
                                    </FormGroup>
                                </div>

                                {/* Ciudad + Código Postal */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <TextField
                                        label={tBilling('city')}
                                        value={city}
                                        onChange={handleCityChange}
                                        placeholder={tBilling('cityPlaceholder')}
                                        required={false}
                                    />
                                    <TextField
                                        label={tBilling('postcode')}
                                        value={postcode}
                                        onChange={handlePostcodeChange}
                                        placeholder={tBilling('postcodePlaceholder')}
                                        required={false}
                                    />
                                </div>

                                {/* Footer info */}
                                <p className="text-xs text-muted-foreground pt-2">{tBilling('footer')}</p>
                            </>
                        )}
                    </div>
                </SettingsSection>
        </SettingsSectionContainer>
    );
}
