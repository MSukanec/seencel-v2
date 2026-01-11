import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // Default to organization dashboard after login if no specific next param
    const next = searchParams.get('next') ?? '/organization'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            // Successful exchange, redirect to intended destination
            return NextResponse.redirect(`${origin}${next}`)
        }

        console.error('Auth callback error:', error)
    }

    // Return the user to an error page with instructions if code exchange failed
    // or if no code provided (shouldn't happen on valid callback)
    return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
