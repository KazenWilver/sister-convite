import type { NextConfig } from "next";

const securityHeaders = [
  // O site é privado: nada deve ser indexado por motores de busca.
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
  // O token do convite está no URL: nunca o enviar como "Referer" para Google Maps, Waze, etc.
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // A pasta-mãe tem outro package-lock.json; a raiz do projecto é esta.
  turbopack: { root: import.meta.dirname },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/c/:token*", headers: [{ key: "Cache-Control", value: "private, no-store" }] },
      { source: "/admin/:path*", headers: [{ key: "Cache-Control", value: "private, no-store" }] },
      { source: "/api/:path*", headers: [{ key: "Cache-Control", value: "private, no-store" }] },
    ];
  },
};

export default nextConfig;
