import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const handleI18nRouting = createMiddleware(routing);

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // CRITICAL: Auth callback must be handled WITHOUT locale prefix
    // Skip i18n routing entirely for auth callback to prevent 404
    if (pathname.startsWith('/auth/callback')) {
        return NextResponse.next();
    }

    // Service Worker must be served from root without any redirects
    if (pathname === '/sw.js') {
        return NextResponse.next();
    }

    // CRITICAL: API routes must NEVER go through i18n middleware
    // MercadoPago/PayPal webhooks receive 307 redirect otherwise
    if (pathname.startsWith('/api/')) {
        return NextResponse.next();
    }

    // 1. Run I18n Middleware first to generate the response with locale
    const response = handleI18nRouting(request);

    // 2. Setup Supabase Client
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    );
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // 3. Get User Session
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // 4. Define Paths
    // Remove locale prefix to check logical path (e.g. /es/onboarding -> /onboarding)
    const pathWithoutLocale = pathname.replace(/^\/(en|es)/, "") || "/";

    // Public paths that valid users shouldn't necessarily be forced out of,
    // BUT if they are logged in, we verify onboarding.
    const isAuthPath = ["/login", "/signup", "/auth/callback", "/forgot-password", "/update-password"].some(p => pathWithoutLocale.startsWith(p));
    const isOnboardingPath = pathWithoutLocale.startsWith("/onboarding") || pathWithoutLocale.startsWith("/bienvenida");
    const isPublicStatic = ["/favicon.ico", "/api", "/_next", "/static", "/images"].some(p => pathname.startsWith(p)) || /\.(?:jpg|jpeg|gif|png|svg|ico|webp|js|json|xml|txt|webmanifest)$/i.test(pathname);

    if (isPublicStatic) return response;

    // 5. Auth Logic
    if (user) {
        // User is logged in

        // Check Onboarding Status
        // We use the internal user ID mapped from auth_id to check preferences
        const { data: userPrefs } = await supabase
            .from("user_preferences")
            .select("onboarding_completed")
            .eq("user_id", (await supabase.from("users").select("id").eq("auth_id", user.id).single()).data?.id)
            .single();

        const onboardingCompleted = userPrefs?.onboarding_completed ?? false;

        // SCENARIO 1: User needs onboarding but is not on onboarding page
        if (!onboardingCompleted && !isOnboardingPath) {
            const locale = request.cookies.get("NEXT_LOCALE")?.value || "es";
            return NextResponse.redirect(new URL(`/${locale}/onboarding`, request.url));
        }

        // SCENARIO 2: User completed onboarding but tries to go to onboarding page
        if (onboardingCompleted && isOnboardingPath) {
            const locale = request.cookies.get("NEXT_LOCALE")?.value || "es";
            return NextResponse.redirect(new URL(`/${locale}/organization`, request.url));
        }

        // SCENARIO 3: User logged in trying to access login/signup
        if (isAuthPath) {
            const locale = request.cookies.get("NEXT_LOCALE")?.value || "es";
            return NextResponse.redirect(new URL(`/${locale}/organization`, request.url));
        }

        // SCENARIO 4: Allow invitation acceptance for logged-in users
        const isInvitePath = pathWithoutLocale.startsWith("/invite") || pathWithoutLocale.startsWith("/invitacion");
        if (isInvitePath) {
            return response; // Let them through to accept invitation
        }

        // SCENARIO 5: Authenticated user on landing page → redirect to hub instantly
        // Skip redirect if user explicitly requested the landing page (?landing=true)
        if (pathWithoutLocale === "/" && !request.nextUrl.searchParams.has('landing')) {
            const locale = request.cookies.get("NEXT_LOCALE")?.value || "es";
            return NextResponse.redirect(new URL(`/${locale}/hub`, request.url));
        }

    } else {
        // User is NOT logged in

        // Public pages - must include BOTH English and Spanish paths due to i18n routing
        // English paths: /privacy, /terms, /contact, /founders, /pricing, /features, /courses, /academy, /about, /portal, /community
        // Spanish paths: /privacidad, /terminos, /contacto, /fundadores, /precios, /caracteristicas, /cursos, /academia, /sobre, /portal, /comunidad
        const publicPrefixes = [
            // English
            "/privacy", "/terms", "/cookies", "/contact", "/founders", "/pricing", "/features", "/courses", "/academy", "/about", "/portal", "/community", "/offline", "/invite",
            // Spanish translations
            "/privacidad", "/terminos", "/contacto", "/fundadores", "/precios", "/caracteristicas", "/cursos", "/academia", "/sobre", "/comunidad", "/invitacion"
        ];
        const isPublicPage = pathWithoutLocale === "/" || isAuthPath || publicPrefixes.some(p => pathWithoutLocale.startsWith(p));

        if (!isPublicPage) {
            const locale = request.cookies.get("NEXT_LOCALE")?.value || "es";
            return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
        }
    }

    return response;
}

export const config = {
    // Matcher ignores static files and _next internals
    // We REMOVED 'api|' from the negative lookahead to let API routes enter middleware
    // and be handled by our explicit check at the top of the file.
    matcher: ["/", "/(es|en)/:path*((?!_next/static|_next/image|images|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|json|xml|txt|webmanifest)$).*)", "/((?!_next/static|_next/image|images|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|json|xml|txt|webmanifest)$).*)"],
};

