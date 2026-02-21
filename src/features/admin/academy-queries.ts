import { createClient } from "@/lib/supabase/server";

// ============================================
// Types
// ============================================

export interface AdminCourseEnrollment {
    id: string;
    user_id: string;
    course_id: string;
    status: string;
    started_at: string;
    expires_at: string | null;
    created_at: string;
    // Joined data
    user: {
        id: string;
        full_name: string | null;
        email: string;
        avatar_url: string | null;
    } | null;
    course: {
        id: string;
        title: string;
        slug: string;
    } | null;
    // Progress from view
    progress_pct: number | null;
    done_lessons: number | null;
    total_lessons: number | null;
    // Payment info
    payment: {
        id: string;
        amount: number | null;
        currency: string | null;
        provider: string;
        gateway: string | null;
        status: string;
        created_at: string;
    } | null;
}

export interface AdminCourse {
    id: string;
    slug: string;
    title: string;
    short_description: string | null;
    is_active: boolean;
    visibility: string;
    status: string;
    price: number | null;
    created_at: string;
    // Counts
    enrollments_count: number;
    modules_count: number;
    lessons_count: number;
    // Details (Joined)
    instructorId?: string | null;
    endorsement?: {
        title: string | null;
        description: string | null;
        imagePath: string | null;
    };
}

export interface CoursesDashboardData {
    kpis: {
        totalEnrollments: number;
        activeEnrollments: number;
        completedEnrollments: number;
        totalRevenue: number;
        revenueThisMonth: number;
        avgProgress: number;
        expiringIn7Days: number;
        expiredEnrollments: number;
    };
    recentEnrollments: AdminCourseEnrollment[];
    expiringEnrollments: AdminCourseEnrollment[];
    courseStats: {
        course_id: string;
        course_title: string;
        enrollments: number;
        revenue: number;
        avg_progress: number;
    }[];
}

// ============================================
// Queries
// ============================================

export async function getAdminCourseEnrollments(): Promise<AdminCourseEnrollment[]> {
    const supabase = await createClient();

    // Get enrollments — sin FK expansion cross-schema (users en public, enrollments en academy)
    const { data: enrollments, error } = await supabase
        .schema('academy').from('course_enrollments')
        .select(`id, user_id, course_id, status, started_at, expires_at, created_at`)
        .order("created_at", { ascending: false });

    // Get user data from public schema separately (cross-schema FK expansion no soportado por PostgREST)
    const userIds = [...new Set(enrollments?.map(e => e.user_id) ?? [])];
    const { data: usersData } = userIds.length
        ? await supabase.schema('iam').from('users').select('id, full_name, email, avatar_url').in('id', userIds)
        : { data: [] };
    const userMap = new Map<string, { id: string; full_name: string | null; email: string; avatar_url: string | null }>();
    usersData?.forEach(u => userMap.set(u.id, u));

    // Get course data from academy schema separately
    const courseIds = [...new Set(enrollments?.map(e => e.course_id) ?? [])];
    const { data: coursesData } = courseIds.length
        ? await supabase.schema('academy').from('courses').select('id, title, slug').in('id', courseIds)
        : { data: [] };
    const courseMap = new Map<string, { id: string; title: string; slug: string }>();
    coursesData?.forEach(c => courseMap.set(c.id, c));

    if (error) {
        console.error("Error fetching enrollments:", error);
        return [];
    }

    // Get progress for each enrollment
    const { data: progressData } = await supabase
        .schema('academy').from('course_progress_view')
        .select(`user_id, course_id, progress_pct, done_lessons, total_lessons`);

    const progressMap = new Map<string, { progress_pct: number; done_lessons: number; total_lessons: number }>();
    progressData?.forEach((p) => {
        progressMap.set(`${p.user_id}-${p.course_id}`, {
            progress_pct: p.progress_pct || 0,
            done_lessons: p.done_lessons || 0,
            total_lessons: p.total_lessons || 0,
        });
    });

    // Get payments for enrollments
    const { data: payments } = await supabase
        .from("payments")
        .select("id, user_id, course_id, amount, currency, provider, gateway, status, created_at")
        .not("course_id", "is", null)
        .eq("status", "completed");

    const paymentMap = new Map<string, AdminCourseEnrollment["payment"]>();
    payments?.forEach((p) => {
        if (p.course_id) {
            paymentMap.set(`${p.user_id}-${p.course_id}`, {
                id: p.id,
                amount: p.amount,
                currency: p.currency,
                provider: p.provider,
                gateway: p.gateway,
                status: p.status,
                created_at: p.created_at,
            });
        }
    });

    return (enrollments || []).map((e) => {
        const progress = progressMap.get(`${e.user_id}-${e.course_id}`);
        const payment = paymentMap.get(`${e.user_id}-${e.course_id}`);
        const userData = userMap.get(e.user_id) ?? null;
        const courseData = courseMap.get(e.course_id) ?? null;

        return {
            ...e,
            user: userData,
            course: courseData,
            progress_pct: progress?.progress_pct || null,
            done_lessons: progress?.done_lessons || null,
            total_lessons: progress?.total_lessons || null,
            payment: payment || null,
        };
    });
}

