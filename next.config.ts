import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https' as const,
                hostname: 'lxaqzpsuzrieaboyljqd.supabase.co',
            },
            {
                protocol: 'https' as const,
                hostname: 'wtatvsgeivymcppowrfy.supabase.co',
            },
            {
                protocol: 'https' as const,
                hostname: 'private-assets.s3.auto.amazonaws.com',
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

