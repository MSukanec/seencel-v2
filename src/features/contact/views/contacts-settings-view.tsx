import { ContactTypesManager } from "@/features/contact/components/contact-types-manager";
import { ContactType } from "@/types/contact";

interface ContactsSettingsViewProps {
    organizationId: string;
    initialTypes: ContactType[];
}

export function ContactsSettingsView({ organizationId, initialTypes }: ContactsSettingsViewProps) {
    return (
        <div className="space-y-6">
            <ContactTypesManager
                organizationId={organizationId}
                initialTypes={initialTypes}
            />
        </div>
    );
}
