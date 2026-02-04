import { QuotesListPage } from "@/features/quotes/pages";

interface PageProps {
    searchParams: Promise<{ view?: string }>;
}

export default function Page({ searchParams }: PageProps) {
    return <QuotesListPage searchParams={searchParams} />;
}
