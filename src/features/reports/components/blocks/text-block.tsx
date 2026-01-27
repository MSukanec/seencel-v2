"use client";

import type { BlockConfig } from "../../views/reports-builder-view";

interface TextBlockProps {
    config: BlockConfig;
}

export function TextBlock({ config }: TextBlockProps) {
    const { title, content } = config;

    return (
        <div className="space-y-2">
            {title && (
                <h4 className="font-semibold text-sm">{title}</h4>
            )}
            <div className="prose prose-sm dark:prose-invert max-w-none">
                {content ? (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {content}
                    </p>
                ) : (
                    <p className="text-sm text-muted-foreground/50 italic">
                        Sin contenido. Configurá el texto en el panel derecho.
                    </p>
                )}
            </div>
        </div>
    );
}
