import { createClient } from '@/lib/supabase/server';

export interface Country {
    id: string;
    name: string;
    alpha_2: string | null;
    alpha_3: string;
    country_code: string | null;
}

export async function getCountries(): Promise<Country[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('countries')
        .select('id, name, alpha_2, alpha_3, country_code')
        .order('name', { ascending: true });

    if (error) {
        console.error('Error fetching countries:', error);
        return [];
    }

    return data || [];
}
