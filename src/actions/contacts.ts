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

export async function getContactsSummary(organizationId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('contacts_summary_view')
        .select('*')
        .eq('organization_id', organizationId)
        .single();

    if (error) {
        console.error("Error fetching contacts summary:", error);
        return { total_contacts: 0, linked_contacts: 0, member_contacts: 0 };
    }

    return data as { total_contacts: number; linked_contacts: number; member_contacts: number };
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

    // Prepare payload
    const payload = {
        ...contact,
        organization_id: organizationId,
        created_by: (await supabase.auth.getUser()).data.user?.id,
        updated_by: (await supabase.auth.getUser()).data.user?.id
    };

    // Convert relative path to full URL if needed
    if (payload.image_url && !payload.image_url.startsWith('http')) {
        payload.image_url = getStorageUrl(payload.image_url, 'avatars');
    }

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

    const payload = {
        ...updates,
        updated_by: (await supabase.auth.getUser()).data.user?.id
    };

    // Convert relative path to full URL if needed
    if (payload.image_url && !payload.image_url.startsWith('http')) {
        payload.image_url = getStorageUrl(payload.image_url, 'avatars');
    }

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

export async function deleteContact(contactId: string, replacementId?: string) {
    const supabase = await createClient();

    // 1. If replacement requested, migrate any references
    if (replacementId) {
        // Future: Add migrations here if contacts are FK'd from other tables
        // Example: Update project_data.client_id from contactId to replacementId
        // For now, contact_type_links uses CASCADE so no migration needed there

        // Placeholder for future FK migrations:
        // await supabase.from('some_table').update({ contact_id: replacementId }).eq('contact_id', contactId);
    }

    // 2. Soft delete
    const { error } = await supabase
        .from('contacts')
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
            updated_by: (await supabase.auth.getUser()).data.user?.id
        })
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

    // 1. Get Auth User
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        console.error("Error getting user for createContactType:", authError);
        throw new Error("Authentication failed");
    }

    // 2. Get Public User ID
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

    if (userError || !userData) {
        console.error("Error fetching public user profile:", userError);
        throw new Error("User profile not found");
    }

    // 3. Get Organization Member ID
    const { data: memberData, error: memberError } = await supabase
        .from('organization_members')
        .select('id')
        .eq('user_id', userData.id)
        .eq('organization_id', organizationId)
        .single();

    if (memberError || !memberData) {
        console.error("Error fetching organization member:", memberError);
        throw new Error("You are not a member of this organization");
    }

    const { data, error } = await supabase
        .from('contact_types')
        .insert({
            organization_id: organizationId,
            name,
            created_by: memberData.id,
            updated_by: memberData.id
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating contact type:", error);
        throw new Error(`Failed to create contact type: ${error.message} (${error.details || ''})`);
    }

    revalidatePath(`/organization/contacts`);
    revalidatePath(`/organization/contacts/settings`); // Assuming there might be a settings page
    return data;
}

export async function updateContactType(id: string, name: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('contact_types')
        .update({
            name,
            updated_by: (await supabase.auth.getUser()).data.user?.id
        })
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
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
            updated_by: (await supabase.auth.getUser()).data.user?.id
        })
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

