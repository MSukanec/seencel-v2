import { requireAuthContext } from "@/lib/auth";

export default async function CatalogLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    await requireAuthContext();

    return <>{children}</>;
}
