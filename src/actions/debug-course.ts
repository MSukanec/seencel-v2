
import { createClient } from "@/lib/supabase/server";

export async function debugCourseFetch(slug: string) {
    const supabase = await createClient();

    console.log(`--- DEBUGGING SLUG: ${slug} ---`);

    // 1. Try exact match
    const { data: exact, error: exactError } = await supabase
        .schema('academy').from('courses')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

    console.log('1. Exact Match:', exact ? 'FOUND' : 'NOT FOUND');
    if (exact) {
        console.log('   ID:', exact.id);
        console.log('   Active:', exact.is_active);
        console.log('   Deleted:', exact.is_deleted);
    }
    if (exactError) console.log('   Error:', exactError.message);

    // 2. Try match ignoring filters (already did above, assuming basic fetch)

    // 3. Check if list view finds it
    const { data: listData } = await supabase
        .schema('academy').from('courses')
        .select('slug, title')
        .eq('is_deleted', false)
        .eq('is_active', true);

    console.log('2. List View candidates:', listData?.map(c => c.slug));

    return { exact, listCandidates: listData };
}

