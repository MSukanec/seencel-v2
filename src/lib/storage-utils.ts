
export function getStorageUrl(path: string | null, bucket: 'avatars' | 'organizations' | 'projects' | 'tasks' | 'public-assets' = 'organizations') {
    if (!path) return null;

    // If it's already a full URL (e.g., Google Auth avatar or legacy absolute URL), return it as is
    if (path.startsWith('http') || path.startsWith('https')) return path;

    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    // Safety check for base URL
    if (!baseUrl) {
        console.warn("NEXT_PUBLIC_SUPABASE_URL is not defined");
        return null;
    }

    // Clean up path if it starts with slash
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;

    return `${baseUrl}/storage/v1/object/public/${bucket}/${cleanPath}`;
}
