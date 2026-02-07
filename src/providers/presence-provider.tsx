"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useOrganization } from "@/stores/organization-store";

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
 * Derives a readable view name from the pathname
 */
function deriveViewName(pathname: string): string {
    // Remove locale prefix (e.g., /es/dashboard -> /dashboard)
    const cleanPath = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '');

    // Map common paths to readable names
    const pathMap: Record<string, string> = {
        '': 'Hub',
        '/': 'Hub',
        '/organization': 'Organization',
        '/organization/team': 'Team',
        '/organization/roles': 'Roles',
        '/pricing': 'Pricing',
        '/projects': 'Projects',
        '/contacts': 'Contacts',
        '/quotes': 'Quotes',
        '/reports': 'Reports',
        '/insights': 'Insights',
        '/preferences': 'Preferences',
        '/community': 'Community',
        '/finance': 'Finance',
        '/materials': 'Materials',
        // Academy general pages
        '/academy': 'Academia',
        '/academy/courses': 'Academia - Catálogo',
        '/academy/my-courses': 'Academia - Mis Cursos',
    };

    // Check for exact match
    if (pathMap[cleanPath]) {
        return pathMap[cleanPath];
    }

    // === SPECIAL: Extract course name from academy paths ===
    // Patterns: /academy/courses/[slug], /academy/my-courses/[slug]/[tab]
    const coursePatterns = [
        /^\/academy\/courses\/([^\/]+)/,
        /^\/academy\/my-courses\/([^\/]+)/,
    ];

    for (const pattern of coursePatterns) {
        const match = cleanPath.match(pattern);
        if (match && match[1]) {
            const courseSlug = match[1];
            // Known course names mapping
            const courseNames: Record<string, string> = {
                'master-archicad': 'Master ArchiCAD',
            };
            // Return known name or format the slug nicely
            return courseNames[courseSlug] || courseSlug
                .replace(/-/g, ' ')
                .replace(/\b\w/g, c => c.toUpperCase());
        }
    }

    // Check for prefix matches (e.g., /projects/abc -> Projects Detail)
    for (const [prefix, name] of Object.entries(pathMap)) {
        if (prefix && cleanPath.startsWith(prefix + '/')) {
            return `${name} Detail`;
        }
    }

    // Fallback: capitalize the first segment
    const segments = cleanPath.split('/').filter(Boolean);
    if (segments.length > 0) {
        return segments[0].charAt(0).toUpperCase() + segments[0].slice(1);
    }

    return 'Unknown';
}

export function PresenceProvider({ children, userId }: PresenceProviderProps) {
    const { activeOrgId } = useOrganization();
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
    }, [userId, activeOrgId]);

    // ========================================================================
    // Navigation Tracking Effect
    // ========================================================================
    useEffect(() => {
        if (!userId || !activeOrgId || !sessionIdRef.current) return;
        if (!pathname) return;

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
    }, [pathname, userId, activeOrgId]);

    // ========================================================================
    // Visibility Change Effect (tab switching)
    // ========================================================================
    useEffect(() => {
        if (!userId || !activeOrgId || !sessionIdRef.current) return;

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
    }, [userId, activeOrgId]);

    return (
        <PresenceContext.Provider value={{ sessionId: sessionIdRef.current, isTracking }}>
            {children}
        </PresenceContext.Provider>
    );
}
