import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const handleI18nRouting = createMiddleware(routing);

export async function middleware(request: NextRequest) {
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
    const { pathname } = request.nextUrl;
    // Remove locale prefix to check logical path (e.g. /es/onboarding -> /onboarding)
    const pathWithoutLocale = pathname.replace(/^\/(en|es)/, "") || "/";

    // Public paths that valid users shouldn't necessarily be forced out of,
    // BUT if they are logged in, we verify onboarding.
    const isAuthPath = ["/login", "/signup", "/auth/callback"].some(p => pathWithoutLocale.startsWith(p));
    const isOnboardingPath = pathWithoutLocale.startsWith("/onboarding");
    const isPublicStatic = ["/favicon.ico", "/api", "/_next", "/static", "/images"].some(p => pathname.startsWith(p)) || /\.(?:jpg|jpeg|gif|png|svg|ico|webp|js)$/i.test(pathname);

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

    } else {
        // User is NOT logged in

        // If trying to access protected routes (organization, onboarding, etc)
        // Allowing public landing page (root /) and auth paths
        // Also allow specific public information pages
        const publicPrefixes = ["/privacy", "/terms", "/cookies", "/contact", "/founders", "/pricing", "/features", "/courses", "/about", "/portal"];
        const isPublicPage = pathWithoutLocale === "/" || isAuthPath || publicPrefixes.some(p => pathWithoutLocale.startsWith(p));

        if (!isPublicPage) {
            const locale = request.cookies.get("NEXT_LOCALE")?.value || "es";
            return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
        }
    }

    return response;
}

export const config = {
    matcher: ["/", "/(es|en)/:path*((?!_next/static|_next/image|images|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)", "/((?!api|_next/static|_next/image|images|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};

