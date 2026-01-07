"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition, useState } from "react";
import { toast } from "sonner";
import { updateBillingProfile } from "@/features/billing/actions";
import { BillingProfile } from "@/features/billing/queries";
import { CountrySelector } from "@/components/ui/country-selector";

interface Country {
    id: string;
    name: string;
    alpha_2: string | null;
}

interface BillingFormProps {
    initialData: BillingProfile | null;
    countries: Country[];
}

export function BillingForm({ initialData, countries }: BillingFormProps) {
    const t = useTranslations('Settings.Billing');
    const [isPending, startTransition] = useTransition();

    const [isCompany, setIsCompany] = useState(initialData?.is_company ?? false);
    const [fullName, setFullName] = useState(initialData?.full_name ?? "");
    const [companyName, setCompanyName] = useState(initialData?.company_name ?? "");
    const [taxId, setTaxId] = useState(initialData?.tax_id ?? "");
    const [countryId, setCountryId] = useState(initialData?.country_id ?? "");
    const [addressLine1, setAddressLine1] = useState(initialData?.address_line1 ?? "");
    const [city, setCity] = useState(initialData?.city ?? "");
    const [postcode, setPostcode] = useState(initialData?.postcode ?? "");

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
        <Card>
            <CardHeader>
                <CardTitle>{t('title')}</CardTitle>
                <CardDescription>{t('description')}</CardDescription>
            </CardHeader>
            <form action={onSubmit}>
                <CardContent className="space-y-6">
                    {/* Company Toggle */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <Label className="text-base">{t('isCompany')}</Label>
                            <p className="text-sm text-muted-foreground">{t('isCompanyDescription')}</p>
                        </div>
                        <Switch
                            checked={isCompany}
                            onCheckedChange={setIsCompany}
                        />
                    </div>

                    {/* Name/Company + Tax ID Row */}
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
                            {/* Hidden inputs to always submit both values */}
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

                    {/* Address + Country Row */}
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

                    {/* City & Postcode */}
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
                </CardContent>

                <CardFooter className="bg-muted/50 border-t px-6 py-4 flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">{t('footer')}</p>
                    <Button type="submit" disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('save')}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
