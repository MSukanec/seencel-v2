"use client";

import { ContactCategory } from "@/types/contact";
import { ContactCategoriesManager } from "@/features/contact/components/contact-categories-manager";

interface ContactsSettingsViewProps {
    organizationId: string;
    initialCategories: ContactCategory[];
}

export function ContactsSettingsView({
    organizationId,
    initialCategories,
}: ContactsSettingsViewProps) {
    return (
        <ContactCategoriesManager
            organizationId={organizationId}
            initialCategories={initialCategories}
        />
    );
}
