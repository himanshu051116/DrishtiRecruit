import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth/session";
import "./globals.css";
import { ToastViewport } from "@/components/ToastViewport";
import { getPlatformSettings } from "@/services/settings/platformSettings";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { AppShell, PublicHeader } from "@/components/AppShell";

export const metadata: Metadata = {
  title: { default: "DrishtiRecruit — Evidence-backed hiring", template: "%s · DrishtiRecruit" },
  description: "Applicant tracking with requirement, evidence and decision coverage.",
  manifest: "/manifest.webmanifest",
};

const themeScript = `(()=>{try{const saved=localStorage.getItem('drishtirecruit-theme');const dark=saved==='dark'||(!saved&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=dark?'dark':'light'}catch{}})()`;

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [user, platform] = await Promise.all([getSessionUser(), getPlatformSettings()]);
  return <html lang="en" suppressHydrationWarning>
    <head><script dangerouslySetInnerHTML={{ __html: themeScript }}/></head>
    <body>
      {platform.maintenanceNotice && <div className="maintenance-banner" role="status">{platform.maintenanceNotice}</div>}
      {user ? <AppShell user={{ name: user.name, role: user.role, companyId: user.companyId }}>{children}</AppShell> : <><a className="skip-link" href="#main-content">Skip to main content</a><PublicHeader/><div id="main-content" tabIndex={-1}>{children}</div></>}
      <ToastViewport/>
      <ServiceWorkerRegister/>
    </body>
  </html>;
}
