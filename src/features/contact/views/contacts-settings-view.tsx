import { ContactCategoriesManager } from "@/features/contact/components/contact-categories-manager";
import { ContactCategory } from "@/types/contact";

interface ContactsSettingsViewProps {
    organizationId: string;
    initialCategories: ContactCategory[];
}

export function ContactsSettingsView({ organizationId, initialCategories }: ContactsSettingsViewProps) {
    return (
        <div className="space-y-6">
            <ContactCategoriesManager
                organizationId={organizationId}
                initialCategories={initialCategories}
            />
        </div>
    );
}
