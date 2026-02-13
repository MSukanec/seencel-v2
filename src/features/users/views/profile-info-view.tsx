"use client";

// ============================================================================
// PROFILE INFO VIEW
// ============================================================================
// Vista de perfil personal usando SettingsSection layout.
// Secciones: Foto de Perfil + Datos Personales (auto-save con debounce).
// ============================================================================

import { useRef, useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { Camera, UserRound, Check, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { CountrySelector } from "@/components/ui/country-selector";
import { SettingsSection, SettingsSectionContainer } from "@/components/shared/settings-section";
import { ContentLayout } from "@/components/layout/dashboard/shared/content-layout";
import { AvatarManager } from "@/features/users/components/avatar-manager";
import { updateUserProfile } from "@/features/users/actions";
import { UserProfile } from "@/types/user";
import { toast } from "sonner";

interface Country {
    id: string;
    name: string;
    alpha_2: string | null;
}

interface ProfileInfoViewProps {
    profile: UserProfile | null;
    countries: Country[];
}

// ── Save status types ──
type SaveStatus = "idle" | "saving" | "saved";

export function ProfileInfoView({ profile, countries }: ProfileInfoViewProps) {
    const t = useTranslations('Settings.Profile');

    // ── Form state ──
    const [firstName, setFirstName] = useState(profile?.first_name || "");
    const [lastName, setLastName] = useState(profile?.last_name || "");
    const [phoneValue, setPhoneValue] = useState(profile?.phone_e164 || "");
    const [countryValue, setCountryValue] = useState(profile?.country || "");
    const [birthdateValue, setBirthdateValue] = useState(profile?.birthdate || "");
    const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

    const initials = profile?.full_name
        ? profile.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
        : "US";

    // ── Debounced auto-save (1000ms) ──
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const triggerAutoSave = useCallback((fields: {
        first_name: string;
        last_name: string;
        phone: string;
        birthdate: string;
        country: string;
    }) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(async () => {
            setSaveStatus("saving");
            try {
                const formData = new FormData();
                formData.set("first_name", fields.first_name);
                formData.set("last_name", fields.last_name);
                formData.set("phone", fields.phone);
                formData.set("birthdate", fields.birthdate);
                formData.set("country", fields.country);
                await updateUserProfile(formData);
                setSaveStatus("saved");
                setTimeout(() => setSaveStatus("idle"), 2000);
            } catch {
                toast.error(t('error'));
                setSaveStatus("idle");
            }
        }, 1000);
    }, [t]);

    // ── Field change handlers ──
    const handleFirstNameChange = (value: string) => {
        setFirstName(value);
        triggerAutoSave({ first_name: value, last_name: lastName, phone: phoneValue, birthdate: birthdateValue, country: countryValue });
    };

    const handleLastNameChange = (value: string) => {
        setLastName(value);
        triggerAutoSave({ first_name: firstName, last_name: value, phone: phoneValue, birthdate: birthdateValue, country: countryValue });
    };

    const handlePhoneChange = (value: string) => {
        setPhoneValue(value);
        triggerAutoSave({ first_name: firstName, last_name: lastName, phone: value, birthdate: birthdateValue, country: countryValue });
    };

    const handleBirthdateChange = (value: string) => {
        setBirthdateValue(value);
        triggerAutoSave({ first_name: firstName, last_name: lastName, phone: phoneValue, birthdate: value, country: countryValue });
    };

    const handleCountryChange = (value: string) => {
        setCountryValue(value);
        triggerAutoSave({ first_name: firstName, last_name: lastName, phone: phoneValue, birthdate: birthdateValue, country: value });
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
                            <div className="grid gap-2">
                                <Label htmlFor="first_name">{t('firstName')}</Label>
                                <Input
                                    id="first_name"
                                    placeholder="Jane"
                                    value={firstName}
                                    onChange={(e) => handleFirstNameChange(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="last_name">{t('lastName')}</Label>
                                <Input
                                    id="last_name"
                                    placeholder="Doe"
                                    value={lastName}
                                    onChange={(e) => handleLastNameChange(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Email y Teléfono */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email">{t('email')}</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    defaultValue={profile.email}
                                    disabled
                                    className="bg-muted text-muted-foreground w-full"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="phone">{t('phone')}</Label>
                                <PhoneInput
                                    value={phoneValue}
                                    onChange={(value) => handlePhoneChange(value || "")}
                                    placeholder={t('phone')}
                                    defaultCountry="AR"
                                />
                            </div>
                        </div>

                        {/* Fecha de Nacimiento y País */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="birthdate">{t('birthdate')}</Label>
                                <Input
                                    id="birthdate"
                                    type="date"
                                    value={birthdateValue}
                                    onChange={(e) => handleBirthdateChange(e.target.value)}
                                    className="w-full"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="country">{t('nationality')}</Label>
                                <CountrySelector
                                    value={countryValue}
                                    onChange={handleCountryChange}
                                    countries={countries}
                                    placeholder={t('selectCountry')}
                                />
                            </div>
                        </div>

                        {/* Auto-save indicator */}
                        <div className="flex items-center justify-end gap-2 pt-1">
                            {saveStatus === "saving" && (
                                <span className="flex items-center gap-1.5 text-xs text-muted-foreground animate-in fade-in">
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    Guardando...
                                </span>
                            )}
                            {saveStatus === "saved" && (
                                <span className="flex items-center gap-1.5 text-xs text-emerald-500 animate-in fade-in">
                                    <Check className="h-3 w-3" />
                                    Guardado
                                </span>
                            )}
                        </div>
                    </div>
                </SettingsSection>
            </SettingsSectionContainer>
        </ContentLayout>
    );
}
