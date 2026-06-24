/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // Proxy /api/* to the Django backend in development.
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api/v1";
    return [
      {
        source: "/backend/:path*",
        destination: `${apiBase}/:path*`,
      },
    ];
  },
};

export default nextConfig;
