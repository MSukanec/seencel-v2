import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // Default to HUB after login — the dashboard layout guard will redirect
    // to /onboarding if signup_completed is false (new users)
    const next = searchParams.get('next') ?? '/hub'

    // Get locale from cookie or default to 'es'
    const cookieStore = await cookies()
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'es'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            // Successful exchange, redirect to intended destination with locale
            // Ensure the path has locale prefix for proper i18n routing
            const redirectPath = next.startsWith(`/${locale}`) ? next : `/${locale}${next}`
            return NextResponse.redirect(`${origin}${redirectPath}`)
        }

        console.error('Auth callback error:', error)
    }

    // Return the user to an error page with instructions if code exchange failed
    // or if no code provided (shouldn't happen on valid callback)
    return NextResponse.redirect(`${origin}/${locale}/login?error=auth_callback_error`)
}

