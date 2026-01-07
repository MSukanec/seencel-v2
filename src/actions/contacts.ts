"use server";

import { createClient } from "@/lib/supabase/server";
import { Contact, ContactWithRelations, ContactType } from "@/types/contact";
import { revalidatePath } from "next/cache";

// --- CONTACTS ---

export async function getOrganizationContacts(organizationId: string): Promise<ContactWithRelations[]> {
    const supabase = await createClient();

    // Using the view 'contacts_with_relations_view' as defined in schema
    const { data, error } = await supabase
        .from('contacts_with_relations_view')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching contacts:", error);
        return [];
    }

    return data as ContactWithRelations[];
}

export async function createContact(organizationId: string, contact: Partial<Contact>, typeIds: string[] = []) {
    const supabase = await createClient();

    // 1. Create Contact
    const { data: newContact, error } = await supabase
        .from('contacts')
        .insert({
            ...contact,
            organization_id: organizationId
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating contact:", error);
        throw new Error("Failed to create contact");
    }

    // 2. Link Types if provided
    if (typeIds.length > 0) {
        const links = typeIds.map(typeId => ({
            contact_id: newContact.id,
            contact_type_id: typeId,
            organization_id: organizationId
        }));

        const { error: linkError } = await supabase
            .from('contact_type_links')
            .insert(links);

        if (linkError) {
            console.error("Error linking contact types:", linkError);
            // We don't throw here to avoid failing the whole operation if just tagging fails, but good to note.
        }
    }

    revalidatePath(`/organization/contacts`);
    return newContact;
}

export async function updateContact(contactId: string, updates: Partial<Contact>, typeIds?: string[]) {
    const supabase = await createClient();

    // 1. Update Details
    const { error } = await supabase
        .from('contacts')
        .update(updates)
        .eq('id', contactId);

    if (error) {
        console.error("Error updating contact:", error);
        throw new Error("Failed to update contact");
    }

    // 2. Update Types if provided (replace all)
    if (typeIds) {
        // Remove existing links
        await supabase
            .from('contact_type_links')
            .delete()
            .eq('contact_id', contactId);

        // Add new links
        if (typeIds.length > 0) {
            // Need org_id, fetch from contact if not available context, but usually we pass it or allow DB to handle if optional?
            // Schema says organization_id is foreign key on links. 
            // We need to fetch the contact's org_id to be safe, or pass it. 
            // Let's fetch it quickly to ensure integrity.
            const { data: contact } = await supabase.from('contacts').select('organization_id').eq('id', contactId).single();

            if (contact) {
                const links = typeIds.map(typeId => ({
                    contact_id: contactId,
                    contact_type_id: typeId,
                    organization_id: contact.organization_id
                }));
                await supabase.from('contact_type_links').insert(links);
            }
        }
    }

    revalidatePath(`/organization/contacts`);
}

export async function deleteContact(contactId: string) {
    const supabase = await createClient();

    // Soft delete as per schema (is_deleted)
    const { error } = await supabase
        .from('contacts')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', contactId);

    if (error) {
        console.error("Error deleting contact:", error);
        throw new Error("Failed to delete contact");
    }

    revalidatePath(`/organization/contacts`);
}

// --- CONTACT TYPES ---

export async function getContactTypes(organizationId: string): Promise<ContactType[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('contact_types')
        .select('*')
        .or(`organization_id.eq.${organizationId},organization_id.is.null`)
        .eq('is_deleted', false)
        .order('name');

    if (error) {
        console.error("Error fetching contact types:", error);
        return [];
    }

    return data as ContactType[];
}

export async function createContactType(organizationId: string, name: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('contact_types')
        .insert({ organization_id: organizationId, name });

    if (error) {
        console.error("Error creating contact type:", error);
        throw new Error("Failed to create contact type");
    }

    revalidatePath(`/organization/contacts`);
}

export async function updateContactType(id: string, name: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('contact_types')
        .update({ name })
        .eq('id', id);

    if (error) {
        console.error("Error updating contact type:", error);
        throw new Error("Failed to update contact type");
    }

    revalidatePath(`/organization/contacts`);
}

export async function deleteContactType(id: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('contact_types')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', id);

    if (error) {
        console.error("Error deleting contact type:", error);
        throw new Error("Failed to delete contact type");
    }

    revalidatePath(`/organization/contacts`);
}
