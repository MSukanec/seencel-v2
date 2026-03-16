import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getDocsTree } from "@/features/docs/lib/get-docs-content";

/**
 * /docs → redirect to the first article of the first section.
 * Resolves dynamically from _meta.json — no hardcoded slugs.
 */
export default async function DocsIndexPage() {
    const locale = await getLocale();
    const tree = await getDocsTree(locale);

    // Find the first section that has children
    const firstSection = tree.find((s) => s.children && s.children.length > 0);
    const firstSlug = firstSection?.children?.[0]?.slug;

    if (firstSlug) {
        redirect(`/${locale}/docs/${firstSlug}`);
    }

    // Fallback: if no content exists at all, show notFound
    redirect(`/${locale}/docs/organizacion/introduccion`);
}
