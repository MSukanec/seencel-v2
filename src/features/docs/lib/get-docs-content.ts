import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface DocMeta {
    title: string;
    description?: string;
    slug: string;
}

export interface DocContent extends DocMeta {
    content: string;
    headings: { level: number; text: string; id: string }[];
}

export interface DocTreeItem {
    slug: string;
    title: string;
    icon?: string;
    children?: DocTreeItem[];
}

const CONTENT_DIR = path.join(process.cwd(), 'content', 'docs');

/**
 * Get the documentation tree for sidebar navigation
 */
export async function getDocsTree(locale: string): Promise<DocTreeItem[]> {
    const localeDir = path.join(CONTENT_DIR, locale);

    if (!fs.existsSync(localeDir)) {
        console.warn(`[Docs] Locale directory not found: ${localeDir}`);
        return [];
    }

    // Read root _meta.json
    const metaPath = path.join(localeDir, '_meta.json');
    let meta: { order?: string[]; items?: Record<string, { title: string; icon?: string }> } = {};

    if (fs.existsSync(metaPath)) {
        const metaContent = fs.readFileSync(metaPath, 'utf-8');
        meta = JSON.parse(metaContent);
    }

    const order = meta.order || [];
    const items = meta.items || {};

    const tree: DocTreeItem[] = [];

    for (const slug of order) {
        const itemDir = path.join(localeDir, slug);
        if (!fs.existsSync(itemDir) || !fs.statSync(itemDir).isDirectory()) {
            continue;
        }

        const itemMeta = items[slug] || { title: slug };
        const children = await getDocsSectionChildren(itemDir, slug);

        tree.push({
            slug,
            title: itemMeta.title,
            icon: itemMeta.icon,
            children,
        });
    }

    return tree;
}

/**
 * Get children of a section (individual articles)
 */
async function getDocsSectionChildren(sectionDir: string, sectionSlug: string): Promise<DocTreeItem[]> {
    const metaPath = path.join(sectionDir, '_meta.json');
    let meta: { order?: string[]; items?: Record<string, { title: string }> } = {};

    if (fs.existsSync(metaPath)) {
        const metaContent = fs.readFileSync(metaPath, 'utf-8');
        meta = JSON.parse(metaContent);
    }

    const order = meta.order || [];
    const items = meta.items || {};

    const children: DocTreeItem[] = [];

    for (const articleSlug of order) {
        const articlePath = path.join(sectionDir, `${articleSlug}.mdx`);
        if (!fs.existsSync(articlePath)) {
            continue;
        }

        const itemMeta = items[articleSlug] || { title: articleSlug };
        children.push({
            slug: `${sectionSlug}/${articleSlug}`,
            title: itemMeta.title,
        });
    }

    return children;
}

/**
 * Get a specific document's content
 */
export async function getDocContent(locale: string, slugParts: string[]): Promise<DocContent | null> {
    const slugPath = slugParts.join('/');
    const filePath = path.join(CONTENT_DIR, locale, `${slugPath}.mdx`);

    if (!fs.existsSync(filePath)) {
        console.warn(`[Docs] File not found: ${filePath}`);
        return null;
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = matter(fileContent);

    // Extract headings for TOC
    const headings = extractHeadings(content);

    return {
        title: data.title || slugParts[slugParts.length - 1],
        description: data.description,
        slug: slugPath,
        content,
        headings,
    };
}

/**
 * Extract headings from markdown content for TOC
 */
function extractHeadings(content: string): { level: number; text: string; id: string }[] {
    const headingRegex = /^(#{2,3})\s+(.+)$/gm;
    const headings: { level: number; text: string; id: string }[] = [];

    let match;
    while ((match = headingRegex.exec(content)) !== null) {
        const level = match[1].length;
        const text = match[2];
        const id = text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-');

        headings.push({ level, text, id });
    }

    return headings;
}

/**
 * Get all document slugs for static generation
 */
export async function getAllDocSlugs(locale: string): Promise<string[][]> {
    const tree = await getDocsTree(locale);
    const slugs: string[][] = [];

    for (const section of tree) {
        if (section.children) {
            for (const child of section.children) {
                slugs.push(child.slug.split('/'));
            }
        }
    }

    return slugs;
}
