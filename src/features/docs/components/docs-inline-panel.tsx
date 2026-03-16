"use client";

import { useEffect, useState, useCallback } from "react";
import { MDXRemote } from "next-mdx-remote";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";
import { getSerializedDoc } from "@/features/docs/actions/docs-actions";
import { Callout } from "@/features/docs/components/mdx/callout";
import { Link } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { BookOpen, ExternalLink, Loader2 } from "lucide-react";

// ─── MDX Components available in inline rendering ──────────
const inlineComponents = {
    Callout,
    // Note: Screenshot and Video are omitted for inline panel
    // to keep it lightweight — full media in /docs page
};

// ─── Types ──────────────────────────────────────────────────

interface DocsInlinePanelProps {
    slug: string;
}

interface DocState {
    title: string;
    serialized: MDXRemoteSerializeResult;
    headings: { level: number; text: string; id: string }[];
}

// ─── Component ──────────────────────────────────────────────

/**
 * Client component that renders an MDX document inline.
 * Used inside the ContextSidebar overlay.
 *
 * Usage (via pushOverlay):
 *   pushOverlay(<DocsInlinePanel slug="proyectos/introduccion" />, { title: "Documentación" })
 */
export function DocsInlinePanel({ slug }: DocsInlinePanelProps) {
    const locale = useLocale();
    const [doc, setDoc] = useState<DocState | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const loadDoc = useCallback(async () => {
        setLoading(true);
        setError(false);
        try {
            const result = await getSerializedDoc(slug, locale);
            if (result) {
                setDoc({
                    title: result.title,
                    serialized: result.serialized,
                    headings: result.headings,
                });
            } else {
                setError(true);
            }
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    }, [slug, locale]);

    useEffect(() => {
        loadDoc();
    }, [loadDoc]);

    // ─── Loading State ──────────────────────────────────────
    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // ─── Error / Not Found State ────────────────────────────
    if (error || !doc) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-3">
                <BookOpen className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                    No se encontró la documentación
                </p>
            </div>
        );
    }

    // ─── Success ────────────────────────────────────────────
    return (
        <div className="flex flex-col h-full">
            {/* Content */}
            <div className="flex-1 overflow-y-auto px-3 py-3">
                {/* Compact prose for sidebar — body text in muted-foreground, headings in foreground */}
                <div className={[
                    "max-w-none text-[12px] leading-relaxed text-muted-foreground",
                    // Headings — foreground (white/dark), compact sizes
                    "[&>h1]:text-[13px] [&>h1]:font-semibold [&>h1]:text-foreground [&>h1]:mb-2 [&>h1]:mt-0",
                    "[&>h2]:text-[12px] [&>h2]:font-semibold [&>h2]:text-foreground [&>h2]:mt-4 [&>h2]:mb-1.5 [&>h2]:border-b [&>h2]:border-border/30 [&>h2]:pb-1",
                    "[&>h3]:text-[12px] [&>h3]:font-medium [&>h3]:text-foreground [&>h3]:mt-3 [&>h3]:mb-1",
                    // Paragraphs
                    "[&>p]:text-[12px] [&>p]:leading-relaxed [&>p]:mb-2",
                    // Strong text in foreground
                    "[&_strong]:text-foreground [&_strong]:font-medium",
                    // Lists — compact
                    "[&>ul]:text-[12px] [&>ul]:pl-4 [&>ul]:mb-2 [&>ul]:space-y-0.5",
                    "[&>ol]:text-[12px] [&>ol]:pl-4 [&>ol]:mb-2 [&>ol]:space-y-0.5",
                    "[&_li]:leading-relaxed",
                    // Tables — full width, fixed layout, compact cells
                    "[&_table]:w-full [&_table]:table-fixed [&_table]:text-[11px] [&_table]:border-collapse [&_table]:my-2",
                    "[&_th]:text-foreground [&_th]:font-medium [&_th]:text-left [&_th]:px-1.5 [&_th]:py-1 [&_th]:border-b [&_th]:border-border/50",
                    "[&_td]:px-1.5 [&_td]:py-1 [&_td]:border-b [&_td]:border-border/20 [&_td]:align-top [&_td]:break-words",
                    // Horizontal rules
                    "[&>hr]:my-3 [&>hr]:border-border/30",
                    // Blockquotes
                    "[&>blockquote]:text-[11px] [&>blockquote]:border-l-2 [&>blockquote]:border-border/50 [&>blockquote]:pl-3 [&>blockquote]:my-2 [&>blockquote]:text-muted-foreground/80",
                    // Code inline
                    "[&_code]:text-[11px] [&_code]:bg-muted/50 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded",
                    // Links
                    "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2",
                ].join(" ")}>
                    <MDXRemote
                        {...doc.serialized}
                        components={inlineComponents}
                    />
                </div>
            </div>

            {/* Footer — Link to full docs */}
            <div className="shrink-0 border-t px-4 py-2.5">
                <Link
                    href={`/docs/${slug}` as any}
                    className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ExternalLink className="h-3 w-3" />
                    Ver documentación completa
                </Link>
            </div>
        </div>
    );
}
