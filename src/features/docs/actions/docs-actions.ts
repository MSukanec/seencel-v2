"use server";

import { getDocContent } from "@/features/docs/lib/get-docs-content";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

/**
 * Server Action: serializes an MDX document for client-side rendering.
 * Used by DocsInlinePanel to render docs in the ContextSidebar.
 *
 * Returns serialized MDX + metadata, or null if not found.
 */
export async function getSerializedDoc(slug: string, locale: string) {
    const slugParts = slug.split('/');
    const doc = await getDocContent(locale, slugParts);

    if (!doc) return null;

    const serialized = await serialize(doc.content, {
        mdxOptions: {
            remarkPlugins: [remarkGfm],
            rehypePlugins: [rehypeSlug],
        },
        parseFrontmatter: true,
    });

    return {
        title: doc.title,
        description: doc.description,
        headings: doc.headings,
        serialized,
    };
}
