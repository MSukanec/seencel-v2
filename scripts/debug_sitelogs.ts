
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSiteLogs() {
    console.log("Fetching site logs with media...");
    const { data, error } = await supabase
        .from('site_logs')
        .select(`
            id,
            comments,
            media_links (
                id,
                media_file:media_files (
                    id,
                    file_url,
                    file_type,
                    file_name
                )
            )
        `)
        .limit(5);

    if (error) {
        console.error("Error:", error);
        return;
    }

    if (!data || data.length === 0) {
        console.log("No site logs found.");
    } else {
        console.log(`Found ${data.length} logs.`);
        data.forEach((log: any, i: number) => {
            console.log(`Log ${i}:`, log.comments?.substring(0, 20));
            console.log(`Media Links:`, JSON.stringify(log.media_links, null, 2));
        });
    }
}

inspectSiteLogs();
