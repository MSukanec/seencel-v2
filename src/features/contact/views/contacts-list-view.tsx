"use client";

import { ContactWithRelations, ContactCategory } from "@/types/contact";
import { ContactsList } from "@/features/contact/components/contacts-list";
import type { SavedView } from "@/features/files/types";

interface ContactsListViewProps {
    organizationId: string;
    initialContacts: ContactWithRelations[];
    contactCategories: ContactCategory[];
    organizationName: string;
    organizationLogoUrl: string | null;
    savedViews: SavedView[];
}

export function ContactsListView({
    organizationId,
    initialContacts,
    contactCategories,
    organizationName,
    organizationLogoUrl,
    savedViews,
}: ContactsListViewProps) {
    return (
        <ContactsList
            organizationId={organizationId}
            initialContacts={initialContacts}
            contactCategories={contactCategories}
            organizationName={organizationName}
            organizationLogoUrl={organizationLogoUrl}
            savedViews={savedViews}
        />
    );
}

