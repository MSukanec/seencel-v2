"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useOrganization } from "@/stores/organization-store";
import { useOrganizationStore } from "@/stores/organization-store";

// ============================================================================
// Types
// ============================================================================

interface PresenceContextType {
    sessionId: string | null;
    isTracking: boolean;
}

const PresenceContext = createContext<PresenceContextType>({
    sessionId: null,
    isTracking: false,
});

// ============================================================================
// Hook
// ============================================================================

export function usePresence() {
    return useContext(PresenceContext);
}

// ============================================================================
// Provider
// ============================================================================

interface PresenceProviderProps {
    children: ReactNode;
    userId: string;
}

// Heartbeat interval: 45 seconds
const HEARTBEAT_INTERVAL = 45 * 1000;

/**
 * Generates a unique session ID per browser tab
 * Uses sessionStorage to persist across page navigations within the same tab
 */
function getOrCreateSessionId(): string {
    if (typeof window === 'undefined') return '';

    const STORAGE_KEY = 'seencel_session_id';
    let sessionId = sessionStorage.getItem(STORAGE_KEY);

    if (!sessionId) {
        sessionId = crypto.randomUUID();
        sessionStorage.setItem(STORAGE_KEY, sessionId);
    }

    return sessionId;
}

/**
 * Derives a readable view name from the pathname.
 * Uses ordered prefix matching (most specific first) to ensure
 * deep routes are correctly identified before shallow ones.
 */
