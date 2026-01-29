'use client';

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CountrySelector } from "@/components/ui/country-selector";
import { UserProfile } from "@/types/user";
import { updateUserProfile } from "../actions";
import { useTransition, useState } from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { PhoneInput } from "@/components/ui/phone-input";
import { toast } from "sonner";

interface Country {
    id: string;
    name: string;
    alpha_2: string | null;
}

interface ProfileFormProps {
    initialData: UserProfile | null;
    countries: Country[];
}

export function ProfileForm({ initialData, countries }: ProfileFormProps) {
    const t = useTranslations('Settings.Profile');
    const [isPending, startTransition] = useTransition();
    const [phoneValue, setPhoneValue] = useState(initialData?.phone_e164 || "");
    const [countryValue, setCountryValue] = useState(initialData?.country || "");
    const [birthdateValue, setBirthdateValue] = useState(initialData?.birthdate || "");

    async function onSubmit(formData: FormData) {
        startTransition(async () => {
            try {
                await updateUserProfile(formData);
                toast.success(t('success'));
            } catch (error) {
                toast.error(t('error'));
                console.error(error);
            }
        });
    }

    if (!initialData) {
        return <div className="text-muted-foreground">{t('loading')}</div>;
    }

    return (
        <Card>
            <form action={onSubmit} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <CardHeader>
                    <CardTitle>{t('displayNameTitle')}</CardTitle>
                    <CardDescription>
                        {t('displayNameDescription')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-4 w-full">
                        {/* Name Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="first_name">{t('firstName')}</Label>
                                <Input
                                    id="first_name"
                                    name="first_name"
                                    placeholder="Jane"
                                    defaultValue={initialData.first_name || ""}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="last_name">{t('lastName')}</Label>
                                <Input
                                    id="last_name"
                                    name="last_name"
                                    placeholder="Doe"
                                    defaultValue={initialData.last_name || ""}
                                />
                            </div>
                        </div>

                        {/* Email & Phone Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email">{t('email')}</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    defaultValue={initialData.email}
                                    disabled
                                    className="bg-muted text-muted-foreground w-full"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="phone">{t('phone')}</Label>
                                <PhoneInput
                                    value={phoneValue}
                                    onChange={(value) => setPhoneValue(value || "")}
                                    placeholder={t('phone')}
                                    defaultCountry="AR"
                                />
                                <input type="hidden" name="phone" value={phoneValue} />
                            </div>
                        </div>

                        {/* Birthdate & Country Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="birthdate">{t('birthdate')}</Label>
                                <Input
                                    id="birthdate"
                                    name="birthdate"
                                    type="date"
                                    value={birthdateValue}
                                    onChange={(e) => setBirthdateValue(e.target.value)}
                                    className="w-full"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="country">{t('nationality')}</Label>
                                <CountrySelector
                                    value={countryValue}
                                    onChange={setCountryValue}
                                    countries={countries}
                                    placeholder={t('selectCountry')}
                                />
                                <input type="hidden" name="country" value={countryValue} />
                            </div>
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="bg-muted/50 border-t px-6 py-4 flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                        {t('maxCharsDescription')}
                    </p>
                    <Button disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('save')}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}

