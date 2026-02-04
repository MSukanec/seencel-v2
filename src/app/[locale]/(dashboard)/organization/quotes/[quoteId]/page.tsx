import { QuoteDetailPage } from "@/features/quotes/pages";

interface PageProps {
    params: Promise<{ quoteId: string }>;
    searchParams?: Promise<{ view?: string }>;
}

export default function Page({ params, searchParams }: PageProps) {
    return <QuoteDetailPage params={params} searchParams={searchParams} />;
}
