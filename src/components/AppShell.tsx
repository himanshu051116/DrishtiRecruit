"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { humanizeEnum } from "@/lib/ui/labels";

type Role = "CANDIDATE" | "RECRUITER" | "HIRING_MANAGER" | "INTERVIEWER" | "ADMIN";
type NavItem = { href: string; label: string; icon: IconName; section?: string };
type IconName = "home" | "briefcase" | "people" | "search" | "chart" | "spark" | "test" | "calendar" | "building" | "bell" | "file" | "offer" | "privacy" | "user" | "shield" | "admin";

const NAV: Record<Role, NavItem[]> = {
  CANDIDATE: [
    { href: "/candidate/dashboard", label: "Overview", icon: "home" },
    { href: "/candidate/jobs", label: "Jobs", icon: "briefcase" },
    { href: "/candidate/applications", label: "Applications", icon: "file" },
    { href: "/candidate/assessments", label: "Assessments", icon: "test" },
    { href: "/candidate/offers", label: "Offers", icon: "offer" },
    { href: "/candidate/profile", label: "Profile", icon: "user", section: "Account" },
    { href: "/candidate/resumes", label: "Resumes", icon: "file" },
    { href: "/candidate/privacy", label: "Privacy", icon: "privacy" },
  ],
  RECRUITER: [
    { href: "/recruiter/dashboard", label: "Overview", icon: "home" },
    { href: "/recruiter/jobs", label: "Jobs", icon: "briefcase" },
    { href: "/recruiter/search", label: "Candidates", icon: "search" },
    { href: "/recruiter/assessments", label: "Assessments", icon: "test" },
    { href: "/recruiter/interviews/availability", label: "Interviews", icon: "calendar" },
    { href: "/recruiter/analytics", label: "Analytics", icon: "chart", section: "Decision tools" },
    { href: "/recruiter/ai-transparency", label: "Processing history", icon: "spark" },
    { href: "/recruiter/company", label: "Company", icon: "building", section: "Workspace" },
  ],
  HIRING_MANAGER: [
    { href: "/recruiter/dashboard", label: "Overview", icon: "home" },
    { href: "/recruiter/jobs", label: "Jobs", icon: "briefcase" },
    { href: "/recruiter/search", label: "Candidates", icon: "search" },
    { href: "/recruiter/assessments", label: "Assessments", icon: "test" },
    { href: "/recruiter/interviews/availability", label: "Interviews", icon: "calendar" },
    { href: "/recruiter/analytics", label: "Analytics", icon: "chart", section: "Decision tools" },
    { href: "/recruiter/ai-transparency", label: "Processing history", icon: "spark" },
    { href: "/recruiter/company", label: "Company", icon: "building", section: "Workspace" },
  ],
  INTERVIEWER: [
    { href: "/interviewer/interviews", label: "Interviews", icon: "calendar" },
    { href: "/recruiter/interviews/availability", label: "Availability", icon: "calendar" },
  ],
  ADMIN: [
    { href: "/admin", label: "Admin overview", icon: "admin" },
    { href: "/recruiter/jobs", label: "Jobs", icon: "briefcase" },
    { href: "/recruiter/search", label: "Candidates", icon: "search" },
    { href: "/recruiter/analytics", label: "Analytics", icon: "chart", section: "Decision tools" },
    { href: "/recruiter/ai-transparency", label: "Processing history", icon: "spark" },
    { href: "/recruiter/assessments/analytics", label: "Assessments", icon: "test" },
  ],
};

function isActive(pathname: string, href: string) {
  if (pathname === href) return true;
  if (href.endsWith("/dashboard") || href === "/admin") return false;
  return pathname.startsWith(`${href}/`);
}

function crumbs(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  const hidden = new Set(["recruiter", "candidate", "interviewer"]);
  return parts.map((part, index) => ({
    label: hidden.has(part) ? humanizeEnum(part) : part.length > 18 && !part.includes("-") ? "Details" : humanizeEnum(part),
    href: `/${parts.slice(0, index + 1).join("/")}`,
  })).filter((item, index) => index === 0 || !hidden.has(parts[index]));
}

