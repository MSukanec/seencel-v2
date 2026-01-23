"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { ReactNode } from "react";

export function PricingFaq() {
    const t = useTranslations("PricingFAQ");
    const itemKeys = ['change_plan', 'payment_methods', 'data_retention', 'billing_cycle', 'user_roles', 'enterprise'] as const;

    return (
        <div className="w-full max-w-3xl mx-auto px-4 pb-16">
            <h2 className="text-3xl font-bold text-center mb-8 tracking-tight">
                {t('title')}
            </h2>
            <Accordion type="single" collapsible className="w-full">
                {itemKeys.map((key) => (
                    <AccordionItem key={key} value={key}>
                        <AccordionTrigger className="text-left">
                            {t(`items.${key}.question`)}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground whitespace-pre-line">
                            {t.rich(`items.${key}.answer`, {
                                contact: (chunks: ReactNode) => (
                                    <Link href="/contact" className="text-primary hover:underline font-medium">
                                        {chunks}
                                    </Link>
                                )
                            })}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    );
}

