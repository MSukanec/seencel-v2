"use client";

import { useDrawer } from "@/providers/drawer-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { useTranslations } from "next-intl";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface ProjectFormProps {
    mode: 'create' | 'edit';
    initialData?: any;
}

export function ProjectForm({ mode, initialData }: ProjectFormProps) {
    const { closeDrawer } = useDrawer();
    const [isLoading, setIsLoading] = useState(false);
    const t = useTranslations('Project.form');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));



        setIsLoading(false);
        closeDrawer();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {t('basicInfo')}
                </h3>

                <div className="space-y-2">
                    <Label htmlFor="name">{t('name')}</Label>
                    <Input
                        id="name"
                        placeholder={t('namePlaceholder')}
                        defaultValue={initialData?.name}
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="code">{t('code')}</Label>
                        <Input
                            id="code"
                            placeholder={t('codePlaceholder')}
                            defaultValue={initialData?.code}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="status">{t('status')}</Label>
                        <Select defaultValue={initialData?.status || "Activo"}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Activo">{t('statusActive')}</SelectItem>
                                <SelectItem value="Finalizado">{t('statusFinished')}</SelectItem>
                                <SelectItem value="Detenido">{t('statusOnHold')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <Separator />

            {/* Dates */}
            <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {t('dates')}
                </h3>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="start_date">{t('startDate')}</Label>
                        <Input
                            id="start_date"
                            type="date"
                            defaultValue={initialData?.start_date}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="estimated_end">{t('endDate')}</Label>
                        <Input
                            id="estimated_end"
                            type="date"
                            defaultValue={initialData?.estimated_end}
                        />
                    </div>
                </div>
            </div>

            <Separator />

            {/* Location */}
            <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {t('location')}
                </h3>

                <div className="space-y-2">
                    <Label htmlFor="address">{t('address')}</Label>
                    <Input
                        id="address"
                        placeholder={t('addressPlaceholder')}
                        defaultValue={initialData?.address}
                    />
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="city">{t('city')}</Label>
                        <Input
                            id="city"
                            placeholder={t('cityPlaceholder')}
                            defaultValue={initialData?.city}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="country">{t('country')}</Label>
                        <Input
                            id="country"
                            placeholder={t('countryPlaceholder')}
                            defaultValue={initialData?.country}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="zip_code">{t('zipCode')}</Label>
                        <Input
                            id="zip_code"
                            placeholder="00000"
                            defaultValue={initialData?.zip_code}
                        />
                    </div>
                </div>
            </div>

            <Separator />

            {/* Client Information */}
            <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {t('client')}
                </h3>

                <div className="space-y-2">
                    <Label htmlFor="client_name">{t('clientName')}</Label>
                    <Input
                        id="client_name"
                        placeholder={t('clientNamePlaceholder')}
                        defaultValue={initialData?.client_name}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="contact_phone">{t('contactPhone')}</Label>
                        <Input
                            id="contact_phone"
                            type="tel"
                            placeholder="+1 (555) 123-4567"
                            defaultValue={initialData?.contact_phone}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">{t('email')}</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="client@example.com"
                            defaultValue={initialData?.email}
                        />
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t sticky bottom-0 bg-background pb-4">
                <Button variant="outline" type="button" onClick={closeDrawer}>
                    {t('cancel')}
                </Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading
                        ? (mode === 'create' ? t('creating') : t('saving'))
                        : (mode === 'create' ? t('createTitle') : t('save'))
                    }
                </Button>
            </div>
        </form>
    );
}
