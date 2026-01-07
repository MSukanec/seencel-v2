import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https' as const,
                hostname: '*.supabase.co',
            },
        ],
    },
    serverExternalPackages: ['sharp'],
    experimental: {
        serverActions: {
            bodySizeLimit: 10485760, // 10MB in bytes
        },
    },
};

export default withNextIntl(nextConfig);

