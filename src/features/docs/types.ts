export interface DocMeta {
    title: string;
    description?: string;
    slug: string;
}

export interface DocContent extends DocMeta {
    content: string;
    headings: DocHeading[];
}

export interface DocHeading {
    level: number;
    text: string;
    id: string;
}

export interface DocTreeItem {
    slug: string;
    title: string;
    icon?: string;
    children?: DocTreeItem[];
}
