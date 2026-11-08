import type { Metadata } from "next";

// O painel pode ser instalado no telemóvel como uma aplicação própria («Painel 🎓»),
// separada dos convites: abre sempre em /admin.
export const metadata: Metadata = {
  manifest: "/admin.webmanifest",
  icons: { icon: "/icons/icon-128.png", apple: "/icons/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "Painel 🎓", statusBarStyle: "black-translucent" },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