export function AppShell({ user, children }: { user: { name: string; role: string; companyId?: string | null }; children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const role = user.role as Role;
  const nav = NAV[role] ?? [];
  const breadcrumb = useMemo(() => crumbs(pathname), [pathname]);

  return <div className="app-shell">
    <button className="skip-link" onClick={() => document.getElementById("main-content")?.focus()}>Skip to main content</button>
    <aside className={`app-sidebar ${open ? "is-open" : ""}`} aria-label="Primary navigation">
      <div className="sidebar-brand">
        <Link href="/dashboard" className="brand-mark" onClick={() => setOpen(false)}><span className="brand-glyph" aria-hidden>DR</span><span><strong>DrishtiRecruit</strong><small>Evidence-backed hiring</small></span></Link>
        <button className="mobile-close" aria-label="Close navigation" onClick={() => setOpen(false)}>×</button>
      </div>
      <nav className="sidebar-nav">
        {nav.map((item, index) => <div key={item.href}>{item.section && (index === 0 || nav[index - 1]?.section !== item.section) && <p className="nav-section">{item.section}</p>}<Link href={item.href} aria-current={isActive(pathname, item.href) ? "page" : undefined} className={`nav-link ${isActive(pathname, item.href) ? "active" : ""}`} onClick={() => setOpen(false)}><Icon name={item.icon}/><span>{item.label}</span></Link></div>)}
      </nav>
      <div className="sidebar-footer">
        <Link href="/notifications" className={`nav-link ${isActive(pathname, "/notifications") ? "active" : ""}`} onClick={() => setOpen(false)}><Icon name="bell"/><span>Notifications</span></Link>
        <Link href="/security" className={`nav-link ${isActive(pathname, "/security") ? "active" : ""}`} onClick={() => setOpen(false)}><Icon name="shield"/><span>Security</span></Link>
        <div className="sidebar-account"><span className="account-avatar">{user.name.slice(0, 1).toUpperCase()}</span><div className="min-w-0"><p className="truncate text-sm font-semibold">{user.name}</p><p className="truncate text-xs text-zinc-500">{humanizeEnum(user.role)}</p></div><ThemeToggle/></div>
      </div>
    </aside>
    {open && <button className="sidebar-scrim" aria-label="Close navigation overlay" onClick={() => setOpen(false)}/>}
    <div className="app-main">
      <header className="app-topbar">
        <button className="mobile-menu" aria-label="Open navigation" aria-expanded={open} onClick={() => setOpen(true)}><span/><span/><span/></button>
        <nav aria-label="Breadcrumb" className="breadcrumb"><Link href="/dashboard">Workspace</Link>{breadcrumb.slice(0, 4).map((item, index) => <span key={`${item.href}-${index}`} className="breadcrumb-item"><span aria-hidden>/</span>{index === breadcrumb.slice(0, 4).length - 1 ? <strong>{item.label}</strong> : <Link href={item.href}>{item.label}</Link>}</span>)}</nav>
        <div className="topbar-actions">{(["RECRUITER","HIRING_MANAGER","ADMIN"] as string[]).includes(role) ? <Link href="/recruiter/search" className="topbar-search" aria-label="Search candidates and jobs"><Icon name="search"/><span>Search</span><kbd>⌘K</kbd></Link> : role === "CANDIDATE" ? <Link href="/candidate/jobs" className="topbar-search" aria-label="Search jobs"><Icon name="search"/><span>Find jobs</span></Link> : null}<Link href="/notifications" className="icon-button" aria-label="Notifications"><Icon name="bell"/></Link><ThemeToggle/></div>
      </header>
      <div id="main-content" tabIndex={-1} className="app-content">{children}</div>
    </div>
  </div>;
}

export function PublicHeader() {
  return <header className="public-header"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-6"><Link href="/" className="brand-mark"><span className="brand-glyph" aria-hidden>DR</span><span><strong>DrishtiRecruit</strong><small>Evidence-backed hiring</small></span></Link><nav className="flex items-center gap-2 text-sm"><Link href="/jobs" className="btn-ghost">Open roles</Link><Link href="/login" className="btn-ghost hidden sm:inline-flex">Sign in</Link><Link href="/register" className="btn-primary">Get started</Link><ThemeToggle/></nav></div></header>;
}

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    home: <><path d="M3 10.7 12 3l9 7.7"/><path d="M5 9.5V21h14V9.5"/><path d="M9 21v-7h6v7"/></>,
    briefcase: <><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18"/></>,
    people: <><circle cx="9" cy="8" r="3"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/><circle cx="17" cy="9" r="2.5"/><path d="M15.5 14.5A5 5 0 0 1 21 20"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></>,
    spark: <><path d="m12 2 1.6 5.4L19 9l-5.4 1.6L12 16l-1.6-5.4L5 9l5.4-1.6L12 2Z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z"/></>,
    test: <><path d="M9 3h6l1 3h3v15H5V6h3l1-3Z"/><path d="M9 11h6M9 15h6"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></>,
    building: <><path d="M4 21V5l8-3 8 3v16"/><path d="M8 8h2M14 8h2M8 12h2M14 12h2M9 21v-5h6v5"/></>,
    bell: <><path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,
    file: <><path d="M6 2h8l4 4v16H6z"/><path d="M14 2v5h5M9 12h6M9 16h6"/></>,
    offer: <><path d="M4 7h16v13H4z"/><path d="M8 7V4h8v3M4 12h16"/></>,
    privacy: <><path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5l-8-3Z"/><path d="m9 12 2 2 4-4"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 22a8 8 0 0 1 16 0"/></>,
    shield: <><path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5l-8-3Z"/><path d="M9 12h6"/></>,
    admin: <><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/></>,
  };
  return <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{paths[name]}</svg>;
}
