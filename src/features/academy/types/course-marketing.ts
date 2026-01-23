// Mock data types and sample data for course landing page
// This will be replaced with real DB data later

export interface Instructor {
    name: string;
    title: string;
    bio: string;
    avatar: string;
    credentials: string[];
    social: {
        linkedin?: string;
        youtube?: string;
        instagram?: string;
    };
}

export interface Lesson {
    id: string;
    title: string;
    duration: string; // "15 min"
    isFree?: boolean;
}

export interface Module {
    id: string;
    title: string;
    description: string;
    lessons: Lesson[];
    icon?: string;
    imagePath?: string | null;
}

export interface Testimonial {
    id: string;
    course_id?: string | null;
    author_name: string;
    author_title?: string | null;
    author_avatar_url?: string | null;
    content: string;
    rating?: number | null;
    is_featured?: boolean | null;
    is_active?: boolean | null;
}

export interface FAQ {
    id: string;
    questionKey: string; // i18n key
    answerKey: string; // i18n key
}

export interface Company {
    name: string;
    logo: string;
}

export interface StudentWork {
    id: string;
    title: string;
    author: string;
    image: string;
    description?: string;
}

export interface Masterclass {
    id: string;
    title: string;
    thumbnail: string;
    duration: string;
    videoUrl?: string;
}

export interface CourseDetails {
    duration: string; // "40+ horas"
    format: string; // "Video on-demand"
    level: string; // "Principiante a Avanzado"
    language: string; // "Español"
    certificate: boolean;
    lifetime: boolean;
    updates: boolean;
    requirements: string[];
}

// Configuration for which sections are visible on the landing page
// Instructors can toggle these to show/hide sections
export interface EnabledSections {
    hero: boolean;           // Always recommended true
    instructor: boolean;     // Instructor bio section
    howItWorks: boolean;     // Platform explanation
    curriculum: boolean;     // Module cards grid
    community: boolean;      // Discord community section
    studentWorks: boolean;   // Gallery of student projects
    masterclasses: boolean;  // Free video previews
    licenseCta: boolean;     // Enterprise license banner
    modulesAccordion: boolean; // Expandable lessons list
    courseDetails: boolean;  // Duration, format, level info
    finalCta: boolean;       // Final call-to-action
    trustedBy: boolean;      // Company logos
    faqs: boolean;           // FAQ accordion
    testimonials: boolean;   // Student reviews
}

// Default: all sections enabled
export const DEFAULT_ENABLED_SECTIONS: EnabledSections = {
    hero: true,
    instructor: true,
    howItWorks: true,
    curriculum: true,
    community: true,
    studentWorks: true,
    masterclasses: true,
    licenseCta: true,
    modulesAccordion: true,
    courseDetails: true,
    finalCta: true,
    trustedBy: true,
    faqs: true,
    testimonials: true,
};

export interface Course {
    slug: string;
    title: string;
    subtitle: string;
    heroImage: string;
    heroVideo?: string;
    price: number;
    originalPrice?: number;
    isFoundersIncluded?: boolean; // New flag for Founders Banner
    // Admin fields
    id?: string;
    instructorId?: string | null;
    status?: string;
    visibility?: string;
    badgeText?: string | null;
    currency: string;
    instructor: Instructor;
    modules: Module[];
    testimonials: Testimonial[];
    faqs: FAQ[];
    trustedCompanies: Company[];
    studentWorks: StudentWork[];
    masterclasses: Masterclass[];
    details: CourseDetails;
    endorsement?: {
        title: string | null;
        description: string | null;
        imagePath: string | null;
    };
    // Section visibility configuration
    enabledSections?: EnabledSections;
}

// ============================================
// MOCK DATA: Curso ArchiCAD Profesional
// ============================================

