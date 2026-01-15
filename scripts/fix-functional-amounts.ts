
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Or preferably use SERVICE_ROLE_KEY if available for bypassing RLS, 
// but sticking to ANON might require user context which is hard in script.
// Let's try ANON first, checking if we have enough permissions or if we need SERVICE_KEY.
// Actually, usually admin tasks need SERVICE_ROLE_KEY. 
// I'll check if SUPABASE_SERVICE_ROLE_KEY is in .env.local usually? 
// If not, I'll rely on RLS allowing access if I can simulate a user or if policies allow.
// But wait, if RLS is on, ANON key won't work for UPDATE without a session.
// I'll try to use SUPABASE_SERVICE_ROLE_KEY.

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    // Fallback to warning user if we can't run it fully.
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixFunctionalAmounts() {
    console.log("Starting backfill of functional_amount...");

    // 1. Fetch payments with NULL functional_amount
    const { data: payments, error: fetchError } = await supabase
        .from('client_payments')
        .select('id, amount, exchange_rate')
        .is('functional_amount', null);

    if (fetchError) {
        console.error("Error fetching payments:", fetchError);
        return;
    }

    console.log(`Found ${payments?.length || 0} payments to update.`);

    if (!payments || payments.length === 0) return;

    // 2. Update each payment
    let successCount = 0;
    let errorCount = 0;

    for (const payment of payments) {
        const rate = payment.exchange_rate || 1;
        const functionalAmount = payment.amount * rate;

        const { error: updateError } = await supabase
            .from('client_payments')
            .update({ functional_amount: functionalAmount })
            .eq('id', payment.id);

        if (updateError) {
            console.error(`Failed to update payment ${payment.id}:`, updateError);
            errorCount++;
        } else {
            successCount++;
        }
    }

    console.log(`Finished. Updated: ${successCount}. Errors: ${errorCount}.`);
}

fixFunctionalAmounts();
