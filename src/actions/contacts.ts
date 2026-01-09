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
        .order('full_name', { ascending: true });

    if (error) {
        console.error("Error fetching contacts:", error);
        return [];
    }

    return data as ContactWithRelations[];
}

// Helper to construct URL
function getStorageUrl(path: string | null, bucket: string = 'avatars') {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return `${baseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

export async function createContact(organizationId: string, contact: Partial<Contact>, typeIds: string[] = []) {
    const supabase = await createClient();

    // Prepare payload with image_url
    const payload = {
        ...contact,
        organization_id: organizationId
    };

    // Auto-fill image_url if path is present 
    if (payload.image_path) {
        // @ts-ignore
        payload.image_url = getStorageUrl(payload.image_path, payload.image_bucket || 'avatars');
    }

    // Clean up legacy fields
    // @ts-ignore
    delete payload.image_path;
    // @ts-ignore
    delete payload.image_bucket;

    // 1. Create Contact
    const { data: newContact, error } = await supabase
        .from('contacts')
        .insert(payload)
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

    const payload = { ...updates };

    // Calculate image_url if path provided
    if (payload.image_path) {
        // @ts-ignore
        payload.image_url = getStorageUrl(payload.image_path, payload.image_bucket || 'avatars');
    }

    // Clean up legacy fields - they don't exist in DB anymore
    // @ts-ignore
    delete payload.image_path;
    // @ts-ignore
    delete payload.image_bucket;

    // 1. Update Details
    const { error } = await supabase
        .from('contacts')
        .update(payload)
        .eq('id', contactId);

    if (error) {
        console.error("Error updating contact:", error);
        throw new Error(`Failed to update contact: ${error.message} (${error.details || ''})`);
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
                console.log("Inserting links:", links);
                const { error: insertError } = await supabase.from('contact_type_links').insert(links);
                if (insertError) {
                    console.error("Error inserting links:", insertError);
                    throw new Error("Failed to link contact types: " + insertError.message);
                }
            }
        }
    }

    revalidatePath('/', 'layout'); // Aggressive refresh to ensure next-intl routes update
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

// Update actions to return data for UI state updates, and support replacement logic
export async function createContactType(organizationId: string, name: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('contact_types')
        .insert({ organization_id: organizationId, name })
        .select()
        .single();

    if (error) {
        console.error("Error creating contact type:", error);
        throw new Error("Failed to create contact type");
    }

    revalidatePath(`/organization/contacts`);
    return data;
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

export async function deleteContactType(id: string, replacementId?: string) {
    const supabase = await createClient();

    // 1. Reassign if replacement requested
    if (replacementId) {
        // Find links with the old type
        const { data: linksToMigrate } = await supabase
            .from('contact_type_links')
            .select('*')
            .eq('contact_type_id', id);

        if (linksToMigrate && linksToMigrate.length > 0) {
            // We need to insert new links for these contacts with replacementId
            // BUT ensure we don't violate unique(contact_id, contact_type_id)
            // Postgres INSERT ON CONFLICT DO NOTHING is perfect here.

            const newLinks = linksToMigrate.map(link => ({
                contact_id: link.contact_id,
                contact_type_id: replacementId,
                organization_id: link.organization_id
            }));

            const { error: moveError } = await supabase
                .from('contact_type_links')
                .upsert(newLinks, { onConflict: 'contact_id, contact_type_id', ignoreDuplicates: true });

            if (moveError) {
                console.error("Error migrating links:", moveError);
                // Proceed to delete anyway? warning? 
                // Assuming soft failure is acceptable, but let's log it.
            }
        }
    }

    // 2. Soft Delete
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

// --- AVATAR UPLOAD ---

export async function uploadContactAvatar(formData: FormData) {
    const supabase = await createClient();
    const file = formData.get('file') as File;

    if (!file) {
        return { success: false, error: "No file provided" };
    }

    // validate file size/type if needed
    if (file.size > 5 * 1024 * 1024) {
        return { success: false, error: "File too large (max 5MB)" };
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `contact-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `contacts/${fileName}`; // Folder 'contacts' inside 'avatars' bucket

    const { error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

    if (error) {
        console.error("Error uploading avatar:", error);
        return { success: false, error: "Failed to upload avatar" };
    }

    return { success: true, path: filePath };
}