export const MOCK_ARCHICAD_COURSE: Course = {
    slug: "archicad",
    title: "ArchiCAD Profesional",
    subtitle: "Domina ArchiCAD desde cero hasta un nivel profesional. Aprende modelado BIM, documentación técnica y workflows de trabajo reales.",
    heroImage: "/images/course-hero-archicad.webp",
    price: 297,
    originalPrice: 497,
    currency: "USD",

    instructor: {
        name: "Arq. Matías Sukanec",
        title: "Arquitecto BIM & Fundador de SEENCEL",
        bio: "Arquitecto con más de 10 años de experiencia en proyectos de gran escala. Especialista certificado en ArchiCAD y metodologías BIM. Ha formado a más de 5,000 profesionales en toda Latinoamérica.",
        avatar: "/images/instructor-matias.webp",
        credentials: [
            "Graphisoft Certified ArchiCAD Expert",
            "Más de 5,000 alumnos formados",
            "10+ años de experiencia profesional",
            "Proyectos en Argentina, Chile, México y España"
        ],
        social: {
            linkedin: "https://linkedin.com/in/msukanec",
            youtube: "https://youtube.com/@seencel",
            instagram: "https://instagram.com/seencel"
        }
    },

    modules: [
        {
            id: "mod-1",
            title: "Introducción a ArchiCAD",
            description: "Conoce la interfaz, configuración inicial y filosofía BIM",
            icon: "Rocket",
            lessons: [
                { id: "1-1", title: "Bienvenida al curso", duration: "5 min", isFree: true },
                { id: "1-2", title: "Instalación y configuración", duration: "12 min" },
                { id: "1-3", title: "La interfaz de ArchiCAD", duration: "18 min" },
                { id: "1-4", title: "Navegación y vistas", duration: "15 min" },
                { id: "1-5", title: "Tu primer proyecto", duration: "20 min" }
            ]
        },
        {
            id: "mod-2",
            title: "Modelado de Elementos Básicos",
            description: "Muros, losas, columnas y elementos estructurales",
            icon: "Layers",
            lessons: [
                { id: "2-1", title: "Herramienta Muro", duration: "25 min" },
                { id: "2-2", title: "Losas y entrepisos", duration: "20 min" },
                { id: "2-3", title: "Columnas y vigas", duration: "18 min" },
                { id: "2-4", title: "Ejercicio práctico: vivienda simple", duration: "35 min" }
            ]
        },
        {
            id: "mod-3",
            title: "Puertas, Ventanas y Aberturas",
            description: "Inserción y parametrización de carpinterías",
            icon: "DoorOpen",
            lessons: [
                { id: "3-1", title: "Biblioteca de objetos", duration: "15 min" },
                { id: "3-2", title: "Insertar puertas", duration: "20 min" },
                { id: "3-3", title: "Insertar ventanas", duration: "18 min" },
                { id: "3-4", title: "Parámetros avanzados", duration: "22 min" }
            ]
        },
        {
            id: "mod-4",
            title: "Cubiertas y Techos",
            description: "Techos inclinados, planos y complejos",
            icon: "Home",
            lessons: [
                { id: "4-1", title: "Tipos de cubiertas", duration: "15 min" },
                { id: "4-2", title: "Cubierta a dos aguas", duration: "25 min" },
                { id: "4-3", title: "Cubiertas complejas", duration: "30 min" },
                { id: "4-4", title: "Shell y formas orgánicas", duration: "28 min" }
            ]
        },
        {
            id: "mod-5",
            title: "Escaleras y Barandas",
            description: "Circulaciones verticales completas",
            icon: "TrendingUp",
            lessons: [
                { id: "5-1", title: "Herramienta Escalera", duration: "25 min" },
                { id: "5-2", title: "Configuración de tramos", duration: "20 min" },
                { id: "5-3", title: "Barandas y pasamanos", duration: "22 min" },
                { id: "5-4", title: "Escaleras personalizadas", duration: "30 min" }
            ]
        },
        {
            id: "mod-6",
            title: "Terreno y Entorno",
            description: "Modelado de sitio y paisajismo",
            icon: "Mountain",
            lessons: [
                { id: "6-1", title: "Herramienta Mesh", duration: "20 min" },
                { id: "6-2", title: "Curvas de nivel", duration: "25 min" },
                { id: "6-3", title: "Excavaciones y rellenos", duration: "18 min" }
            ]
        },
        {
            id: "mod-7",
            title: "Documentación Técnica",
            description: "Planos, cortes, elevaciones y detalles",
            icon: "FileText",
            lessons: [
                { id: "7-1", title: "Configuración de planos", duration: "20 min" },
                { id: "7-2", title: "Secciones y alzados", duration: "25 min" },
                { id: "7-3", title: "Cotas y anotaciones", duration: "22 min" },
                { id: "7-4", title: "Detalles constructivos", duration: "30 min" },
                { id: "7-5", title: "Layouts y publicación", duration: "25 min" }
            ]
        },
        {
            id: "mod-8",
            title: "Renderizado y Visualización",
            description: "Materiales, luces y renders fotorrealistas",
            icon: "Image",
            lessons: [
                { id: "8-1", title: "Superficies y materiales", duration: "25 min" },
                { id: "8-2", title: "Iluminación", duration: "20 min" },
                { id: "8-3", title: "Motor CineRender", duration: "30 min" },
                { id: "8-4", title: "Twinmotion integración", duration: "35 min" }
            ]
        }
    ],

    testimonials: [
        {
            id: "t1",
            author_name: "Carolina Méndez",
            author_title: "Arquitecta - Estudio CM Arquitectura",
            author_avatar_url: "/images/testimonials/carolina.webp",
            content: "Este curso transformó completamente mi forma de trabajar. Pasé de hacer planos 2D a entregar proyectos BIM completos en la mitad del tiempo. La inversión se pagó sola en el primer mes.",
            rating: 5,
            is_featured: true
        },
        {
            id: "t2",
            author_name: "Roberto Álvarez",
            author_title: "Ingeniero Civil - Constructora del Norte",
            author_avatar_url: "/images/testimonials/roberto.webp",
            content: "Excelente estructura del curso. Matías explica todo con claridad y los ejercicios prácticos son muy útiles. Lo recomiendo 100%.",
            rating: 5
        },
        {
            id: "t3",
            author_name: "María José Torres",
            author_title: "Estudiante de Arquitectura - UBA",
            author_avatar_url: "/images/testimonials/mariajose.webp",
            content: "Como estudiante, este curso me dio una ventaja enorme. Ahora consigo trabajos freelance porque manejo ArchiCAD mejor que muchos profesionales.",
            rating: 5
        },
        {
            id: "t4",
            author_name: "Andrés Peña",
            author_title: "Director de Proyectos - DYPSA Desarrollos",
            author_avatar_url: "/images/testimonials/andres.webp",
            content: "Capacitamos a todo nuestro equipo con este curso. La productividad aumentó significativamente y la calidad de documentación mejoró muchísimo.",
            rating: 5,
            is_featured: true
        }
    ],

    faqs: [
        { id: "faq1", questionKey: "whatIsIncluded", answerKey: "whatIsIncludedAnswer" },
        { id: "faq2", questionKey: "howLongAccess", answerKey: "howLongAccessAnswer" },
        { id: "faq3", questionKey: "needPriorKnowledge", answerKey: "needPriorKnowledgeAnswer" },
        { id: "faq4", questionKey: "whichVersion", answerKey: "whichVersionAnswer" },
        { id: "faq5", questionKey: "getCertificate", answerKey: "getCertificateAnswer" },
        { id: "faq6", questionKey: "moneyBack", answerKey: "moneyBackAnswer" }
    ],

    trustedCompanies: [
        { name: "EIDICO", logo: "/images/companies/eidico.svg" },
        { name: "Grupo Portland", logo: "/images/companies/portland.svg" },
        { name: "TGLT", logo: "/images/companies/tglt.svg" },
        { name: "Vizora", logo: "/images/companies/vizora.svg" },
        { name: "Consultatio", logo: "/images/companies/consultatio.svg" },
        { name: "IRSA", logo: "/images/companies/irsa.svg" }
    ],

    studentWorks: [
        {
            id: "sw1",
            title: "Residencia Moderna",
            author: "Juan García",
            image: "/images/student-works/work1.webp",
            description: "Proyecto de vivienda unifamiliar de 280m²"
        },
        {
            id: "sw2",
            title: "Edificio de Oficinas",
            author: "Lucía Fernández",
            image: "/images/student-works/work2.webp",
            description: "Torre corporativa de 12 pisos"
        },
        {
            id: "sw3",
            title: "Centro Comercial",
            author: "Miguel Torres",
            image: "/images/student-works/work3.webp",
            description: "Mall de 15,000m² con cine"
        },
        {
            id: "sw4",
            title: "Hotel Boutique",
            author: "Ana Martínez",
            image: "/images/student-works/work4.webp",
            description: "Hotel de 45 habitaciones"
        }
    ],

    masterclasses: [
        {
            id: "mc1",
            title: "Introducción a BIM con ArchiCAD",
            thumbnail: "/images/masterclass/mc1.webp",
            duration: "45 min",
            videoUrl: "https://youtube.com/watch?v=example1"
        },
        {
            id: "mc2",
            title: "5 errores comunes en ArchiCAD",
            thumbnail: "/images/masterclass/mc2.webp",
            duration: "30 min",
            videoUrl: "https://youtube.com/watch?v=example2"
        },
        {
            id: "mc3",
            title: "De AutoCAD a ArchiCAD",
            thumbnail: "/images/masterclass/mc3.webp",
            duration: "35 min",
            videoUrl: "https://youtube.com/watch?v=example3"
        }
    ],

    details: {
        duration: "40+ horas",
        format: "Video on-demand",
        level: "Principiante a Avanzado",
        language: "Español",
        certificate: true,
        lifetime: true,
        updates: true,
        requirements: [
            "Computadora con ArchiCAD instalado (versión 24 o superior)",
            "Conocimientos básicos de dibujo técnico (recomendado)",
            "Ganas de aprender y practicar"
        ]
    }
};

// Helper to get course by slug
export function getCourseBySlug(slug: string): Course | undefined {
    const courses: Record<string, Course> = {
        "archicad": MOCK_ARCHICAD_COURSE
    };
    return courses[slug];
}

// Get all course slugs for static generation
export function getAllCourseSlugs(): string[] {
    return ["archicad"];
}

