"use client";

// ============================================================================
// PROFILE INFO VIEW
// ============================================================================
// Vista de perfil personal usando SettingsSection layout.
// Secciones: Foto de Perfil + Datos Personales (auto-save con debounce).
// Usa Field Factories (Standard 19.10) para todos los campos.
// ============================================================================

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Camera, UserRound } from "lucide-react";
import { SettingsSection, SettingsSectionContainer } from "@/components/shared/settings-section";
import { ContentLayout } from "@/components/layout/dashboard/shared/content-layout";
import { FormGroup } from "@/components/ui/form-group";
import { AvatarManager } from "@/features/users/components/avatar-manager";
import { updateUserProfile } from "@/features/users/actions";
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
} from "@/components/shared/forms/fields";

interface Country {
    id: string;
    name: string;
    alpha_2: string | null;
}

interface ProfileInfoViewProps {
    profile: UserProfile | null;
    countries: Country[];
}

interface ProfileFields {
    first_name: string;
    last_name: string;
    phone: string;
    birthdate: string;
    country: string;
}

export function ProfileInfoView({ profile, countries }: ProfileInfoViewProps) {
    const t = useTranslations('Settings.Profile');

    // ── Form state ──
    const [firstName, setFirstName] = useState(profile?.first_name || "");
    const [lastName, setLastName] = useState(profile?.last_name || "");
    const [phoneValue, setPhoneValue] = useState(profile?.phone_e164 || "");
    const [countryValue, setCountryValue] = useState(profile?.country || "");
    const [birthdateValue, setBirthdateValue] = useState<Date | undefined>(
        parseDateFromDB(profile?.birthdate) ?? undefined
    );

    const initials = profile?.full_name
        ? profile.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
        : "US";

    // ── Helper: build current fields snapshot ──
    const buildFields = (overrides: Partial<ProfileFields> = {}): ProfileFields => ({
        first_name: firstName,
        last_name: lastName,
        phone: phoneValue,
        birthdate: birthdateValue ? (formatDateForDB(birthdateValue) ?? "") : "",
        country: countryValue,
        ...overrides,
    });

    // ── Auto-save (según autosave-pattern.md) ──
    const { triggerAutoSave } = useAutoSave<ProfileFields>({
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

    // ── Field change handlers ──
    const handleFirstNameChange = (value: string) => {
        setFirstName(value);
        triggerAutoSave(buildFields({ first_name: value }));
    };

    const handleLastNameChange = (value: string) => {
        setLastName(value);
        triggerAutoSave(buildFields({ last_name: value }));
    };

    const handlePhoneChange = (value: string) => {
        setPhoneValue(value);
        triggerAutoSave(buildFields({ phone: value }));
    };

    const handleBirthdateChange = (value: Date | undefined) => {
        setBirthdateValue(value);
        triggerAutoSave(buildFields({ birthdate: value ? (formatDateForDB(value) ?? "") : "" }));
    };

    const handleCountryChange = (value: string) => {
        setCountryValue(value);
        triggerAutoSave(buildFields({ country: value }));
    };

    if (!profile) {
        return <div className="text-muted-foreground p-6">{t('loading')}</div>;
    }

    return (
        <ContentLayout variant="settings">
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
            </SettingsSectionContainer>
        </ContentLayout>
    );
}
