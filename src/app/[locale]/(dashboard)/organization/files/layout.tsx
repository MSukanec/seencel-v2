import { requireAuthContext } from "@/lib/auth";

export default async function FilesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Auth check — shared across all sub-pages
    await requireAuthContext();

    return <>{children}</>;
}
