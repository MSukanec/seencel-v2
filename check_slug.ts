
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkSlug() {
    const { data, error } = await supabase
        .from("courses")
        .select("id, title, slug, is_active, is_deleted")
        .ilike("title", "%ArchiCAD%")

    console.log(JSON.stringify(data, null, 2));
}

checkSlug();
