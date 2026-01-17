import createNextIntlPlugin from 'next-intl/plugin';
import bundleAnalyzer from '@next/bundle-analyzer';

const withNextIntl = createNextIntlPlugin();

// 🚀 Bundle Analyzer - Run with ANALYZE=true npm run build
const withBundleAnalyzer = bundleAnalyzer({
    enabled: process.env.ANALYZE === 'true',
});

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

// Chain plugins: NextIntl -> BundleAnalyzer
export default withBundleAnalyzer(withNextIntl(nextConfig));
