import { getActiveOrganizationId } from "@/actions/general-costs";
import { getContactTypes, getOrganizationContacts } from "@/actions/contacts";
import { ContactsClient } from "@/components/organization/contacts/contacts-client";
import { redirect } from "next/navigation";

export default async function ContactsPage() {
    const organizationId = await getActiveOrganizationId();

    if (!organizationId) {
        redirect('/');
    }

    const [contacts, types] = await Promise.all([
        getOrganizationContacts(organizationId),
        getContactTypes(organizationId)
    ]);

    return (
        <ContactsClient
            organizationId={organizationId}
            initialContacts={contacts}
            initialTypes={types}
        />
    );
}
