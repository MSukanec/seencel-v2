import type { MDXComponents } from 'mdx/types'

// This file allows you to provide custom React components
// to be used in MDX files. You can import and use any
// React component you want, including inline styles,
// components from other libraries, and more.

export function useMDXComponents(components: MDXComponents): MDXComponents {
    return {
        // Default heading styles - using neutral colors, not primary
        // [...props] ensures id from rehype-slug is passed through
        // [&_a]:text-inherit ensures autolinks don't override heading color
        h1: (props) => (
            <h1 {...props} className="text-4xl font-bold mb-6 [&_a]:text-inherit [&_a]:no-underline" />
        ),
        h2: (props) => (
            <h2 {...props} className="text-2xl font-semibold mt-10 mb-4 scroll-mt-20 [&_a]:text-inherit [&_a]:no-underline" />
        ),
        h3: (props) => (
            <h3 {...props} className="text-xl font-semibold mt-8 mb-3 scroll-mt-20 [&_a]:text-inherit [&_a]:no-underline" />
        ),
        // Paragraph styling
        p: ({ children }) => (
            <p className="text-sm text-muted-foreground leading-6 mb-3">{children}</p>
        ),
        // List styling
        ul: ({ children }) => (
            <ul className="list-disc pl-6 mb-3 text-sm text-muted-foreground space-y-1.5">{children}</ul>
        ),
        ol: ({ children }) => (
            <ol className="list-decimal pl-6 mb-3 text-sm text-muted-foreground space-y-1.5">{children}</ol>
        ),
        li: ({ children }) => (
            <li className="pl-1">{children}</li>
        ),
        // Code blocks
        code: ({ children }) => (
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
        ),
        pre: ({ children }) => (
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4 text-sm">{children}</pre>
        ),
        // Links
        a: ({ href, children }) => (
            <a href={href} className="text-primary hover:underline">{children}</a>
        ),
        // Blockquotes
        blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground my-4">
                {children}
            </blockquote>
        ),
        // Tables
        table: ({ children }) => (
            <div className="overflow-x-auto mb-4">
                <table className="w-full border-collapse">{children}</table>
            </div>
        ),
        th: ({ children }) => (
            <th className="border border-border bg-muted px-3 py-2 text-left font-semibold text-sm">{children}</th>
        ),
        td: ({ children }) => (
            <td className="border border-border px-3 py-2 text-sm text-muted-foreground">{children}</td>
        ),
        ...components,
    }
}