export async function getAdminCourses(): Promise<AdminCourse[]> {
    const supabase = await createClient();

    const { data: courses, error } = await supabase
        .schema('academy').from('courses')
        .select(`
            id,
            slug,
            title,
            short_description,
            is_active,
            visibility,
            status,
            price,
            created_at,
            course_details (
                instructor_id,
                endorsement_title,
                endorsement_description,
                endorsement_image_path
            )
        `)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching courses:", error);
        return [];
    }

    // Get enrollment counts
    const { data: enrollmentCounts } = await supabase
        .schema('academy').from('course_enrollments')
        .select("course_id")
        .in("course_id", courses?.map((c) => c.id) || []);

    const enrollmentCountMap = new Map<string, number>();
    enrollmentCounts?.forEach((e) => {
        enrollmentCountMap.set(e.course_id, (enrollmentCountMap.get(e.course_id) || 0) + 1);
    });

    // Get module counts
    const { data: moduleCounts } = await supabase
        .schema('academy').from('course_modules')
        .select("course_id")
        .eq("is_deleted", false)
        .in("course_id", courses?.map((c) => c.id) || []);

    const moduleCountMap = new Map<string, number>();
    moduleCounts?.forEach((m) => {
        moduleCountMap.set(m.course_id, (moduleCountMap.get(m.course_id) || 0) + 1);
    });

    // Get lesson counts from view
    const { data: lessonCounts } = await supabase
        .schema('academy').from('course_lessons_total_view')
        .select("course_id, total_lessons");

    const lessonCountMap = new Map<string, number>();
    lessonCounts?.forEach((l) => {
        lessonCountMap.set(l.course_id, l.total_lessons || 0);
    });

    return (courses || []).map((c) => {
        // Type assertion for the joined relationship
        const details = c.course_details as any; // Type safe enough for now
        // If course_details can be an array in some setups, we take the first one, but unique constraint says one.
        // It typically returns an object if single() or array if not specified. With standard select it returns object or array dep on relationship.
        // Let's assume object or array of 1.
        const detail = Array.isArray(details) ? details[0] : details;

        return {
            ...c,
            enrollments_count: enrollmentCountMap.get(c.id) || 0,
            modules_count: moduleCountMap.get(c.id) || 0,
            lessons_count: lessonCountMap.get(c.id) || 0,
            // Map details
            instructorId: detail?.instructor_id || null,
            endorsement: {
                title: detail?.endorsement_title || null,
                description: detail?.endorsement_description || null,
                imagePath: detail?.endorsement_image_path || null,
            }
        };
    });
}

