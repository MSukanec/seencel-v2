import { ContactsList } from "@/features/contact/components/contacts-list";
import { ContactWithRelations, ContactCategory } from "@/types/contact";


interface ContactsListViewProps {
    organizationId: string;
    initialContacts: ContactWithRelations[];
    contactCategories: ContactCategory[];
    organizationName: string;
    organizationLogoUrl: string | null;
}

export function ContactsListView({ organizationId, initialContacts, contactCategories, organizationName, organizationLogoUrl }: ContactsListViewProps) {
    return (
        <div className="space-y-6">
            {/* Contacts Table */}
            <ContactsList
                organizationId={organizationId}
                initialContacts={initialContacts}
                contactCategories={contactCategories}
                organizationName={organizationName}
                organizationLogoUrl={organizationLogoUrl}
            />
        </div>
    );
}
