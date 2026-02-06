import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";

export default async function DocsIndexPage() {
    const locale = await getLocale();

    // Redirect to the first doc page (primeros-pasos or getting-started depending on locale)
    const firstDoc = locale === 'es'
        ? '/docs/materiales/introduccion'
        : '/docs/materials/introduction';

    redirect(`/${locale}${firstDoc}`);
}