export async function getCoursesDashboardData(): Promise<CoursesDashboardData> {
    const supabase = await createClient();

    // Get all enrollments
    const { data: enrollments } = await supabase
        .schema('academy').from('course_enrollments')
        .select("id, user_id, course_id, status, expires_at, created_at");

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const totalEnrollments = enrollments?.length || 0;
    const activeEnrollments = enrollments?.filter((e) => e.status === "active").length || 0;
    const completedEnrollments = enrollments?.filter((e) => e.status === "completed").length || 0;
    const expiredEnrollments = enrollments?.filter((e) => e.status === "expired").length || 0;
    const expiringIn7Days = enrollments?.filter((e) => {
        if (!e.expires_at || e.status !== "active") return false;
        const expDate = new Date(e.expires_at);
        return expDate > now && expDate <= in7Days;
    }).length || 0;

    // Get payments for courses
    const { data: payments } = await supabase
        .from("payments")
        .select("amount, currency, created_at, course_id")
        .not("course_id", "is", null)
        .eq("status", "completed");

    const totalRevenue = payments?.reduce((acc, p) => acc + (p.amount || 0), 0) || 0;
    const revenueThisMonth = payments?.filter((p) => new Date(p.created_at) >= startOfMonth)
        .reduce((acc, p) => acc + (p.amount || 0), 0) || 0;

    // Get average progress
    const { data: progressData } = await supabase
        .schema('academy').from('course_progress_view')
        .select("progress_pct");

    const avgProgress = progressData?.length
        ? progressData.reduce((acc, p) => acc + (p.progress_pct || 0), 0) / progressData.length
        : 0;

    // Get recent enrollments (last 10)
    const recentEnrollments = await getAdminCourseEnrollments();
    const recentTop10 = recentEnrollments.slice(0, 10);

    // Get expiring enrollments
    const expiringEnrollments = recentEnrollments.filter((e) => {
        if (!e.expires_at || e.status !== "active") return false;
        const expDate = new Date(e.expires_at);
        return expDate > now && expDate <= in7Days;
    }).slice(0, 10);

    // Course revenue stats
    const courseRevenueMap = new Map<string, { revenue: number; title: string }>();
    const { data: coursesData } = await supabase.schema('academy').from('courses').select("id, title");
    coursesData?.forEach((c) => courseRevenueMap.set(c.id, { revenue: 0, title: c.title }));

    payments?.forEach((p) => {
        if (p.course_id) {
            const existing = courseRevenueMap.get(p.course_id);
            if (existing) {
                existing.revenue += p.amount || 0;
            }
        }
    });

    // Enrollment count per course
    const courseEnrollmentMap = new Map<string, number>();
    enrollments?.forEach((e) => {
        courseEnrollmentMap.set(e.course_id, (courseEnrollmentMap.get(e.course_id) || 0) + 1);
    });

    // Average progress per course
    const { data: courseProgress } = await supabase
        .schema('academy').from('course_progress_view')
        .select("course_id, progress_pct");

    const courseProgressMap = new Map<string, { sum: number; count: number }>();
    courseProgress?.forEach((p) => {
        const existing = courseProgressMap.get(p.course_id) || { sum: 0, count: 0 };
        existing.sum += p.progress_pct || 0;
        existing.count += 1;
        courseProgressMap.set(p.course_id, existing);
    });

    const courseStats = Array.from(courseRevenueMap.entries()).map(([courseId, data]) => ({
        course_id: courseId,
        course_title: data.title,
        enrollments: courseEnrollmentMap.get(courseId) || 0,
        revenue: data.revenue,
        avg_progress: courseProgressMap.get(courseId)
            ? courseProgressMap.get(courseId)!.sum / courseProgressMap.get(courseId)!.count
            : 0,
    }));

    return {
        kpis: {
            totalEnrollments,
            activeEnrollments,
            completedEnrollments,
            totalRevenue,
            revenueThisMonth,
            avgProgress: Math.round(avgProgress * 100) / 100,
            expiringIn7Days,
            expiredEnrollments,
        },
        recentEnrollments: recentTop10,
        expiringEnrollments,
        courseStats,
    };
}

