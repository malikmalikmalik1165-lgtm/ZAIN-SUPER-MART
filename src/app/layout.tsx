import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { ServiceWorkerRegister } from "@/components/sw-register";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZAIN SUPER MART",
  description: "Complete Grocery Store Management & POS System — ZAIN SUPER MART, Bhera–Malakwal Road, Miani",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ZAIN SUPER MART",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#059669",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.__zsmInstallPrompt = null;
              window.__zsmAppInstalled = window.matchMedia('(display-mode: standalone)').matches;
              window.addEventListener('beforeinstallprompt', function (event) {
                event.preventDefault();
                window.__zsmInstallPrompt = event;
                window.dispatchEvent(new Event('zsm-install-ready'));
              });
              window.addEventListener('appinstalled', function () {
                window.__zsmInstallPrompt = null;
                window.__zsmAppInstalled = true;
                window.dispatchEvent(new Event('zsm-app-installed'));
              });
            `,
          }}
        />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ZAIN SUPER MART" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#059669" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body className="bg-slate-50 text-slate-900 antialiased">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