function deriveViewName(pathname: string): string {
    // Remove locale prefix (e.g., /es/hub -> /hub)
    const cleanPath = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '');

    // ================================================================
    // 1. Exact match map (static routes without dynamic segments)
    // ================================================================
    const exactMap: Record<string, string> = {
        '': 'Hub',
        '/': 'Hub',
        '/hub': 'Hub',
        '/profile': 'Mi Perfil',
        '/maintenance': 'Mantenimiento',
        '/docs': 'Documentación',

        // ── Organization ──
        '/organization': 'Organización',
        '/organization/catalog': 'Catálogo de Tareas',
        '/organization/contacts': 'Contactos',
        '/organization/finance': 'Finanzas',
        '/organization/general-costs': 'Gastos Generales',
        '/organization/capital': 'Capital',
        '/organization/settings': 'Configuración',
        '/organization/planner': 'Planificador',
        '/organization/projects': 'Proyectos',
        '/organization/quotes': 'Presupuestos',
        '/organization/reports': 'Reportes',
        '/organization/files': 'Archivos',
        '/organization/team': 'Equipo',


        // ── Academy ──
        '/academy/my-courses': 'Academia - Mis Cursos',

        // ── Community ──
        '/community/founders': 'Comunidad - Fundadores',
        '/community/map': 'Comunidad - Mapa',

        // ── Checkout ──
        '/checkout': 'Checkout',
        '/checkout/success': 'Checkout - Éxito',
        '/checkout/pending': 'Checkout - Pendiente',
        '/checkout/failure': 'Checkout - Error',

        // ── Admin ──
        '/admin': 'Admin - Dashboard',
        '/admin/academy': 'Admin - Academia',
        '/admin/audit-logs': 'Admin - Auditoría',
        '/admin/billing': 'Admin - Facturación',
        '/admin/catalog': 'Admin - Catálogo',
        '/admin/changelog': 'Admin - Changelog',
        '/admin/directory': 'Admin - Directorio',
        '/admin/emails': 'Admin - Emails',
        '/admin/feedback': 'Admin - Feedback',
        '/admin/finance': 'Admin - Finanzas',
        '/admin/hub-content': 'Admin - Contenido Hub',
        '/admin/organizations': 'Admin - Organizaciones',
        '/admin/settings': 'Admin - Configuración',
        '/admin/support': 'Admin - Soporte',
        '/admin/system': 'Admin - Sistema',
        '/admin/users': 'Admin - Usuarios',
    };

    if (exactMap[cleanPath]) {
        return exactMap[cleanPath];
    }

    // ================================================================
    // 2. Dynamic route patterns (ordered most specific first)
    // ================================================================
    const dynamicPatterns: Array<{ pattern: RegExp; label: string | ((match: RegExpMatchArray) => string) }> = [
        // ── Academy: course detail with tab ──
        { pattern: /^\/academy\/my-courses\/([^/]+)\/player$/, label: (m) => `Curso: ${formatCourseSlug(m[1])} - Reproductor` },
        { pattern: /^\/academy\/my-courses\/([^/]+)\/content$/, label: (m) => `Curso: ${formatCourseSlug(m[1])} - Contenido` },
        { pattern: /^\/academy\/my-courses\/([^/]+)\/forum$/, label: (m) => `Curso: ${formatCourseSlug(m[1])} - Foro` },
        { pattern: /^\/academy\/my-courses\/([^/]+)\/notes$/, label: (m) => `Curso: ${formatCourseSlug(m[1])} - Notas` },
        { pattern: /^\/academy\/my-courses\/([^/]+)/, label: (m) => `Curso: ${formatCourseSlug(m[1])}` },

        // ── Admin: course detail with tab ──
        { pattern: /^\/admin\/academy\/([^/]+)\/content$/, label: 'Admin - Curso: Contenido' },
        { pattern: /^\/admin\/academy\/([^/]+)\/forum$/, label: 'Admin - Curso: Foro' },
        { pattern: /^\/admin\/academy\/([^/]+)\/general$/, label: 'Admin - Curso: General' },
        { pattern: /^\/admin\/academy\/([^/]+)\/marketing$/, label: 'Admin - Curso: Marketing' },
        { pattern: /^\/admin\/academy\/([^/]+)\/testimonials$/, label: 'Admin - Curso: Testimonios' },
        { pattern: /^\/admin\/academy\/([^/]+)/, label: 'Admin - Curso: Detalle' },

        // ── Admin: catalog detail ──
        { pattern: /^\/admin\/catalog\/division\//, label: 'Admin - División' },
        { pattern: /^\/admin\/catalog\/element\//, label: 'Admin - Elemento' },
        { pattern: /^\/admin\/catalog\/task\//, label: 'Admin - Tarea' },

        // ── Organization: catalog detail ──
        { pattern: /^\/organization\/catalog\/task\//, label: 'Catálogo - Tarea' },
        { pattern: /^\/organization\/quotes\//, label: 'Presupuesto - Detalle' },

        // ── Project (with projectId) ──
        { pattern: /^\/project\/[^/]+\/construction-tasks$/, label: 'Proyecto - Tareas' },
        { pattern: /^\/project\/[^/]+\/clients$/, label: 'Proyecto - Clientes' },
        { pattern: /^\/project\/[^/]+\/details$/, label: 'Proyecto - Detalles' },
        { pattern: /^\/organization\/projects\/[^/]+$/, label: 'Proyecto - Detalles' },
        { pattern: /^\/project\/[^/]+\/files$/, label: 'Proyecto - Archivos' },
        { pattern: /^\/project\/[^/]+\/finance$/, label: 'Proyecto - Finanzas' },
        { pattern: /^\/project\/[^/]+\/health$/, label: 'Proyecto - Salud' },
        { pattern: /^\/project\/[^/]+\/labor$/, label: 'Proyecto - Mano de Obra' },
        { pattern: /^\/project\/[^/]+\/materials$/, label: 'Proyecto - Materiales' },
        { pattern: /^\/project\/[^/]+\/planner$/, label: 'Proyecto - Planificador' },
        { pattern: /^\/project\/[^/]+\/portal$/, label: 'Proyecto - Portal' },
        { pattern: /^\/project\/[^/]+\/quotes$/, label: 'Proyecto - Presupuestos' },
        { pattern: /^\/project\/[^/]+\/sitelog$/, label: 'Proyecto - Bitácora' },
        { pattern: /^\/project\/[^/]+\/subcontracts$/, label: 'Proyecto - Subcontratos' },
        { pattern: /^\/project\/[^/]+$/, label: 'Proyecto - Resumen' },

        // ── Docs ──
        { pattern: /^\/docs\//, label: 'Documentación' },
    ];

    for (const { pattern, label } of dynamicPatterns) {
        const match = cleanPath.match(pattern);
        if (match) {
            return typeof label === 'function' ? label(match) : label;
        }
    }

    // ================================================================
    // 3. Fallback: format the path segments
    // ================================================================
    const segments = cleanPath.split('/').filter(Boolean);

    // Skip UUID-like segments for better readability
    const meaningful = segments.filter(s => !/^[0-9a-f-]{20,}$/.test(s));

    if (meaningful.length > 0) {
        return meaningful
            .map(s => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' '))
            .join(' - ');
    }

    return 'Desconocido';
}

/**
 * Formats a course slug into a readable name.
 * Uses a known map for branded courses, otherwise humanizes the slug.
 */
function formatCourseSlug(slug: string): string {
    const knownCourses: Record<string, string> = {
        'master-archicad': 'Master ArchiCAD',
    };
    return knownCourses[slug] || slug
        .replace(/-/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}

export function PresenceProvider({ children, userId }: PresenceProviderProps) {
    const { activeOrgId } = useOrganization();
    const isImpersonating = useOrganizationStore(state => state.isImpersonating);
    const pathname = usePathname();
    const sessionIdRef = useRef<string>('');
    const lastPathRef = useRef<string>('');
    const [isTracking, setIsTracking] = useState(false);

    // Initialize session ID on mount
    useEffect(() => {
        sessionIdRef.current = getOrCreateSessionId();
    }, []);

    // ========================================================================
    // Heartbeat Effect
    // ========================================================================
    useEffect(() => {
        if (!userId || !activeOrgId || !sessionIdRef.current) return;
        if (isImpersonating) return; // Suppress heartbeat during admin impersonation

        const supabase = createClient();

        const sendHeartbeat = async () => {
            try {
                await supabase.rpc('heartbeat', {
                    p_org_id: activeOrgId,
                    p_session_id: sessionIdRef.current,
                    p_status: 'online',
                });
                setIsTracking(true);
            } catch (error) {
                console.error('[Presence] Heartbeat failed:', error);
            }
        };

        // Send initial heartbeat
        sendHeartbeat();

        // Set up interval
        const interval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

        // Cleanup
        return () => {
            clearInterval(interval);
        };
    }, [userId, activeOrgId, isImpersonating]);

    // ========================================================================
    // Navigation Tracking Effect
    // ========================================================================
    useEffect(() => {
        if (!userId || !activeOrgId || !sessionIdRef.current) return;
        if (!pathname) return;
        if (isImpersonating) return; // Suppress tracking during admin impersonation

        // Skip if same path
        if (pathname === lastPathRef.current) return;
        lastPathRef.current = pathname;

        const supabase = createClient();
        const viewName = deriveViewName(pathname);

        const trackNavigation = async () => {
            try {
                await supabase.rpc('analytics_track_navigation', {
                    p_org_id: activeOrgId,
                    p_session_id: sessionIdRef.current,
                    p_view_name: viewName,
                });
            } catch (error) {
                // Navigation tracking is non-critical, just log
                console.error('[Presence] Navigation tracking failed:', error);
            }
        };

        trackNavigation();
    }, [pathname, userId, activeOrgId, isImpersonating]);

    // ========================================================================
    // Visibility Change Effect (tab switching)
    // ========================================================================
    useEffect(() => {
        if (!userId || !activeOrgId || !sessionIdRef.current) return;
        if (isImpersonating) return; // Suppress visibility during admin impersonation

        const supabase = createClient();

        const handleVisibilityChange = async () => {
            const status = document.hidden ? 'away' : 'online';

            try {
                await supabase.rpc('heartbeat', {
                    p_org_id: activeOrgId,
                    p_session_id: sessionIdRef.current,
                    p_status: status,
                });
            } catch (error) {
                // Non-critical
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [userId, activeOrgId, isImpersonating]);

    return (
        <PresenceContext.Provider value={{ sessionId: sessionIdRef.current, isTracking }}>
            {children}
        </PresenceContext.Provider>
    );
}
