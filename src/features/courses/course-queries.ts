import { createClient } from "@/lib/supabase/server";
import { Course, Instructor, Module, Lesson, Testimonial, FAQ, Company, StudentWork, Masterclass, CourseDetails, EnabledSections, DEFAULT_ENABLED_SECTIONS } from "@/components/course/mock-course-data";

export async function getCourseBySlug(slug: string): Promise<Course | null> {
    const supabase = await createClient();

    // 1. Fetch main course data
    const { data: course, error: courseError } = await supabase
        .from("courses")
        .select(`
            id,
            slug,
            title,
            short_description,
            price,
            is_active,
            image_path
        `)
        .eq("slug", slug)
        .eq("is_deleted", false)
        .single();

    if (courseError || !course) {
        console.error("Error fetching course:", courseError);
        return null;
    }

    // 2. Fetch course details
    const { data: details, error: detailsError } = await supabase
        .from("course_details")
        .select(`
            badge_text,
            preview_video_id,
            landing_sections,
            instructor_id,
            endorsement_title,
            endorsement_description,
            endorsement_image_path
        `)
        .eq("course_id", course.id)
        .single();

    // Helper to construct full image URL
    const getStorageUrlHero = (path: string | null) => {
        if (!path) return "/images/course-hero-placeholder.webp";
        if (path.startsWith("http")) return path;
        return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/public-assets/${path}`;
    };

    // 3. Fetch instructor
    let instructor: Instructor = {
        name: "Instructor Seencel",
        title: "Expert",
        bio: "",
        avatar: "",
        credentials: [],
        social: {}
    };

    if (details?.instructor_id) {
        const { data: instructorData } = await supabase
            .from("course_instructors")
            .select("*")
            .eq("id", details.instructor_id)
            .single();

        if (instructorData) {
            instructor = {
                name: instructorData.name,
                title: instructorData.title || "",
                bio: instructorData.bio || "",
                avatar: getStorageUrlHero(instructorData.avatar_path),
                credentials: instructorData.credentials || [],
                social: {
                    linkedin: instructorData.linkedin_url || undefined,
                    youtube: instructorData.youtube_url || undefined,
                    instagram: instructorData.instagram_url || undefined,
                    // website: instructorData.website_url || undefined // Interface doesn't have website
                }
            };
        }
    }

    // 4. Fetch modules and lessons
    const { data: modulesData } = await supabase
        .from("course_modules")
        .select(`
            id,
            title,
            description,
            sort_index,
            image_path,
            course_lessons (
                id,
                title,
                duration_sec,
                free_preview,
                sort_index
            )
        `)
        .eq("course_id", course.id)
        .eq("is_deleted", false)
        .order("sort_index");

    const modules: Module[] = (modulesData || []).map(m => ({
        id: m.id,
        title: m.title,
        description: m.description || "",
        icon: "BookOpen", // Default icon, maybe add to DB later
        imagePath: getStorageUrlHero(m.image_path),
        lessons: (m.course_lessons || [])
            .sort((a, b) => a.sort_index - b.sort_index)
            .map(l => ({
                id: l.id,
                title: l.title,
                duration: l.duration_sec ? `${Math.ceil(l.duration_sec / 60)} min` : "5 min",
                isFree: l.free_preview
            }))
    }));

    // 5. Fetch FAQs
    const { data: faqsData } = await supabase
        .from("course_faqs")
        .select("*")
        .eq("course_id", course.id)
        .order("sort_index");

    const faqs: FAQ[] = (faqsData || []).map(f => ({
        id: f.id,
        questionKey: f.question, // Using raw text for now as the schema has 'question' text
        answerKey: f.answer      // Using raw text for now as the schema has 'answer' text
    }));

    // 7. Parse JSONB fields from course_details.landing_sections
    const landingSections = details?.landing_sections as any || {};

    // 8. Fetch Testimonials (Real Data)
    const { data: testimonialsData } = await supabase
        .from("testimonials")
        .select("*")
        .eq("course_id", course.id)
        .eq("is_active", true)
        .eq("is_deleted", false)
        .order("sort_index", { ascending: true });

    const testimonials: Testimonial[] = (testimonialsData || []).map(t => ({
        id: t.id,
        course_id: t.course_id,
        author_name: t.author_name,
        author_title: t.author_title,
        author_avatar_url: t.author_avatar_url, // Direct URL or check if relative? Assuming direct URL from DB or absolute
        content: t.content,
        rating: t.rating,
        is_featured: t.is_featured,
        is_active: t.is_active
    }));

    // 9. Check if included in Founders Program
    const { data: foundersSetting } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "founder_bonus_course_id")
        .single();


    return {
        id: course.id,
        instructorId: details?.instructor_id || null,
        slug: course.slug,
        title: course.title,
        subtitle: course.short_description || "",
        heroImage: getStorageUrlHero(course.image_path),
        heroVideo: details?.preview_video_id || undefined,
        price: course.price || 0,
        currency: "USD",
        isFoundersIncluded: foundersSetting?.value === course.id,
        instructor,
        modules,
        faqs,
        testimonials: testimonials.length > 0 ? testimonials : (landingSections.testimonials || []), // Fallback to mock/landing if DB empty
        trustedCompanies: landingSections.trustedCompanies || [],
        studentWorks: landingSections.studentWorks || [],
        masterclasses: landingSections.masterclasses || [],
        details: landingSections.details || {
            duration: "0 horas",
            format: "Video on-demand",
            level: "Todos los niveles",
            language: "Español",
            certificate: true,
            lifetime: true,
            updates: true,
            requirements: []
        },

        enabledSections: landingSections.enabledSections || DEFAULT_ENABLED_SECTIONS,
        endorsement: {
            title: details?.endorsement_title || null,
            description: details?.endorsement_description || null,
            imagePath: details?.endorsement_image_path ? getStorageUrlHero(details.endorsement_image_path) : null
        }
    };
}

export async function getCourseById(id: string, options: { includeContent?: boolean } = {}): Promise<Course | null> {
    const supabase = await createClient();

    // 1. Fetch main course data (reusing logic but by ID)
    const { data: course, error: courseError } = await supabase
        .from("courses")
        .select(`
            id,
            slug,
            title,
            short_description,
            price,
            is_active,
            image_path,
            status,
            visibility
        `)
        .eq("id", id)
        .single();

    if (courseError || !course) return null;

    // 2. Fetch course details
    const { data: details } = await supabase
        .from("course_details")
        .select("*")
        .eq("course_id", course.id)
        .single();

    // Helper to construct full image URL
    const getStorageUrl = (path: string | null) => {
        if (!path) return "";
        if (path.startsWith("http")) return path;
        return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/public-assets/${path}`;
    };

    // 3. Fetch instructor
    let instructor: Instructor = {
        name: "Instructor Seencel",
        title: "Expert",
        bio: "",
        avatar: "",
        credentials: [],
        social: {}
    };

    if (details?.instructor_id) {
        const { data: instructorData } = await supabase
            .from("course_instructors")
            .select("*")
            .eq("id", details.instructor_id)
            .single();

        if (instructorData) {
            instructor = {
                name: instructorData.name,
                title: instructorData.title || "",
                bio: instructorData.bio || "",
                avatar: getStorageUrl(instructorData.avatar_path),
                credentials: instructorData.credentials || [],
                social: {
                    linkedin: instructorData.linkedin_url || undefined,
                    youtube: instructorData.youtube_url || undefined,
                    instagram: instructorData.instagram_url || undefined,
                }
            };
        }
    }

    const getStorageUrlHero = (path: string | null) => {
        if (!path) return "/images/course-hero-placeholder.webp";
        if (path.startsWith("http")) return path;
        return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/public-assets/${path}`;
    };

    const landingSections = details?.landing_sections as any || {};

    let modules: Module[] = [];

    // 4. Fetch Modules & Lessons ONLY if requested
    if (options.includeContent) {
        const { data: modulesData } = await supabase
            .from("course_modules")
            .select("*, image_path")
            .eq("course_id", course.id)
            .order("sort_index", { ascending: true });

        const { data: lessonsData } = await supabase
            .from("course_lessons")
            .select("*")
            .in("module_id", (modulesData || []).map(m => m.id))
            .order("sort_index", { ascending: true });

        modules = (modulesData || []).map(m => ({
            id: m.id,
            title: m.title,
            description: m.description || "",
            imagePath: getStorageUrlHero(m.image_path), // Map to full URL
            lessons: (lessonsData || [])
                .filter(l => l.module_id === m.id)
                .map(l => ({
                    id: l.id,
                    title: l.title,
                    duration: Math.round((l.duration_sec || 0) / 60) + " min", // Approx string format
                    isFree: l.free_preview,
                    videoUrl: ""
                }))
        }));
    }

    return {
        id: course.id,
        instructorId: details?.instructor_id || null,
        badgeText: details?.badge_text || null,
        slug: course.slug,
        title: course.title,
        subtitle: course.short_description || "",
        heroImage: getStorageUrlHero(course.image_path),
        price: course.price || 0,
        currency: "USD",
        instructor,
        modules: modules,
        faqs: [],
        enabledSections: landingSections.enabledSections || DEFAULT_ENABLED_SECTIONS,
        testimonials: [],
        trustedCompanies: [],
        studentWorks: [],
        masterclasses: [],
        details: landingSections.details || {},
        // Extra admin fields
        status: course.status,
        visibility: course.visibility,
        endorsement: {
            title: details?.endorsement_title || null,
            description: details?.endorsement_description || null,
            imagePath: details?.endorsement_image_path || null
        }
    } as any;
}

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function getAllCourseSlugs(): Promise<string[]> {
    const supabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data } = await supabase
        .from("courses")
        .select("slug")
        .eq("is_active", true)
        .eq("is_deleted", false);

    return (data || []).map(c => c.slug);
}

export async function getAllInstructors() {
    const supabase = await createClient();
    const { data } = await supabase
        .from("course_instructors")
        .select("id, name, avatar_path")
        .order("name");

    return data || [];
}
