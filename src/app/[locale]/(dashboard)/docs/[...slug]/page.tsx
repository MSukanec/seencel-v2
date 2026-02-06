import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getDocContent } from "@/features/docs/lib/get-docs-content";
import { DocsTOCWrapper } from "@/features/docs/components/docs-toc-wrapper";
import { Callout, Video, Screenshot } from "@/features/docs/components/mdx";
import { useMDXComponents } from "@/../mdx-components";
import type { Metadata } from "next";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import remarkGfm from "remark-gfm";

interface DocsPageProps {
    params: Promise<{
        locale: string;
        slug: string[];
    }>;
}

// MDX components to use
const components = {
    ...useMDXComponents({}),
    Callout,
    Video,
    Screenshot,
};

export async function generateMetadata({ params }: DocsPageProps): Promise<Metadata> {
    const { slug } = await params;
    const locale = await getLocale();
    const doc = await getDocContent(locale, slug);

    if (!doc) {
        return { title: "Documentación | SEENCEL" };
    }

    return {
        title: `${doc.title} | Documentación | SEENCEL`,
        description: doc.description,
        robots: "index, follow", // Docs are public
    };
}

export default async function DocsPage({ params }: DocsPageProps) {
    const { slug } = await params;
    const locale = await getLocale();
    const doc = await getDocContent(locale, slug);

    if (!doc) {
        notFound();
    }

    return (
        <div className="h-full overflow-y-auto">
            {/* Inject TOC into right sidebar */}
            <DocsTOCWrapper headings={doc.headings} />

            {/* Article content - centered like narrow layout */}
            <article className="mx-auto max-w-4xl px-4 md:px-8 py-6 pb-20">
                {/* Breadcrumb */}
                <nav className="text-sm text-muted-foreground mb-4">
                    <span>Docs</span>
                    {slug.map((part, i) => (
                        <span key={i}>
                            <span className="mx-2">/</span>
                            <span className={i === slug.length - 1 ? "text-foreground" : ""}>
                                {part.charAt(0).toUpperCase() + part.slice(1)}
                            </span>
                        </span>
                    ))}
                </nav>

                {/* MDX Content */}
                <MDXRemote
                    source={doc.content}
                    components={components}
                    options={{
                        mdxOptions: {
                            remarkPlugins: [remarkGfm],
                            rehypePlugins: [
                                rehypeSlug,
                                [rehypeAutolinkHeadings, { behavior: "wrap" }],
                            ],
                        },
                    }}
                />
            </article>
        </div>
    );
}
