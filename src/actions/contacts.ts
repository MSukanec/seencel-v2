"use server";

import { createClient } from "@/lib/supabase/server";
import { Contact, ContactWithRelations, ContactCategory } from "@/types/contact";
import { revalidatePath } from "next/cache";
import { completeOnboardingStep } from "@/features/onboarding/actions";

// --- CONTACTS ---

export async function getOrganizationContacts(organizationId: string): Promise<ContactWithRelations[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('contacts_view')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_deleted', false) // Filter out deleted contacts
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

export async function createContact(organizationId: string, contact: Partial<Contact>, categoryIds: string[] = []) {
    const supabase = await createClient();

    // Prepare payload
    const payload = {
        ...contact,
        organization_id: organizationId,
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

    // 2. Link Categories if provided
    if (categoryIds.length > 0) {
        const links = categoryIds.map(categoryId => ({
            contact_id: newContact.id,
            contact_category_id: categoryId,
            organization_id: organizationId
        }));

        const { error: linkError } = await supabase
            .from('contact_category_links')
            .insert(links);

        if (linkError) {
            console.error("Error linking contact categories:", linkError);
            // We don't throw here to avoid failing the whole operation if just tagging fails, but good to note.
        }
    }

    revalidatePath(`/organization/contacts`);

    // Mark onboarding step as completed (fire and forget)
    completeOnboardingStep('create_contact').catch(() => { });

    return newContact;
}

export async function updateContact(contactId: string, updates: Partial<Contact>, categoryIds?: string[]) {
    const supabase = await createClient();

    const payload = {
        ...updates,
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

    // 2. Update Categories if provided (replace all)
    if (categoryIds) {
        // Remove existing links
        await supabase
            .from('contact_category_links')
            .delete()
            .eq('contact_id', contactId);

        // Add new links
        if (categoryIds.length > 0) {
            // Need org_id, fetch from contact if not available context, but usually we pass it or allow DB to handle if optional?
            // Schema says organization_id is foreign key on links. 
            // We need to fetch the contact's org_id to be safe, or pass it. 
            // Let's fetch it quickly to ensure integrity.
            const { data: contact } = await supabase.from('contacts').select('organization_id').eq('id', contactId).single();

            if (contact) {
                // Deduplicate categoryIds to prevent unique constraint violations in the same batch
                const uniqueCategoryIds = Array.from(new Set(categoryIds));
                const links = uniqueCategoryIds.map(categoryId => ({
                    contact_id: contactId,
                    contact_category_id: categoryId,
                    organization_id: contact.organization_id
                }));
                console.log("Inserting links:", links);
                const { error: insertError } = await supabase.from('contact_category_links').insert(links);
                if (insertError) {
                    console.error("Error inserting links:", insertError);
                    throw new Error("Failed to link contact categories: " + insertError.message);
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
        // For now, contact_category_links uses CASCADE so no migration needed there

        // Placeholder for future FK migrations:
        // await supabase.from('some_table').update({ contact_id: replacementId }).eq('contact_id', contactId);
    }

    // 2. Soft delete
    const { error } = await supabase
        .from('contacts')
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
        })
        .eq('id', contactId);

    if (error) {
        console.error("Error deleting contact:", JSON.stringify(error, null, 2));
        throw new Error(`Failed to delete contact: ${error.message} | code: ${error.code} | details: ${error.details} | hint: ${error.hint}`);
    }

    revalidatePath(`/organization/contacts`);
}

// --- CONTACT CATEGORIES ---

export async function getContactCategories(organizationId: string): Promise<ContactCategory[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('contact_categories')
        .select('*')
        .or(`organization_id.eq.${organizationId},organization_id.is.null`)
        .eq('is_deleted', false)
        .order('name');

    if (error) {
        console.error("Error fetching contact categories:", error);
        return [];
    }

    return data as ContactCategory[];
}

// Update actions to return data for UI state updates, and support replacement logic
export async function createContactCategory(organizationId: string, name: string) {
    const supabase = await createClient();

    // 1. Get Auth User
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        console.error("Error getting user for createContactCategory:", authError);
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
        .from('contact_categories')
        .insert({
            organization_id: organizationId,
            name,
            created_by: memberData.id,
            updated_by: memberData.id
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating contact category:", error);
        throw new Error(`Failed to create contact category: ${error.message} (${error.details || ''})`);
    }

    revalidatePath(`/organization/contacts`);
    return data;
}

export async function updateContactCategory(id: string, name: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('contact_categories')
        .update({ name })
        .eq('id', id);

    if (error) {
        console.error("Error updating contact category:", error);
        throw new Error("Failed to update contact category");
    }

    revalidatePath(`/organization/contacts`);
}

export async function deleteContactCategory(id: string, replacementId?: string) {
    const supabase = await createClient();

    // 1. Reassign if replacement requested
    if (replacementId) {
        // Find links with the old category
        const { data: linksToMigrate } = await supabase
            .from('contact_category_links')
            .select('*')
            .eq('contact_category_id', id);

        if (linksToMigrate && linksToMigrate.length > 0) {
            // We need to insert new links for these contacts with replacementId
            // BUT ensure we don't violate unique(contact_id, contact_category_id)
            // Postgres INSERT ON CONFLICT DO NOTHING is perfect here.

            const newLinks = linksToMigrate.map(link => ({
                contact_id: link.contact_id,
                contact_category_id: replacementId,
                organization_id: link.organization_id
            }));

            const { error: moveError } = await supabase
                .from('contact_category_links')
                .upsert(newLinks, { onConflict: 'contact_id, contact_category_id', ignoreDuplicates: true });

            if (moveError) {
                console.error("Error migrating links:", moveError);
                // Proceed to delete anyway? warning? 
                // Assuming soft failure is acceptable, but let's log it.
            }
        }
    }

    // 2. Soft Delete
    const { error } = await supabase
        .from('contact_categories')
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
        })
        .eq('id', id);

    if (error) {
        console.error("Error deleting contact category:", error);
        throw new Error("Failed to delete contact category");
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

export async function getContactsByCategories(organizationId: string, categories: string[]): Promise<Contact[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('contacts')
        .select(`
            *,
            contact_category_links!inner (
                contact_categories!inner (
                    name
                )
            )
        `)
        .eq('organization_id', organizationId)
        .eq('is_deleted', false)
        .in('contact_category_links.contact_categories.name', categories)
        .order('full_name', { ascending: true });

    if (error) {
        console.error("Error fetching contacts by categories:", error);
        return [];
    }

    // Dedup contact objects using a Map
    const uniqueContactsMap = new Map();
    data.forEach((item: any) => {
        if (!uniqueContactsMap.has(item.id)) {
            const { contact_category_links, ...contact } = item;
            uniqueContactsMap.set(item.id, contact as Contact);
        }
    });

    return Array.from(uniqueContactsMap.values());
}
